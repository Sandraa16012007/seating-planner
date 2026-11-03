# Farewell Seating Planner

A small, mobile-first seating planner for a farewell. There are exactly 22 tables and 153 seats:

- Tables 1–21: 7 students each
- Table 22: 6 students

Anyone with the link can view the shared seating arrangement. There are no accounts, logins, or user roles.

## Current stage

The app is a working, mobile-first planner:

- Next.js App Router project with TypeScript and Tailwind CSS
- Supabase schema, constraints, RPCs, and RLS policies
- Request-time server rendering of all 22 tables and their students
- Seating overview with total, occupied, and available seat counts
- Responsive table cards with occupancy states, progress bars, and student previews
- Table detail sheet/modal with the full student list and remove controls
- Add-student form with table preselection, validation, pending state, and inline success/error feedback
- Server Actions for add/remove, with the database enforcing uniqueness and capacity
- Duplicate-name errors that identify the table already holding that student
- Confirmation before removing a student and a public-access warning in the footer

The app is complete for the current scope. Changes are visible to other visitors after they refresh; no realtime subscription is used. The database, concurrency, persistence, and responsive scenarios listed under [Verification](#verification) were exercised against the live Supabase project.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- React 19 + TypeScript
- Tailwind CSS 4
- [Supabase](https://supabase.com/) (Postgres, RLS, RPC)

No auth library, global state manager, or localStorage caching is used. React local state handles the modal and forms; Supabase is the single source of truth.

## Quick start

Prerequisites: Node.js 20.9 or newer and npm.

```bash
npm install
```

1. Create a Supabase project.
2. Apply all migrations in `supabase/migrations/` in filename order (the CLI command `supabase db push` does this).
3. Create `.env.local` from `.env.example` and fill in the project URL and anon key.
4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If the environment variables are missing, the app shows setup instructions instead of crashing.

## Supabase setup

### 1. Apply the migration

Use either option:

**Supabase Dashboard (simplest)**

1. Open your project → **SQL Editor**.
2. Run `supabase/migrations/20261103000000_initial_schema.sql`.
3. Run `supabase/migrations/20261103010000_duplicate_name_message.sql` if this project already had the first migration applied. The second file is idempotent and safe on a fresh project too.

**Supabase CLI**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 2. Confirm the seed data

```sql
select table_number, capacity
from public.seating_tables
order by table_number;

-- Should return 22 rows: 1-21 with capacity 7, 22 with capacity 6.
```

### 3. Add environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The anon key is safe to expose only because RLS restricts what it can do. **Never** put the service-role key in this app or any `NEXT_PUBLIC_*` variable.

## Deploy

### Vercel

1. Apply both migrations to the Supabase project that production will use.
2. Push the repository to GitHub and import it into Vercel (or deploy with the Vercel CLI). Vercel detects Next.js automatically.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the project's environment variables for Production, Preview, and Development.
4. Deploy. The build command is `npm run build`.
5. Open the deployment URL on two devices. Add a test student on one device, refresh on the other, and confirm the student appears.

### Self-hosted Node server

```bash
npm ci
npm run build
npm run start
```

Set the same two environment variables on the server before starting. The app needs a Node.js server because the page is rendered per request; it is not a static export.

Do not add a `SUPABASE_SERVICE_ROLE_KEY` to either environment. The app deliberately uses only the anon key, and every write is constrained by the RPCs, triggers, and RLS policies.

## Public access warning

This app is deliberately account-free:

- Any visitor with the URL can read every student name and class/section.
- Any visitor with the URL can add or remove students through the public RPCs.
- There is no attribution, audit trail, moderation, or rate limiting.
- A malicious visitor could delete the whole arrangement or submit offensive names.

That is acceptable for a trusted farewell group, but it is **not** a private or abuse-resistant system. If that changes, add authentication and tighten the grants/policies in the migration.

## Folder structure

```text
app/
  actions/
    seating.ts                Server Actions for add/remove
  error.tsx                  Route error boundary
  layout.tsx                 Root layout, fonts, metadata
  page.tsx                   Home route: header, hero, Suspense, footer
  globals.css                Tailwind entry + theme + motion

components/
  seating/
    SeatingBoard.tsx          Server data container (env check + fetch)
    SeatingPlanner.tsx        Client orchestrator for views, refresh, notices
    SeatingSummary.tsx        Tables/seats/occupied/available stats
    TableGrid.tsx             Responsive grid + status legend
    TableCard.tsx             Compact table card with occupancy and add button
    TableDetails.tsx          Full table details and remove controls
    RemoveStudent.tsx         Inline remove confirmation form
    AddStudentForm.tsx        Add-student form + validation feedback
    TableStatusBadge.tsx      Empty/available/1-left/full badge
    OccupancyBar.tsx          Reusable progress bar
    TableGridSkeleton.tsx     Suspense fallback
    SetupNotice.tsx           Shown when Supabase env is missing
    DatabaseError.tsx         Shown when the plan cannot be loaded
  ui/
    Modal.tsx                 Native dialog (bottom sheet on mobile)
    Spinner.tsx               Pending indicator
    icons.tsx                 Inline SVG icons

lib/
  constants.ts                22 tables, capacities, input limits
  seating.ts                  Server-only DB reads/writes + domain mapping
  seating-validation.ts       Shared client/server form validation
  table-status.ts             Occupancy/status helpers
  supabase/
    server.ts                 Env validation + anonymous Supabase client

types/
  actions.ts                  Server Action result types
  database.ts                 Supabase schema types (manual, migration-aligned)
  seating.ts                  App-facing domain types

supabase/
  migrations/
    20261103000000_initial_schema.sql
    20261103010000_duplicate_name_message.sql
```

There is no global state library or browser-side database client. The only client state is UI state for the modal, form, pending actions, and inline notices.

## Module responsibilities

| Module | Responsibility | Must not |
| --- | --- | --- |
| `app/page.tsx` | Route composition, header/hero, Suspense fallback | Talk to the database |
| `components/seating/SeatingBoard.tsx` | Request-time env check and data loading | Own interactive UI state |
| `components/seating/SeatingPlanner.tsx` | Client modal routing, refresh, and notices | Talk to Supabase directly |
| `components/seating/TableGrid.tsx` `TableCard.tsx` | Card presentation and table selection callbacks | Know about SQL |
| `components/seating/TableDetails.tsx` `AddStudentForm.tsx` `RemoveStudent.tsx` | Detail/form interactions, validation feedback, pending states | Talk to Supabase directly |
| `app/actions/seating.ts` | Validate form data, call the data layer, map errors, return serializable results | Contain JSX |
| `lib/seating.ts` | Queries, RPC calls, snake_case → camelCase mapping, `SeatingError` | Import React or UI code |
| `lib/seating-validation.ts` | Shared name/class/table validation | Access the database |
| `lib/table-status.ts` | Occupancy and empty/available/1-left/full helpers | Access the database |
| `lib/supabase/server.ts` | Validate env and create the anonymous client | Contain business rules |
| `types/database.ts` | Database row/insert/update/RPC types | Contain UI concerns |
| `types/seating.ts` | App-facing `Student`, `SeatingTable`, `SeatingPlan` | Mirror raw database column names |
| `supabase/migrations/...` | Schema, seed, uniqueness, capacity concurrency, RLS, RPC grants | Depend on the Next.js app |

## How the modules communicate

### Reading the plan

```text
Browser
  └─ GET /
      └─ app/page.tsx
          └─ <Suspense> → components/seating/SeatingBoard.tsx
              ├─ lib/supabase/server.ts → anonymous Supabase client
              ├─ lib/seating.ts#getSeatingPlan()
              │    ├─ select seating_tables (22 rows)
              │    └─ select students
              │         └─ map snake_case rows → camelCase domain objects
              └─ components/seating/SeatingPlanner.tsx
                   ├─ SeatingSummary.tsx
                   └─ TableGrid.tsx → TableCard.tsx
```

- `SeatingBoard` calls `connection()` so the data is fetched at request time, not baked in at build time.
- `lib/seating.ts` returns a **domain** `SeatingPlan`; components never see raw database rows.
- If fewer than 22 tables come back, `getSeatingPlan` throws a configuration error instead of silently showing a partial plan.
- The modal and forms are client-side, but the plan itself stays server-rendered. After a successful mutation, `router.refresh()` updates the server tree without discarding the open modal.

### Writing

```text
Table card / table details / remove confirmation
  └─ Client component
      ├─ validates name/class/table locally
      └─ calls a Server Action in app/actions/seating.ts
          └─ lib/seating.ts#addStudent() / #removeStudent()
              └─ supabase.rpc("add_student") / supabase.rpc("remove_student")
                  └─ Postgres trigger + unique constraint + RLS
      └─ on success: inline feedback + router.refresh()
```

- Writes never go directly from the browser to Supabase. The browser only invokes Server Actions.
- The Server Actions repeat the form validation; the database remains the final authority.
- Successful changes trigger `router.refresh()` so the server-rendered plan and all visible counts update.
- Other visitors see changes when they refresh the page. No realtime subscription is used.
- Add success keeps the form open so several friends can be added in a row. Removal uses an inline confirmation.

## Database design

### `public.seating_tables`

| Column | Type | Notes |
| --- | --- | --- |
| `table_number` | `smallint` | Primary key, 1–22 |
| `capacity` | `smallint` | 7 for tables 1–21; 6 for table 22, enforced by a CHECK |

The migration seeds all 22 rows. Empty tables still exist.

### `public.students`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `name` | `text` | Display name, 1–80 chars |
| `name_normalized` | `text` | Generated, stored; unique across all tables |
| `class_section` | `text` | 1–40 chars |
| `table_number` | `smallint` | FK → `seating_tables.table_number` |
| `created_at` | `timestamptz` | Defaults to `now()` |

`name_normalized` is produced by `normalize_student_name(name)`:

```sql
btrim(regexp_replace(lower(name), '\s+', ' ', 'g'))
```

So `" Sandra   Prince "`, `"sandra prince"`, and `"SANDRA PRINCE"` all normalize to `sandra prince` and collide on the unique constraint.

### RPCs

- `add_student(p_name, p_class_section, p_table_number)` — trims/collapses input, validates lengths and table number, checks for an existing normalized name, inserts, and returns the new row. Duplicate-name violations return a message such as `Sandra Prince is already seated at Table 1. A student can only be seated once.` The pre-check gives a friendly message; the unique constraint and exception handler also cover simultaneous requests.
- `remove_student(p_student_id)` — deletes by id and returns whether a row was removed.

`anon` and `authenticated` can execute these RPCs. They **cannot** insert, update, or delete table rows directly.

## How the business rules are enforced

| Rule | Enforcement |
| --- | --- |
| Exactly 22 tables | Seeded rows + no public write access |
| Table capacities 7/7/…/6 | `seating_tables_capacity_matches_rules` CHECK |
| Unique student name, case/space-insensitive | Generated `name_normalized` + `students_name_normalized_unique` |
| One table per student | `students.table_number` is a single non-null FK |
| No over-capacity table | `BEFORE INSERT OR UPDATE` trigger locks the `seating_tables` row with `SELECT ... FOR UPDATE`, counts occupants, and rejects if full |
| Simultaneous duplicate submissions | The unique constraint rejects one transaction; the exception handler re-reads the winning row and reports its table |
| Simultaneous over-capacity submissions | The table-row lock serializes the trigger checks; the second transaction sees the first insert |
| Removal frees the seat and the name | A normal `DELETE`; no soft-delete or name tombstone |
| Empty tables still shown | Rows live in `seating_tables`, independent of `students` |
| Writes cannot bypass validation | RLS denies direct writes; only the two `SECURITY DEFINER` RPCs are granted |

The capacity trigger is a database-level backstop even if someone later changes the RPCs or grants: any insert/update that would exceed capacity fails.

## Input limits

The client validates these in `lib/seating-validation.ts` and the Server Actions repeat the checks, but the database is authoritative:

- Name: 1–80 characters after trimming
- Class/section: 1–40 characters after trimming
- Table number: 1–22

## Verification

The live Supabase project and the running app were tested with temporary test rows. The temporary rows were removed afterwards, and the database was left with 0 students.

| Area | Result |
| --- | --- |
| Schema | 22 tables; capacities 7 for tables 1–21 and 6 for table 22; total 153 seats |
| Basic writes | Add to an empty table, multiple students to one table, students to different tables, delete, and re-add a deleted name all passed |
| Duplicate names | `Sandra Prince`, `sandra prince`, `SANDRA PRINCE`, `Sandra  Prince`, and `" Sandra Prince "` were rejected with a message naming the table already holding the student |
| Table capacity | Table 1 accepted 7 and rejected an 8th (`23514`); table 22 accepted 6 and rejected a 7th (`23514`) |
| Concurrent duplicate | Two simultaneous normalized-name inserts produced exactly one row and one `23505` error naming the winning table |
| Concurrent last seat | Two simultaneous inserts for the final seat at table 22 produced one success and one `23514`; the table stayed at 6 |
| Direct access | Anonymous direct `insert` and `delete` on `students` were denied; RPCs are the write path |
| Persistence | A second Supabase client and a fresh server render both saw a new row; a fresh render no longer showed it after deletion |
| Responsive UI | 390 px, 768 px, and 1280 px viewports had no horizontal overflow; the mobile dialog did not overflow; details, add, success, remove confirmation, and removal feedback worked |
| Full-table UI | A table with 7 students showed `Full`/`No seats left`, hid the card add action, and disabled the details add button |
| Duplicate UI | The add form displayed `Sandra Prince is already seated at Table 1. A student can only be seated once.` |
| Build checks | `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed |
| Production smoke | `next start` served the built app; the mobile layout and duplicate error above worked against the production server |

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```

## Next steps

1. Add a committed automated test suite for the Server Actions and RPCs, especially concurrent inserts into the last seat and duplicate normalized names.
2. Optionally add a Supabase Realtime subscription or refresh-on-focus so other visitors' changes appear without a manual reload.
3. If the audience stops being trusted, add authentication, moderation, and rate limiting.

Realtime subscriptions and localStorage are optional and not needed for correctness.

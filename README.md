# Farewell Seating Planner

A small, mobile-first seating planner for a farewell. There are exactly 19 tables and 153 seats:

- Tables 1–18: 8 students each
- Table 19: 9 students

Anyone with the link can view the shared seating arrangement. There are no accounts, logins, or user roles. Each browser can register one student and remove only that same entry using a passwordless device token.

## Current stage

The app is a working, mobile-first planner:

- Next.js App Router project with TypeScript and Tailwind CSS
- Supabase schema, constraints, RPCs, and RLS policies
- Request-time server rendering of all 19 tables and their students
- Seating overview with total, occupied, and available seat counts
- Responsive table cards with occupancy states, progress bars, and student previews
- Table detail sheet/modal with the full student list and remove controls
- Add-student form with table preselection, validation, pending state, and inline success/error feedback
- Passwordless one-student-per-browser registration using a secure localStorage token
- Owner-only removal: the browser token is verified inside Postgres, and other students' entries are view-only
- Server Actions for add/remove, with the database enforcing ownership, uniqueness, and capacity
- Duplicate-name feedback that warns about matching first names and rejects duplicate full names and name + class/section combinations
- Confirmation before removing your own entry and a public-view notice in the footer

The app is complete for the current scope. Changes are visible to other visitors after they refresh; no realtime subscription is used. The database, concurrency, persistence, ownership, and responsive scenarios listed under [Verification](#verification) were exercised against the live Supabase project.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- React 19 + TypeScript
- Tailwind CSS 4
- [Supabase](https://supabase.com/) (Postgres, RLS, RPC)

No auth library, global state manager, or browser database client is used. The only local storage is the opaque ownership token described below; React local state handles the modal, forms, and pending actions; Supabase is the single source of truth.

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
2. Run every file in `supabase/migrations/` in filename order. On a project created before the resize, make sure `20261104000000_resize_to_19_tables.sql` is included; it is idempotent and safe on a fresh project too. The ownership migration is `20261105000000_device_ownership.sql`; `20261105010000_fix_ownership_validation.sql` keeps the duplicate-name messages and raw newline checks intact.

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

-- Should return 19 rows: 1-18 with capacity 8, 19 with capacity 9.
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

1. Apply all migrations in `supabase/migrations/` to the Supabase project that production will use.
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

## Public access and ownership warning

This app is deliberately account-free:

- Any visitor with the URL can read every student name and class/section.
- A browser can register exactly one student. The registration is tied to a random token in that browser's `localStorage`; only a SHA-256 hash is stored in Supabase.
- A browser can remove only the student associated with its own token. Other entries are view-only, and direct table `INSERT`/`UPDATE`/`DELETE` requests are denied by RLS and table/column grants.
- There is no login, recovery code, cross-device recovery, attribution, audit trail, moderation, or rate limiting.
- Clearing browser storage loses the token and therefore the ability to remove that entry. A malicious visitor can still register a new student from a new token or submit offensive names.

That is acceptable for a trusted farewell group, but it is **not** a private or abuse-resistant system. If that changes, add authentication, moderation, and rate limiting.

## Folder structure

```text
app/
  actions/
    seating.ts                Server Actions for add/remove/ownership lookup
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
    RemoveStudent.tsx         Owner-only remove confirmation form
    AddStudentForm.tsx        Registration form + duplicate warnings
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
  constants.ts                19 tables, capacities, input limits
  ownership-token.ts          Browser token generation/storage helpers
  seating.ts                  Server-only DB reads/writes + domain mapping
  seating-validation.ts       Shared form validation + duplicate checks
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
    20261104000000_resize_to_19_tables.sql
    20261105000000_device_ownership.sql
    20261105010000_fix_ownership_validation.sql
```

There is no global state library or browser-side database client. The only browser persistence is the ownership token in `localStorage`; all other client state is UI state for the modal, form, pending actions, and inline notices.

## Module responsibilities

| Module | Responsibility | Must not |
| --- | --- | --- |
| `app/page.tsx` | Route composition, header/hero, Suspense fallback | Talk to the database |
| `components/seating/SeatingBoard.tsx` | Request-time env check and data loading | Own interactive UI state |
| `components/seating/SeatingPlanner.tsx` | Client modal routing, ownership resolution, refresh, and notices | Talk to Supabase directly |
| `components/seating/TableGrid.tsx` `TableCard.tsx` | Card presentation and table selection callbacks | Know about SQL |
| `components/seating/TableDetails.tsx` `AddStudentForm.tsx` `RemoveStudent.tsx` | Detail/form interactions, duplicate warnings, owner-only removal, pending states | Talk to Supabase directly |
| `app/actions/seating.ts` | Validate form data, call the data layer, map errors, return serializable results | Contain JSX |
| `lib/seating.ts` | Queries, RPC calls, snake_case → camelCase mapping, `SeatingError` | Import React or UI code |
| `lib/ownership-token.ts` | Generate, save, read, and clear the browser ownership token | Access the database or render UI |
| `lib/seating-validation.ts` | Shared name/class/table validation and duplicate checks | Access the database |
| `lib/table-status.ts` | Occupancy and empty/available/1-left/full helpers | Access the database |
| `lib/supabase/server.ts` | Validate env and create the anonymous client | Contain business rules |
| `types/database.ts` | Database row/insert/update/RPC types | Contain UI concerns |
| `types/seating.ts` | App-facing `Student`, `SeatingTable`, `SeatingPlan` | Mirror raw database column names |
| `supabase/migrations/...` | Schema, seed, uniqueness, capacity concurrency, RLS, ownership RPCs, grants | Depend on the Next.js app |

## How the modules communicate

### Reading the plan

```text
Browser
  └─ GET /
      └─ app/page.tsx
          └─ <Suspense> → components/seating/SeatingBoard.tsx
              ├─ lib/supabase/server.ts → anonymous Supabase client
              ├─ lib/seating.ts#getSeatingPlan()
              │    ├─ select seating_tables (19 rows)
              │    └─ select students
              │         └─ map snake_case rows → camelCase domain objects
              └─ components/seating/SeatingPlanner.tsx
                   ├─ SeatingSummary.tsx
                   ├─ reads localStorage token → getOwnedStudentAction()
                   └─ TableGrid.tsx → TableCard.tsx
```

- `SeatingBoard` calls `connection()` so the data is fetched at request time, not baked in at build time.
- `lib/seating.ts` returns a **domain** `SeatingPlan`; components never see raw database rows.
- If fewer than 19 tables come back, `getSeatingPlan` throws a configuration error instead of silently showing a partial plan.
- The modal and forms are client-side, but the plan itself stays server-rendered. After a successful mutation, `router.refresh()` updates the server tree without discarding the open modal.
- On the client, `SeatingPlanner` reads the ownership token from `localStorage` and asks the server to resolve it. The database, not the client, decides whether the token belongs to a row.

### Writing

```text
Table card / table details / remove confirmation
  └─ Client component
      ├─ validates name/class/table locally and shows duplicate warnings
      └─ calls a Server Action in app/actions/seating.ts
          └─ lib/seating.ts#addStudent() / #removeOwnedStudent()
              └─ supabase.rpc("add_student") / supabase.rpc("remove_owned_student")
                  └─ Postgres ownership hash + capacity trigger + unique indexes + RLS
      └─ on success: inline feedback + router.refresh()
```

- Writes never go directly from the browser to Supabase. The browser only invokes Server Actions.
- The Server Actions repeat the form validation; the database remains the final authority.
- Successful changes trigger `router.refresh()` so the server-rendered plan and all visible counts update.
- Other visitors see changes when they refresh the page. No realtime subscription is used.
- A successful registration stores the raw token in `localStorage` and shows a confirmation panel. One browser can register one student. Removal is only available on the entry that the token resolves to, and the local token is cleared after the matching database deletion returns success.

## Database design

### `public.seating_tables`

| Column | Type | Notes |
| --- | --- | --- |
| `table_number` | `smallint` | Primary key, 1–19 |
| `capacity` | `smallint` | 8 for tables 1–18; 9 for table 19, enforced by a CHECK |

The migration seeds all 19 rows. Empty tables still exist.

### `public.students`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `name` | `text` | Display name, 1–80 chars |
| `name_normalized` | `text` | Generated, stored; unique across all tables |
| `class_section` | `text` | 1–40 chars |
| `table_number` | `smallint` | FK → `seating_tables.table_number` |
| `ownership_token_hash` | `text` | SHA-256 hash of the browser token; unique when present |
| `created_at` | `timestamptz` | Defaults to `now()` |

`name_normalized` is produced by `normalize_student_name(name)`:

```sql
btrim(regexp_replace(lower(name), '\s+', ' ', 'g'))
```

So `" Sandra   Prince "`, `"sandra prince"`, and `"SANDRA PRINCE"` all normalize to `sandra prince` and collide on the unique constraint.

`ownership_token_hash` is never returned by the public REST read path: `anon` and `authenticated` have column-level `SELECT` only on `id`, `name`, `class_section`, `table_number`, and `created_at`. Existing rows from before the ownership migration may have a null hash; new registrations always have one.

### RPCs

- `add_student(p_name, p_class_section, p_table_number, p_ownership_token)` — trims/collapses input, rejects commas/line breaks, validates lengths and table number, rejects an already-registered token, checks duplicate name + class/section, duplicate full name, and single-word first-name collisions, then inserts and returns the new row. Duplicate violations return messages such as `Sandra Prince is already seated at Table 1. A student can only be seated once.` or `This device is already registered as …`. The pre-checks give friendly messages; the unique indexes and the INSERT-scoped exception handler cover simultaneous requests.
- `get_owned_student(p_ownership_token)` — hashes the token and returns the matching student row, or no row.
- `remove_owned_student(p_student_id, p_ownership_token)` — deletes only when both the id and the hash of the supplied token match, and returns whether a row was removed.

`anon` and `authenticated` can execute these RPCs. They **cannot** insert, update, or delete table rows directly. The old unrestricted `remove_student(uuid)` and three-argument `add_student(...)` are dropped.

## How the business rules are enforced

| Rule | Enforcement |
| --- | --- |
| Exactly 19 tables | Seeded rows + no public write access |
| Table capacities 8/8/…/9 | `seating_tables_capacity_matches_rules` CHECK |
| Unique student name, case/space-insensitive | Generated `name_normalized` + `students_name_normalized_unique` |
| Unique name + class/section | Explicit normalized check in `add_student`, before the global name check |
| Matching first name warning / ambiguous single-name rejection | Frontend `findNameConflict`; `add_student` rejects one-word names when the first name already exists and allows distinctive multi-part full names |
| One registration per browser | Raw token in `localStorage`; SHA-256 hash in `students.ownership_token_hash`; partial unique index + `add_student` pre-check |
| Owner-only removal | `remove_owned_student` matches both row id and token hash inside a `SECURITY DEFINER` RPC |
| One table per student | `students.table_number` is a single non-null FK |
| No over-capacity table | `BEFORE INSERT OR UPDATE` trigger locks the `seating_tables` row with `SELECT ... FOR UPDATE`, counts occupants, and rejects if full |
| Simultaneous duplicate submissions | The unique constraints reject one transaction; the exception handler re-reads the winning row and reports its table |
| Simultaneous over-capacity submissions | The table-row lock serializes the trigger checks; the second transaction sees the first insert |
| Simultaneous same-token submissions | The partial unique index on `ownership_token_hash` permits exactly one row |
| Removal frees the seat and the name | A normal `DELETE`; no soft-delete or name tombstone |
| Empty tables still shown | Rows live in `seating_tables`, independent of `students` |
| Writes cannot bypass validation | RLS denies direct writes; only the token-aware `SECURITY DEFINER` RPCs are granted |
| Ownership hash cannot be read publicly | Column-level SELECT grants exclude `ownership_token_hash` |

The capacity trigger is a database-level backstop even if someone later changes the RPCs or grants: any insert/update that would exceed capacity fails.

## Input limits and name rules

The client validates these in `lib/seating-validation.ts` and the Server Actions repeat the checks, but the database is authoritative:

- Name: 1–80 characters after trimming, single-line only
- Commas and line breaks are rejected; a registration is exactly one student
- Class/section: 1–40 characters after trimming
- Table number: 1–19
- Ownership token: 43 base64url characters (32 random bytes)
- Multi-part names with spaces are valid; a matching first name requires a surname or additional name

## Verification

The live Supabase project and the running app were tested with temporary test rows. The temporary rows were removed afterwards, and the database was left with 0 students.

| Area | Result |
| --- | --- |
| Schema | 19 tables; capacities 8 for tables 1–18 and 9 for table 19; total 153 seats |
| Ownership registration | Registering stored a 43-character token in `localStorage`; the reload resolved the same student and showed the owned-entry banner |
| One student per browser | The same token could not register a second student; all 19 card add buttons were disabled as `Already registered` |
| Owner-only deletion | A different token and a random token both returned `false`; the row survived; the owner's token deleted it and cleared `localStorage` only after success |
| Direct access | Anonymous direct `INSERT`, `UPDATE`, and `DELETE` on `students` all returned HTTP 401; the ownership hash column returned HTTP 401 |
| Duplicate full names | Case/whitespace variants with the same class/section were rejected with the name + class message; the same normalized full name in another class was also rejected |
| First-name handling | A matching first name with no surname was rejected; a matching first name with a distinctive multi-part full name was allowed, and the UI showed the warning |
| Multiple names | Comma-separated and newline-separated submissions were rejected by the UI and by the RPC |
| Table capacity | Table 1 accepted 8 and rejected a 9th; table 19 accepted 8 plus one concurrent winner and rejected the other concurrent attempt |
| Concurrent last seat | Two simultaneous inserts for the final seat at table 19 produced exactly one success and one capacity error; the table stayed at 9 |
| Persistence | A second browser and a fresh server render saw the same shared plan; the deleted row disappeared after refresh |
| Responsive UI | The production app was exercised at a 390 px mobile viewport; the existing 768 px and 1280 px layouts were unchanged |
| Build checks | `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed |
| Production smoke | `next start` served the built app; the full registration/revisit/owner-delete flow and duplicate warnings passed against it |

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

Realtime subscriptions remain optional. The ownership token in `localStorage` is required for a browser to identify and remove its own registration.

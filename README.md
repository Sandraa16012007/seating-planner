# Farewell Seating Planner

A small, mobile-first seating planner for a college farewell. There are exactly 22 tables and 153 seats:

- Tables 1–21: 7 students each
- Table 22: 6 students

Anyone with the link can view the shared seating arrangement. There are no accounts, logins, or user roles.

## Current stage

This repository contains the **foundation** for the app:

- Next.js App Router project with TypeScript and Tailwind CSS
- Supabase schema, constraints, RPCs, and RLS policies
- Typed Supabase integration and a separate data-access module
- A read-only, mobile-first seating board that loads the shared plan from Supabase
- `addStudent` / `removeStudent` data functions ready for the editing UI

The add/remove forms and live refresh are intentionally **not** built yet. See [Next steps](#next-steps).

## Stack

- [Next.js 16](https://nextjs.org/) (App Router, React Server Components)
- React 19 + TypeScript
- Tailwind CSS 4
- [Supabase](https://supabase.com/) (Postgres, RLS, RPC)

No auth library, state manager, or localStorage caching is used. Supabase is the single source of truth.

## Quick start

```bash
npm install
```

1. Create a Supabase project.
2. Run the migration in `supabase/migrations/20261103000000_initial_schema.sql`.
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
2. Paste the contents of `supabase/migrations/20261103000000_initial_schema.sql`.
3. Run it.

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

## Public access warning

This app is deliberately account-free:

- Any visitor with the URL can read every student name and class/section.
- Any visitor with the URL can add or remove students through the public RPCs.
- There is no attribution, audit trail, moderation, or rate limiting.
- A malicious visitor could delete the whole arrangement or submit offensive names.

That is acceptable for a trusted college farewell group, but it is **not** a private or abuse-resistant system. If that changes, add authentication and tighten the grants/policies in the migration.

## Folder structure

```text
app/
  layout.tsx                  Root layout, fonts, metadata
  page.tsx                    Home route: header, Suspense boundary, footer
  globals.css                 Tailwind entry + base theme

components/
  seating/
    SeatingBoard.tsx          Server data container (env check + fetch)
    TableGrid.tsx             Summary + responsive grid
    TableCard.tsx             One table's seats and students
    TableGridSkeleton.tsx     Suspense fallback
    SetupNotice.tsx           Shown when Supabase env is missing

lib/
  constants.ts                22 tables, capacities, input limits
  seating.ts                  Server-only DB reads/writes + domain mapping
  supabase/
    server.ts                 Env validation + anonymous Supabase client

types/
  database.ts                 Supabase schema types (manual, migration-aligned)
  seating.ts                  App-facing domain types

supabase/
  migrations/
    20261103000000_initial_schema.sql
```

`hooks/` is intentionally absent. No client-side state is needed in this stage.

## Module responsibilities

| Module | Responsibility | Must not |
| --- | --- | --- |
| `app/page.tsx` | Route composition, static heading, Suspense fallback | Talk to the database |
| `components/seating/SeatingBoard.tsx` | Request-time env check and data loading | Render low-level table markup |
| `components/seating/TableGrid.tsx` `TableCard.tsx` | Presentation only | Know about Supabase or SQL |
| `lib/seating.ts` | Queries, RPC calls, snake_case → camelCase mapping, `SeatingError` | Import React or UI code |
| `lib/supabase/server.ts` | Validate env and create the anonymous client | Contain business rules |
| `types/database.ts` | Database row/insert/update/RPC types | Contain UI concerns |
| `types/seating.ts` | App-facing `Student`, `SeatingTable`, `SeatingPlan` | Mirror raw database column names |
| `supabase/migrations/...` | Schema, seed, uniqueness, capacity concurrency, RLS, RPC grants | Depend on the Next.js app |

## How the modules communicate

### Reading the plan (implemented)

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
              └─ components/seating/TableGrid.tsx → TableCard.tsx
```

- `SeatingBoard` calls `connection()` so the data is fetched at request time, not baked in at build time.
- `lib/seating.ts` returns a **domain** `SeatingPlan`; components never see raw database rows.
- If fewer than 22 tables come back, `getSeatingPlan` throws a configuration error instead of silently showing a partial plan.

### Writing (data layer ready, UI not built)

The intended flow for the next stage:

```text
Client form
  └─ Server Action (app/actions/seating.ts, to be added)
      └─ lib/seating.ts#addStudent() / #removeStudent()
          └─ supabase.rpc("add_student") / supabase.rpc("remove_student")
              └─ Postgres trigger + unique constraint + RLS
```

Keeping writes in Server Actions avoids exposing a second mutation path in the browser. The anon key is still used server-side, and the database remains the authority.

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

- `add_student(p_name, p_class_section, p_table_number)` — trims/collapses input, validates lengths and table number, inserts, and returns the new row. Duplicate-name violations become a friendly error.
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
| Simultaneous duplicate submissions | The unique constraint rejects one transaction |
| Simultaneous over-capacity submissions | The table-row lock serializes the trigger checks; the second transaction sees the first insert |
| Removal frees the seat and the name | A normal `DELETE`; no soft-delete or name tombstone |
| Empty tables still shown | Rows live in `seating_tables`, independent of `students` |
| Writes cannot bypass validation | RLS denies direct writes; only the two `SECURITY DEFINER` RPCs are granted |

The capacity trigger is a database-level backstop even if someone later changes the RPCs or grants: any insert/update that would exceed capacity fails.

## Input limits

The frontend should mirror these before submitting, but the database is authoritative:

- Name: 1–80 characters after trimming
- Class/section: 1–40 characters after trimming
- Table number: 1–22

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
```

## Next steps

1. Add `app/actions/seating.ts` with `addStudentAction` and `removeStudentAction` Server Actions.
2. Add a client form per table (name + class/section) with pending state and friendly constraint errors.
3. Add a remove control for each entry.
4. Refresh the page after mutations (`refresh()` / `revalidatePath`), and optionally refetch on window focus so other visitors' changes appear.
5. Add tests for the RPCs, especially concurrent inserts into the last seat and duplicate normalized names.

Realtime subscriptions and localStorage are optional and not needed for correctness.

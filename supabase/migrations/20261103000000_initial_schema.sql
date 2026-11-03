-- Farewell Seating Planner - initial schema
-- Apply this file in the Supabase SQL Editor, or with `supabase db push`.
--
-- Design notes:
--   * 22 fixed tables are seeded. Tables 1-21 have capacity 7; table 22 has 6.
--   * Student names are globally unique after normalizing case and whitespace.
--   * Capacity is enforced by a transactional trigger that locks the table row,
--     so two simultaneous inserts cannot overfill a table.
--   * Writes go through add_student / remove_student RPCs. Direct table writes
--     are denied by RLS and table privileges.

-- ---------------------------------------------------------------------------
-- 1. Name normalization
-- ---------------------------------------------------------------------------

create or replace function public.normalize_student_name(p_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select btrim(regexp_replace(lower(p_name), '\s+', ' ', 'g'));
$$;

revoke all on function public.normalize_student_name(text) from public;

comment on function public.normalize_student_name(text) is
  'Trims, lower-cases, and collapses repeated whitespace. Used for global name uniqueness.';

-- ---------------------------------------------------------------------------
-- 2. Fixed seating tables
-- ---------------------------------------------------------------------------

create table if not exists public.seating_tables (
  table_number smallint primary key,
  capacity smallint not null,
  constraint seating_tables_number_range
    check (table_number between 1 and 22),
  constraint seating_tables_capacity_matches_rules
    check (
      (table_number between 1 and 21 and capacity = 7)
      or (table_number = 22 and capacity = 6)
    )
);

comment on table public.seating_tables is
  'The 22 fixed farewell tables. Tables 1-21 seat 7; table 22 seats 6.';

insert into public.seating_tables (table_number, capacity)
select n, case when n = 22 then 6 else 7 end
from generate_series(1, 22) as n
on conflict (table_number) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Students
-- ---------------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text generated always as (
    public.normalize_student_name(name)
  ) stored,
  class_section text not null,
  table_number smallint not null
    references public.seating_tables (table_number)
    on update cascade
    on delete restrict,
  created_at timestamptz not null default now(),
  constraint students_name_not_blank
    check (char_length(btrim(name)) between 1 and 80),
  constraint students_class_section_not_blank
    check (char_length(btrim(class_section)) between 1 and 40),
  constraint students_name_normalized_unique
    unique (name_normalized)
);

comment on column public.students.name_normalized is
  'Generated lower-cased/whitespace-normalized name. Unique across all tables.';

create index if not exists students_table_number_idx
  on public.students (table_number);

-- ---------------------------------------------------------------------------
-- 4. Capacity enforcement
-- ---------------------------------------------------------------------------

create or replace function public.enforce_table_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_capacity smallint;
  v_occupied integer;
begin
  -- The row lock is held until this transaction commits. Concurrent inserts
  -- for the same table therefore queue here, and the count below sees every
  -- committed insert that happened before the lock was acquired.
  select st.capacity
    into v_capacity
    from public.seating_tables st
   where st.table_number = new.table_number
     for update;

  if v_capacity is null then
    raise exception 'Table % does not exist.', new.table_number
      using errcode = '23503';
  end if;

  if tg_op = 'INSERT' then
    select count(*)
      into v_occupied
      from public.students s
     where s.table_number = new.table_number;
  else
    select count(*)
      into v_occupied
      from public.students s
     where s.table_number = new.table_number
       and s.id <> new.id;
  end if;

  if v_occupied >= v_capacity then
    raise exception 'Table % is full (capacity %).', new.table_number, v_capacity
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_table_capacity() from public;

drop trigger if exists students_capacity_check on public.students;

create trigger students_capacity_check
before insert or update of table_number on public.students
for each row
execute function public.enforce_table_capacity();

-- ---------------------------------------------------------------------------
-- 5. Public RPCs (the only write path)
-- ---------------------------------------------------------------------------

create or replace function public.add_student(
  p_name text,
  p_class_section text,
  p_table_number smallint
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students;
  v_name text;
  v_class_section text;
begin
  -- Store a tidy display value as well as the generated normalized value.
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_class_section := btrim(
    regexp_replace(coalesce(p_class_section, ''), '\s+', ' ', 'g')
  );

  if v_name = '' then
    raise exception 'Student name is required.'
      using errcode = '22023';
  end if;

  if char_length(v_name) > 80 then
    raise exception 'Student name must be 80 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_class_section = '' then
    raise exception 'Class/section is required.'
      using errcode = '22023';
  end if;

  if char_length(v_class_section) > 40 then
    raise exception 'Class/section must be 40 characters or fewer.'
      using errcode = '22001';
  end if;

  if p_table_number is null
     or p_table_number < 1
     or p_table_number > 22 then
    raise exception 'Table number must be between 1 and 22.'
      using errcode = '22023';
  end if;

  insert into public.students (name, class_section, table_number)
  values (v_name, v_class_section, p_table_number)
  returning * into v_student;

  return v_student;
exception
  when unique_violation then
    raise exception 'A student with this name is already seated.'
      using errcode = '23505';
end;
$$;

create or replace function public.remove_student(p_student_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.students
   where id = p_student_id;

  return found;
end;
$$;

revoke all on function public.add_student(text, text, smallint) from public;
revoke all on function public.remove_student(uuid) from public;

grant execute on function public.add_student(text, text, smallint)
  to anon, authenticated, service_role;
grant execute on function public.remove_student(uuid)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.seating_tables enable row level security;
alter table public.students enable row level security;

drop policy if exists "Public read access to seating tables"
  on public.seating_tables;
create policy "Public read access to seating tables"
  on public.seating_tables
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read access to students" on public.students;
create policy "Public read access to students"
  on public.students
  for select
  to anon, authenticated
  using (true);

-- There are deliberately no INSERT/UPDATE/DELETE policies. Remove direct
-- table privileges as well, so writes must use the RPCs above.
revoke all on table public.seating_tables from anon, authenticated;
revoke all on table public.students from anon, authenticated;

grant select on table public.seating_tables to anon, authenticated;
grant select on table public.students to anon, authenticated;

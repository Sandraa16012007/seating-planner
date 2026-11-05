-- Passwordless device ownership for student registrations.
--
-- Each successful registration creates one unguessable ownership token in the
-- browser. Only a SHA-256 hash of that token is stored in Postgres. The token
-- is presented to the RPCs below; a student row is only removable when both its
-- id and the hash of the presented token match.
--
-- This migration also:
--   * removes the old unrestricted remove_student RPC,
--   * replaces add_student with a token-aware version,
--   * adds strict full-name, first-name and name+class duplicate checks,
--   * hides ownership_token_hash from the public read API.

-- ---------------------------------------------------------------------------
-- 1. Token hashing
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

create or replace function public.hash_ownership_token(p_token text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

revoke all on function public.hash_ownership_token(text) from public;

comment on function public.hash_ownership_token(text) is
  'SHA-256 hash used to store device ownership tokens without keeping the raw token.';

-- ---------------------------------------------------------------------------
-- 2. Ownership column
-- ---------------------------------------------------------------------------

alter table public.students
  add column if not exists ownership_token_hash text;

alter table public.students
  drop constraint if exists students_ownership_token_hash_format;

alter table public.students
  add constraint students_ownership_token_hash_format
  check (
    ownership_token_hash is null
    or ownership_token_hash ~ '^[0-9a-f]{64}$'
  );

-- One student per token. The partial unique index still allows legacy rows
-- created before this migration to remain unowned, but every new registration
-- must have a token.
create unique index if not exists students_ownership_token_hash_unique
  on public.students (ownership_token_hash)
  where ownership_token_hash is not null;

comment on column public.students.ownership_token_hash is
  'SHA-256 hash of the browser ownership token. Null only for legacy rows created before device ownership existed.';

-- ---------------------------------------------------------------------------
-- 3. Remove the old unrestricted write functions
-- ---------------------------------------------------------------------------

-- Dropping (rather than just revoking) these functions is important: the old
-- three-argument add_student and the public remove_student would otherwise
-- remain callable and could bypass ownership checks.
drop function if exists public.remove_student(uuid);
drop function if exists public.add_student(text, text, smallint);

-- ---------------------------------------------------------------------------
-- 4. Token-aware add_student
-- ---------------------------------------------------------------------------

create function public.add_student(
  p_name text,
  p_class_section text,
  p_table_number smallint,
  p_ownership_token text
)
returns public.students
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student public.students;
  v_name text;
  v_name_normalized text;
  v_name_parts text[];
  v_class_section text;
  v_class_section_normalized text;
  v_ownership_token text;
  v_ownership_token_hash text;
  v_existing_name text;
  v_existing_class_section text;
  v_existing_table smallint;
begin
  -- A registration is exactly one student. Check the raw value before
  -- whitespace is collapsed, otherwise a pasted newline would silently become
  -- a space and two names would be stored as one.
  if coalesce(p_name, '') ~ '[,\r\n]' then
    raise exception 'Enter one student name only, not a list of names.'
      using errcode = '22023';
  end if;

  -- Display values and normalized values are computed exactly the same way as
  -- the generated name_normalized column, so validation and the unique index
  -- always agree.
  v_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_name_normalized := public.normalize_student_name(v_name);
  v_name_parts := regexp_split_to_array(v_name_normalized, ' ');
  v_class_section := btrim(
    regexp_replace(coalesce(p_class_section, ''), '\s+', ' ', 'g')
  );
  v_class_section_normalized := public.normalize_student_name(v_class_section);
  v_ownership_token := btrim(coalesce(p_ownership_token, ''));

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
     or p_table_number > 19 then
    raise exception 'Table number must be between 1 and 19.'
      using errcode = '22023';
  end if;

  if v_ownership_token !~ '^[A-Za-z0-9_-]{43}$' then
    raise exception 'A valid device ownership token is required.'
      using errcode = '22023';
  end if;

  v_ownership_token_hash := public.hash_ownership_token(v_ownership_token);

  -- One registration per browser token. This is enforced by the partial
  -- unique index as well, which closes the simultaneous-submission race.
  select s.name, s.class_section, s.table_number
    into v_existing_name, v_existing_class_section, v_existing_table
    from public.students s
   where s.ownership_token_hash = v_ownership_token_hash
   limit 1;

  if found then
    raise exception 'This device is already registered as % at Table %. Each device can register one student.',
      v_existing_name, v_existing_table
      using errcode = '23505';
  end if;

  -- Reject the same full name in the same class/section with a specific
  -- message. The global name check below rejects matching full names in other
  -- classes too.
  select s.name, s.class_section, s.table_number
    into v_existing_name, v_existing_class_section, v_existing_table
    from public.students s
   where s.name_normalized = v_name_normalized
     and public.normalize_student_name(s.class_section) = v_class_section_normalized
   limit 1;

  if found then
    raise exception '% is already registered in % at Table %. A student can only be registered once.',
      v_existing_name, v_existing_class_section, v_existing_table
      using errcode = '23505';
  end if;

  -- Full names are unique across every table.
  select s.name, s.class_section, s.table_number
    into v_existing_name, v_existing_class_section, v_existing_table
    from public.students s
   where s.name_normalized = v_name_normalized
   limit 1;

  if found then
    raise exception '% is already seated at Table %. A student can only be seated once.',
      v_existing_name, v_existing_table
      using errcode = '23505';
  end if;

  -- If the first name is already in use, a single-word name is too ambiguous.
  -- The browser also warns about matching first names when a surname is
  -- present; this check is the non-bypassable backstop.
  if coalesce(array_length(v_name_parts, 1), 0) < 2 then
    select s.name, s.class_section, s.table_number
      into v_existing_name, v_existing_class_section, v_existing_table
      from public.students s
     where split_part(s.name_normalized, ' ', 1) = v_name_parts[1]
     limit 1;

    if found then
      raise exception 'Someone with the first name % is already registered. Enter your full name, including a surname or another name.',
        initcap(v_name_parts[1])
        using errcode = '23505';
    end if;
  end if;

  begin
    insert into public.students (
      name,
      class_section,
      table_number,
      ownership_token_hash
    )
    values (
      v_name,
      v_class_section,
      p_table_number,
      v_ownership_token_hash
    )
    returning * into v_student;
  exception
    when unique_violation then
      -- Two simultaneous registrations from the same browser token, or two
      -- simultaneous identical names, can slip past the checks above. The
      -- unique indexes are authoritative; re-read the winner for a useful
      -- error. Keeping this handler on the INSERT only means our own duplicate
      -- messages above are never swallowed by it.
      select s.name, s.table_number
        into v_existing_name, v_existing_table
        from public.students s
       where s.ownership_token_hash = v_ownership_token_hash
       limit 1;

      if v_existing_table is not null then
        raise exception 'This device is already registered as % at Table %. Each device can register one student.',
          v_existing_name, v_existing_table
          using errcode = '23505';
      end if;

      select s.name, s.table_number
        into v_existing_name, v_existing_table
        from public.students s
       where s.name_normalized = v_name_normalized
       limit 1;

      if v_existing_table is not null then
        raise exception '% is already seated at Table %. A student can only be seated once.',
          v_existing_name, v_existing_table
          using errcode = '23505';
      end if;

      raise exception 'A student with this name is already seated.'
        using errcode = '23505';
  end;

  return v_student;
end;
$$;

revoke all on function public.add_student(text, text, smallint, text)
  from public;
grant execute on function public.add_student(text, text, smallint, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Ownership lookup and owner-only deletion
-- ---------------------------------------------------------------------------

create function public.get_owned_student(p_ownership_token text)
returns public.students
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_student public.students;
  v_ownership_token text;
begin
  v_ownership_token := btrim(coalesce(p_ownership_token, ''));

  if v_ownership_token !~ '^[A-Za-z0-9_-]{43}$' then
    return null;
  end if;

  select s.*
    into v_student
    from public.students s
   where s.ownership_token_hash = public.hash_ownership_token(v_ownership_token)
   limit 1;

  return v_student;
end;
$$;

create function public.remove_owned_student(
  p_student_id uuid,
  p_ownership_token text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ownership_token text;
begin
  v_ownership_token := btrim(coalesce(p_ownership_token, ''));

  if p_student_id is null
     or v_ownership_token !~ '^[A-Za-z0-9_-]{43}$' then
    return false;
  end if;

  delete from public.students as s
   where s.id = p_student_id
     and s.ownership_token_hash =
       public.hash_ownership_token(v_ownership_token);

  return found;
end;
$$;

revoke all on function public.get_owned_student(text) from public;
revoke all on function public.remove_owned_student(uuid, text) from public;

grant execute on function public.get_owned_student(text)
  to anon, authenticated, service_role;
grant execute on function public.remove_owned_student(uuid, text)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Public read-only access, without the token hash
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

-- There are deliberately no INSERT/UPDATE/DELETE policies.
revoke all on table public.seating_tables from anon, authenticated;
revoke all on table public.students from anon, authenticated;

-- Column-level SELECT keeps the ownership hash out of the public API. The app
-- only reads these five columns anyway.
grant select (id, name, class_section, table_number, created_at)
  on table public.students to anon, authenticated;
grant select on table public.seating_tables to anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on table public.students from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.seating_tables from anon, authenticated;

comment on table public.students is
  'One row per registered student. Rows are created by add_student and removed only by remove_owned_student with the matching device token.';

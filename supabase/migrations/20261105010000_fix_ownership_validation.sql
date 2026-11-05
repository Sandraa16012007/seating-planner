-- Keep duplicate-name messages and raw newline rejection intact.
-- The exception handler is scoped to the INSERT so custom duplicate errors
-- raised before it are not swallowed.

create or replace function public.add_student(
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

revoke all on function public.add_student(text, text, smallint, text) from public;
grant execute on function public.add_student(text, text, smallint, text) to anon, authenticated, service_role;

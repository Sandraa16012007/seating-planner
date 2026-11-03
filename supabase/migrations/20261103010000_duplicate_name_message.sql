-- Improve the duplicate-name error so visitors can see which table already
-- contains the student. The unique constraint and the capacity trigger remain
-- the final database-level guards.

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
  v_existing_name text;
  v_existing_table smallint;
begin
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

  -- Return a useful message before attempting the insert. The unique
  -- constraint below still closes the race between this check and the insert.
  select s.name, s.table_number
    into v_existing_name, v_existing_table
    from public.students s
   where s.name_normalized = public.normalize_student_name(v_name)
   limit 1;

  if found then
    raise exception '% is already seated at Table %. A student can only be seated once.',
      v_existing_name, v_existing_table
      using errcode = '23505';
  end if;

  insert into public.students (name, class_section, table_number)
  values (v_name, v_class_section, p_table_number)
  returning * into v_student;

  return v_student;
exception
  when unique_violation then
    -- A simultaneous request may have inserted the same normalized name after
    -- the check above. Look it up again so the visitor still gets the table.
    select s.name, s.table_number
      into v_existing_name, v_existing_table
      from public.students s
     where s.name_normalized = public.normalize_student_name(v_name)
     limit 1;

    if v_existing_table is not null then
      raise exception '% is already seated at Table %. A student can only be seated once.',
        v_existing_name, v_existing_table
        using errcode = '23505';
    end if;

    raise exception 'A student with this name is already seated.'
      using errcode = '23505';
end;
$$;

revoke all on function public.add_student(text, text, smallint) from public;
grant execute on function public.add_student(text, text, smallint)
  to anon, authenticated, service_role;

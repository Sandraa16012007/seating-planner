import "server-only";

import { TABLE_COUNT } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { AddStudentInput, SeatingPlan, Student } from "@/types/seating";

type StudentRow = Database["public"]["Tables"]["students"]["Row"];
type StudentRecord = Pick<
  StudentRow,
  "id" | "name" | "class_section" | "table_number" | "created_at"
>;

export class SeatingError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "SeatingError";
    this.code = code;
  }
}

function mapStudent(row: StudentRecord): Student {
  return {
    id: row.id,
    name: row.name,
    classSection: row.class_section,
    tableNumber: row.table_number,
    createdAt: row.created_at,
  };
}

/**
 * Loads all 19 tables and their students. Missing tables are treated as a
 * configuration error so the app never silently shows a partial plan.
 */
export async function getSeatingPlan(): Promise<SeatingPlan> {
  const supabase = createSupabaseServerClient();

  const [tablesResult, studentsResult] = await Promise.all([
    supabase
      .from("seating_tables")
      .select("table_number, capacity")
      .order("table_number", { ascending: true }),
    supabase
      .from("students")
      .select("id, name, class_section, table_number, created_at")
      .order("created_at", { ascending: true }),
  ]);

  if (tablesResult.error) {
    throw new SeatingError(tablesResult.error.message, tablesResult.error.code);
  }

  if (studentsResult.error) {
    throw new SeatingError(
      studentsResult.error.message,
      studentsResult.error.code,
    );
  }

  const tables = tablesResult.data ?? [];

  if (tables.length !== TABLE_COUNT) {
    throw new SeatingError(
      `Expected ${TABLE_COUNT} seating tables but found ${tables.length}. Apply the Supabase migration before using the planner.`,
    );
  }

  const studentsByTable = new Map<number, Student[]>();

  for (const row of studentsResult.data ?? []) {
    const student = mapStudent(row);
    const tableStudents = studentsByTable.get(student.tableNumber) ?? [];

    tableStudents.push(student);
    studentsByTable.set(student.tableNumber, tableStudents);
  }

  return tables.map((table) => ({
    tableNumber: table.table_number,
    capacity: table.capacity,
    students: studentsByTable.get(table.table_number) ?? [],
  }));
}

/**
 * Adds a student through the add_student RPC. The database enforces a single
 * registration per ownership token, name uniqueness and capacity.
 */
export async function addStudent(input: AddStudentInput): Promise<Student> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("add_student", {
    p_name: input.name,
    p_class_section: input.classSection,
    p_table_number: input.tableNumber,
    p_ownership_token: input.ownershipToken,
  });

  if (error) {
    throw new SeatingError(error.message, error.code);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new SeatingError("The student could not be added.");
  }

  return mapStudent(row);
}

/**
 * Resolves the student registered by this browser token. The token itself is
 * never stored in the database and is hashed inside the RPC.
 */
export async function getOwnedStudent(
  ownershipToken: string,
): Promise<Student | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_owned_student", {
    p_ownership_token: ownershipToken,
  });

  if (error) {
    throw new SeatingError(error.message, error.code);
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.id) {
    return null;
  }

  return mapStudent(row);
}

/**
 * Deletes a student only when the supplied browser token belongs to that exact
 * row. A false result means the id/token pair did not match.
 */
export async function removeOwnedStudent(
  studentId: string,
  ownershipToken: string,
): Promise<boolean> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("remove_owned_student", {
    p_student_id: studentId,
    p_ownership_token: ownershipToken,
  });

  if (error) {
    throw new SeatingError(error.message, error.code);
  }

  return data === true;
}

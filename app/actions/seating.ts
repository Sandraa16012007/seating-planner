"use server";

import { addStudent, removeStudent, SeatingError } from "@/lib/seating";
import { validateStudentForm } from "@/lib/seating-validation";
import type { AddStudentState, RemoveStudentState } from "@/types/actions";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getTableNumber(formData: FormData) {
  const raw = formData.get("tableNumber");

  if (typeof raw !== "string") {
    return Number.NaN;
  }

  const value = Number(raw);

  return Number.isInteger(value) ? value : Number.NaN;
}

function addErrorMessage(error: SeatingError) {
  switch (error.code) {
    case "23505":
      return /already seated/i.test(error.message)
        ? error.message
        : "A student with this name is already seated.";
    case "23514":
      return /full|capacity/i.test(error.message)
        ? error.message
        : "That table is already full.";
    case "23503":
      return "That table does not exist. Choose another table.";
    case "22001":
    case "22023":
      return error.message;
    default:
      return "We couldn't add this student. Please try again.";
  }
}

export async function addStudentAction(
  formData: FormData,
): Promise<AddStudentState> {
  const name = getString(formData, "name");
  const classSection = getString(formData, "classSection");
  const tableNumber = getTableNumber(formData);
  const errors = validateStudentForm({ name, classSection, tableNumber });
  const firstError = Object.values(errors)[0];

  if (firstError) {
    return { status: "error", message: firstError };
  }

  try {
    const student = await addStudent({ name, classSection, tableNumber });

    return {
      status: "success",
      message: `Added ${student.name} to Table ${student.tableNumber}.`,
      studentId: student.id,
      studentName: student.name,
      tableNumber: student.tableNumber,
    };
  } catch (error) {
    if (error instanceof SeatingError) {
      console.error("add_student failed", error.code, error.message);
      return { status: "error", message: addErrorMessage(error) };
    }

    console.error("Unexpected add_student error", error);
    return {
      status: "error",
      message: "Something went wrong. Please try again.",
    };
  }
}

export async function removeStudentAction(
  formData: FormData,
): Promise<RemoveStudentState> {
  const studentId = getString(formData, "studentId").trim();
  const studentName = getString(formData, "studentName").trim() || "The student";

  if (!UUID_PATTERN.test(studentId)) {
    return {
      status: "error",
      message: "We couldn't identify that student. Refresh and try again.",
    };
  }

  try {
    const removed = await removeStudent(studentId);

    return {
      status: "success",
      message: removed
        ? `${studentName} was removed. Their seat is now free.`
        : `${studentName} was already removed.`,
      studentId,
    };
  } catch (error) {
    if (error instanceof SeatingError) {
      console.error("remove_student failed", error.code, error.message);
    } else {
      console.error("Unexpected remove_student error", error);
    }

    return {
      status: "error",
      message: "We couldn't remove this student. Please try again.",
    };
  }
}

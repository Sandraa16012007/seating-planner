import {
  MAX_CLASS_SECTION_LENGTH,
  MAX_STUDENT_NAME_LENGTH,
  TABLE_COUNT,
} from "@/lib/constants";

export type StudentFormValues = {
  name: string;
  classSection: string;
  tableNumber: number;
};

export type StudentFormErrors = Partial<
  Record<keyof StudentFormValues, string>
>;

/** Collapse repeated whitespace so validation matches the database rules. */
export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateStudentForm(
  values: StudentFormValues,
): StudentFormErrors {
  const errors: StudentFormErrors = {};
  const name = normalizeWhitespace(values.name);
  const classSection = normalizeWhitespace(values.classSection);

  if (!name) {
    errors.name = "Please enter the student's name.";
  } else if (name.length > MAX_STUDENT_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_STUDENT_NAME_LENGTH} characters or fewer.`;
  }

  if (!classSection) {
    errors.classSection = "Please enter the class or section.";
  } else if (classSection.length > MAX_CLASS_SECTION_LENGTH) {
    errors.classSection = `Class/section must be ${MAX_CLASS_SECTION_LENGTH} characters or fewer.`;
  }

  if (
    !Number.isInteger(values.tableNumber) ||
    values.tableNumber < 1 ||
    values.tableNumber > TABLE_COUNT
  ) {
    errors.tableNumber = "Choose a valid table.";
  }

  return errors;
}

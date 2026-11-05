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

export type NameConflict = {
  kind: "full-name" | "name-and-class" | "first-name";
  /** A blocking conflict must be fixed; a warning can be acknowledged. */
  blocking: boolean;
  message: string;
};

type ExistingStudentName = {
  name: string;
  classSection: string;
  tableNumber: number;
};

/** Collapse repeated whitespace so validation matches the database rules. */
export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

/** Case- and whitespace-insensitive form used for duplicate comparisons. */
export function normalizeStudentName(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

export function getStudentFirstName(value: string) {
  return normalizeStudentName(value).split(" ")[0] ?? "";
}

/**
 * A single-line name field should never contain a list. Commas and line breaks
 * are the separators people use when pasting several names.
 */
export function hasMultipleNameSeparators(value: string) {
  return /[,\r\n]/.test(value);
}

export function validateStudentForm(
  values: StudentFormValues,
): StudentFormErrors {
  const errors: StudentFormErrors = {};
  const name = normalizeWhitespace(values.name);
  const classSection = normalizeWhitespace(values.classSection);

  if (!name) {
    errors.name = "Please enter the student's name.";
  } else if (hasMultipleNameSeparators(values.name)) {
    errors.name =
      "Enter one student's name only. Commas and line breaks are not allowed.";
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

/**
 * Mirrors the database duplicate checks for immediate feedback. The database
 * remains authoritative because another visitor may register between page load
 * and form submission.
 */
export function findNameConflict(
  name: string,
  classSection: string,
  existingStudents: ExistingStudentName[],
): NameConflict | null {
  const normalizedName = normalizeStudentName(name);

  if (!normalizedName || hasMultipleNameSeparators(name)) {
    return null;
  }

  const normalizedClassSection = normalizeStudentName(classSection);
  const firstName = getStudentFirstName(name);

  const sameFullName = existingStudents.find(
    (student) => normalizeStudentName(student.name) === normalizedName,
  );

  if (sameFullName) {
    const sameClassSection =
      Boolean(normalizedClassSection) &&
      normalizeStudentName(sameFullName.classSection) === normalizedClassSection;

    return {
      kind: sameClassSection ? "name-and-class" : "full-name",
      blocking: true,
      message: sameClassSection
        ? `${sameFullName.name} is already registered in ${sameFullName.classSection} at Table ${sameFullName.tableNumber}. A student can only be registered once.`
        : `${sameFullName.name} is already seated at Table ${sameFullName.tableNumber}. A student can only be seated once.`,
    };
  }

  const sameFirstName = existingStudents.find(
    (student) => getStudentFirstName(student.name) === firstName,
  );

  if (!sameFirstName) {
    return null;
  }

  const existingFirstName = normalizeWhitespace(sameFirstName.name).split(
    " ",
  )[0];

  if (!normalizedName.includes(" ")) {
    return {
      kind: "first-name",
      blocking: true,
      message: `Someone with the first name ${existingFirstName} is already registered. Enter your full name, including a surname or another name.`,
    };
  }

  return {
    kind: "first-name",
    blocking: false,
    message: `Another student with the first name ${existingFirstName} is already registered. Make sure your full name includes a surname or another distinctive name.`,
  };
}

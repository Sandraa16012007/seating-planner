export const TABLE_COUNT = 22;
export const STANDARD_TABLE_CAPACITY = 7;
export const FINAL_TABLE_CAPACITY = 6;

/** 21 tables x 7 seats + 1 table x 6 seats = 153. */
export const TOTAL_CAPACITY =
  (TABLE_COUNT - 1) * STANDARD_TABLE_CAPACITY + FINAL_TABLE_CAPACITY;

/**
 * Input limits. These mirror the CHECK constraints and RPC validation in the
 * database migration; keep both sides in sync.
 */
export const MAX_STUDENT_NAME_LENGTH = 80;
export const MAX_CLASS_SECTION_LENGTH = 40;

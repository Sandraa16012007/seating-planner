export const TABLE_COUNT = 19;
export const STANDARD_TABLE_CAPACITY = 8;
export const FINAL_TABLE_CAPACITY = 9;

/** 18 tables x 8 seats + 1 table x 9 seats = 153. */
export const TOTAL_CAPACITY =
  (TABLE_COUNT - 1) * STANDARD_TABLE_CAPACITY + FINAL_TABLE_CAPACITY;

/**
 * Input limits. These mirror the CHECK constraints and RPC validation in the
 * database migration; keep both sides in sync.
 */
export const MAX_STUDENT_NAME_LENGTH = 80;
export const MAX_CLASS_SECTION_LENGTH = 40;

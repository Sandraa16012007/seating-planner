/** A student as the application uses it (camelCase, presentation-friendly). */
export type Student = {
  id: string;
  name: string;
  classSection: string;
  tableNumber: number;
  createdAt: string;
};

/** One of the 22 fixed tables, including the students seated there. */
export type SeatingTable = {
  tableNumber: number;
  capacity: number;
  students: Student[];
};

/** All tables in table-number order. */
export type SeatingPlan = SeatingTable[];

export type AddStudentInput = {
  name: string;
  classSection: string;
  tableNumber: number;
};

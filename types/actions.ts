export type AddStudentState =
  | { status: "idle" }
  | {
      status: "success";
      message: string;
      studentId: string;
      studentName: string;
      tableNumber: number;
    }
  | { status: "error"; message: string };

export type RemoveStudentState =
  | { status: "idle" }
  | { status: "success"; message: string; studentId: string }
  | { status: "error"; message: string };

export type OwnedStudentState =
  | { status: "none" }
  | {
      status: "found";
      studentId: string;
      studentName: string;
      classSection: string;
      tableNumber: number;
    }
  | { status: "error"; message: string };

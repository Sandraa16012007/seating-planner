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

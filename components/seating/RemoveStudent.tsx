"use client";

import { useRef, useState, useTransition } from "react";

import { removeStudentAction } from "@/app/actions/seating";
import { TrashIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import type { Student } from "@/types/seating";

type RemoveStudentProps = {
  student: Student;
  tableNumber: number;
  onRemoved: (studentName: string) => void;
};

export default function RemoveStudent({
  student,
  tableNumber,
  onRemoved,
}: RemoveStudentProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <li>
        <RemoveStudentConfirm
          onCancel={() => setConfirming(false)}
          onRemoved={onRemoved}
          student={student}
          tableNumber={tableNumber}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-white px-3 py-2.5">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium leading-5 text-ink">
          {student.name}
        </p>
        <p className="mt-0.5 break-words text-xs leading-5 text-stone-500">
          {student.classSection}
        </p>
      </div>

      <button
        aria-label={`Remove ${student.name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        onClick={() => setConfirming(true)}
        type="button"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </li>
  );
}

type RemoveStudentConfirmProps = {
  student: Student;
  tableNumber: number;
  onCancel: () => void;
  onRemoved: (studentName: string) => void;
};

function RemoveStudentConfirm({
  student,
  tableNumber,
  onCancel,
  onRemoved,
}: RemoveStudentConfirmProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const removingRef = useRef(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending || removingRef.current) {
      return;
    }

    setError(null);
    const formData = new FormData(event.currentTarget);
    removingRef.current = true;

    startTransition(async () => {
      try {
        const result = await removeStudentAction(formData);

        if (result.status === "error") {
          setError(result.message);
          return;
        }

        onRemoved(student.name);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        removingRef.current = false;
      }
    });
  }

  return (
    <div className="toast-enter rounded-2xl border border-rose-200 bg-rose-50/80 p-3">
      <p className="text-sm font-semibold text-rose-900">
        Remove {student.name}?
      </p>
      <p className="mt-1 text-xs leading-5 text-rose-700/80">
        Their seat at Table {tableNumber} will become available.
      </p>

      {error ? (
        <p
          className="mt-2 rounded-lg bg-white/80 px-2.5 py-2 text-xs font-medium leading-5 text-rose-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
        <input name="studentId" type="hidden" value={student.id} />
        <input name="studentName" type="hidden" value={student.name} />

        <button
          autoFocus
          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-60"
          disabled={pending}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <>
              <Spinner className="h-3.5 w-3.5" />
              Removing
            </>
          ) : (
            "Remove"
          )}
        </button>
      </form>
    </div>
  );
}

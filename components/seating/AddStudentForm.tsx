"use client";

import { useId, useRef, useState } from "react";

import { addStudentAction } from "@/app/actions/seating";
import { AlertCircleIcon, CheckIcon, PlusIcon } from "@/components/ui/icons";
import Spinner from "@/components/ui/Spinner";
import {
  MAX_CLASS_SECTION_LENGTH,
  MAX_STUDENT_NAME_LENGTH,
} from "@/lib/constants";
import {
  generateOwnershipToken,
  readOwnershipToken,
  saveOwnershipToken,
} from "@/lib/ownership-token";
import {
  findNameConflict,
  hasMultipleNameSeparators,
  validateStudentForm,
  type StudentFormErrors,
} from "@/lib/seating-validation";
import { getOpenSeats } from "@/lib/table-status";
import type { SeatingPlan } from "@/types/seating";

type AddStudentFormProps = {
  plan: SeatingPlan;
  initialTableNumber: number;
  cancelLabel?: string;
  /** True once this browser already owns a student entry. */
  registrationLocked?: boolean;
  onCancel: () => void;
  onAdded: (studentId: string, ownershipToken: string) => void;
};

type RegisteredState = {
  message: string;
  studentName: string;
  tableNumber: number;
};

export default function AddStudentForm({
  plan,
  initialTableNumber,
  cancelLabel = "Cancel",
  registrationLocked = false,
  onCancel,
  onAdded,
}: AddStudentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [tableNumber, setTableNumber] = useState(initialTableNumber);
  const [fieldErrors, setFieldErrors] = useState<StudentFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<RegisteredState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const formId = useId();
  const nameId = `${formId}-name`;
  const classId = `${formId}-class`;
  const tableId = `${formId}-table`;
  const nameErrorId = `${formId}-name-error`;
  const nameWarningId = `${formId}-name-warning`;
  const classErrorId = `${formId}-class-error`;
  const tableErrorId = `${formId}-table-error`;
  const tableHintId = `${formId}-table-hint`;

  const selectedTable = plan.find(
    (table) => table.tableNumber === tableNumber,
  );
  const openSeats = selectedTable ? getOpenSeats(selectedTable) : 0;
  const isTableFull = !selectedTable || openSeats === 0;
  const hasAnyOpenSeats = plan.some((table) => getOpenSeats(table) > 0);
  const existingStudents = plan.flatMap((table) => table.students);
  const hasNameSeparators = hasMultipleNameSeparators(name);
  const nameConflict = hasNameSeparators
    ? null
    : findNameConflict(name, classSection, existingStudents);
  const nameWarningMessage = hasNameSeparators
    ? "Enter one student's name only. Commas and line breaks are not allowed."
    : nameConflict?.message;
  const nameHasBlockingConflict =
    hasNameSeparators || nameConflict?.blocking === true;

  function clearFeedback() {
    setServerError(null);
  }

  function handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);

    if (fieldErrors.name) {
      setFieldErrors((current) => ({ ...current, name: undefined }));
    }

    clearFeedback();
  }

  function handleClassChange(event: React.ChangeEvent<HTMLInputElement>) {
    setClassSection(event.target.value);

    if (fieldErrors.classSection) {
      setFieldErrors((current) => ({ ...current, classSection: undefined }));
    }

    clearFeedback();
  }

  function handleTableChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setTableNumber(Number(event.target.value));

    if (fieldErrors.tableNumber) {
      setFieldErrors((current) => ({ ...current, tableNumber: undefined }));
    }

    clearFeedback();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting || submittingRef.current || registrationLocked) {
      return;
    }

    const errors = validateStudentForm({ name, classSection, tableNumber });
    const conflict = findNameConflict(name, classSection, existingStudents);

    if (conflict?.blocking) {
      errors.name = conflict.message;
    }

    if (!selectedTable) {
      errors.tableNumber = "Choose a valid table.";
    } else if (openSeats === 0) {
      errors.tableNumber = "That table is full. Choose another table.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setServerError(null);

      const firstInvalid = (
        ["name", "classSection", "tableNumber"] as const
      ).find((field) => errors[field]);

      if (firstInvalid) {
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
          ?.focus();
      }

      return;
    }

    // Keep the same token for every attempt from this browser. It is saved
    // before the request so a successful registration remains recoverable even
    // if the response is interrupted.
    const ownershipToken = readOwnershipToken() ?? generateOwnershipToken();

    if (!saveOwnershipToken(ownershipToken)) {
      setServerError(
        "This browser could not store your registration token. Enable site storage and try again.",
      );
      return;
    }

    setFieldErrors({});
    setServerError(null);

    const formData = new FormData(event.currentTarget);
    formData.set("ownershipToken", ownershipToken);
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await addStudentAction(formData);

      if (result.status === "success") {
        setServerError(null);
        setName("");
        setClassSection("");
        setRegistered({
          message: result.message,
          studentName: result.studentName,
          tableNumber: result.tableNumber,
        });
        onAdded(result.studentId, ownershipToken);
        return;
      }

      if (result.status === "error") {
        setServerError(result.message);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const inputClassName = (hasError: boolean) =>
    `mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-4 ${
      hasError
        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
        : "border-stone-200 focus:border-brand/40 focus:ring-brand/10"
    }`;

  if (registered) {
    return (
      <div className="space-y-4">
        <div
          className="toast-enter flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800"
          role="status"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>{registered.message}</p>
        </div>

        <p className="rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-xs leading-5 text-stone-600">
          This browser is now linked to {registered.studentName} at Table{" "}
          {registered.tableNumber}. Only this browser can remove that entry.
        </p>

        <div className="flex justify-end">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            onClick={onCancel}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {serverError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p>{serverError}</p>
        </div>
      ) : null}

      {registrationLocked ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
          This browser already has a registration. One student can be
          registered per browser.
        </p>
      ) : null}

      <div>
        <label className="text-sm font-medium text-ink" htmlFor={nameId}>
          Student name
        </label>
        <input
          aria-describedby={
            fieldErrors.name
              ? nameErrorId
              : nameWarningMessage
                ? nameWarningId
                : undefined
          }
          aria-invalid={
            fieldErrors.name || nameHasBlockingConflict ? true : undefined
          }
          autoCapitalize="words"
          autoComplete="off"
          className={inputClassName(
            Boolean(fieldErrors.name || nameHasBlockingConflict),
          )}
          enterKeyHint="next"
          id={nameId}
          maxLength={MAX_STUDENT_NAME_LENGTH}
          name="name"
          onChange={handleNameChange}
          placeholder="e.g. Aditi Sharma"
          required
          type="text"
          value={name}
        />
        {fieldErrors.name ? (
          <p
            className="mt-1.5 text-xs font-medium text-rose-600"
            id={nameErrorId}
          >
            {fieldErrors.name}
          </p>
        ) : nameWarningMessage ? (
          <p
            className={`mt-1.5 text-xs font-medium ${
              nameHasBlockingConflict ? "text-rose-600" : "text-amber-700"
            }`}
            id={nameWarningId}
          >
            {nameWarningMessage}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-ink" htmlFor={classId}>
          Section
        </label>
        <input
          aria-describedby={fieldErrors.classSection ? classErrorId : undefined}
          aria-invalid={fieldErrors.classSection ? true : undefined}
          autoCapitalize="words"
          autoComplete="off"
          className={inputClassName(Boolean(fieldErrors.classSection))}
          enterKeyHint="next"
          id={classId}
          maxLength={MAX_CLASS_SECTION_LENGTH}
          name="classSection"
          onChange={handleClassChange}
          placeholder="e.g. A, B, C, D"
          required
          type="text"
          value={classSection}
        />
        {fieldErrors.classSection ? (
          <p
            className="mt-1.5 text-xs font-medium text-rose-600"
            id={classErrorId}
          >
            {fieldErrors.classSection}
          </p>
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-ink" htmlFor={tableId}>
          Table
        </label>
        <select
          aria-describedby={
            fieldErrors.tableNumber ? tableErrorId : tableHintId
          }
          aria-invalid={fieldErrors.tableNumber ? true : undefined}
          className={inputClassName(Boolean(fieldErrors.tableNumber))}
          id={tableId}
          name="tableNumber"
          onChange={handleTableChange}
          value={tableNumber}
        >
          {plan.map((table) => {
            const seats = getOpenSeats(table);

            return (
              <option
                disabled={seats === 0}
                key={table.tableNumber}
                value={table.tableNumber}
              >
                {`Table ${table.tableNumber} · ${
                  seats === 0
                    ? "full"
                    : `${seats} ${seats === 1 ? "seat" : "seats"} left`
                }`}
              </option>
            );
          })}
        </select>

        {fieldErrors.tableNumber ? (
          <p
            className="mt-1.5 text-xs font-medium text-rose-600"
            id={tableErrorId}
          >
            {fieldErrors.tableNumber}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-stone-500" id={tableHintId}>
            {selectedTable && openSeats === 0
              ? "This table is full. Choose another table."
              : selectedTable
                ? `Table ${selectedTable.tableNumber} · ${openSeats} of ${selectedTable.capacity} seats available`
                : "Choose an available table."}
          </p>
        )}
      </div>

      {!hasAnyOpenSeats ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-700">
          Every seat is currently taken. A registered student must remove their
          own entry before someone else can register.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          onClick={onCancel}
          type="button"
        >
          {cancelLabel}
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:bg-stone-200 disabled:text-stone-400"
          disabled={
            submitting ||
            registrationLocked ||
            nameHasBlockingConflict ||
            isTableFull ||
            !hasAnyOpenSeats
          }
          type="submit"
        >
          {submitting ? (
            <>
              <Spinner className="h-4 w-4" />
              Adding…
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Add student
            </>
          )}
        </button>
      </div>
    </form>
  );
}

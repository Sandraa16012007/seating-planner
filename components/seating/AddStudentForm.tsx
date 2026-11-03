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
  validateStudentForm,
  type StudentFormErrors,
} from "@/lib/seating-validation";
import { getOpenSeats } from "@/lib/table-status";
import type { SeatingPlan } from "@/types/seating";

type AddStudentFormProps = {
  plan: SeatingPlan;
  initialTableNumber: number;
  cancelLabel?: string;
  onCancel: () => void;
  onAdded: () => void;
};

export default function AddStudentForm({
  plan,
  initialTableNumber,
  cancelLabel = "Cancel",
  onCancel,
  onAdded,
}: AddStudentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [tableNumber, setTableNumber] = useState(initialTableNumber);
  const [fieldErrors, setFieldErrors] = useState<StudentFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const nameId = `${formId}-name`;
  const classId = `${formId}-class`;
  const tableId = `${formId}-table`;
  const nameErrorId = `${formId}-name-error`;
  const classErrorId = `${formId}-class-error`;
  const tableErrorId = `${formId}-table-error`;
  const tableHintId = `${formId}-table-hint`;

  const selectedTable = plan.find(
    (table) => table.tableNumber === tableNumber,
  );
  const openSeats = selectedTable ? getOpenSeats(selectedTable) : 0;
  const isTableFull = !selectedTable || openSeats === 0;
  const hasAnyOpenSeats = plan.some((table) => getOpenSeats(table) > 0);

  function clearFeedback() {
    setServerError(null);
    setSuccessMessage(null);
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

    if (submitting) {
      return;
    }

    const errors = validateStudentForm({ name, classSection, tableNumber });

    if (!selectedTable) {
      errors.tableNumber = "Choose a valid table.";
    } else if (openSeats === 0) {
      errors.tableNumber = "That table is full. Choose another table.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setServerError(null);
      setSuccessMessage(null);

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

    setFieldErrors({});
    setServerError(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      const result = await addStudentAction(formData);

      if (result.status === "success") {
        setSuccessMessage(result.message);
        setServerError(null);
        setName("");
        setClassSection("");
        onAdded();
        return;
      }

      if (result.status === "error") {
        setServerError(result.message);
        setSuccessMessage(null);
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
      setSuccessMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClassName = (hasError: boolean) =>
    `mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-stone-400 focus:ring-4 ${
      hasError
        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
        : "border-stone-200 focus:border-brand/40 focus:ring-brand/10"
    }`;

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {successMessage ? (
        <div
          className="toast-enter flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800"
          role="status"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>{successMessage}</p>
        </div>
      ) : null}

      {serverError ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p>{serverError}</p>
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-ink" htmlFor={nameId}>
          Student name
        </label>
        <input
          aria-describedby={fieldErrors.name ? nameErrorId : undefined}
          aria-invalid={fieldErrors.name ? true : undefined}
          autoCapitalize="words"
          autoComplete="off"
          className={inputClassName(Boolean(fieldErrors.name))}
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
        ) : null}
      </div>

      <div>
        <label className="text-sm font-medium text-ink" htmlFor={classId}>
          Class / section
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
          placeholder="e.g. Computer Science"
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
          Every seat is currently taken. Ask someone to remove a student before
          adding a new one.
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
          disabled={submitting || isTableFull || !hasAnyOpenSeats}
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

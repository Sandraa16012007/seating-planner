"use client";

import OccupancyBar from "@/components/seating/OccupancyBar";
import RemoveStudent from "@/components/seating/RemoveStudent";
import TableStatusBadge from "@/components/seating/TableStatusBadge";
import {
  CheckIcon,
  ChevronLeftIcon,
  PlusIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getOpenSeats, getTableStatus } from "@/lib/table-status";
import type { SeatingTable } from "@/types/seating";

type DetailsNotice = {
  id: string;
  message: string;
};

type TableDetailsProps = {
  table: SeatingTable;
  notice: DetailsNotice | null;
  ownedStudentId: string | null;
  ownershipToken: string | null;
  canRegister: boolean;
  registrationPending: boolean;
  onAdd: () => void;
  onRemoved: (studentName: string) => void;
  onClose: () => void;
};

export default function TableDetails({
  table,
  notice,
  ownedStudentId,
  ownershipToken,
  canRegister,
  registrationPending,
  onAdd,
  onRemoved,
  onClose,
}: TableDetailsProps) {
  const occupied = table.students.length;
  const openSeats = getOpenSeats(table);
  const status = getTableStatus(table);
  const isFull = openSeats === 0;
  const addDisabled = isFull || !canRegister;

  return (
    <div>
      {notice ? (
        <div
          className="toast-enter mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-5 text-emerald-800"
          role="status"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p>{notice.message}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Occupancy
            </p>
            <p className="mt-1 font-serif text-3xl leading-none text-ink">
              {occupied}
              <span className="font-sans text-sm font-medium text-stone-500">
                {" "}
                / {table.capacity}
              </span>
            </p>
          </div>
          <TableStatusBadge status={status} />
        </div>

        <OccupancyBar
          capacity={table.capacity}
          className="mt-3"
          label={`Table ${table.tableNumber} occupancy`}
          occupied={occupied}
          size="md"
          status={status}
        />

        <p className="mt-2 text-xs text-stone-500">
          {isFull
            ? "No seats available at this table"
            : `${openSeats} ${openSeats === 1 ? "seat" : "seats"} available`}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Students</h3>
        <span className="text-xs text-stone-500">
          {occupied} {occupied === 1 ? "person" : "people"}
        </span>
      </div>

      {occupied === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center">
          <UsersIcon className="mx-auto h-6 w-6 text-stone-300" />
          <p className="mt-2 text-sm font-medium text-stone-600">
            This table is empty
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Be the first to take a seat.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {table.students.map((student) => (
            <RemoveStudent
              canRemove={
                student.id === ownedStudentId && Boolean(ownershipToken)
              }
              key={student.id}
              onRemoved={onRemoved}
              ownershipToken={ownershipToken}
              student={student}
              tableNumber={table.tableNumber}
            />
          ))}
        </ul>
      )}

      {isFull ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-5 text-rose-700">
          This table is full. The owner of an entry must remove it to free a
          seat.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
          onClick={onClose}
          type="button"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to all tables
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:bg-stone-200 disabled:text-stone-400"
          disabled={addDisabled}
          onClick={onAdd}
          type="button"
        >
          {isFull ? (
            "Table is full"
          ) : registrationPending ? (
            "Checking registration…"
          ) : !canRegister ? (
            "Already registered"
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              Add student
            </>
          )}
        </button>
      </div>
    </div>
  );
}

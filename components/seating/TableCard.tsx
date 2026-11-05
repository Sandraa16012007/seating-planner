"use client";

import OccupancyBar from "@/components/seating/OccupancyBar";
import TableStatusBadge from "@/components/seating/TableStatusBadge";
import { PlusIcon } from "@/components/ui/icons";
import { getOpenSeats, getTableStatus } from "@/lib/table-status";
import type { SeatingTable } from "@/types/seating";

type TableCardProps = {
  table: SeatingTable;
  canRegister: boolean;
  registrationPending: boolean;
  onOpenDetails: (tableNumber: number) => void;
  onAddStudent: (tableNumber: number) => void;
};

export default function TableCard({
  table,
  canRegister,
  registrationPending,
  onOpenDetails,
  onAddStudent,
}: TableCardProps) {
  const occupied = table.students.length;
  const openSeats = getOpenSeats(table);
  const status = getTableStatus(table);
  const isFull = status === "full";
  const addDisabled = isFull || !canRegister;
  const visibleStudents = table.students.slice(0, 3);
  const hiddenCount = table.students.length - visibleStudents.length;

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 shadow-[0_12px_40px_-32px_rgba(45,30,35,0.45)] transition duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_18px_50px_-30px_rgba(45,30,35,0.35)] ${
        isFull
          ? "border-rose-200/80 bg-rose-50/30"
          : "border-white/80 bg-white/80"
      }`}
    >
      <button
        aria-label={`View Table ${table.tableNumber} details, ${occupied} of ${table.capacity} seats taken`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        onClick={() => onOpenDetails(table.tableNumber)}
        type="button"
      />

      <div className="pointer-events-none relative z-20 flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              Table
            </p>
            <h3 className="mt-0.5 font-serif text-2xl leading-none text-ink">
              {table.tableNumber}
            </h3>
          </div>
          <TableStatusBadge status={status} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-stone-500">
            {occupied} of {table.capacity} seated
          </span>
          <span className="text-stone-500">
            {openSeats === 0
              ? "No seats left"
              : `${openSeats} ${openSeats === 1 ? "seat" : "seats"} open`}
          </span>
        </div>

        <OccupancyBar
          capacity={table.capacity}
          className="mt-2"
          label={`Table ${table.tableNumber} occupancy`}
          occupied={occupied}
          status={status}
        />

        <div className="mt-3 flex-1">
          {occupied === 0 ? (
            <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-stone-200/80 bg-white/40 px-3 py-3 text-center text-xs text-stone-500">
              No one seated yet
            </div>
          ) : (
            <ul className="space-y-1.5">
              {visibleStudents.map((student) => (
                <li
                  className="flex min-w-0 items-center justify-between gap-2"
                  key={student.id}
                >
                  <span className="min-w-0 break-words text-sm font-medium leading-5 text-stone-700">
                    {student.name}
                  </span>
                  <span
                    className="max-w-[42%] shrink-0 truncate rounded-full bg-stone-100/90 px-2 py-0.5 text-[11px] font-medium text-stone-500"
                    title={student.classSection}
                  >
                    {student.classSection}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {hiddenCount > 0 ? (
            <p className="mt-2 text-[11px] font-medium text-stone-500">
              +{hiddenCount} more {hiddenCount === 1 ? "student" : "students"}
            </p>
          ) : null}
        </div>

        <button
          className={`pointer-events-auto mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${
            addDisabled
              ? "pointer-events-none bg-stone-100 text-stone-400"
              : "bg-brand text-white hover:bg-brand-dark active:scale-[0.99]"
          }`}
          disabled={addDisabled}
          onClick={() => onAddStudent(table.tableNumber)}
          type="button"
        >
          {isFull ? (
            "Table full"
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
    </article>
  );
}

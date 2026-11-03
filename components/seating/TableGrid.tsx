"use client";

import TableCard from "@/components/seating/TableCard";
import { AlertCircleIcon } from "@/components/ui/icons";
import type { SeatingPlan } from "@/types/seating";

type TableGridProps = {
  plan: SeatingPlan;
  onOpenDetails: (tableNumber: number) => void;
  onAddStudent: (tableNumber: number) => void;
};

const legend = [
  { label: "Empty", dotClassName: "bg-stone-400" },
  { label: "Available", dotClassName: "bg-emerald-500" },
  { label: "1 seat left", dotClassName: "bg-amber-400" },
  { label: "Full", dotClassName: "bg-rose-400" },
];

export default function TableGrid({
  plan,
  onOpenDetails,
  onAddStudent,
}: TableGridProps) {
  const totalSeats = plan.reduce((total, table) => total + table.capacity, 0);
  const occupiedSeats = plan.reduce(
    (total, table) => total + table.students.length,
    0,
  );
  const openSeats = Math.max(0, totalSeats - occupiedSeats);

  return (
    <section aria-label="Seating arrangement" className="mt-8" id="tables">
      <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl leading-tight text-ink sm:text-3xl">
            Choose your table
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-stone-500">
            Tap a table to see who is seated or save a spot for a friend.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-medium text-stone-500">
          {legend.map((item) => (
            <span className="inline-flex items-center gap-1.5" key={item.label}>
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${item.dotClassName}`}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      {openSeats === 0 ? (
        <div
          className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm leading-6 text-rose-800"
          role="status"
        >
          <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
          <p>
            <strong className="font-semibold">Every seat is taken.</strong>{" "}
            Remove a student from a table to open a seat.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plan.map((table) => (
          <TableCard
            key={table.tableNumber}
            onAddStudent={onAddStudent}
            onOpenDetails={onOpenDetails}
            table={table}
          />
        ))}
      </div>
    </section>
  );
}

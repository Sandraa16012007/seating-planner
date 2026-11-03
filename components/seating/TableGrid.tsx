import TableCard from "@/components/seating/TableCard";
import type { SeatingPlan } from "@/types/seating";

type TableGridProps = {
  plan: SeatingPlan;
};

export default function TableGrid({ plan }: TableGridProps) {
  const totalSeats = plan.reduce((total, table) => total + table.capacity, 0);
  const occupiedSeats = plan.reduce(
    (total, table) => total + table.students.length,
    0,
  );
  const openSeats = totalSeats - occupiedSeats;

  return (
    <section aria-label="Seating arrangement">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">
            Seating arrangement
          </h2>
          <p className="mt-0.5 text-sm text-stone-500">
            {occupiedSeats} of {totalSeats} seats filled · Tables 1–21 seat 7,
            table 22 seats 6
          </p>
        </div>

        <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
          {openSeats} {openSeats === 1 ? "seat" : "seats"} left
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {plan.map((table) => (
          <TableCard key={table.tableNumber} table={table} />
        ))}
      </div>
    </section>
  );
}

import type { SeatingTable } from "@/types/seating";

type TableCardProps = {
  table: SeatingTable;
};

export default function TableCard({ table }: TableCardProps) {
  const occupied = table.students.length;
  const openSeats = Math.max(0, table.capacity - occupied);
  const isFull = openSeats === 0;
  const fillPercentage = Math.min(
    100,
    Math.round((occupied / table.capacity) * 100),
  );

  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-stone-900">
            Table {table.tableNumber}
          </h3>
          <p className="mt-0.5 text-xs text-stone-400">
            {occupied} of {table.capacity} seats taken
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isFull
              ? "bg-rose-50 text-rose-600"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {isFull ? "Full" : `${openSeats} open`}
        </span>
      </div>

      <div
        aria-label={`Table ${table.tableNumber} occupancy`}
        aria-valuemax={table.capacity}
        aria-valuemin={0}
        aria-valuenow={occupied}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full ${
            isFull ? "bg-rose-400" : "bg-amber-500"
          }`}
          style={{ width: `${fillPercentage}%` }}
        />
      </div>

      {occupied === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-stone-200 px-3 py-5 text-center text-sm text-stone-400">
          No one seated yet
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-100">
          {table.students.map((student) => (
            <li
              className="flex items-start justify-between gap-3 py-2.5"
              key={student.id}
            >
              <span className="min-w-0 break-words text-sm font-medium leading-5 text-stone-800">
                {student.name}
              </span>
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                {student.classSection}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

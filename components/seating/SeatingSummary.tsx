import type { SeatingPlan } from "@/types/seating";

type SeatingSummaryProps = {
  plan: SeatingPlan;
};

export default function SeatingSummary({ plan }: SeatingSummaryProps) {
  const totalTables = plan.length;
  const totalSeats = plan.reduce((total, table) => total + table.capacity, 0);
  const occupiedSeats = plan.reduce(
    (total, table) => total + table.students.length,
    0,
  );
  const availableSeats = Math.max(0, totalSeats - occupiedSeats);

  const stats = [
    { label: "Tables", value: totalTables, hint: "fixed layout" },
    { label: "Total seats", value: totalSeats, hint: "capacity" },
    { label: "Occupied", value: occupiedSeats, hint: "seats taken" },
    {
      label: "Available",
      value: availableSeats,
      hint: availableSeats === 0 ? "event full" : "seats open",
      highlight: availableSeats === 0,
    },
  ];

  return (
    <section aria-label="Seating overview">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            className={`rounded-2xl border bg-white/70 p-4 shadow-[0_12px_36px_-28px_rgba(45,30,35,0.45)] backdrop-blur-sm ${
              stat.highlight
                ? "border-rose-200/80 bg-rose-50/60"
                : "border-white/80"
            }`}
            key={stat.label}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 sm:text-[11px]">
              {stat.label}
            </p>
            <p
              className={`mt-2 font-serif text-3xl leading-none ${
                stat.highlight ? "text-rose-500" : "text-ink"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">{stat.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

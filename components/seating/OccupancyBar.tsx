import type { TableStatus } from "@/lib/table-status";

const barStyles: Record<TableStatus, string> = {
  empty: "bg-stone-300",
  available: "bg-emerald-500",
  "almost-full": "bg-amber-400",
  full: "bg-rose-400",
};

type OccupancyBarProps = {
  occupied: number;
  capacity: number;
  status: TableStatus;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export default function OccupancyBar({
  occupied,
  capacity,
  status,
  label,
  size = "sm",
  className = "",
}: OccupancyBarProps) {
  const percentage =
    capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

  return (
    <div
      aria-label={label}
      aria-valuemax={capacity}
      aria-valuemin={0}
      aria-valuenow={occupied}
      aria-valuetext={`${occupied} of ${capacity} seats (${percentage}%)`}
      className={`overflow-hidden rounded-full bg-stone-100 ${
        size === "md" ? "h-2" : "h-1.5"
      } ${className}`}
      role="progressbar"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${barStyles[status]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

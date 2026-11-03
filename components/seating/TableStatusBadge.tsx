import type { TableStatus } from "@/lib/table-status";

const statusStyles: Record<
  TableStatus,
  { label: string; className: string; dotClassName: string }
> = {
  empty: {
    label: "Empty",
    className: "border-stone-200 bg-stone-100/80 text-stone-500",
    dotClassName: "bg-stone-400",
  },
  available: {
    label: "Available",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  "almost-full": {
    label: "1 seat left",
    className: "border-amber-100 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-400",
  },
  full: {
    label: "Full",
    className: "border-rose-100 bg-rose-50 text-rose-600",
    dotClassName: "bg-rose-400",
  },
};

type TableStatusBadgeProps = {
  status: TableStatus;
};

export default function TableStatusBadge({ status }: TableStatusBadgeProps) {
  const style = statusStyles[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style.className}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${style.dotClassName}`}
      />
      {style.label}
    </span>
  );
}

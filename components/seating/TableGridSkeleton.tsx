import { TABLE_COUNT } from "@/lib/constants";

export default function TableGridSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-4">
        <div className="h-6 w-48 animate-pulse rounded bg-stone-200" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-stone-200" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: TABLE_COUNT }, (_, index) => (
          <div
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            key={index}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="h-5 w-24 animate-pulse rounded bg-stone-200" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-stone-200" />
            </div>
            <div className="mt-4 h-1.5 w-full animate-pulse rounded-full bg-stone-100" />
            <div className="mt-5 space-y-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TableGridSkeleton() {
  return (
    <div>
      <span className="sr-only" role="status">
        Loading seating plan…
      </span>

      <div aria-hidden="true" className="animate-pulse">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="rounded-2xl border border-white/80 bg-white/70 p-4"
              key={index}
            >
              <div className="h-3 w-16 rounded bg-stone-200/80" />
              <div className="mt-3 h-8 w-12 rounded bg-stone-200/80" />
              <div className="mt-2 h-3 w-20 rounded bg-stone-100" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="h-8 w-52 rounded bg-stone-200/80" />
            <div className="mt-2 h-4 w-72 max-w-full rounded bg-stone-200/60" />
          </div>
          <div className="hidden h-6 w-56 rounded-full bg-stone-200/50 sm:block" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              className="rounded-2xl border border-white/80 bg-white/70 p-4"
              key={index}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="h-2.5 w-10 rounded bg-stone-200/80" />
                  <div className="mt-2 h-7 w-8 rounded bg-stone-200/80" />
                </div>
                <div className="h-6 w-16 rounded-full bg-stone-200/70" />
              </div>
              <div className="mt-4 flex justify-between gap-3">
                <div className="h-3 w-20 rounded bg-stone-100" />
                <div className="h-3 w-14 rounded bg-stone-100" />
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-stone-100" />
              <div className="mt-4 space-y-2.5">
                <div className="h-4 w-3/4 rounded bg-stone-100" />
                <div className="h-4 w-2/3 rounded bg-stone-100" />
                <div className="h-4 w-1/2 rounded bg-stone-100" />
              </div>
              <div className="mt-4 h-11 w-full rounded-xl bg-stone-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

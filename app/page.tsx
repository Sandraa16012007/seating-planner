import { Suspense } from "react";

import SeatingBoard from "@/components/seating/SeatingBoard";
import TableGridSkeleton from "@/components/seating/TableGridSkeleton";
import { TABLE_COUNT, TOTAL_CAPACITY } from "@/lib/constants";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-3 border-b border-stone-200/80 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-ink sm:text-base">
              Farewell Seating Planner
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:text-[11px]">
              Farewell · 2026-2027
            </p>
          </div>
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-stone-500 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {TABLE_COUNT} tables · {TOTAL_CAPACITY} seats
        </span>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-2xl pb-8 pt-10 text-center sm:pb-10 sm:pt-14">
          <h1 className="mt-3 text-balance font-serif text-4xl leading-[1.03] text-ink sm:text-6xl">
            Find your table.
            <br />
            <span className="text-brand/80">Find your people.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-stone-500 sm:text-base">
            Choose a table, see who&apos;s seated, and save a spot for yourself
            or a friend.
          </p>
        </section>

        <Suspense fallback={<TableGridSkeleton />}>
          <SeatingBoard />
        </Suspense>
      </main>

      <footer className="mt-12 border-t border-stone-200/80 pt-5 text-xs leading-5 text-stone-500">
        <p>
          <strong className="font-medium text-stone-500">Public planner:</strong>{" "}
          no accounts or sign-in. Anyone with the link can add or remove
          students.
        </p>
        <p className="mt-1">
          Refresh the page to see changes made by other visitors.
        </p>
      </footer>
    </div>
  );
}

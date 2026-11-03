import { Suspense } from "react";

import SeatingBoard from "@/components/seating/SeatingBoard";
import TableGridSkeleton from "@/components/seating/TableGridSkeleton";
import { TABLE_COUNT, TOTAL_CAPACITY } from "@/lib/constants";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
            College Farewell
          </p>
        </div>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Farewell Seating Planner
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500 sm:text-base">
          Find your table and see who is seated with you. {TABLE_COUNT} tables,{" "}
          {TOTAL_CAPACITY} seats in total.
        </p>
      </header>

      <main className="flex-1">
        <Suspense fallback={<TableGridSkeleton />}>
          <SeatingBoard />
        </Suspense>
      </main>

      <footer className="mt-10 border-t border-stone-200 pt-4 text-xs leading-5 text-stone-400">
        <strong className="font-medium text-stone-500">Public planner:</strong>{" "}
        there are no accounts. Anyone with the link can change the seating
        arrangement.
      </footer>
    </div>
  );
}

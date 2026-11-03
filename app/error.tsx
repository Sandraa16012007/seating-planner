"use client";

import { useEffect } from "react";
import Link from "next/link";

import { AlertCircleIcon } from "@/components/ui/icons";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-4 py-16">
      <section className="w-full rounded-3xl border border-rose-200/80 bg-white/80 p-6 text-center shadow-[0_24px_80px_-48px_rgba(45,30,35,0.4)] sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <AlertCircleIcon className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-serif text-3xl text-ink">
          We hit a snag
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
          Something unexpected happened while loading the planner. Your data is
          safe in Supabase. Try again, or reload the page.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-600 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
            href="/"
            prefetch={false}
          >
            Reload page
          </Link>
        </div>
      </section>
    </div>
  );
}

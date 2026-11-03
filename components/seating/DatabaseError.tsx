import Link from "next/link";

import { AlertCircleIcon } from "@/components/ui/icons";

type DatabaseErrorProps = {
  message?: string;
};

export default function DatabaseError({ message }: DatabaseErrorProps) {
  return (
    <section className="rounded-3xl border border-rose-200/80 bg-rose-50/70 p-6 text-center sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
        <AlertCircleIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-serif text-2xl text-ink">
        We couldn&apos;t load the seating plan
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
        The database is not responding, or the seating tables have not been set
        up yet. Check the Supabase connection and try again.
      </p>
      {message ? (
        <p className="mx-auto mt-3 max-w-md rounded-xl bg-white/80 px-3 py-2 text-xs leading-5 text-stone-500">
          {message}
        </p>
      ) : null}
      <Link
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
        href="/"
        prefetch={false}
      >
        Try again
      </Link>
    </section>
  );
}

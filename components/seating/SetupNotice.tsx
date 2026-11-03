import { AlertCircleIcon } from "@/components/ui/icons";

export default function SetupNotice() {
  return (
    <section className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
          <AlertCircleIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
            Setup required
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight text-ink">
            Connect Supabase to load the seating plan
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            The interface is ready, but the database connection is not
            configured yet.
          </p>
        </div>
      </div>

      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-600">
        <li>
          Create a Supabase project and run the SQL in{" "}
          <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            supabase/migrations/20261103000000_initial_schema.sql
          </code>
          .
        </li>
        <li>
          Copy{" "}
          <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            .env.example
          </code>{" "}
          to{" "}
          <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            .env.local
          </code>{" "}
          and add your project URL and anon key.
        </li>
        <li>Restart the dev server.</li>
      </ol>

      <p className="mt-4 text-xs leading-5 text-amber-800/80">
        Full instructions are in{" "}
        <code className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs">
          README.md
        </code>
        .
      </p>
    </section>
  );
}

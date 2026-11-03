export default function SetupNotice() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
        Setup required
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-stone-900">
        Connect Supabase to load the seating plan
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        The UI is ready, but the database connection is not configured yet.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-stone-600">
        <li>
          Create a Supabase project and run the SQL in{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            supabase/migrations/20261103000000_initial_schema.sql
          </code>
          .
        </li>
        <li>
          Copy{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            .env.example
          </code>{" "}
          to{" "}
          <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs text-stone-800">
            .env.local
          </code>{" "}
          and add your project URL and anon key.
        </li>
        <li>Restart the dev server.</li>
      </ol>

      <p className="mt-4 text-xs leading-5 text-amber-800/80">
        Full instructions are in{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5 text-xs">
          README.md
        </code>
        .
      </p>
    </section>
  );
}

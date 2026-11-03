import { connection } from "next/server";

import DatabaseError from "@/components/seating/DatabaseError";
import SeatingPlanner from "@/components/seating/SeatingPlanner";
import SetupNotice from "@/components/seating/SetupNotice";
import { getSeatingPlan, SeatingError } from "@/lib/seating";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { SeatingPlan } from "@/types/seating";

type LoadResult =
  | { ok: true; plan: SeatingPlan }
  | { ok: false; error: unknown };

async function loadPlan(): Promise<LoadResult> {
  try {
    return { ok: true, plan: await getSeatingPlan() };
  } catch (error) {
    return { ok: false, error };
  }
}

/**
 * Server-only data container. Rendering is deferred to request time so the
 * plan is always fresh and environment variables are read at runtime.
 */
export default async function SeatingBoard() {
  await connection();

  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const result = await loadPlan();

  if (!result.ok) {
    console.error("Failed to load seating plan:", result.error);

    const message =
      result.error instanceof SeatingError &&
      result.error.message.startsWith("Expected")
        ? result.error.message
        : undefined;

    return <DatabaseError message={message} />;
  }

  return <SeatingPlanner plan={result.plan} />;
}

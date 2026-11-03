import { connection } from "next/server";

import SetupNotice from "@/components/seating/SetupNotice";
import TableGrid from "@/components/seating/TableGrid";
import { getSeatingPlan } from "@/lib/seating";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Server-only data container. Rendering is deferred to request time so the
 * plan is always fresh and environment variables are read at runtime.
 */
export default async function SeatingBoard() {
  await connection();

  if (!isSupabaseConfigured()) {
    return <SetupNotice />;
  }

  const plan = await getSeatingPlan();

  return <TableGrid plan={plan} />;
}

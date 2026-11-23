import { connection } from "next/server";
import { buildOutlook } from "@/lib/snook/outlook";

/**
 * JSON version of the outlook, for checking and tuning the scores.
 * Upstream fetches are cached for 2 hours (CACHE_SECONDS in config.ts).
 */
export async function GET() {
  await connection();
  const outlook = await buildOutlook();
  return Response.json(outlook, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}

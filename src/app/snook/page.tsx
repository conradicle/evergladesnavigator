import { connection } from "next/server";
import SnookOutlook from "@/components/snook/SnookOutlook";
import { buildOutlook } from "@/lib/snook/outlook";

/**
 * Renders per request so "today" is always current; the upstream forecast
 * fetches are cached for 2 hours (CACHE_SECONDS in src/lib/snook/config.ts).
 */
export default async function SnookPage() {
  await connection();
  const outlook = await buildOutlook();
  return <SnookOutlook outlook={outlook} />;
}

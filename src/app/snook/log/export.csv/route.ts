import { isLoggedIn } from "@/lib/snook/auth";
import { tripsToCsv } from "@/lib/snook/csv";
import { getRedis, listTrips } from "@/lib/snook/store";
import { dateKeyOf } from "@/lib/snook/time";

/** CSV of every logged trip with its saved forecast. Passcode required. */
export async function GET() {
  const redis = getRedis();
  if (!redis) return new Response("Storage not connected.", { status: 503 });
  if (!(await isLoggedIn())) return new Response("Sign in at /snook/log first.", { status: 401 });
  const csv = tripsToCsv(await listTrips(redis));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="snook-trips-${dateKeyOf(Date.now())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

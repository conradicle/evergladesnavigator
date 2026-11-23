import { createHash, timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { buildOutlook } from "@/lib/snook/outlook";
import { getRedis, saveSnapshot } from "@/lib/snook/store";

/**
 * Daily forecast snapshot, run by Vercel Cron (vercel.json) each morning.
 * Vercel sends "Authorization: Bearer $CRON_SECRET"; anything else is
 * refused, and so is every request while CRON_SECRET is unset.
 */
function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(header), h(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  await connection();
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, error: "storage not connected" }, { status: 503 });
  const outlook = await buildOutlook();
  await saveSnapshot(redis, outlook);
  return Response.json({ ok: true, date: outlook.today, unavailable: outlook.unavailable });
}

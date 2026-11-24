import type { Metadata } from "next";
import { connection } from "next/server";
import SharkRiver from "@/components/snook/SharkRiver";
import { buildOutlook } from "@/lib/snook/outlook";
import { buildSharkConditions } from "@/lib/snook/shark";

export const metadata: Metadata = {
  title: "Shark River | Snook Outlook",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Per request; the USGS and NOAA fetches underneath are cached. */
export default async function SharkRiverPage() {
  await connection();
  const outlook = await buildOutlook();
  const conditions = await buildSharkConditions(outlook);
  return <SharkRiver c={conditions} />;
}

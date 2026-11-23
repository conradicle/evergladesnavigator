import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Passcode gate for /snook/log. The cookie holds an HMAC derived from
 * SNOOK_LOG_PASSCODE, never the passcode itself, so changing the passcode
 * in Vercel signs everyone out.
 */
export const LOG_COOKIE = "snook_log";
export const LOG_COOKIE_MAX_AGE = 180 * 86400;

export function passcodeConfigured(): boolean {
  return !!process.env.SNOOK_LOG_PASSCODE;
}

export function sessionToken(passcode: string): string {
  return createHmac("sha256", passcode).update("snook-log-session-v1").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function passcodeMatches(attempt: string): boolean {
  const real = process.env.SNOOK_LOG_PASSCODE;
  if (!real) return false;
  // Compare HMACs so the comparison is constant-length and constant-time.
  return safeEqual(sessionToken(attempt), sessionToken(real));
}

export async function isLoggedIn(): Promise<boolean> {
  const real = process.env.SNOOK_LOG_PASSCODE;
  if (!real) return false;
  const value = (await cookies()).get(LOG_COOKIE)?.value;
  return !!value && safeEqual(value, sessionToken(real));
}

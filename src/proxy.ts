import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Temporary "coming soon" gate. Rewrites every request to the coming-soon
 * page while leaving the rest of the site (pages, forms, API routes) fully
 * intact in the codebase. Nothing is deleted, just made unreachable.
 * To bring the real site back, delete this file.
 */

/**
 * Private tools that must work while the gate is up: /snook (and anything
 * under it, like its manifest and icons) and /api/snook. Matches whole path
 * segments only, so /snookfoo or /api/snooker stay gated.
 */
const UNGATED = /^\/(?:snook|api\/snook)(?:\/|$)/;

export function proxy(request: NextRequest) {
  if (UNGATED.test(request.nextUrl.pathname)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: [
    "/((?!coming-soon|_next/static|_next/image|favicon.ico|logo-icon.png|logo-full.png|robots.txt|sitemap.xml|opengraph-image).*)",
  ],
};

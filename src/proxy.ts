import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Temporary "coming soon" gate. Rewrites every request to the coming-soon
 * page while leaving the rest of the site (pages, forms, API routes) fully
 * intact in the codebase — nothing is deleted, just made unreachable.
 * To bring the real site back, delete this file.
 */
export function proxy(request: NextRequest) {
  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  matcher: [
    "/((?!coming-soon|_next/static|_next/image|favicon.ico|logo-icon.png|logo-full.png).*)",
  ],
};

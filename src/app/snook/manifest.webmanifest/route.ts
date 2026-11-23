/**
 * Web app manifest scoped to /snook, so "Add to Home Screen" opens the
 * Snook Outlook rather than the marketing site. Served here (not as
 * app/manifest.ts) because that would apply to the whole site.
 */
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "Snook Outlook",
    short_name: "Snook Outlook",
    description: "Daily snook bite outlook for Flamingo and Chokoloskee.",
    id: "/snook",
    start_url: "/snook",
    scope: "/snook",
    display: "standalone",
    background_color: "#fbf7ec",
    theme_color: "#fbf7ec",
    icons: [
      { src: "/snook/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/snook/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/snook/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json" },
  });
}

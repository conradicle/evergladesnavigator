import type { Metadata, Viewport } from "next";
import SnookNav from "@/components/snook/SnookNav";

/**
 * Private, unlisted tool for Captain Adam Gelber. Not linked anywhere,
 * left out of the sitemap, disallowed in robots.txt, and noindexed here
 * and by an X-Robots-Tag header (next.config.ts). Exempt from the
 * coming-soon gate in src/proxy.ts.
 */
export const metadata: Metadata = {
  title: "Snook Outlook",
  description: "Daily snook bite outlook for Flamingo, Chokoloskee, and Lostmans.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
  manifest: "/snook/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Snook Outlook", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/snook/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/snook/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: null,
  twitter: null,
};

export const viewport: Viewport = {
  themeColor: "#fbf7ec",
  // Lets the bottom tab bar sit above the iPhone home indicator.
  viewportFit: "cover",
};

export default function SnookLayout({ children }: LayoutProps<"/snook">) {
  return (
    <>
      <main
        id="main"
        className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {children}
      </main>
      <SnookNav />
    </>
  );
}

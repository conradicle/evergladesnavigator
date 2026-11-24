"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Bottom tab bar for phones (the main way the outlook gets used, often as a
 * home-screen app with no browser buttons). Hidden from md up, where each
 * page has its own header links.
 */
const TABS = [
  {
    href: "/snook",
    label: "Outlook",
    match: (p: string) => p === "/snook",
    icon: (
      <path d="M4 19V9m5 10V5m5 14v-7m5 7V8" strokeLinecap="round" />
    ),
  },
  {
    href: "/snook/shark-river",
    label: "Shark River",
    match: (p: string) => p.startsWith("/snook/shark-river"),
    icon: (
      <path d="M3 8c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1M3 13c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1M3 18c2.5-2 4.5-2 7 0s4.5 2 7 0 3-1.5 4-1" strokeLinecap="round" />
    ),
  },
  {
    href: "/snook/log",
    label: "Trip log",
    match: (p: string) => p.startsWith("/snook/log"),
    icon: (
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default function SnookNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Snook Outlook sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-swamp-800/15 bg-[#fbf7ec]/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map((t) => {
          const active = t.match(path);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                  active ? "text-swamp-950" : "text-swamp-700"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-sand-200 ring-1 ring-swamp-900/30" : ""}`}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true">
                    {t.icon}
                  </svg>
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

import Link from "next/link";
import Logo from "./Logo";
import NavLink from "./NavLink";

const NAV_LINKS = [
  { href: "/tours", label: "Tours" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-swamp-800/10 bg-sand-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-swamp-900 transition hover:text-swamp-700">
          {/* Under 380px only the icon shows; the name stays for screen readers. */}
          <Logo textClassName="sr-only text-base min-[380px]:not-sr-only sm:text-lg" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium text-swamp-900 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="transition hover:text-sunset-700 aria-[current=page]:underline aria-[current=page]:underline-offset-4"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link
          href="/booking"
          className="whitespace-nowrap rounded-full bg-swamp-800 px-4 py-2 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700 sm:px-5"
        >
          Book a Trip
        </Link>
      </div>
      <nav aria-label="Main" className="flex items-center gap-6 overflow-x-auto border-t border-swamp-800/10 px-6 py-2 text-sm font-medium text-swamp-900 md:hidden">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            className="whitespace-nowrap aria-[current=page]:underline aria-[current=page]:underline-offset-4"
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

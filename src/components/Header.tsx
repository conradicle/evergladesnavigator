import Link from "next/link";
import Logo from "./Logo";

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
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-swamp-900 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-sunset-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/booking"
          className="rounded-full bg-swamp-800 px-5 py-2 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700"
        >
          Book a Trip
        </Link>
      </div>
      <nav className="flex items-center gap-6 overflow-x-auto border-t border-swamp-800/10 px-6 py-2 text-sm font-medium text-swamp-900 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap">
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

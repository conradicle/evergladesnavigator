"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Header nav link that marks the current page with aria-current. */
export default function NavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCurrent = pathname === href;

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

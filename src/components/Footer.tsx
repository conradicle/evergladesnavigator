import Link from "next/link";
import Logo from "./Logo";
import { business, launchPointsLabel } from "@/lib/business";

export default function Footer() {
  return (
    <footer className="border-t border-swamp-800/10 bg-swamp-950 text-sand-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="max-w-sm space-y-3">
          <div className="text-sand-100">
            <Logo />
          </div>
          <p className="text-sm text-sand-300">
            Guided fishing charters and ecotours from {launchPointsLabel},{" "}
            {business.state}. Trips by appointment.
          </p>
          {(business.phone || business.email) && (
            <p className="text-sm text-sand-300">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="hover:text-sunset-500">
                  {business.phone}
                </a>
              )}
              {business.phone && business.email && " · "}
              {business.email && (
                <a href={`mailto:${business.email}`} className="hover:text-sunset-500">
                  {business.email}
                </a>
              )}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm sm:flex sm:gap-16">
          <div className="space-y-2">
            <p className="font-semibold text-sand-100">Explore</p>
            <ul className="space-y-1 text-sand-300">
              <li>
                <Link href="/tours" className="hover:text-sunset-500">
                  Tours
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sunset-500">
                  About
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-sunset-500">
                  Gallery
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-sand-100">Connect</p>
            <ul className="space-y-1 text-sand-300">
              <li>
                <Link href="/booking" className="hover:text-sunset-500">
                  Book a Trip
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-sunset-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-sand-100/10 px-6 py-4 text-center text-xs text-sand-300">
        © {new Date().getFullYear()} Everglades Navigator. All rights reserved.
      </div>
    </footer>
  );
}

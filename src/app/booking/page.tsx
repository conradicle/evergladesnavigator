import type { Metadata } from "next";
import BookingForm from "@/components/BookingForm";

export const metadata: Metadata = {
  title: "Book a Trip | Everglades Navigator",
  description: "Request a fishing charter or ecotour with Everglades Navigator.",
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string }>;
}) {
  const { trip } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
        Booking
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-swamp-950">
        Request a trip
      </h1>
      <p className="mt-4 text-swamp-800">
        Online payment isn&apos;t live yet, so this form sends a request
        instead of a confirmed booking. We&apos;ll follow up by email to
        confirm availability, exact pricing, and next steps.
      </p>

      <div className="mt-10">
        <BookingForm initialTrip={trip} />
      </div>
    </div>
  );
}

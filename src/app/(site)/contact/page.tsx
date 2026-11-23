import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact | Everglades Navigator",
  description: `Contact ${business.name} to plan a fishing charter or ecotour from ${business.launchPoints.join(" or ")}, ${business.stateCode}. All trips are booked by appointment.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sunset-700">
        Contact
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-swamp-950">
        Get in touch
      </h1>
      <p className="mt-4 text-swamp-800">
        Trips leave from {business.launchPoints.join(" and ")},{" "}
        {business.state}, and are booked by appointment. Send a message below
        and we&apos;ll follow up.
      </p>
      {(business.phone || business.email) && (
        <ul className="mt-4 space-y-1 text-swamp-800">
          {business.phone && (
            <li>
              Phone:{" "}
              <a href={`tel:${business.phone}`} className="font-semibold text-swamp-900 underline">
                {business.phone}
              </a>
            </li>
          )}
          {business.email && (
            <li>
              Email:{" "}
              <a href={`mailto:${business.email}`} className="font-semibold text-swamp-900 underline">
                {business.email}
              </a>
            </li>
          )}
        </ul>
      )}

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}

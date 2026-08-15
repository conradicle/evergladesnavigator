import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Everglades Navigator",
  description: "Get in touch with Everglades Navigator.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
        Contact
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-swamp-950">
        Get in touch
      </h1>
      <p className="mt-4 text-swamp-800">
        Phone and email details will be posted here once the business
        launches. Until then, send a message below and we&apos;ll follow up.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}

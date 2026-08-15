"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContactState } from "@/app/actions/contact";

const initialState: ContactState = { status: "idle" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactMessage,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-swamp-900">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-swamp-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-swamp-900">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm font-medium text-red-700">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="text-sm font-medium text-swamp-700">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-swamp-800 px-6 py-3 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}

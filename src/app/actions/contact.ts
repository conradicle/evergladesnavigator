"use server";

export interface ContactState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitContactMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Please fill out every field." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  // No email service is wired up yet. Once one is (e.g. Resend, Postmark),
  // send { name, email, message } to CONTACT_EMAIL from here instead of
  // just logging it.
  console.log("[contact] new message", { name, email, message });

  return {
    status: "success",
    message: "Thanks — your message has been received. We'll get back to you soon.",
  };
}

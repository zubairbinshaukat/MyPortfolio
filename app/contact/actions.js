"use server";

import { headers } from "next/headers";
import { site } from "@/lib/site";

/**
 * The contact form's delivery path.
 *
 * Resend over a server action, chosen from the three options in
 * CONTENT-REVIEW.md §6. It keeps /contact free of any third-party origin: the
 * browser posts to zubyr.dev and nothing else, and the call to Resend happens
 * server-side where no script tag, no iframe and no cross-origin request is
 * involved. The old form ran a 1.2 s timer and threw the message away; every
 * path through this one either delivers or says out loud that it did not.
 *
 * Resend is called over `fetch` rather than through the `resend` npm package.
 * The request is a dozen lines and the package would add a dependency to the
 * server bundle for no behaviour we need.
 *
 * ENVIRONMENT — set these in Vercel (Project → Settings → Environment
 * Variables), for Production and Preview:
 *
 *   RESEND_API_KEY      required. From resend.com/api-keys. Sending permission
 *                       is enough; it does not need full access.
 *   CONTACT_FROM_EMAIL  required. The From address, on a domain verified in
 *                       Resend. Either "contact@zubyr.dev" or the display form
 *                       "Zubyr.dev <contact@zubyr.dev>". It must NOT be the
 *                       gmail address — Resend will reject a From on a domain
 *                       it has not verified.
 *   CONTACT_TO_EMAIL    optional. Where enquiries land. Defaults to the
 *                       address already published on the site.
 *
 * With RESEND_API_KEY absent the form does not pretend to work: it returns the
 * transport error state, which renders the email address as the way through.
 * That is also what happens on a local `next dev` with no env file.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Field limits. Anything longer is a paste accident or a bot. */
const LIMITS = { name: 120, email: 200, subject: 200, message: 8000 };

/**
 * Rate limit: 3 submissions per IP per 10 minutes.
 *
 * A Map in module scope, which on Vercel means per-instance and per-cold-start
 * rather than global. That is the honest description of what it buys — it
 * stops one browser hammering one instance, and it costs nothing. The honeypot
 * is what actually catches the bots. If the volume ever justifies real
 * limiting, it needs a shared store (Vercel KV or Upstash), not a bigger Map.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const hits = new Map();

function rateLimited(key) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);

  // Opportunistic sweep so the Map cannot grow without bound on a warm instance.
  if (hits.size > 500) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** The client IP as far as the platform will tell us. */
async function clientKey() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0] : h.get("x-real-ip") || "unknown").trim();
}

/**
 * Deliberately loose. The point is to catch "no @ in it", not to adjudicate
 * RFC 5322 — a valid address rejected by a clever regex is a lost enquiry.
 */
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function field(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * The shape every return value has. Not exported: a "use server" module may
 * only export async functions, so the matching initial state lives in
 * components/ContactForm.js.
 *
 *   status      "idle" before submission, then "ok" or "error"
 *   message     the sentence shown to the person
 *   fieldErrors per-field messages, keyed by input name
 *   values      what they typed, so an error never costs them the message
 */
const EMPTY = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: { name: "", email: "", subject: "", message: "" },
};

export async function sendContactMessage(_prevState, formData) {
  const values = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    subject: field(formData, "subject"),
    message: field(formData, "message"),
  };

  // The honeypot. A real person never sees this input and never fills it; a
  // form-filling bot fills every field it finds. Nothing is sent, and the bot
  // is told what it expects to hear rather than being handed a signal to
  // adapt to. No human message reaches this branch.
  if (field(formData, "website")) {
    return { ...EMPTY, status: "ok", message: "Thanks — your message has been sent." };
  }

  const fieldErrors = {};
  if (!values.name) fieldErrors.name = "Tell me who you are.";
  else if (values.name.length > LIMITS.name) fieldErrors.name = "That is longer than a name.";

  if (!values.email) fieldErrors.email = "I need an address to reply to.";
  else if (values.email.length > LIMITS.email || !looksLikeEmail(values.email))
    fieldErrors.email = "That does not look like an email address.";

  if (values.subject.length > LIMITS.subject) fieldErrors.subject = "Keep the subject to one line.";

  if (!values.message) fieldErrors.message = "Describe the work — a couple of sentences is enough.";
  else if (values.message.length < 20)
    fieldErrors.message = "A little more detail: what happens today, and what should happen instead?";
  else if (values.message.length > LIMITS.message)
    fieldErrors.message = "That is over the length this form accepts. Email it instead.";

  if (Object.keys(fieldErrors).length) {
    return {
      status: "error",
      message: "Nothing was sent — the highlighted fields need a change first.",
      fieldErrors,
      values,
    };
  }

  if (rateLimited(await clientKey())) {
    return {
      status: "error",
      message: `That is three messages in ten minutes, so this one was not sent. Email ${site.email} directly if it is urgent.`,
      fieldErrors: {},
      values,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || site.email;

  if (!apiKey || !from) {
    console.error(
      "[contact] RESEND_API_KEY or CONTACT_FROM_EMAIL is not set; the message was not delivered."
    );
    return {
      status: "error",
      message: `The form could not send your message — it is a fault at this end, not with what you wrote. Please email ${site.email} instead.`,
      fieldErrors: {},
      values,
    };
  }

  const subject = values.subject
    ? `zubyr.dev — ${values.subject}`
    : `zubyr.dev — enquiry from ${values.name}`;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // So hitting reply in the inbox replies to the sender, not to the site.
        reply_to: values.email,
        subject,
        text: [
          `Name:    ${values.name}`,
          `Email:   ${values.email}`,
          `Subject: ${values.subject || "(none given)"}`,
          "",
          values.message,
        ].join("\n"),
      }),
      // A hung upstream must not hold the request open indefinitely; a
      // timeout here surfaces as the failure state, which shows the address.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[contact] Resend returned ${response.status}: ${detail.slice(0, 500)}`);
      return {
        status: "error",
        message: `Your message did not go through — the mail service rejected it. Please email ${site.email} instead; nothing was delivered.`,
        fieldErrors: {},
        values,
      };
    }
  } catch (error) {
    console.error("[contact] Resend request failed:", error);
    return {
      status: "error",
      message: `Your message did not go through — the mail service could not be reached. Please email ${site.email} instead; nothing was delivered.`,
      fieldErrors: {},
      values,
    };
  }

  return {
    ...EMPTY,
    status: "ok",
    message: `Sent. It has arrived at ${site.email} and you will get a reply at ${values.email}.`,
  };
}

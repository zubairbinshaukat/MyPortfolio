"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactMessage } from "@/app/contact/actions";

/**
 * The contact form.
 *
 * It posts to a server action on this origin, so /contact loads no third-party
 * script and opens no third-party iframe. See app/contact/actions.js for the
 * delivery path and the environment variables it needs.
 *
 * WITH JAVASCRIPT DISABLED
 *
 * The whole form is server-rendered — inputs, labels, submit button — and
 * `useActionState` with a server function is progressively enhanced by React,
 * so the browser posts the form to this URL and the page comes back rendered
 * with the result. Nothing here is built by script on the client.
 *
 * That is the intent, and it is what React documents. It is also the part most
 * likely to be broken by a future change to how actions are dispatched, which
 * is why the email address is printed next to the form unconditionally rather
 * than only in the failure state: if the form ever silently stops working, the
 * page still visibly carries a way to make contact. `scripts/check-nojs.mjs`
 * asserts both the fields and the address survive with every <script> stripped.
 *
 * FEEDBACK
 *
 * Three states, all of them explicit. Nothing is ever accepted quietly:
 *
 *   idle   the form
 *   ok     a confirmation naming where the message went and where the reply
 *          will arrive
 *   error  what went wrong, whether anything was sent (it was not), and the
 *          email address as the way through — with every field still filled in
 */

/** Mirrors the shape app/contact/actions.js returns. */
const initialState = {
  status: "idle",
  message: "",
  fieldErrors: {},
  values: { name: "", email: "", subject: "", message: "" },
};

/** Labels are mono caps at the metadata step, like every other label on the site. */
const labelClass = "font-mono text-metadata uppercase text-meta";

/**
 * Field styling, from the design's contact view: a 12px radius on a 3% white
 * surface, a hairline border that turns accent on focus, and a 48px minimum
 * height so every field clears the design note's tap target. The focus ring
 * itself is global — app/globals.css gives `:focus-visible` one ring for the
 * whole site, so no control can be added without one.
 */
const inputClass =
  "mt-2 min-h-control w-full rounded-field border border-white/10 bg-surface px-[15px] py-[13px] " +
  "text-[15px] text-heading placeholder:text-meta transition-colors duration-300 ease-ease " +
  "focus:border-accent-line focus:bg-surface-hover";

function Submit() {
  // Reads the pending state of the enclosing form. With JavaScript off this
  // never fires and the button keeps its resting label, which is correct.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 inline-flex min-h-[50px] items-center rounded-full bg-gradient px-6 py-[15px] text-[15px] font-semibold text-white transition-transform duration-300 ease-ease hover:-translate-y-[2px] disabled:translate-y-0 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-copy text-accent-soft">
      {message}
    </p>
  );
}

export default function ContactForm({ email }) {
  const [state, formAction] = useActionState(sendContactMessage, initialState);
  const { fieldErrors, values } = state;

  if (state.status === "ok") {
    return (
      <div
        // Announced when the form is replaced by this panel after a client-side
        // submission. On a no-JS submission the page has fully reloaded, so the
        // heading order carries it instead.
        role="status"
        className="mt-6 max-w-2xl rounded-card border border-hairline bg-surface p-6"
      >
        <p className="font-display text-item-h3 text-heading">Message sent</p>
        <p className="mt-3 text-copy text-body">{state.message}</p>
        <p className="mt-3 text-copy text-body">
          If you do not hear back, the address is{" "}
          <a
            href={`mailto:${email}`}
            className="text-heading underline decoration-accent-line underline-offset-4"
          >
            {email}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 max-w-2xl" noValidate={false}>
      {state.status === "error" ? (
        <div
          role="alert"
          className="mb-6 rounded-field border border-accent-line bg-surface px-4 py-3 text-copy text-strong"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Your name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          defaultValue={values.name}
          aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
          aria-invalid={fieldErrors.name ? "true" : undefined}
          className={inputClass}
        />
        <FieldError id="contact-name-error" message={fieldErrors.name} />
      </div>

      <div className="mt-[18px]">
        <label htmlFor="contact-email" className={labelClass}>
          Your email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          defaultValue={values.email}
          aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
          aria-invalid={fieldErrors.email ? "true" : undefined}
          className={inputClass}
        />
        <FieldError id="contact-email-error" message={fieldErrors.email} />
      </div>

      <div className="mt-[18px]">
        <label htmlFor="contact-subject" className={labelClass}>
          Subject <span>(optional)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          maxLength={200}
          defaultValue={values.subject}
          aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
          aria-invalid={fieldErrors.subject ? "true" : undefined}
          className={inputClass}
        />
        <FieldError id="contact-subject-error" message={fieldErrors.subject} />
      </div>

      <div className="mt-[18px]">
        <label htmlFor="contact-message" className={labelClass}>
          What you want built
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={8}
          maxLength={8000}
          defaultValue={values.message}
          placeholder="What happens today, who does it, and what it costs you when it goes wrong."
          aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
          aria-invalid={fieldErrors.message ? "true" : undefined}
          className={inputClass}
        />
        <FieldError id="contact-message-error" message={fieldErrors.message} />
      </div>

      {/*
        Honeypot. Hidden from sight, from the tab order and from assistive
        technology, so no person can fill it; a form-filling bot fills every
        input it finds and is discarded on the server. `hidden` is deliberately
        not used — some bots skip hidden inputs, and this one is meant to be
        found. Nothing a human submits reaches that branch.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <Submit />

      <p className="mt-4 max-w-prose text-[13.5px] leading-[1.7] text-meta">
        The form sends straight to{" "}
        <a
          href={`mailto:${email}`}
          className="text-body underline decoration-accent-line underline-offset-4 transition-colors duration-300 ease-ease hover:text-heading"
        >
          {email}
        </a>
        . If it fails, it will say so and nothing will have been sent — email
        that address instead.
      </p>
    </form>
  );
}

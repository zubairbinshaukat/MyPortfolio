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

const inputClass =
  "mt-2 w-full rounded-md border border-white/25 bg-black/30 px-3 py-2 text-white " +
  "placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-purple-400";

function Submit() {
  // Reads the pending state of the enclosing form. With JavaScript off this
  // never fires and the button keeps its resting label, which is correct.
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-8 rounded-md border border-white/30 bg-white/10 px-5 py-2.5 font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-white/90">
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
        className="mt-6 max-w-2xl rounded-lg border border-white/25 bg-black/20 p-6"
      >
        <p className="text-lg font-semibold text-white">Message sent</p>
        <p className="mt-2 text-white/80">{state.message}</p>
        <p className="mt-4 text-white/80">
          If you do not hear back, the address is{" "}
          <a
            href={`mailto:${email}`}
            className="text-white underline underline-offset-4"
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
          className="mb-6 rounded-md border border-white/30 bg-black/30 px-4 py-3 text-white/90"
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label htmlFor="contact-name" className="text-white">
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

      <div className="mt-6">
        <label htmlFor="contact-email" className="text-white">
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

      <div className="mt-6">
        <label htmlFor="contact-subject" className="text-white">
          Subject <span className="text-white/60">(optional)</span>
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

      <div className="mt-6">
        <label htmlFor="contact-message" className="text-white">
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

      <p className="mt-4 text-white/70">
        The form sends straight to{" "}
        <a href={`mailto:${email}`} className="text-white underline underline-offset-4">
          {email}
        </a>
        . If it fails, it will say so and nothing will have been sent — email
        that address instead.
      </p>
    </form>
  );
}

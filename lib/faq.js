import { site } from "./site";
import { gate, present } from "./commitments.mjs";

/**
 * The FAQ, used twice: rendered as visible <h3>/<p> pairs on the homepage, and
 * serialised into FAQPage JSON-LD by lib/schema.js.
 *
 * Both consumers read this array, which is what makes a mismatch between the
 * visible text and the schema structurally impossible. A mismatch there is a
 * manual-action risk, so this constraint is load-bearing, not tidiness. It is
 * also why answers 5–8 are gated as whole question/answer objects rather than
 * having their commitments edited out of the prose: gating the object removes
 * the question from the page and from the schema in the same operation.
 *
 * Answers are plain, complete, factual sentences because AI systems lift them
 * close to verbatim. Fragments do not survive that trip.
 *
 * The first four questions are the literal entity questions from
 * seo-implementation.md §5.3 and must not be reworded. They are built from
 * verified facts and are deliberately not in the commitments register.
 *
 * Answers 5–8 are process promises to prospective clients — paid discovery
 * credited against the build, thirty days of fixes, white-label terms, code
 * ownership on delivery. Each is gated in lib/commitments.mjs and returns null
 * until confirmed; `present()` then closes the list up, so the FAQ renders as
 * four questions rather than four questions and four gaps.
 */
export const faqs = present([
  {
    id: "who-is-zubair-bin-shaukat",
    q: "Who is Zubair Bin Shaukat?",
    a: `Zubair Bin Shaukat is a software engineer based in Lahore, Pakistan. He builds business automation systems with n8n, custom GoHighLevel dashboards and marketplace apps, web applications with Next.js and React, and cross-platform mobile apps with React Native. He works directly with founders and white-label for agencies, on fixed-scope engagements. His site is ${site.url}.`,
  },
  {
    id: "what-services-does-zubair-bin-shaukat-offer",
    q: "What services does Zubair Bin Shaukat offer?",
    a: "Four things. Automation systems built on n8n, with retries, an exception queue and a runbook. GoHighLevel platform work: custom dashboards mounted inside the platform, marketplace apps, sub-account provisioning and API v2 integrations. Web development with Next.js, React, TypeScript and Postgres. Cross-platform mobile apps with React Native and Expo, including store submission.",
  },
  {
    id: "where-is-zubair-bin-shaukat-based",
    q: "Where is Zubair Bin Shaukat based?",
    a: "Lahore, Pakistan, on UTC+5. He works remotely with clients in other timezones and has kept overlapping hours with teams in Europe, the United Kingdom and North America.",
  },
  {
    id: "how-can-i-hire-zubair-bin-shaukat",
    q: "How can I hire Zubair Bin Shaukat?",
    a: `Through the contact form at ${site.url}/contact, or by email at ${site.email}. Describe the process you want automated or the application you want built; the reply will say whether it is something he takes on, and what the next step costs.`,
  },

  // Answers 5–8. Unconfirmed commitments — see lib/commitments.mjs.
  gate("faq-scoping"),
  gate("faq-handover"),
  gate("faq-white-label"),
  gate("faq-ownership"),
]);

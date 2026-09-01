/**
 * The commitments register.
 *
 * Every string in this file promises a prospective client something — a price,
 * a timeframe, a transfer of credentials or code, a guarantee, or a boundary on
 * what the work includes. None of them has been confirmed by Zubair, and all of
 * them originate in the design prototype's filler copy (see CONTENT-REVIEW.md
 * §3, items C6 and C7). Until each is confirmed it must not render and must not
 * reach JSON-LD.
 *
 * WHY THIS FILE AND NOT A MARKDOWN HOLDING PEN
 *
 * A `COMMITMENTS-TO-CONFIRM.md` would hold the same text, but nothing would
 * stop the copy also existing in lib/services.js, and nothing would fail when
 * the two drift. This file is the text itself: lib/services.js, lib/faq.js,
 * lib/site.js and lib/about.js call `gate()` and receive either the confirmed
 * string or the fallback, so an unconfirmed commitment is structurally unable
 * to render. scripts/check-commitments.mjs imports this same array and searches
 * the built HTML for every unconfirmed string, so a copy pasted back into a
 * component fails the build too.
 *
 * It is `.mjs` rather than `.js` because the guard script has to import it
 * directly from Node, and package.json is not `"type": "module"`. Every other
 * lib/*.js file is only ever read through the bundler, so this is the one file
 * that needs the explicit extension.
 *
 * TO CONFIRM AN ITEM
 *
 * Read `text`, answer `ask`, and if the answer is yes, change `confirmed` to
 * `true` on that entry alone. Nothing else has to change: the string is already
 * wired to its render site. If the answer is no, edit `text` to what is true —
 * the entry stays gated until you also set `confirmed: true`.
 *
 * `fallback` is what renders while the item is unconfirmed. Every fallback is
 * either the same sentence with the promise removed, or nothing at all. No
 * fallback introduces a claim that is not already carried by FAQ answers 1–4,
 * which CONTENT-REVIEW.md §3 records as verified.
 */

export const commitments = [
  // ---------------------------------------------------------------------
  // Delivery timeframes. Each renders under the <h1> of a service page, on
  // its homepage card, and next to it in the /contact service list.
  // ---------------------------------------------------------------------
  {
    id: "svc-gohighlevel-shape",
    confirmed: false,
    where: "lib/services.js → gohighlevel.shape",
    ask: "Is 4–8 weeks the range you will quote for GoHighLevel work?",
    text: "4–8 weeks · agency or direct",
    // "agency or direct" alone is confirmed by FAQ 1; the weeks are not.
    fallback: "Agency or direct",
  },
  {
    id: "svc-automation-shape",
    confirmed: false,
    where: "lib/services.js → automation.shape",
    ask: "Is 2–4 weeks the range you will quote for automation work, and do you quote it fixed-price?",
    text: "2–4 weeks · fixed price · runbook included",
    // The runbook is confirmed by FAQ answer 2.
    fallback: "Runbook included",
  },
  {
    id: "svc-web-development-shape",
    confirmed: false,
    where: "lib/services.js → web-development.shape",
    ask: "Is 8–16 weeks the range you will quote for web application work?",
    text: "8–16 weeks · staged releases",
    fallback: "Staged releases",
  },
  {
    id: "svc-mobile-shape",
    confirmed: false,
    where: "lib/services.js → mobile.shape",
    ask: "Is 8–16 weeks the range you will quote for mobile work?",
    text: "8–16 weeks · store submission included",
    // Store submission being in scope is confirmed by FAQ answer 2.
    fallback: "Store submission included",
  },

  // ---------------------------------------------------------------------
  // Week-by-week schedules. These are the `when` labels on the four steps of
  // each service's "How the work runs" list. With the schedule gated, the
  // steps still render in order — they just carry no dates.
  // ---------------------------------------------------------------------
  {
    id: "svc-gohighlevel-timeline",
    confirmed: false,
    where: "lib/services.js → gohighlevel.steps[].when",
    ask: "Do these four phases really land on this schedule for a GoHighLevel build?",
    text: ["Days 1–2", "Week 1", "Weeks 2–6", "Final week"],
    fallback: [],
  },
  {
    id: "svc-automation-timeline",
    confirmed: false,
    where: "lib/services.js → automation.steps[].when",
    ask: "Do these four phases really land on this schedule for an automation build?",
    text: ["Days 1–2", "Week 1", "Weeks 2–3", "Final week"],
    fallback: [],
  },
  {
    id: "svc-web-development-timeline",
    confirmed: false,
    where: "lib/services.js → web-development.steps[].when",
    ask: "Do these four phases really land on this schedule for a web build?",
    text: ["Week 1", "Weeks 2–3", "Weeks 4–14", "Final weeks"],
    fallback: [],
  },
  {
    id: "svc-mobile-timeline",
    confirmed: false,
    where: "lib/services.js → mobile.steps[].when",
    ask: "Do these four phases really land on this schedule for a mobile build?",
    text: ["Week 1", "Weeks 2–5", "Weeks 6–13", "Final weeks"],
    fallback: [],
  },

  // ---------------------------------------------------------------------
  // Handover terms: thirty days of free fixes, credentials and repositories
  // transferred. The fallbacks keep the runbook, which FAQ answer 2 confirms,
  // and drop everything else.
  // ---------------------------------------------------------------------
  {
    id: "svc-gohighlevel-handoff",
    confirmed: false,
    where: "lib/services.js → gohighlevel.steps[3].body",
    ask: "Do you give 30 days of fixes at no cost, record a walkthrough, and move every credential to accounts the client owns?",
    text: "Recorded walkthrough, runbook per failure mode, credentials moved to accounts you own, 30 days of fixes.",
    fallback: "A runbook covering every failure mode, so the build can be run without me.",
  },
  {
    id: "svc-automation-handoff",
    confirmed: false,
    where: "lib/services.js → automation.steps[3].body",
    ask: "Do you give 30 days of fixes at no cost after an automation handover?",
    text: "Workflows exported and documented, a runbook per failure mode, and 30 days of fixes at no cost.",
    fallback: "Workflows exported and documented, with a runbook covering every failure mode.",
  },
  {
    id: "svc-web-development-handoff",
    confirmed: false,
    where: "lib/services.js → web-development.steps[3].body",
    ask: "Do you transfer the repository to the client's organisation and give 30 days of fixes at no cost?",
    text: "Repository transferred to your organisation, architecture notes written, 30 days of fixes.",
    fallback: "Architecture notes written up alongside the code.",
  },

  // ---------------------------------------------------------------------
  // Claims buried inside "What it covers" bullets. Each fallback is the same
  // bullet with the promise clause cut out, so the capability survives and
  // only the commitment goes.
  // ---------------------------------------------------------------------
  {
    id: "svc-gohighlevel-covers-review",
    confirmed: false,
    where: "lib/services.js → gohighlevel.covers[1]",
    ask: "Will you guarantee a marketplace review submission passes first time?",
    text: "Marketplace apps: OAuth install, webhook subscriptions, uninstall cleanup, and a review submission that passes first time.",
    fallback: "Marketplace apps: OAuth install, webhook subscriptions and uninstall cleanup.",
  },
  {
    id: "svc-automation-covers-credentials",
    confirmed: false,
    where: "lib/services.js → automation.covers[0]",
    ask: "Do you commit to every credential living in accounts the client owns, on every engagement?",
    text: "n8n workflows, self-hosted or cloud, with credentials that live in accounts you own.",
    fallback: "n8n workflows, self-hosted or cloud.",
  },

  // ---------------------------------------------------------------------
  // The "What I will say no to" lists. Positioning claims, not descriptions:
  // each one tells a prospective client what you will refuse to do. Gated
  // whole — the section does not render at all while a list is empty.
  // ---------------------------------------------------------------------
  {
    id: "svc-gohighlevel-nos",
    confirmed: false,
    where: "lib/services.js → gohighlevel.nos (whole 'What I will say no to' section)",
    ask: "Are these three the refusals you want on the GoHighLevel page, in these words?",
    text: [
      "Rebuilding a working snapshot into custom code because custom code sounds better.",
      "Dashboards without an agreed definition of the metric. That conversation comes first or the build does not start.",
      "Scraping the platform UI where an API exists. It breaks on their release schedule, not yours.",
    ],
    fallback: [],
  },
  {
    id: "svc-automation-nos",
    confirmed: false,
    where: "lib/services.js → automation.nos (whole 'What I will say no to' section)",
    ask: "Are these three the refusals you want on the automation page, in these words?",
    text: [
      "Automating a process nobody has written down. The document comes first; sometimes it ends the project.",
      "Pipelines with no exception path. If there is no answer for the odd case, there is no system.",
      "Wiring production credentials into a workflow I own. Everything runs under your accounts.",
    ],
    fallback: [],
  },
  {
    id: "svc-web-development-nos",
    confirmed: false,
    where: "lib/services.js → web-development.nos (whole 'What I will say no to' section)",
    ask: "Are these three the refusals you want on the web page, in these words?",
    text: [
      "Rebuilding a marketing site as a single-page app. If it is content, it should be static and crawlable.",
      "Starting on screens before the data model is agreed. That order has never once saved time.",
      "Shipping a launch with no staging environment and no way to roll back.",
    ],
    fallback: [],
  },
  {
    id: "svc-mobile-nos",
    confirmed: false,
    where: "lib/services.js → mobile.nos (whole 'What I will say no to' section)",
    ask: "Are these three the refusals you want on the mobile page, in these words?",
    text: [
      "Wrapping an existing website in a WebView and calling it an app.",
      "Offline support bolted on after launch. It is a data model decision, and it is not cheap to retrofit.",
      "Store submission as your problem. Getting through review is part of the work.",
    ],
    fallback: [],
  },

  // ---------------------------------------------------------------------
  // FAQ answers 5–8. Gated as whole question/answer objects, so each one
  // disappears from the visible list and from FAQPage JSON-LD together —
  // the two are generated from the same array, which is what keeps them
  // byte-identical. Answers 1–4 are verified and are not in this register.
  // ---------------------------------------------------------------------
  {
    id: "faq-scoping",
    confirmed: false,
    where: "lib/faq.js → FAQ answer 5, homepage + FAQPage schema",
    ask: "Is discovery paid, and is it credited against the build? Does it end in a fixed price and a date?",
    text: {
      id: "how-do-you-scope-a-project",
      q: "How do you scope a project?",
      a: "A paid discovery, credited against the build if you go ahead. The output is a written spec: the process as it runs today, the parts that get automated, the parts that do not, a fixed price and a date. Some discoveries end with the conclusion that the automation is not worth building yet.",
    },
    fallback: null,
  },
  {
    id: "faq-handover",
    confirmed: false,
    where: "lib/faq.js → FAQ answer 6, homepage + FAQPage schema",
    ask: "Recorded walkthrough, runbook, credentials transferred, thirty days of fixes at no cost — do you commit to all four?",
    text: {
      id: "what-does-handover-include",
      q: "What does handover include?",
      a: "A recorded walkthrough, a runbook listing every failure mode with its fix, credentials transferred to accounts you own, and thirty days of fixes at no cost. Nothing runs on infrastructure held in someone else's name.",
    },
    fallback: null,
  },
  {
    id: "faq-white-label",
    confirmed: false,
    where: "lib/faq.js → FAQ answer 7, homepage + FAQPage schema",
    ask: "Are these your white-label terms — your engineer, your tooling, no direct client contact unless invited?",
    text: {
      id: "do-you-work-white-label-for-agencies",
      q: "Do you work white-label for agencies?",
      a: "Yes. The engagement appears as your engineer, uses your project tooling, and involves no direct contact with your client unless you put him on the call.",
    },
    fallback: null,
  },
  {
    id: "faq-ownership",
    confirmed: false,
    where: "lib/faq.js → FAQ answer 8, homepage + FAQPage schema",
    ask: "Does the client own the code and the automations on delivery, in writing? Are repositories transferred to their organisation?",
    text: {
      id: "who-owns-the-code-and-the-automations",
      q: "Who owns the code and the automations?",
      a: "You do, on delivery, in writing. Repositories are transferred to your organisation, n8n workflows are exported and documented, and the architecture notes come with them so the next engineer does not have to guess.",
    },
    fallback: null,
  },

  // ---------------------------------------------------------------------
  // The same promises, made again elsewhere. Gating them in lib/services.js
  // and lib/faq.js alone would not take them off the site: the homepage's
  // "How I work" block and the /about fact table repeat them word for word.
  // ---------------------------------------------------------------------
  {
    id: "howiwork-handover",
    confirmed: false,
    where: "lib/site.js → howIWork[2].body, homepage 'How I work' step 03",
    ask: "Same handover terms as faq-handover. Confirm both together or neither.",
    text: "A recorded walkthrough, a runbook listing every failure mode with its fix, credentials moved to accounts you own, and thirty days of fixes at no cost. Nothing runs on infrastructure held in someone else's name.",
    fallback: "A runbook listing every failure mode with its fix, so the system can be run without me.",
  },
  {
    id: "about-engagement-fixed-price",
    confirmed: false,
    where: "lib/about.js → facts, the 'Engagement' row on /about",
    ask: "Is every engagement fixed-price, or only fixed-scope? FAQ 1 says fixed-scope and is confirmed; fixed-price is not.",
    text: "Fixed scope, fixed price",
    fallback: "Fixed scope",
  },
  {
    id: "about-intro-fixed-price",
    confirmed: false,
    where: "lib/about.js → intro[1], second paragraph of /about",
    ask: "Same question as about-engagement-fixed-price. Confirm both together or neither.",
    text: "He works directly with founders and white-label for agencies, on fixed-scope, fixed-price engagements. The common thread across the work is process: the systems he builds replace something that was previously done by hand, and they are handed over with a runbook so the client can run them without him.",
    fallback:
      "He works directly with founders and white-label for agencies, on fixed-scope engagements. The common thread across the work is process: the systems he builds replace something that was previously done by hand, and they are handed over with a runbook so the client can run them without him.",
  },
  {
    id: "contact-reply-time",
    confirmed: false,
    where: "lib/site.js → replyTime, the 'Reply time' row on /contact",
    ask: "Do you want to promise a reply within one business day?",
    text: "Within one business day",
    fallback: null,
  },
];

const byId = new Map(commitments.map((c) => [c.id, c]));

/**
 * The value a gated field should render.
 *
 * Returns the registered text once `confirmed` is true, and the entry's own
 * `fallback` until then. An unknown id throws rather than returning the
 * fallback silently — a typo in a call site must not look like a gated item.
 */
export function gate(id) {
  const entry = byId.get(id);
  if (!entry) throw new Error(`gate("${id}"): no such commitment in lib/commitments.mjs`);
  return entry.confirmed ? entry.text : entry.fallback;
}

/** True when the register says this item has been signed off. */
export function isConfirmed(id) {
  const entry = byId.get(id);
  if (!entry) throw new Error(`isConfirmed("${id}"): no such commitment`);
  return Boolean(entry.confirmed);
}

/**
 * Drop the holes a gated item leaves in a list. `gate()` returns null for an
 * unconfirmed item whose fallback is nothing, and this removes it so the list
 * closes up rather than rendering an empty row.
 */
export function present(list) {
  return list.filter((item) => item !== null && item !== undefined);
}

/**
 * Attach a gated schedule to a list of steps.
 *
 * The steps themselves are process description and always render; only the
 * week labels are a commitment, so an unconfirmed schedule leaves every step
 * in place with `when` unset.
 */
export function withSchedule(id, steps) {
  const when = gate(id) || [];
  return steps.map((step, i) => ({ ...step, when: when[i] ?? null }));
}

/**
 * Every string that is currently gated, flattened. scripts/check-commitments.mjs
 * asserts that none of these appears anywhere in the built HTML.
 */
export function unconfirmedStrings() {
  const out = [];
  const walk = (value) => {
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  for (const entry of commitments) {
    if (!entry.confirmed) walk(entry.text);
  }
  return out;
}

import { gate, present, withSchedule } from "./commitments.mjs";

/**
 * The four services. Each object drives a route, its metadata, its `Service`
 * JSON-LD and the homepage "what I do" cards — one definition, four consumers.
 *
 * Prose voice is carried over from the approved prototype (`design/`). No
 * metric, count or client name appears here; see CONTENT-REVIEW.md.
 *
 * Every `gate("…")` call is a claim that commits Zubair to something — a
 * timeframe, a price, a transfer of credentials, a guarantee, or a boundary on
 * what he will take on. The strings live in lib/commitments.mjs and render
 * only once confirmed there. Fields are nullable as a result:
 *
 *   shape        may be null      — the page renders no shape line
 *   covers[]     may be short     — `present()` closes the gap
 *   nos[]        may be empty     — the whole section does not render
 *   steps[].when may be null      — the step renders without a date
 *
 * Every consumer has to tolerate that. Nothing else in the file is gated:
 * ledes, descriptions and step titles are descriptions of the work, not
 * promises about it.
 */

export const services = [
  {
    slug: "gohighlevel",
    /** Short — Google uses the title tag as the sitelink label. */
    title: "GoHighLevel Development",
    h1: "GoHighLevel Custom Dashboards & Marketplace Apps",
    serviceType: "GoHighLevel Platform Development",
    shape: gate("svc-gohighlevel-shape"),
    description:
      "Custom GoHighLevel dashboards, marketplace apps and API v2 integrations, built inside the platform by Zubair Bin Shaukat and handed off with a runbook.",
    lede: "The layer under snapshots: custom dashboards mounted inside the platform, marketplace apps with their own OAuth, provisioning that runs on a schedule, and API v2 work that survives a rate limit.",
    covers: present([
      "Custom dashboards mounted as a menu link, so they open inside the sub-account rather than in a separate BI tool.",
      gate("svc-gohighlevel-covers-review"),
      "Sub-account provisioning — creation, snapshot application, user seeding and tagging — on a schedule or a trigger.",
      "API v2 integrations with rate-limit backoff, nightly reconciliation, and a sync log you can read without me.",
      "Repairing existing builds: usually a token scope problem, a webhook with no retry, or both.",
    ]),
    nos: gate("svc-gohighlevel-nos"),
    steps: withSchedule("svc-gohighlevel-timeline", [
      { n: "01", title: "Read the process", body: "Two sessions with the person who does the work today, and one page of agreed definitions out the other end." },
      { n: "02", title: "Thin slice", body: "One sub-account, one metric, end to end, in the real environment. Proves the scopes and the shape." },
      { n: "03", title: "Build and harden", body: "The rest of the surface, plus the sync, the cache, the backoff and the exception view." },
      { n: "04", title: "Hand off", body: gate("svc-gohighlevel-handoff") },
    ]),
    tags: ["API v2", "Marketplace apps", "Dashboards", "Provisioning", "OAuth 2.0"],
  },

  {
    slug: "automation",
    title: "n8n & Workflow Automation",
    h1: "Automation Systems with n8n",
    serviceType: "Business Process Automation",
    shape: gate("svc-automation-shape"),
    description:
      "Manual business processes rebuilt as n8n pipelines with retries, an exception queue and a readable log. Automation development by Zubair Bin Shaukat.",
    lede: "A manual process, written down until it stops having exceptions, then rebuilt as a pipeline with retries, an exception queue and a log someone can read at 8 a.m.",
    covers: present([
      gate("svc-automation-covers-credentials"),
      "Webhook inboxes: accept, persist, acknowledge, then process — so a slow downstream system never costs you an event.",
      "Idempotency and retry design, because the interesting failures are the ones that happen twice.",
      "An exception queue with a human in it. Automation that silently swallows the odd case is worse than the spreadsheet.",
      "Postgres as the ledger, so there is always a record of what ran and what it decided.",
    ]),
    nos: gate("svc-automation-nos"),
    steps: withSchedule("svc-automation-timeline", [
      { n: "01", title: "Write the process down", body: "The steps as they actually run today, including the parts people do from memory. This is where most of the value is." },
      { n: "02", title: "Automate the spine", body: "The happy path end to end, in the real environment, with real data volumes." },
      { n: "03", title: "Design the failures", body: "Retries, idempotency keys, the exception queue, and the log line that tells you which of the three fired." },
      { n: "04", title: "Hand off", body: gate("svc-automation-handoff") },
    ]),
    tags: ["n8n", "Webhooks", "Postgres", "Exception queues", "Idempotency"],
  },

  {
    slug: "web-development",
    title: "Web Development",
    h1: "Web Development with Next.js & React",
    serviceType: "Web Application Development",
    shape: gate("svc-web-development-shape"),
    description:
      "Client portals, internal tools and web applications built with Next.js, React and Postgres by Zubair Bin Shaukat, a Next.js developer based in Lahore.",
    lede: "Client-facing applications where the hard part is the data model, not the pixels. Portals, internal tools, and anything replacing a spreadsheet that six people fight over.",
    covers: present([
      "Next.js App Router applications, server-rendered by default, typed end to end.",
      "Client portals: document intake, status, deadlines — the things clients currently phone about.",
      "Internal tools that replace a shared spreadsheet, with the permissions the spreadsheet never had.",
      "Postgres schemas designed before the screens, because the data model is the part you cannot refactor cheaply.",
      "Auth, roles and audit trails treated as features rather than afterthoughts.",
    ]),
    nos: gate("svc-web-development-nos"),
    steps: withSchedule("svc-web-development-timeline", [
      { n: "01", title: "Model the data", body: "Entities, relationships and the rules that are actually invariants. Written down and agreed before any UI exists." },
      { n: "02", title: "Ship a thin slice", body: "One complete path through the app, deployed, so the shape is real rather than described." },
      { n: "03", title: "Build in stages", body: "Feature by feature, each one released rather than accumulated, so nothing waits on everything." },
      { n: "04", title: "Hand off", body: gate("svc-web-development-handoff") },
    ]),
    tags: ["Next.js", "React", "TypeScript", "Postgres", "Auth"],
  },

  {
    slug: "mobile",
    title: "Mobile App Development",
    h1: "Cross-Platform Mobile Apps",
    serviceType: "Mobile Application Development",
    shape: gate("svc-mobile-shape"),
    description:
      "Cross-platform iOS and Android apps built with React Native and Expo by Zubair Bin Shaukat, a React Native developer based in Lahore, Pakistan.",
    lede: "One codebase, both stores, built for the case where the network is not there. Sync conflicts get designed, not discovered.",
    covers: present([
      "React Native and Expo, one codebase submitted to both the App Store and Play.",
      "Offline-first sync, where the local database is the source of truth until the device reconnects.",
      "Conflict resolution designed up front, because two people editing the same record offline is a certainty, not an edge case.",
      "Over-the-air updates, so a fix does not wait on a review queue.",
      "Crash and error reporting wired in before launch rather than after the first bad week.",
    ]),
    nos: gate("svc-mobile-nos"),
    steps: withSchedule("svc-mobile-timeline", [
      { n: "01", title: "Decide what works offline", body: "Which screens must function with no signal, and what happens when two devices disagree. This drives the whole build." },
      { n: "02", title: "Build the sync engine", body: "Local database, queue, reconciliation. Everything else is easier once this is right." },
      { n: "03", title: "Build the app", body: "Screens and flows on top of a sync layer that already works, tested on real devices with the network turned off." },
      { n: "04", title: "Ship to both stores", body: "Builds, metadata, review, and the OTA channel set up so the next fix is a deploy rather than a submission." },
    ]),
    tags: ["React Native", "Expo", "Offline-first", "Releases", "Sentry"],
  },
];

/** Lookup helpers. `getService` returns undefined for an unknown slug — callers use notFound(). */
export function getService(slug) {
  return services.find((s) => s.slug === slug);
}

/** The other three services, for the cross-links every service page must carry. */
export function getRelatedServices(slug) {
  return services.filter((s) => s.slug !== slug);
}

export const serviceSlugs = services.map((s) => s.slug);

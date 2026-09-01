# Content review — sign-off needed before launch

Phase 1 built the structure. This is the list of things in it that assert
something about you, and which I could not verify from the repository, the live
site or your public profiles.

The design prototype in `design/` supplies values for most of these, but its
data script is mockup filler — the three testimonials in it are attributed to
people who do not appear anywhere else in your work, and the metrics are
invented. None of those numbers were carried across.

**Nothing unverified was put into JSON-LD.** Structured data is a machine-read
assertion of fact, and search engines and AI systems treat it as one. It
contains only your name, role, location, stack, email and profile links.

---

## 1. Blocking — a launch claim with no source

| # | Item | Where it would go | Prototype's value (not used) |
|---|---|---|---|
| C1 | Years of experience | `lib/about.js` → `facts` | "6 years" |
| C2 | Systems shipped / still in production | `lib/about.js` → `facts` | "34" / "28" |
| C3 | Longest-running engagement | `lib/about.js` → `facts` | "4 years, 1 month" |
| C4 | Year-by-year timeline (2020–2025) | `/about` — section not built | six dated entries |

`/about` currently ships without any of these. It is complete and factual as it
stands; it is just thinner than it should be. Give me the real numbers and they
go into `lib/about.js` and the `/about` fact block in one edit.

**C4 note:** the timeline is the single highest-value block for the "who is
Zubair Bin Shaukat" query, because dated facts are what AI systems quote. Worth
writing even if it is only four entries.

---

## 2. Blocking — case study bodies

The three case studies are the **real** projects from your previous site, not
the prototype's six invented ones. Their frontmatter facts are accurate. Their
bodies are empty.

- `content/projects/opencinema.mdx`
- `content/projects/biz-xpert-web.mdx`
- `content/projects/biz-xpert-mobile.mdx`

Each has three `## ` headings with a `{/* TODO */}` note under it: **The
problem**, **Approach**, **Outcome**.

All three carry `draft: true`, which means they:

- still build and still return 200, so the route and schema are exercised
- are served `noindex`
- are excluded from `sitemap.xml`
- show a visible "Draft" banner

Flip `draft: false` per file when its body is written. Also unverified in those
files and worth a check: the `year` values (2024/2025) and `publishedAt` dates,
which I set to plausible placeholders.

---

## 3. Needs your voice — shipped, indexed, editable

These went live because a page with them is better than a page without, but
they are written in your voice by someone who is not you.

| # | Item | File |
|---|---|---|
| C5 | The blog post | `content/blog/idempotency-keys.mdx` |
| C6 | Service page copy — the "what it covers", "what I will say no to" and process steps for **automation**, **web-development** and **mobile** | `lib/services.js` |
| C7 | FAQ answers 5–8 (scoping, handover, white-label, ownership) | `lib/faq.js` |
| C8 | The three "how I work" steps | `lib/site.js` → `howIWork` |

**C5** is a real technical post with no invented incidents — no "the night my
pager went off". It is correct as engineering writing, but it is not your
prose. It is `draft: false` and therefore indexed; set `draft: true` in its
frontmatter if you would rather it not be live until you have rewritten it.

**C6** — the GoHighLevel page's copy is close to the prototype's, which is the
one service it wrote in detail. The other three I extended in the same voice
from its short service blurbs. The commitments they make on your behalf are the
part to check: fixed price, 30 days of fixes, credentials transferred to you,
"I will say no to" lists.

**C7** — answers 1–4 are the four literal entity questions from
`seo-implementation.md` §5.3 and are built from verified facts. Answers 5–8 are
process claims from the prototype: paid discovery credited against the build,
30 days of fixes, white-label terms, code ownership on delivery. **These are
promises to prospective clients.** Confirm each one.

---

## 4. Confirmed and used

For completeness, so you can see what I did treat as settled:

- Name, "also known as Zubyr", role, Lahore/Pakistan, UTC+5
- `thedevzubair@gmail.com` — now in `lib/site.js` and nowhere else
- GitHub, LinkedIn, `x.com/zubairbinshaukt`, Instagram — the exact URL forms the
  hero's social dock already links to
- Stack, from the previous site's own tech list and your services
- The three testimonials — **unchanged wording**, real people, monogram avatars
  replacing the dicebear cartoons

## 5. Removed, per PLAN §1

- The old email `zubairbinshaukat4455@gmail.com`
- The phone number, from the UI and from schema
- The Blogger link
- The `vercel.app` URL from the sitemap
- Facebook from `sameAs` — it is not in the entity set PLAN §1.5 lists. It is
  still in the hero's floating dock, which is frozen until Phase 3.

---

## 6. Open question this phase raised

**The contact form.** The old `Contact.js` had a form that ran a 1.2 s timer and
discarded the message. I did not rebuild it: a form that silently drops
enquiries is worse than no form. `/contact` currently gives the email address,
the profile links, and a "what to include" list.

A real form needs a delivery mechanism. Cheapest options, in the order I would
pick them:

1. **Resend** + a server action — you own the domain, ~20 lines, free tier
   covers this volume comfortably.
2. **Formspree / Web3Forms** — no backend at all, but a third-party origin on
   `/contact`, which cuts against the zero-third-party-origins goal.
3. **Vercel serverless function** + any SMTP provider.

Tell me which and it goes into Phase 2 with the design port.

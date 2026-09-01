# The contact form — what to set up

The form on `/contact` posts to a server action on this origin and the server
calls Resend. No third-party script or iframe loads on the page.

Until the two required variables are set, the form still renders and still
accepts input, but every submission returns the failure state — "The form could
not send your message… please email thedevzubair@gmail.com instead" — and
nothing is silently dropped. So an unconfigured deployment is safe, just not
useful.

## 1. Resend

1. Sign up at [resend.com](https://resend.com) — the free tier covers this
   volume comfortably (3,000 emails/month at the time of writing).
2. **Domains → Add Domain → `zubyr.dev`.** Resend gives you three DNS records
   (a DKIM `TXT`, an SPF `TXT`, and usually a `MX` for the return path). Add
   them wherever `zubyr.dev`'s DNS lives and wait for Resend to mark the domain
   verified.

   This step is not optional. Resend will only send from a domain it has
   verified, so `thedevzubair@gmail.com` cannot be the From address. It is the
   To address instead.
3. **API Keys → Create API Key.** Sending permission is enough; it does not
   need full access. Copy it — Resend shows it once.

## 2. Vercel

Project → Settings → Environment Variables. Add these to **Production** and
**Preview**:

| Name | Required | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | The key from step 1.3. Starts `re_`. |
| `CONTACT_FROM_EMAIL` | yes | An address on the verified domain: `contact@zubyr.dev`, or the display form `Zubyr.dev <contact@zubyr.dev>`. The mailbox does not have to exist. |
| `CONTACT_TO_EMAIL` | no | Where enquiries land. Defaults to `thedevzubair@gmail.com`, the address already published on the site. |

Redeploy after adding them — environment variables are read at request time,
but a running deployment does not pick up new ones.

For local development, put the same names in `.env.local` (already gitignored).

## 3. Check it

Submit the form on the deployed site. Expect:

- **Success** — the form is replaced by a "Message sent" panel naming both the
  address it went to and the address the reply will come to, and the email
  arrives at `CONTACT_TO_EMAIL` with the sender's address in `Reply-To`, so
  hitting reply in Gmail replies to them.
- **Failure** — a message saying it did not go through and that nothing was
  sent, with the email address as the way through. The server log carries the
  Resend status code and body.

## What is in place

- **Honeypot.** A `website` field, positioned off-screen and out of the tab
  order. A form-filling bot fills it; a person cannot. Filled submissions are
  discarded and the bot gets the ordinary success response.
- **Rate limit.** Three submissions per IP per ten minutes. It is an in-memory
  Map, so on Vercel it is per-instance and resets on a cold start — it stops
  one browser hammering one instance and costs nothing. Real limiting would
  need a shared store (Vercel KV, Upstash); nothing here justifies that yet.
- **Works without JavaScript.** The whole form is server-rendered and React
  progressively enhances the server action, so a browser with scripting off
  posts the form and gets the result back rendered. Verified against a
  production build: validation errors, the honeypot branch and the transport
  failure state all render correctly from a plain multipart POST.
- **The address is always visible.** Printed under the form regardless of
  state, so if the form ever breaks the page still carries a way through.
  `scripts/check-nojs.mjs` asserts both the form fields and the address survive
  with every `<script>` stripped out.
- **Ten-second timeout** on the Resend call, so a hung upstream surfaces as the
  failure state rather than a spinning page.

## Where the code is

| File | What it does |
| --- | --- |
| `app/contact/actions.js` | The server action: validation, honeypot, rate limit, the Resend call, and every state it can return. |
| `components/ContactForm.js` | The form, its three states, and the honeypot markup. |
| `app/contact/page.js` | Mounts the form above the existing contact details. |

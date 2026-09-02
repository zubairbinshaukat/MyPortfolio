import { site } from "@/lib/site";

/**
 * The design's dashed social pill, in the centre of the band's resting state.
 *
 * WHAT THIS REPLACES, AND WHY
 *
 * PLAN §3.4 names three problems in the hero's top-right and asks for one
 * answer to all of them rather than three deconflictions. The answer is the
 * design's own: view 01.1 draws the resting band as monogram · social pill ·
 * Index, and captions the condensed state "section readout replaces the pill
 * on scroll". Building that resolves every one of them at once —
 *
 *   The two controls competing for the corner. There is now one control in the
 *   corner, the Index trigger, at every width. The socials are in the middle of
 *   the band, which is the only place on the page nothing else wants.
 *
 *   The dock that rendered as a bare unlabelled square. Deleted, along with
 *   `components/ui/floating-dock.js` and `app/Components/floating.js`. A 64px
 *   magnifying bar whose icons grow to 80px was never going to fit a 66px
 *   band, and Phase 2 could only move it out of the corner, not make it the
 *   thing the design draws. This is that thing.
 *
 *   The dot rail stranded over the portrait. Deleted in the same change. The
 *   band already carries a real scroll-progress line, so the rail's only
 *   remaining case — "it could become a progress indicator" — was for a second
 *   one.
 *
 * THE 44px QUESTION
 *
 * §3.4 requires tap targets of at least 44px, and the band is 66px tall with
 * 10px of padding, so a control inside it has 44px to work in. A bordered pill
 * with 44px links inside it would be 46px and would grow the band.
 *
 * The border is drawn as an `outline` with a negative offset instead. An
 * outline is painted, not laid out: the dashed ring sits on the pill's own
 * edge and contributes nothing to its height, so each link is a full 44×44 and
 * the band stays exactly the height Phase 2 measured. The alternative was
 * 42px links and a footnote explaining why 42 is nearly 44.
 *
 * ALWAYS VISIBLE, ON EVERY ROUTE
 *
 * It used to render only on the homepage, and only until the section readout
 * had something to say — the design captions its condensed band "section
 * readout replaces the pill on scroll", and that is what was built.
 *
 * That trade was wrong, and the reason is not visual. These four links are the
 * only rendered evidence of the `sameAs` array in the Person schema: the
 * structured data claims four profiles belong to this entity, and on-page
 * links to them are what corroborates the claim rather than merely repeating
 * it. An entity signal that is present for the first screenful of the homepage
 * and absent everywhere else is a weaker signal than one that is on every page
 * of the site, and the readout it was competing with is information every page
 * already prints in the eyebrow above its own heading.
 *
 * So the pill keeps the centre column at every width and on every route, and
 * the readout moved to the left of the band from 768px up. components/
 * SiteNav.js carries the layout note.
 *
 * ACCESSIBLE NAMES CONTAIN THE VISIBLE TEXT
 *
 * Each chip is a two-character mark and each link is named. The name is
 * `"gh GitHub"` and not `"GitHub"`, which looks redundant and is not: WCAG
 * 2.5.3 Label in Name requires the accessible name to contain the visible
 * label, so that someone driving the page by voice can say what they can see.
 * Lighthouse reported exactly this — `label-content-name-mismatch` on the
 * GitHub and Instagram chips, because "github" does not contain "gh" as a run
 * of characters and "instagram" does not contain "ig". The LinkedIn and X
 * chips passed by accident.
 *
 * The visible token stays `aria-hidden` so a screen reader is not given the
 * glyph twice.
 */
export default function SocialPill({ className = "" }) {
  return (
    <ul
      className={`flex items-center rounded-full bg-surface outline-dashed outline-1 -outline-offset-1 outline-edge ${className}`}
    >
      {site.socials.map((social) => (
        <li key={social.url}>
          <a
            href={social.url}
            target="_blank"
            rel="me noopener noreferrer"
            aria-label={`${social.short} ${social.label}`}
            className="group/chip flex h-tap w-tap items-center justify-center"
          >
            <span
              aria-hidden="true"
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] lowercase text-meta transition-colors duration-300 ease-ease group-hover/chip:bg-white/[0.12] group-hover/chip:text-heading"
            >
              {social.short}
            </span>
          </a>
        </li>
      ))}

      {/*
        The fifth chip in the design is "@", and it is the email rather than a
        fifth profile. It is here and not in `site.socials` because that array
        is `sameAs`: a mailto in a list of profile URLs is a schema error, and
        deriving one from the other is what keeps the two honest.
      */}
      <li>
        <a
          href={`mailto:${site.email}`}
          aria-label={`@ Email ${site.name}`}
          className="group/chip flex h-tap w-tap items-center justify-center"
        >
          <span
            aria-hidden="true"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/[0.06] font-mono text-[9px] text-meta transition-colors duration-300 ease-ease group-hover/chip:bg-white/[0.12] group-hover/chip:text-heading"
          >
            @
          </span>
        </a>
      </li>
    </ul>
  );
}

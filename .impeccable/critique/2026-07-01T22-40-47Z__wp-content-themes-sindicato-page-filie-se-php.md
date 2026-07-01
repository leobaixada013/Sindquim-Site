---
target: wp-content/themes/sindicato/page-filie-se.php (Filie-se)
total_score: 14
p0_count: 2
p1_count: 1
timestamp: 2026-07-01T22-40-47Z
slug: wp-content-themes-sindicato-page-filie-se-php
---
Method: dual-agent (A: general-purpose design-review sub-agent · B: general-purpose detector/browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Submit button is disabled until the LGPD checkbox is checked (verified functional — see Anti-Patterns note below), but nothing on the page explains this, so it reads as broken. |
| 2 | Match System / Real World | 3 | Plain, non-jargon Portuguese copy; no mismatch, but no practical explanation of what filiation means day-to-day. |
| 3 | User Control and Freedom | 2 | No cancel/back affordance beyond browser back; two competing conversion paths (WhatsApp vs. form) with no guidance on which to use. |
| 4 | Consistency and Standards | 1 | WhatsApp button correctly uses `.button.button--primary` (46px+, on-brand red); the CF7 form beside it renders 100% browser-default — two design languages in the same view. |
| 5 | Error Prevention | 1 | No visible required-field indicator, no phone-format hint beyond CF7 defaults. |
| 6 | Recognition Rather Than Recall | 1 | Verified via DOM: `seu-nome`, `seu-email`, `seu-telefone`, `empresa` all return `labels.length === 0` — placeholder-only identification. |
| 7 | Flexibility and Efficiency | 2 | WhatsApp is a genuine low-friction alternative for a "let me just talk to someone" segment — a real plus, but presented with zero framing over the form. |
| 8 | Aesthetic and Minimalist Design | 1 | Not minimalist by intent — unstyled: default 1px grey borders, inline `style="padding: 40px 0;"` instead of theme tokens. |
| 9 | Error Recovery | 1 | No validation styling exists to recover from yet; once the form is properly wired (see Anti-Patterns note), this needs its own pass. |
| 10 | Help and Documentation | 0 | Zero trust content: no dues/cost mention, no concrete benefits list, no "what happens after you submit." |
| **Total** | | **14/40** | **Poor — the site's single highest-stakes conversion page currently gives a hesitant worker no reason to finish the form.** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A)**: Doesn't read as "AI wrote this" — the copy is plain and human. It reads as "nobody finished the page": a bare `<h1>`, one paragraph, one styled button, and a raw CF7 shortcode with zero theme classes. On the site's highest-stakes page (the one job is converting a hesitant worker into a dues-paying member), that absence of intentionality is itself the defect.

**Deterministic scan**: `detect.mjs --json` → exit 0, zero findings. Same `.php`-coverage gap already confirmed on the two earlier pages critiqued this session (Convenções, Contato): `.php` isn't in the detector's DOM-aware scan list, so it fell through to a regex-only pass over raw source text. Zero findings is a coverage gap, not a clean page.

**Cross-check / false-alarm caught in synthesis**: Assessment A initially flagged a **P0 "submit button is inert — the form cannot be submitted at all,"** based on the button staying `disabled` after passive 1.5s/5s waits. Assessment B, working independently on the same page, went further and **interactively tested this**: setting the LGPD checkbox to checked and dispatching `change`/`click` events flipped `disabled` to `false` immediately. This is the exact same mechanism already verified benign on the Contato page earlier this session (CF7 gates the submit button behind required-field completion, including the consent checkbox) — not a broken initialization, and not unique to this template. **Downgrading this from "form is unsubmittable" to what it actually is: a real but smaller issue — the disabled state is never explained to the user**, so a first-time visitor who hasn't yet noticed the checkbox has no way to tell "broken" from "not finished yet." Folded into the touch-target/affordance issue below rather than reported as a standalone P0.

**Visual overlays**: Not injected by either assessment (both judged the CLI scan, screenshots, and direct DOM measurements sufficient). No horizontal overflow at either viewport — confirmed via `scrollWidth`/`clientWidth` equality by both assessments independently.

## Overall Impression

The same root cause identified on the two other bare-HTML pages this session (Convenções, Contato) shows up here a third time — but on this page it's more consequential: this is the site's actual conversion funnel, the one place PRODUCT.md names as "decidir se filiar." The WhatsApp button is correctly built and on-brand; the CF7 form sitting right beside it is 100% unstyled, has zero labels on any of its four fields, and its 13×13px consent checkbox gates a 151×24px submit button with no explanation of the gating. On top of the styling gap, the page offers a hesitant worker literally one sentence of reassurance before asking for their name, email, phone, and employer — no cost, no concrete benefits, no next-step. This is the weakest page in the site's most important journey.

## What's Working

1. **WhatsApp CTA is correctly styled and functional** — real `wa.me` deep link with a pre-filled message, using `.button.button--primary` at proper height. The one on-brand element on the page.
2. **Offering a synchronous human alternative alongside the form is a good UX call** for a workforce that may prefer a conversation over a form — matches the brand's "acolhedor" personality goal.
3. **The LGPD checkbox is correctly wrapped in a `<label>`** (unlike the four text fields) — confirmed `labels.length === 1` — so it does get an accessible name despite its small visual size, and the underlying CF7 required-field gating is functioning as intended.

## Priority Issues

**[P0] CF7 form renders completely unstyled — the exact same shortcode pattern that IS styled elsewhere on the site (`.contato-form-card`, fixed earlier this session) is dropped here into a bare container.** Measured input height ~30px vs. the 46px this theme's own CSS already specifies for this exact form pattern. Fix: wrap the form output in the same styled card/label/input treatment used on `/contato/`. → `$impeccable polish`.

**[P0] No `<label>` element on any of the four required fields (name/email/telefone/empresa) — verified via DOM (`labels.length === 0` on all four, vs. `1` on a control field elsewhere on the site).** Placeholder-only identification; a WCAG 2.1 AA failure per PRODUCT.md's own stated minimum, and a real problem for anyone interrupted mid-form on mobile (all fields look identical once any text is entered). Fix: add explicit labels to every field, matching the pattern already correct on this same form's LGPD checkbox. → `$impeccable harden`.

**[P1] Submit button (151×24px) and LGPD checkbox (13×13px) both fail the site's 44×44px touch-target rule, and the button's disabled-until-consent state is never explained.** The gating itself is intentional and functions correctly (verified interactively), but nothing tells a first-time user why the button appears inert — a very likely silent-abandonment point. Fix: style both controls to the established sizing (46px button height via `.button--primary`/`.wpcf7-submit`, enlarged checkbox matching the Contato fix), and add a small hint near the checkbox/button pairing. → `$impeccable harden`.

**[P2] Zero trust or reassurance content on the site's highest-stakes conversion page.** One abstract sentence ("fortalece a categoria... benefícios exclusivos") with no cost, no concrete benefits (the site elsewhere references a health plan and legal support, neither named here), and no statement of what happens after submitting. Fix: add a short, concrete block — 2-3 tangible benefits, the next step after submitting, ideally a cost/dues mention or link. → `$impeccable clarify`.

**[P2] Two competing, unframed CTAs (WhatsApp vs. form) with identical visual weight and no explanation of when to use which.** Fix: frame the two paths explicitly (a short kicker like "Prefere falar com alguém agora?" above WhatsApp, a visual break, then "Ou preencha seus dados:" above the form). → `$impeccable layout`.

## Persona Red Flags

**Jordan (First-Timer)** — the primary persona for this exact page per PRODUCT.md's "decidir se filiar": reads one sentence, finds no cost/benefit specifics, fills a form with no labels (loses track of which field is which once typing starts), and if they haven't yet checked the LGPD box, clicks a button that does nothing with zero explanatory message — the worst possible outcome at the moment of maximum commitment.

**Sam (Accessibility-Dependent)**: no accessible name on any of the four text fields; the LGPD checkbox does announce correctly via its label, but renders at a native 13×13px box, well under the 44×44px minimum PRODUCT.md itself sets.

**Riley (Stress Tester)**: the permanently-inert-looking submit button (until the checkbox is checked) is exactly the kind of "looks like it works but silently does nothing" pattern this persona is trained to hunt for — most users won't register it as consent-gated, only as "not working."

## Minor Observations

- Inline `style="padding: 40px 0;"` instead of a theme spacing token — same pattern already fixed on the other two pages this session.
- No section structure below the `<h1>` — the whole page is one flat block.
- No imagery at all, on a page that could reasonably reinforce "Movimento Coletivo" warmth with the same hero photo already used on the homepage.

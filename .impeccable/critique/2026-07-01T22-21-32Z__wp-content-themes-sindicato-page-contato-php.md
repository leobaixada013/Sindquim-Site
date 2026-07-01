---
target: wp-content/themes/sindicato/page-contato.php (Contato)
total_score: 15
p0_count: 2
p1_count: 2
timestamp: 2026-07-01T22-21-32Z
slug: wp-content-themes-sindicato-page-contato-php
---
Method: dual-agent (A: general-purpose design-review sub-agent · B: general-purpose detector/browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | CF7's own default AJAX response region exists, but nothing is styled or reinforced by the theme. |
| 2 | Match System / Real World | 3 | Plain Portuguese labels/placeholders; sensible "Setor" routing options. |
| 3 | User Control and Freedom | 3 | Simple single-page task; WhatsApp opens in a new tab with `rel="noopener"`. |
| 4 | Consistency and Standards | 0 | Verified live: submit button renders 61×24px with browser-default styling, not `.button--primary`; map has no card treatment (radius/shadow) unlike every other container on the site. |
| 5 | Error Prevention | 2 | CF7 required-field markers and email-type validation exist structurally, with no visual reinforcement. |
| 6 | Recognition Rather Than Recall | 1 | Verified via DOM (`el.labels.length`): name, email, select, textarea, and submit have **no** `<label>` element — identified only by placeholder text, which disappears on input. |
| 7 | Flexibility and Efficiency | 1 | Phone number is plain text, not a `tel:` link; no `autocomplete` hints. |
| 8 | Aesthetic and Minimalist Design | 0 | Not minimalist — unstyled. Jump from a fully-designed header to raw paragraphs reads as broken. |
| 9 | Error Recovery | 2 | CF7's default validation/preserve-on-failure behavior is present but generic/unbranded. |
| 10 | Help and Documentation | 1 | No contextual help anywhere; "Setor" options unexplained; no response-time reassurance. |
| **Total** | | **15/40** | **Poor — major UX overhaul required; core experience broken.** |

## Anti-Patterns Verdict

**LLM assessment**: Doesn't fail the usual AI-slop test (no gradient hero, no generic copy) — it fails the opposite way: it looks unfinished. Header/footer are fully on-system; the moment the page body starts (contact info, map, CF7 form) every trace of the design system disappears. A visitor's reaction is "did this page not finish loading its styles?" — on the page whose entire job is converting a hesitant worker into a phone call, WhatsApp message, or filiação.

**Deterministic scan**: `detect.mjs --json` on `page-contato.php` → exit 0, zero findings. Confirmed (by both assessments independently, reading the detector's own source) that `.php` isn't in the detector's DOM-aware `SCANNABLE_EXTENSIONS`/`HTML_EXTENSIONS` lists, so the CLI fell through to a regex-only text scan of 16 lines of PHP glue containing almost no static markup (header/footer/form are all generated at runtime by `get_header()`, `get_footer()`, and the CF7 shortcode). **Zero findings here is a coverage gap, not a clean bill of health** — consistent with the same caveat raised in the earlier Convenções critique.

**Visual overlays**: Not injected by either assessment (both judged the CLI scan + screenshots sufficient evidence). One genuine cross-validated false alarm worth noting: **both assessments independently saw the Google Maps iframe render as an empty grey loading box** on an early screenshot and **both independently re-verified** it was a load-timing artifact (a longer wait shows the map fully loaded with pins/streets) — not a real defect. Also independently confirmed via `Runtime.evaluate` (`scrollWidth === clientWidth === 390`): **no horizontal overflow on mobile.**

## Overall Impression

Both assessments converge tightly on the same verdict as the earlier Convenções critique: this is another page where the design system stops the moment the header ends. The WhatsApp button is the one styled element on the page (correctly using `.button--primary`); everything after it — contact details, map, and the entire Contact Form 7 form — renders in browser defaults. The CF7 submit button was independently measured at 61×24px (well under the site's own 46px `.button` standard and the 44×44px mobile touch-target rule from PRODUCT.md) and the LGPD consent checkbox at 13×13px — a mandatory, legally-required action with an accessibility-hostile hit target. This page converts hesitant workers into contact — it's currently the weakest link in that exact journey.

## What's Working

1. **WhatsApp CTA is correctly built and styled** — real `wa.me` deep link with a pre-filled Portuguese message, using the actual `.button--primary` class. The only element that looks like it belongs to this site.
2. **The "Setor" dropdown is a genuinely good idea** — routing to Atendimento geral/Jurídico/Filiação/Benefícios directly maps to PRODUCT.md's "não há um único fluxo dominante" principle. The execution just undersells it (buried in an unstyled `<select>`).
3. **Map embed is technically sound**: `loading="lazy"`, confirmed no horizontal overflow on mobile via direct DOM measurement.
4. **Clean, correct server-side form config** — CF7 required-field markers, sanitized routing, no security issues found.

## Priority Issues

**[P0] Form controls carry zero brand styling, and the submit button fails the site's own touch-target rule.** Verified live: `.wpcf7-submit` renders at 61×24px with browser-default transparent-gray styling, sitting directly below a red `.button--primary` WhatsApp button one section above — same visual "component family," two completely different products. 24px is roughly half the 46px `.button` minimum this same theme establishes elsewhere. Fix: style `.wpcf7-form-control` (inputs/select/textarea) with the site's input conventions (padding, `var(--line)` border, radius, on-brand focus state), and apply `.button--primary`'s treatment to `.wpcf7-submit`. → `$impeccable polish`.

**[P0] Form fields have no associated `<label>` element.** Verified via direct DOM query (`el.labels.length`): name, email, sector select, message, and submit all return `hasLabel: false` — identified only by placeholder text, which vanishes on input and is not a reliable accessible name. Directly conflicts with PRODUCT.md's explicit WCAG 2.1 AA minimum. Fix: add persistent, visible `<label>` elements for every field. → `$impeccable harden`.

**[P1] LGPD consent checkbox measures 13×13px on live mobile render** — roughly a third of the 44×44px minimum, gating the entire form submission (a legally-required consent action) behind a precision tap. Fix: give the checkbox (or its wrapping label) a padded 44×44px hit area. → `$impeccable harden`.

**[P1] No visual grouping across the page's contact channels, map, and form.** Phone, address, WhatsApp button, map, and the full form render as one flat, undifferentiated stream with identical visual weight (fails Chunking/Grouping/Visual-Hierarchy). The map has zero card treatment (no radius, no shadow) unlike every other container on the site. Fix: group phone/address/WhatsApp into a contact card, give the map the site's standard card treatment, wrap the form in its own labeled section ("Envie uma mensagem"). → `$impeccable layout`.

**[P2] Phone number is plain text, not a `tel:` link.** PRODUCT.md's stated success metric is a worker finding contact info "rapidamente e pelo celular" — forcing manual copy-and-dial instead of one-tap calling is a low-cost, high-friction gap on a mobile-first audience. Fix: wrap the number in `<a href="tel:+55...">`. → `$impeccable clarify`.

## Persona Red Flags

**Jordan (First-Timer)**: Faces three parallel, unranked contact options (call, WhatsApp, form) with no guidance on which is fastest or what response time to expect. The "Setor" dropdown offers "Jurídico"/"Filiação"/"Benefícios" with no explanation of what selecting one does or how it differs from the dedicated `/filie-se/` page.

**Sam (Accessibility-Dependent)**: None of the five interactive form controls have a `<label>` or `aria-label` — a screen reader falls back to inconsistent placeholder-as-name behavior. The mandatory LGPD checkbox at 13×13px live on device is a serious barrier for anyone with motor impairment.

**Casey (Mobile User)**: Must scroll one-handed through a long, visually flat page to reach the primary action — a 24px-tall submit button, well under the 44px thumb-target minimum. The phone number isn't tappable, forcing an app-switch and manual typing instead of a one-tap call.

## Minor Observations

- Site-wide nav links "Contato" to `#contato` (an anchor, presumably on the homepage), not to `/contato/` — worth checking whether that's intentional.
- No supporting intro sentence under `<h1>Contato</h1>` — a one-line human framing would soften the jump into raw data, more in line with the brand's "acolhedor" side.
- CF7's own default plugin CSS is not being dequeued in `functions.php`, so today's baseline styling rides entirely on the plugin's bundled defaults — a silent regression risk the next time CF7 updates.

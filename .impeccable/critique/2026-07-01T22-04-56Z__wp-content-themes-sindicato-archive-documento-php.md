---
target: wp-content/themes/sindicato/archive-documento.php (Convenções e Documentos)
total_score: 14
p0_count: 1
p1_count: 2
timestamp: 2026-07-01T22-04-56Z
slug: wp-content-themes-sindicato-archive-documento-php
---
Method: dual-agent (A: general-purpose design-review sub-agent · B: general-purpose detector/browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Filter values persist via GET, but no result count and no "active filters" echo. |
| 2 | Match System / Real World | 3 | Type labels are correct plain-language; year-as-free-number-field is an odd match for "pick a year with documents." |
| 3 | User Control and Freedom | 1 | No reset/clear-filters control anywhere. |
| 4 | Consistency and Standards | 0 | Zero theme classes on h1/form/list — the single biggest break from the rest of the site. |
| 5 | Error Prevention | 1 | Year `<input type="number">` has no min/max/step; any integer silently returns "not found." |
| 6 | Recognition Rather Than Recall | 2 | "Baixar PDF" is visually identical to plain text (global `a{color:inherit;text-decoration:none}`) — not recognizable as a link until hover/tab. |
| 7 | Flexibility and Efficiency | 2 | GET-based filtering is bookmarkable/shareable (a real plus); no sort, no bulk actions. |
| 8 | Aesthetic and Minimalist Design | 1 | Reads as unfinished, not minimal-by-intent — glaring next to the fully art-directed header/footer around it. |
| 9 | Error Recovery | 1 | Empty state is a flat gray sentence with no suggested next step. |
| 10 | Help and Documentation | 1 | No explanation of document-type jargon (Convenção vs. Acordo vs. Termo Aditivo). |
| **Total** | | **14/40** | **Poor — this specific page needs a real overhaul; the rest of the site is not in this state.** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A)**: This page does not look like generic AI-slop (no gradient hero, no rounded-icon card grid, no eyebrow stack) — it fails the opposite way: it looks like nothing was designed at all. Bare `<h1>`, bare `<form>`, bare `<ul><li>`, sandwiched between a fully art-directed navy header and footer. A visitor wouldn't ask "which AI made this" — they'd ask "is this page broken?" On the page serving the union's legally load-bearing collective-bargaining documents, that reads as institutional neglect.

**Deterministic scan (Assessment B)**: `detect.mjs --json` on `archive-documento.php` returned exit code 0, zero findings. Important caveat, confirmed by reading the detector's own source: `.php` is not in `SCANNABLE_EXTENSIONS` (the deep DOM-aware HTML/CSS analysis), so the single-file path fell through to the lighter regex-only `detectText()` pass over raw source text. **Zero findings here does not mean zero anti-patterns in the rendered page** — it means the regex ruleset found nothing matchable in the raw PHP text. The unstyled native `<select>`/`<input>` and the invisible-link styling are real, visible, rendering-level issues a text-regex scan has no way to catch. Both assessments agree this is a detector-coverage gap, not a contradiction.

**Visual overlays**: Not injected by either assessment (both judged the fragile live-server/injection flow unnecessary given a 0-finding CLI scan and a page with no documents currently published to overlay). No user-visible overlay exists in a browser tab; treat the two assessments' screenshots as the evidence trail instead.

## Overall Impression

The gut reaction from both assessments converges tightly: this is the one page on the site where the design system stops. Everything around it — header, footer, buttons — is fully on-brand navy/vermelho; the content well of the actual "Convenções e Documentos" page is bare browser defaults. Both assessments independently confirmed there are currently **zero published documents** in the `documento` CPT, so the actual list/card rendering has never been visually tested — only the filter controls and the empty state are real evidence today. The single biggest opportunity: this page serves one of PRODUCT.md's named core visit-reasons ("consultar convênios") and is currently the weakest link in that journey.

## What's Working

1. **`method="get"` filtering** — filter state lives in the URL, survives refresh/back-button, and is shareable/bookmarkable with zero JS. Quietly correct architecture choice.
2. **Correct label/control association** (`<label>Ano<input.../></label>`) — screen readers get proper programmatic pairing for free, no `for`/`id` bugs.
3. **Clean, safe server-side handling** — `absint()` on year, `sanitize_text_field(wp_unslash())` on tipo, consistent `esc_attr`/`esc_html`/`esc_url` throughout. The emptiness here is a design gap, not a security one.

## Priority Issues

**[P0] The page abandons the site's entire design system**
- **Why it matters**: `h1`, `form`, and `ul/li` carry zero theme classes — no navy-950 heading color, no established type scale, no list/card treatment. This is the page serving the union's most institutionally serious content and it's the one page with no brand identity applied, directly against DESIGN.md's rule that navy is "a base dominante de marca... não pode ser diluído."
- **Fix**: Give the h1 the same navy + headline scale used by `.section-heading h2` elsewhere; wrap the filter as a real styled component; render documents as list/card rows with visible metadata instead of bare `<li>`.
- **Suggested command**: `$impeccable shape` (this page needs its component patterns designed, not just polished), followed by `$impeccable polish`.

**[P1] Filter controls fail the project's own 44×44px touch-target rule, and wrap incorrectly on mobile**
- **Why it matters**: PRODUCT.md/DESIGN.md both mandate ≥44×44px touch targets for this mobile-first audience. The year `<input>` and `<select>` render at native browser-default height with no `min-height` — while the footer's newsletter `<input>`, on this exact same rendered page, already gets `min-height: 46px`. On mobile (390px, confirmed via CDP device-metrics emulation, not the flagged-false-positive `--window-size` method), the "Tipo" label visually detaches from its own `<select>` and floats alone on the line above it — a genuine wrap/grouping defect (verified via `scrollWidth`/`clientWidth`: no actual horizontal overflow at either breakpoint, so this is a wrap issue, not a clipping bug).
- **Fix**: Apply the same `min-height: 46px; border-radius: 6px; border: 1px solid var(--line)` treatment already used for `.newsletter input` to the filter's number input and select; adjust the mobile flex/wrap so "Tipo" and its select never separate.
- **Suggested command**: `$impeccable harden` (accessibility/touch-target compliance), then `$impeccable adapt` for the mobile wrap.

**[P1] "Baixar PDF" has no visible link affordance, and document type disappears after filtering**
- **Why it matters**: The sitewide rule `a { color: inherit; text-decoration: none; }` makes the download link visually identical to plain text — a user scanning a list of legal documents can't tell what's clickable without hovering or tabbing onto it. Separately, `tipo` filters the list but is never shown per row, forcing the user to remember what they searched for.
- **Fix**: Style "Baixar PDF" as the existing `.button--small` component (already built, already used for "Ouvir agora" on the podcast card); show each row's tipo as a small label.
- **Suggested command**: `$impeccable clarify`.

**[P2] No reset control, no active-filter feedback, and a weak/ambiguous empty state**
- **Why it matters**: There's no way to clear a filter except retyping by hand; no result count is shown when documents do exist; and the empty state ("Nenhum documento encontrado para o filtro selecionado.") is a flat sentence with no next action. Both assessments independently confirmed that with *no* filter applied at all, the page still returns this same empty message — the `documento` CPT currently has zero published entries, so the real list/card UI has never been exercised.
- **Fix**: Add a visible "Limpar filtros" control, show a result count, give the empty state a concrete next step ("Nenhuma convenção publicada ainda — volte em breve" vs. a filter-specific miss), and populate at least one real or placeholder `documento` entry so the list styling can be verified once P0 is addressed.
- **Suggested command**: `$impeccable clarify`.

## Persona Red Flags

**Jordan (First-Timer)**: Doesn't know "Termo Aditivo" vs. "Acordo Coletivo" — pure legal/union jargon with zero inline explanation. Has no idea which years actually have documents before guessing one into the bare number field; a wrong guess gets the identical flat "not found" sentence. The unstyled h1 gives no visual confirmation of having "arrived" anywhere real — likely to bounce back to nav thinking the link is broken.

**Sam (Accessibility-Dependent)**: The two filter fields have no `<fieldset>`/`<legend>` grouping them as one combined filter — a screen reader hears "Ano, edit text" then "Tipo, combobox" with no announced relationship. "Baixar PDF" links are effectively invisible to a low-vision sighted user scanning visually rather than using a screen reader (no color/underline distinction), forcing blind tabbing to discover which words are links.

**Riley (Stress Tester)**: The year field accepts anything — "0", negative numbers, "99999" — all silently producing the identical "not found" message, indistinguishable from a legitimately empty year. GET params correctly preserve state on reload/share (a genuine plus), but nothing on the page restates which filter produced the current (or empty) list.

## Minor Observations

- Year field is `<input type="number">` with no min/max/step — a `<select>` of years that actually have documents (matching the existing Tipo dropdown pattern) would be both more usable and impossible to get wrong.
- `.container` here uses a hardcoded inline `style="padding: 40px 0;"` while the rest of the site standardizes section spacing via `.section { padding: 72px 0; }`.
- No result count ("X documentos encontrados") shown when documents exist.
- Sitewide reliance on browser-default focus states is not specific to this page — worth a separate broader audit, not a priority item here.

## Questions to Consider

- If this page carried the same navy/vermelho identity as the homepage, would a worker searching for last year's collective agreement feel like they're on the union's official channel — or on a placeholder that shipped before design was finished?
- PRODUCT.md names "consultar convênios" as a core reason people visit this site. Why is this exact page the one with zero brand identity applied?
- Should "Baixar PDF" simply become the existing `.button--small` component (already built, already used elsewhere) rather than invisible inline text?

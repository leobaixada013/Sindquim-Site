---
target: home page (front-page.php + header.php + footer.php)
total_score: 23
p0_count: 4
p1_count: 2
timestamp: 2026-07-01T20-28-00Z
slug: wp-content-themes-sindicato-front-page-php
---
Method: dual-agent (A: design-review sub-agent · B: detector+browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No active/current-section state in sticky nav during scroll |
| 2 | Match System / Real World | 3 | Quick-access icon labels are cryptic abbreviations (CCT/BEN/JUR/SIM), not real-world terms |
| 3 | User Control and Freedom | 3 | Mobile menu toggle works in code, but see P0 below — it's off-screen at common phone widths |
| 4 | Consistency and Standards | 2 | Red used inconsistently: sometimes urgency/action, sometimes pure decoration (every section eyebrow, category tags) |
| 5 | Error Prevention | 1 | Footer newsletter form: `action="#"`, no validation, no format hint |
| 6 | Recognition Rather Than Recall | 3 | Nav labels clear; quick-card abbreviations require decoding |
| 7 | Flexibility and Efficiency | 3 | Appropriate for a single-scroll marketing page |
| 8 | Aesthetic and Minimalist Design | 3 | Clean palette/whitespace, undercut by ghost-cards and repetitive eyebrows |
| 9 | Error Recovery | 1 | No error states exist anywhere on the page |
| 10 | Help and Documentation | 2 | "Área do Associado" link doesn't go to a member area — just jumps to `#contato` |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

**LLM assessment (Assessment A):** Not an instant "AI made this" — the restrained 3-color system and specific Portuguese copy help. But checked against the ban list, it fails or near-fails three patterns: the tiny uppercase `.section-label` eyebrow repeats identically above every single section (hero, Acesso rápido, Podcast, Instagram, CTA band — 5/5), the ghost-card pattern (1px border + 40px-blur shadow on the same element) is shipped in `.featured-post`/`.post-card`/`.notice-panel` — the exact combination DESIGN.md itself now bans — and the hero `<h1>` visibly clips at 390px viewport width.

**Deterministic scan (Assessment B):** 14 findings in `assets/css/main.css` (0 in the PHP templates): 1 `overused-font` (Arial, line 29), 12 `design-system-color` advisories, 1 `design-system-radius` advisory (999px pill, line 592). The detector caught something the design review didn't isolate as its own issue: **12 literal `rgba()`/hex colors that trace back to no `:root` custom property at all** (lines 50, 179, 213, 223, 360, 389, 390×2, 395, 401, 768, 852) — colors like `rgba(5, 27, 51, …)` (hex `#051B33`) and `rgba(233, 41, 47, …)` (hex `#E9292F`) are numerically distinct from the documented tokens (`--navy-950: #161429`, `--red-600: #e73a3f`) — real design-system drift, not alpha variants of approved tokens.

**False positives (Assessment B, self-identified):** the `overused-font` hit on `Arial` doesn't match the rule's actual target list (Inter, Roboto, Fraunces, Geist, etc.) — Arial is a plain system font, not a training-data-default webfont. The `999px` radius on `.podcast-feature__tag` is a legitimate pill-shape technique for a padded rectangular tag (DESIGN.md's `full: 50%` token wouldn't produce a pill here) — missing token entry, not drift.

**Additional evidence found during synthesis, verified independently:** the hero background image and two other backgrounds (`.post-image--assembly`, `.insta-card--photo`) all reference `url("assets/hero-assembleia-sindicato.png")` from inside `assets/css/main.css`. That path resolves to `wp-content/themes/sindicato/assets/css/assets/hero-assembleia-sindicato.png`, which does not exist. The actual file lives only at the repo root (`assets/hero-assembleia-sindicato.png`, the original static-mockup asset) — it was never copied into the theme, and even if it were, the relative path is one level wrong (needs `../hero-assembleia-sindicato.png` or the file needs to live under `assets/css/assets/`). This has been broken since the theme was built; the hero currently renders as a flat navy rectangle with no photographic texture on every page that uses it.

**Browser evidence (Assessment B):** confirmed genuine horizontal overflow at 390px width (not just word-wrap) by comparing identical copy at 390px vs. 430px — at 390px "direitos" truncates to "direit…" and "negociáveis" is cut at the viewport edge; at 430px the same text renders in full. Separately, the `.menu-toggle` hamburger button — the only way to open mobile nav, since `.nav-links` is `display:none` under 860px — is pushed fully off-screen at 390px width (visible but already clipped at 430px). No live browser-overlay injection was available in this session; all findings are from static screenshots at 1440px and 390px plus two disambiguation crops (390×700, 430×700).

## Overall Impression

The palette and copy genuinely avoid both PRODUCT.md anti-references (dated "sindicato panfleto" and cold corporate) — that's real, earned differentiation. But the page has three independently-confirmed P0 defects that a mobile-first union audience will hit immediately: a hero headline that visibly clips, a hero image that has never actually loaded, and a mobile nav toggle that's unreachable at common phone widths. The single biggest opportunity is closing that gap between "the design system is well-specified" (DESIGN.md is precise and even names its own known debt) and "the shipped page follows it" — several of today's defects are the code contradicting rules the project already wrote down for itself (One Signal Rule, No Double-Depth Rule).

## What's Working

1. A genuinely restrained, differentiated palette (navy + red + azul-aço) that avoids both named anti-references — doesn't read as generic SaaS or dated union-panfleto.
2. Direct, worker-facing Portuguese copy with no corporate filler, consistent with the "firm but approachable" brand personality.
3. The sticky nav + mobile hamburger is a real, working implementation (`assets/js/main.js` correctly toggles `.is-open`/`aria-expanded`) — the toggle mechanism itself isn't broken, only its visibility at narrow widths.

## Priority Issues

**[P0] Hero image asset is broken — has likely never rendered**
- **Why it matters**: The hero, the featured-post card, and the Instagram photo-card treatment all depend on `assets/hero-assembleia-sindicato.png`, referenced via a relative path that resolves one directory short of where the file would need to be — and the file was never copied into the theme at all (it only exists at the repo-root mockup). The union's single largest visual identity moment has been a flat navy rectangle since launch.
- **Fix**: Copy `assets/hero-assembleia-sindicato.png` (repo root) into `wp-content/themes/sindicato/assets/img/`, then update the three `url(...)` references in `assets/css/main.css` (lines 214, 384, 853) to the correct relative path.
- **Suggested command**: `$impeccable harden`

**[P0] Mobile hero headline overflows/clips at 390px viewport**
- **Why it matters**: Confirmed independently by both assessments — at 390px the hero `<h1>` text is cut off mid-word. This audience is mobile-first per PRODUCT.md, and the hero headline is the single highest-priority message on the page.
- **Fix**: Audit `.hero__copy`/`.hero h1` sizing (`assets/css/main.css` ~lines 233–259) for real overflow, not just tight wrapping, at ≤390px.
- **Suggested command**: `$impeccable harden`

**[P0] Mobile nav toggle unreachable at common phone widths**
- **Why it matters**: `.nav-links` is `display:none` below 860px, and `.menu-toggle` is the only way to open it — but at 390px width the toggle button is pushed fully off-screen. A visitor on a standard-width phone cannot open the navigation menu at all.
- **Fix**: Fix header layout so `.menu-toggle` stays within the viewport at all supported mobile widths (390px and up).
- **Suggested command**: `$impeccable adapt`

**[P0] Sub-AA color contrast on the primary CTA path**
- **Why it matters**: `--red-600` (#e73a3f) against white measures ~4.14:1, below the 4.5:1 AA minimum — and this exact pairing is the resting-state background of every `.button--primary`, including the "Filie-se"/"Quero me associar" join CTAs, plus `.section-label`, `.post-meta span`, and `.notice-list time`. DESIGN.md asserts "≥4.5:1 já é prática deste projeto" — that claim is currently false in the shipped CSS, on the join-flow buttons specifically.
- **Fix**: Use `--red-700` (#d31a1f) as the resting-state color for text-on-white and white-on-red pairings, not just the hover state.
- **Suggested command**: `$impeccable harden`

**[P1] Broken primary-nav anchor — "O Sindicato" links to nothing**
- **Why it matters**: `header.php:39` links to `#sindicato`; no element with that id exists anywhere in the rendered page. It's the first item in main navigation — the "who we are" trust link a first-time visitor would reach for — and it silently does nothing.
- **Fix**: Point it at a real About/Institutional page (or the future `/o-sindicato` page from the site's broader page-structure plan) instead of a dead in-page anchor.
- **Suggested command**: `$impeccable audit`

**[P1] The design system's own "One Signal Rule" is violated by the default styling**
- **Why it matters**: `.section-label { color: var(--red-600); }` has no per-section override except the hero — so "Serviços para a categoria," "Áudio e vídeo," "Redes sociais," and "Fortaleça sua representação" all render in urgency-red despite none being urgent. Same for post category tags. DESIGN.md's own rule says red is "nunca decorativo" — the shipped code contradicts the project's own governing document, diluting red exactly where real urgency needs to stand out.
- **Fix**: Move non-urgent eyebrows/tags to navy or azul-aço; reserve red strictly for `.alert-strip`, `.button--primary`, and genuinely urgent badges.
- **Suggested command**: `$impeccable colorize`

**[P2] Ghost-card anti-pattern still shipped in content cards**
- **What**: `.featured-post, .post-card, .notice-panel` combine a 1px border with a 40px-blur shadow on the same element — the exact pattern DESIGN.md's "No Double-Depth Rule" now bans, flagged there as known debt but not yet fixed.
- **Fix**: Drop the border, keep the soft shadow, per DESIGN.md's stated direction.
- **Suggested command**: `$impeccable polish`

**[P2] 12 literal colors bypass the documented token system**
- **What**: The detector found 12 `rgba()`/hex values in `assets/css/main.css` that don't trace back to any `:root` custom property — real numeric drift from the documented palette, concentrated in overlay gradients and one card-texture background.
- **Fix**: Either fold these into named tokens (if intentional/reused) or replace with existing token references (if accidental drift).
- **Suggested command**: `$impeccable extract`

## Persona Red Flags

**Jordan (confused first-timer)**: Clicks "O Sindicato" expecting an about/history page — nothing happens. Sees quick-access cards labeled only "CCT," "BEN," "JUR," "SIM" and must read small captions to decode meaning before deciding whether to click. Taps "Área do Associado" expecting a member login and instead just jumps to the footer contact block.

**Riley (stress-tester)**: On a quiet news week (the state actually captured in these screenshots — one published post, no urgent notices, no podcast episode, no Instagram cards), `.post-grid` leaves a large dead whitespace column beside the featured card, and the Podcast/Instagram sections silently fall back from styled cards to a single plain-text paragraph — breaking the card language everywhere else on the page at exactly the moment the institution most needs to look active. Then resizes to a phone and hits all three P0 mobile defects at once.

**Casey (distracted mobile user)**: Wants the phone number fast — it's genuinely right there in the topbar, good. But the topbar stacks into several lines above the header on mobile, pushing real content further down before Casey even reaches the message. Then the hero headline clips, and there's no way to open the nav menu to go elsewhere, because the toggle button is off-screen.

## Minor Observations

- Quick-access "icons" are literal 3-letter text abbreviations, not real iconography — reads as a placeholder.
- Footer newsletter form (`footer.php:35`) has `action="#"` with no real submission handling or validation.
- "Política de Privacidade | Transparência" in the footer bottom bar is plain text, not links.
- No `@media (prefers-reduced-motion)` block exists yet in `main.css` — consistent with DESIGN.md's own note that this is pending.
- Decorative gradient/pattern textures stand in for real photography on `.post-image--document/finance/benefits` — reasonable as placeholders, but read as generic next to the one real photo asset (which, per the P0 above, currently doesn't even load).

## Questions to Consider

1. If red is reserved for "urgency or action" by the design system's own named rule, why does the shipped CSS make it the *default* color of every section eyebrow and category tag — none of which are urgent?
2. The homepage gracefully hides an absent urgent notice but not an empty news grid or empty podcast/Instagram feed. On a quiet week, does the homepage end up looking inactive at exactly the moment it most needs to look reliable?
3. The hero image has likely never rendered since this theme was built — how many other asset-path assumptions inherited from the static mockup might have broken the same way during the port to WordPress?

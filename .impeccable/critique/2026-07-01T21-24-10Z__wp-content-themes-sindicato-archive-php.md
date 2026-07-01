---
target: noticias (archive.php + single.php)
total_score: 20
p0_count: 2
p1_count: 1
timestamp: 2026-07-01T21-24-10Z
slug: wp-content-themes-sindicato-archive-php
---
Method: dual-agent (A: design-review sub-agent · B: detector+browser-evidence sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | No active-nav state; no breadcrumb; no page-count feedback |
| 2 | Match System / Real World | 3 | Share links show raw text, not recognizable icons |
| 3 | User Control and Freedom | 1 | No "back to news" link on single.php |
| 4 | Consistency and Standards | 1 | Listing has a real card design; single is raw unstyled HTML |
| 5 | Error Prevention | 2 | `get_the_category()[0] ?? ''` risks a PHP notice on uncategorized posts |
| 6 | Recognition Rather Than Recall | 3 | Category/date consistently shown |
| 7 | Flexibility and Efficiency | 2 | No filter/search despite PRODUCT.md naming multiple jobs-to-be-done |
| 8 | Aesthetic and Minimalist Design | 2 | Listing clean (marred by grid bug); single reads as unfinished |
| 9 | Error Recovery | 2 | Empty-state and broken nav link both fail silently |
| 10 | Help and Documentation | 3 | N/A, neutral |
| **Total** | | **20/40** | **Acceptable/Poor boundary** |

## Anti-Patterns Verdict

Mostly clean of absolute-ban patterns. The ghost-card border+shadow combo is NOT present in `.post-card` (shadow only) — already compliant. The one slop-adjacent symptom is a real grid bug (see P0), not decorative.

**Deterministic scan**: 7 findings in `main.css` (0 in archive.php/single.php themselves): overused-font (Arial, false positive — documented in DESIGN.md as intentional), design-system-color x5 (topbar text #dce8f3, ambiente-suave shadow rgba — false positive, already documented in DESIGN.md Elevation section — plus document-placeholder gradient stops, footer bottom text), design-system-radius (999px pill, same missing-token pattern noted in the home critique).

## Overall Impression

The listing (`archive.php`) legitimately reuses the site's card system and is close to solid. `single.php` — the template readers spend the most time on — has almost no design applied at all, and the jump between the two is a genuine "is this site broken?" moment. On top of that, the primary "Notícias" nav destination (`/noticias/`) 404s: no page, category, or CPT exists at that slug anywhere in the install.

## Priority Issues

**[P0] `.post-card` grid layout breaks at desktop widths (≥1101px)**
`.post-card { grid-template-columns: 150px 1fr; }` (main.css:418-422) expects an image column + text column, but `archive.php` never renders a `.post-image` div — only `.post-card__body`. With one child, grid auto-placement puts the body into the 150px track, leaving ~85% of the card empty and crushing titles to one word per line. Measured live via `getBoundingClientRect()`: `.post-card__body` renders at 150px width inside a 1180px card. Fixed correctly below 1100px by the existing media query (`grid-template-columns: 1fr`) — only breaks at desktop widths.

**[P0] `single.php` has essentially no design applied**
Raw semantic HTML: unstyled h1, unstyled `the_content()` with no reading-width constraint, share links with zero visual affordance (indistinguishable from body text per the global `a { color: inherit; text-decoration: none; }` rule). The emotional drop from a well-designed card to this is the single biggest issue found.

**[P1] Primary "Notícias" nav destination doesn't exist**
`header.php:40`/`footer.php:29` link to `home_url('/noticias/')`. No page, category, or CPT with that slug exists (confirmed via REST API); returns HTTP 404. Every visitor's first click into news fails.

**[P2] Share links on single.php fail the 44x44px touch-target rule**
Raw inline `<a>` tags, no padding, no min-height, no color/underline distinction.

**[P2] `.nav-links` class collision will hide mobile pagination**
`the_posts_pagination()` wraps output in `<div class="nav-links">` by default — same class the header's mobile-hidden nav uses (`display:none` below 860px). Not yet visible live (no category has 2+ pages yet) but a real landmine once real content lands.

## Persona Red Flags

**Jordan**: clicks "NOTÍCIAS", hits a 404. If arriving via a shared article link instead, lands on a bare page with no way back to the list. **Casey**: escapes the desktop grid bug (mobile media query saves it) but hits sub-44px share links trying to forward an urgent notice. **Riley**: resizing across the 1100px breakpoint visibly breaks/fixes the card layout in real time.

## Minor Observations

No custom CSS on any bare `h1`/`p`/`article` selector — current appearance is UA-default coincidence, not design intent. `.post-meta`'s `justify-content:space-between` (designed for a narrow card) reused verbatim on single.php's full-width container creates an oddly wide category-to-date gap. No hover/focus transition on `.post-card` despite DESIGN.md's Movimento section describing this as intended. `get_the_category()[0] ?? ''` will emit a PHP notice for uncategorized posts.

## Questions to Consider

1. If news is this site's most-visited section, why does the template readers spend the most time on (single.php) get zero design budget?
2. Is `/noticias/` meant to be a category archive, a CPT, or a static page listing latest posts? The shape was never actually decided.

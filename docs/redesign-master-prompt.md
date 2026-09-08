# RareUI — Master Redesign Prompt

**Purpose:** a self-contained brief for redesigning every screen in this app to one consistent design system, in the spirit of reui.io's blocks-showcase aesthetic. Paste this whole file into a fresh session (or hand it to a designer) to execute the redesign — it doesn't assume any other context.

---

## 1. Goal

RareUI is currently a patchwork: the 3 built-in component detail pages recently got a polished, reui.io-style treatment (a bordered card with a Preview/Code tab switcher and a trimmed icon toolbar), but the homepage, Library catalog, Library admin, and Figma-to-Code pages were each restyled independently at different points and never brought up to the same standard. The result is one app that reads as 3-4 different apps stitched together.

**The job:** apply one consistent design system — spacing scale, container widths, card/toolbar patterns, section-header conventions — across all 7 screens, using reui.io's actual visual language as the reference, not just "make it look nicer."

## 2. Reference aesthetic (reui.io / shadcn blocks style)

Characteristics to actually replicate, extracted from reui.io's blocks pages:

- **Structural card pattern:** every showcased block lives in one bordered card with a **toolbar strip** at the top (light gray/subtle background, bottom border) containing a tab switcher on the left and a row of small icon-only buttons on the right, then the actual content below.
- **Toolbar icon buttons:** consistently sized (~28-32px square), 1px border, generous hit-area, tooltip on hover instead of visible label text — not text buttons with icons prepended.
- **Breadcrumb nav:** small, muted, `Section > Subsection > Page` — always present except on the true homepage.
- **Typography:** one bold, tight-tracking headline per page; one muted description line directly under it; no decorative subheadings competing for attention.
- **Spacing discipline:** generous vertical rhythm between page sections (breadcrumb → title → description → content), but tight, deliberate spacing *within* a toolbar or card.
- **Copy-path chip:** a small monospace pill showing an install/import path with a copy icon — always in the same toolbar position.
- **Badges:** small rounded-full pills with a border, used sparingly (category tag, status), never as decoration.

RareUI already has a working dark-first token system (`--color-canvas/surface/field/hover/line/ink/ink-2/3/4/accent/accent-dim`, `--radius-window/control`) — **do not invent a new palette or switch to light-first.** The goal is applying reui.io's *structural* patterns and *spacing discipline* on top of RareUI's existing dark theme, not copying reui.io's light theme.

## 3. Current state — screen by screen

Survey taken directly from the running app (`npm run dev`, all 7 routes screenshotted):

| Route | Container width | Current pattern | Gap vs. target |
|---|---|---|---|
| `/` (homepage) | `max-w-4xl` (896px) | Hero + `CategorySection` groups of `PrimitiveShowcase` cards | Cards don't use the toolbar-card pattern; category headers are plain text + count, no visual weight |
| `/components/edge-stepper`, `/command-palette`, `/adaptive-form` | `max-w-4xl` | **Already redesigned** — bordered card, Preview/Code tabs, trimmed icon toolbar, install chip | This is the reference implementation — everything else should match this |
| `/library` | `max-w-[1200px]` | Hero + category-pill filter row + search + card grid | Category pills wrap onto a second line at this width (`All Website Mobile Dashboard Marketing E-commerce` then `SaaS` alone below) — needs either a scrollable row or a wrap-aware layout; cards are plain bordered boxes, no toolbar-card treatment |
| `/library/admin` | `max-w-[640px]` | Eyebrow label ("MANAGE") + heading + form + list | Narrowest page on the site by a wide margin; visually reads as a completely different, smaller-scoped tool rather than part of the same product |
| `/figma-to-code` | `max-w-6xl` (1152px) | Plain section labels ("Canvas", "Technology") + dashed-border drop zone | No breadcrumb at all (only page without one); section labels don't match the eyebrow/heading pattern used elsewhere |

**Known structural inconsistencies to resolve as part of this redesign, not work around:**
- 4 different container widths across 7 routes (896 / 1200 / 640 / 1152px) with no shared scale
- Only the 3 component detail pages use the toolbar-card pattern — homepage cards, library cards, and the figma-to-code canvas all use older, one-off card styles
- Border-radius vocabulary is split between `rounded-control` (6px, semantic token) and hardcoded `rounded-[8px]` / `rounded-[12px]` / `rounded-[16px]` with no documented rule for which applies where
- Section-header conventions differ per page: homepage uses plain text + count; library uses pills; admin uses an eyebrow label; figma-to-code uses a bare label — pick ONE pattern and use it everywhere a page has multiple sections

## 4. Design system to establish (fill these in as fixed decisions, then apply everywhere)

Work through these as explicit decisions before touching any page — every page redesign should cite back to this section rather than reinvent it:

- **Container width scale:** pick 1-2 widths max (e.g. a `max-w-4xl` "reading" width for text-heavy pages, one wider `max-w-[1200px]` "workspace" width for tool/catalog pages) and assign every route to one of them. `/library/admin` at 640px should almost certainly move to whichever width `/library` uses — they're the same tool.
- **Card/toolbar pattern:** formalize the pattern already built for the component detail pages (bordered card → toolbar strip with tab-switcher-left/icons-right → content) as *the* card primitive, and identify every place it should replace an ad hoc card (homepage `PrimitiveShowcase`, library `ComponentCard`, figma-to-code's canvas + output panels).
- **Border-radius scale:** decide which radius token applies to which class of element (buttons/inputs/chips vs. cards vs. modals) and eliminate the arbitrary-pixel radii that don't map to a documented rule.
- **Section-header pattern:** one consistent header treatment (eyebrow label + heading, or heading + count — pick one) used identically on the homepage's category sections, the library's results area, the admin tool's steps, and figma-to-code's Canvas/Technology/Code sections.
- **Breadcrumb coverage:** every non-homepage route gets one, styled identically (already the case for 5 of 7 routes — just add it to `/figma-to-code`).

## 5. Page-by-page work

For each page, apply the decisions from Section 4. Suggested order (lowest-risk / most self-contained first):

1. **`/figma-to-code`** — add breadcrumb, apply the section-header pattern to "Canvas"/"Technology"/"Code", reconcile its container width with the chosen scale.
2. **`/` homepage** — restyle `PrimitiveShowcase` cards to use the toolbar-card pattern where it makes sense (may need a lighter variant since these are grid cards, not full detail views), apply the section-header pattern to `CategorySection`.
3. **`/library`** — fix the category-pill wrap, restyle `ComponentCard` to match the homepage's card treatment, apply the section-header pattern.
4. **`/library/admin`** — move to the shared workspace container width, apply the section-header pattern to its numbered steps, bring its form/button styling in line with the rest of the site (it currently feels the most like a separate tool).

Do **not** touch the 3 component detail pages beyond fixing anything Section 4's decisions retroactively change about them (e.g. if the container-width scale changes, they need to move too) — they're the reference implementation this whole redesign is matching everything else to.

## 6. Constraints — do not change

- **No logic changes.** Every page's actual behavior (fetches, state, event handlers, the Figma clipboard read/write, the Supabase admin CRUD, the SVG-to-code conversion) must come out byte-identical in behavior. This is a visual-only pass, same discipline as the Library restyle earlier in this project's history: convert styling, touch nothing else.
- **Keep the dark-first theme.** No light-mode-by-default switch. The per-preview light/dark toggle on component detail pages stays scoped to just that preview pane.
- **No new dependencies.** Everything achievable with the existing Tailwind v4 token system and plain React — don't reach for a component library to get the reui.io look.
- **No automated test suite exists.** Verify each page manually via the dev server (`npm run dev`) after its pass — visual comparison against the component detail pages as the reference, console-error check, and a click-through of the page's actual functionality (search/filter on `/library`, extraction flow on `/library/admin`, paste-to-code on `/figma-to-code`) to confirm nothing broke.

## 7. Suggested process

This is exactly the shape of work the `superpowers:brainstorming` → `writing-plans` → `subagent-driven-development` skill chain (already used earlier in this project) is built for: work through Section 4's open decisions as a short design conversation first (get sign-off on the container-width scale and card pattern before any code changes), then turn Sections 4-5 into a numbered implementation plan, one task per page plus one task for the shared design-system decisions, each with its own before/after verification.

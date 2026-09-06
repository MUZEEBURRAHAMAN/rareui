# Unified Platform Merge — Design Spec

**Date:** 2026-09-06
**Status:** Approved by user, pending implementation plan

## 1. Problem & Goal

RareUI currently exists as two separate applications:

- **`rareui-edge-stepper`** — a Vite + React 19 SPA. The main showcase site: hero,
  built-in component grid (Edge Stepper, AI Command Palette, Adaptive Form Flow),
  per-component detail pages, and a Figma→Code conversion tool. No backend.
- **`rareui-components`** — a Next.js 15 + React 19 app with a Supabase-backed
  database. A community/admin-curated library of Figma components that can be
  copied and pasted directly into Figma (reconstructs Figma's native clipboard
  format). Has real API routes and a service-role-key-gated admin tool for
  adding/editing/deleting library entries.

They are visually distinct (different design systems), live at different
origins (`localhost:5173` vs `localhost:3000`), and today are connected only
by an external "Library" link in the Vite app's header that opens the Next
app in a new tab.

**Goal:** one site, one URL, one nav, one codebase — merge the Vite SPA into
the Next.js app (chosen because Next.js can serve everything the Vite app
does, but not vice versa without adding a real backend), restyle the Library
section to match RareUI's existing dark-first design system, and keep the two
feature areas ("Components" and "Library") as distinct sections under a
shared nav rather than one merged data model.

## 2. Non-goals

- No change to the Supabase schema, RLS policies, or the admin
  security model (service-role key stays server-only, admin still
  password-gated).
- No merging of built-in components and library components into one
  data source or one browsable grid — they stay conceptually separate
  ("Components" vs "Library"), just under the same nav/theme.
- No GitHub repo changes (rename, new remote, push) — explicitly deferred
  by the user to a later, separate task.
- No new automated test suite — neither app has one today; verification
  stays manual/visual via the dev server, consistent with how this project
  has been built throughout.
- No deployment/hosting changes (Vercel, domains) — out of scope for this
  pass.

## 3. Target routing

All routes live in the Next.js app (`rareui-components`) going forward.

| Today | Becomes |
|---|---|
| Vite `index.html` → `App.tsx` | `/` |
| Vite `expand.html` → `expand.tsx` (Edge Stepper detail) | `/components/edge-stepper` |
| Vite `expand-command.html` → `expand-command.tsx` (Command Palette detail) | `/components/command-palette` |
| Vite `expand-form.html` → `expand-form.tsx` (Adaptive Form detail) | `/components/adaptive-form` |
| Vite `figma-to-code.html` → `figma-to-code.tsx` | `/figma-to-code` |
| Next `/` (library catalog) | `/library` |
| Next `/admin` (extraction tool) | `/library/admin` |
| Next `/api/*` | unchanged |

Nav order: `RareUI` logo · `Components` (`/`) · `Library` (`/library`) ·
`Figma to Code` (`/figma-to-code`) · `GitHub`. Current section is
visually indicated (active-link styling) — none of the nav links show
active state today, this is a small addition.

## 4. Design system unification

RareUI's dark-first theme wins; the Library section is restyled to match.

**Token porting** — replace `rareui-components/src/app/globals.css`'s
token block (light-first, monochrome `--bg`/`--bg-card`/`--accent`)
with RareUI's actual tokens from `rareui-edge-stepper/src/index.css`:
`--color-canvas/surface/field/hover/line/ink/ink-2/3/4/accent/accent-dim`,
`--radius-window/control`, `--shadow-hairline/btn`, and all `@keyframes`
(fade-up, modal-in, toast-in/out, field-in, step-in, orbit, pulse-dot,
surfer-wave, pixel-on, shimmer-text). Same `[data-theme="light"|"dark"]`
+ `prefers-color-scheme` override pattern both apps already use — dark by
default, light only when explicitly scoped (used by the per-component
preview toggle).

**Font fix (bundled in)** — neither app currently loads an actual Inter /
JetBrains Mono font file; both just reference the family name with system
fallbacks. Add real font loading via `next/font/google` (Inter +
JetBrains Mono) in the root layout, applied through the existing
`--font-sans` / `--font-mono` theme tokens.

**Library component restyle** — rewrite inline `style={{...}}` objects to
Tailwind utility classes (`bg-surface`, `text-ink-3`, `border-line`,
`rounded-control`, etc.) in all 8 of its files: `Header.tsx` (deleted,
see §5), `SearchBar.tsx`, `CategoryFilter.tsx`, `ComponentCard.tsx`,
`CopyToFigmaButton.tsx`, `ComponentSideSheet.tsx`,
`src/app/page.tsx` (catalog), `src/app/admin/page.tsx`. Visual only — no
behavior changes.

## 5. Shared layout & nav

- New single `SiteHeader` component (`src/components/SiteHeader.tsx`),
  rendered once from the root `layout.tsx`. Replaces:
  - Vite's nav markup, currently hand-duplicated three times across
    `App.tsx`, `figma-to-code.tsx`, and `ComponentDetailPage.tsx`.
  - The Library app's own `Header.tsx` (deleted; its catalog `page.tsx`
    stops importing/rendering it directly).
- `/library/admin` keeps its own contextual sub-bar ("← Back to catalog ·
  Admin — Extract Components") beneath the shared nav, restyled to match —
  same pattern as the Components section's detail-page breadcrumbs
  ("Components / Navigation & Discovery").
- Favicon/icons: move `rareui-edge-stepper/public/favicon.svg` and
  `icons.svg` into `rareui-components/public/` (currently empty except a
  `thumbnails/` folder from Supabase uploads — no conflict).
- Metadata title/description updated from "RareUI — Figma Component
  Library" to reflect the whole site, e.g. "RareUI — UI Components &
  Figma Library".
- `Toaster` (sonner) stays mounted globally in the root layout — only the
  Library section's admin/copy actions use it; Components pages use inline
  state swaps instead, no conflict.

## 6. Porting the Components section

Full file inventory to port from `rareui-edge-stepper/src/` into
`rareui-components/src/`, unchanged in logic (adjust import paths and
mark client-only files `"use client"` where they use hooks/browser APIs):

- `components/ui/` — `ActionButton`, `AiIcon`, `CategorySection`,
  `CheckIcon`, `CloseIcon`, `CodeIcon`, `CodeModal`, `ComponentDetailPage`,
  `CopyIcon`, `CopyToast`, `InfoIcon`, `PrimitiveShowcase`,
  `PromptModal`, `index.ts`. **Not ported:** `ExpandIcon.tsx` — confirmed
  dead code (exported from the barrel file, never actually imported
  anywhere else in the app; `CodeModal` looked similarly suspicious but
  is genuinely rendered inside `PrimitiveShowcase.tsx`, so it's kept).
- `components/edge-stepper/` — `DotsLoader`, `EdgeStepper`, `LoadingState`,
  `OrbitLoader`, `OutlineItem`, `OutlinePanel`, `PixelGrid`, `ShimmerText`,
  `SurferLoader`, `TickRail`, `VariantSwitcher`, `useEdgeStepper`, `index.ts`
- `components/command-palette/` — `CommandGroup`, `CommandPalette`,
  `CommandRow`, `useCommandPalette`, `index.ts`
- `components/adaptive-form/` — `AdaptiveFormFlow`, `FormField`,
  `StepIndicator`, `useAdaptiveForm`, `index.ts`
- `data/` — `commandItems.ts`, `contentBlocks.ts`, `formSteps.ts`,
  `outlineItems.ts`
- `hooks/` — `useElapsedTime.ts`, `useLazyComponent.ts`
- `utils/` — `domToFigmaSvg.ts`, `svgToCode.ts`
- `lib/cn.ts` (the Library app's `lib/` already has `clipboard.ts`,
  `supabase.ts`, `types.ts` — `cn.ts` is additive, no collision)

**Source-code embedding (the one real mechanism change):** Vite's
`?raw` import trick (`import source from "./EdgeStepper.tsx?raw"`) has
no Next.js/webpack equivalent. Instead, each detail page
(`app/components/edge-stepper/page.tsx`, etc.) is a **Server Component**
that reads its own source files off disk with `fs.readFileSync` at
build time, passing the code as string props into the ported
`ComponentDetailPage` client component (logic unchanged). Because the
files are known at build time, these pages statically render — a small
perf win over the Vite version, not just a workaround.

The `?url` import (used for the "View file ↗" link to the foundation
CSS) is replaced by a route handler, `app/theme.css/route.ts`, which
reads the real `globals.css` and serves it as `text/css` — one source
of truth, no duplicated token file.

The homepage (`app/page.tsx` today = Library catalog) is replaced by
the ported `App.tsx` content (RareUI hero + built-in component grid);
the Library catalog moves to `app/library/page.tsx`.

**Concrete link fixes required during the port** — `App.tsx` hardcodes
each component card's `expandUrl` prop to the old multi-page Vite paths
(`"/expand.html"`, `"/expand-command.html"`, `"/expand-form.html"`);
these must be updated to `"/components/edge-stepper"`,
`"/components/command-palette"`, `"/components/adaptive-form"`
respectively as part of the port, not left as a follow-up.

## 7. Environment & secrets

No changes. `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_PASSWORD`,
`SUPABASE_SERVICE_ROLE_KEY`) is untouched — the Components section is
fully static and needs none of it. The security model (service-role
key server-only, admin password-gated writes) is unchanged.

## 8. Cleanup (deferred until merge is verified)

- `rareui-edge-stepper/` becomes dead weight once the merge is confirmed
  working — left in place untouched for now, safe to delete later.
- `rareui-edge-stepper/src/lib/libraryUrl.ts` (the external-link helper
  added for the now-obsolete external "Library" tab) gets deleted as
  part of this work, since Library becomes a normal internal route.
- GitHub repo (`MUZEEBURRAHAMAN/rareui`, currently tracking
  `rareui-edge-stepper`) is explicitly left untouched — no rename, no
  new remote, no push. Follow-up task, not part of this one.

## 9. Verification approach

Neither app has an automated test suite. Verification is manual via
the dev server (`npm run dev` in `rareui-components/`) at each
implementation phase:

1. Shared theme/layout renders correctly standalone (nav, favicon,
   dark/light toggle mechanism intact) before any page content is ported.
2. Each Components-section page renders and matches current Vite
   behavior: hero, component grid, detail pages (Preview light/dark
   toggle, Install copy, Code tabs with syntax highlighting, Figma/AI
   export buttons), Figma-to-Code tool (paste → framework switch → code
   output).
3. Library section still works end-to-end after restyle: search/filter,
   Copy-to-Figma (verify clipboard payload still pastes into Figma),
   side sheet, admin extraction/save/delete (password gate intact).
4. Full nav sweep — every link reachable, active-state highlighting
   correct, no broken internal links from the old multi-page Vite
   structure.

## 10. Risks / open items

- Rewriting 8 Library files from inline styles to Tailwind classes is
  the largest single chunk of "new" work (not a straight port) — most
  likely place for visual regressions, gets its own verification pass.
- `fs.readFileSync` in Server Components will fail loudly at build time
  if a path is wrong — acceptable fail-fast behavior, no runtime error
  handling needed since it's not user-triggered.

# Unified Platform Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the `rareui-edge-stepper` Vite SPA into the `rareui-components` Next.js app so RareUI is one site, one nav, one codebase, with the Library section restyled to match RareUI's existing dark-first design system.

**Architecture:** Next.js App Router, one route per current Vite page/Next page (see routing table in spec §3). Shared theme tokens and a single `SiteHeader` live in the root layout. Component source code for the "Code" tab is read from disk in Server Components (`fs.readFileSync` at build time) instead of Vite's `?raw` import trick — everything ported is a straight, unchanged copy of working code except for that one mechanism swap.

**Tech Stack:** Next.js 15 (App Router), React 19, Tailwind CSS v4 (CSS-first `@theme`), TypeScript, Supabase (Library section only, untouched).

**Spec:** `/Users/admin/All Project/RareUi/rareui-components/docs/superpowers/specs/2026-09-06-unified-platform-merge-design.md`

## Global Constraints

- Source app: `/Users/admin/All Project/RareUi/rareui-edge-stepper/src/`. Destination app: `/Users/admin/All Project/RareUi/rareui-components/src/`. All paths below are relative to these roots unless stated otherwise.
- Both projects use the identical `@/*` → `./src/*` TypeScript path alias — **no import path rewriting is needed anywhere**, confirmed by grep across every source file. Only two changes are ever needed on a ported file: (1) add a `"use client";` directive as line 1 if the file uses React hooks or browser-only APIs, (2) nothing else, unless a task explicitly says otherwise (e.g. the `expandUrl`/`foundationHref` link fixes in Task 12).
- No changes to `.env.local`, Supabase schema, RLS policies, or the admin password gate (spec §7).
- No GitHub repo changes of any kind — do not `git init`, do not touch remotes (spec §8).
- No automated test suite exists or is being added. "Test" steps below are concrete manual dev-server checks: exact URL, exact action, exact expected result — never a vague "verify it works."
- RareUI's dark-first theme wins everywhere (spec §4) — canvas/surface/field/hover/line/ink/accent tokens, `[data-theme]` scoping pattern.
- Every `npm run dev` check runs from `/Users/admin/All Project/RareUi/rareui-components/` on port 3000 unless stated otherwise.

---

## Task 1: Port theme tokens and add real font loading

**Files:**
- Modify: `rareui-components/src/app/globals.css`
- Modify: `rareui-components/src/app/layout.tsx`
- Test: manual, via dev server

**Interfaces:**
- Produces: CSS custom properties `--color-canvas`, `--color-surface`, `--color-field`, `--color-hover`, `--color-line`, `--color-ink`, `--color-ink-2/3/4`, `--color-accent`, `--color-accent-dim`, `--radius-window`, `--radius-control`, `--shadow-hairline`, `--shadow-btn`, `--font-sans`, `--font-mono` — every later task's Tailwind classes (`bg-canvas`, `text-ink-3`, `rounded-control`, etc.) depend on these existing.

- [ ] **Step 1: Replace the token block in `globals.css`**

Replace the entire contents of `rareui-components/src/app/globals.css` with:

```css
@import "tailwindcss";

/* ─── Custom theme tokens ─── */
@theme {
  --color-canvas: #ffffff;
  --color-surface: #f9f9fb;
  --color-field: #f1f1f5;
  --color-hover: #ebebf0;
  --color-line: #e4e4ea;
  --color-ink: #1a1a2e;
  --color-ink-2: #5a5a72;
  --color-ink-3: #8a8aa0;
  --color-ink-4: #b0b0c0;
  --color-accent: #7c5cfc;
  --color-accent-dim: rgba(124, 92, 252, 0.08);

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-window: 12px;
  --radius-control: 6px;

  --shadow-hairline: 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-btn: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* ─── Dark mode tokens ─── */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-canvas: #0e0e12;
    --color-surface: #18181e;
    --color-field: #1e1e26;
    --color-hover: #26262f;
    --color-line: #2a2a36;
    --color-ink: #e4e3eb;
    --color-ink-2: #a8a8be;
    --color-ink-3: #6b6b82;
    --color-ink-4: #4a4a5e;
    --color-accent: #8b7bf7;
    --color-accent-dim: rgba(139, 123, 247, 0.12);

    --shadow-hairline: 0 0 0 1px rgba(255, 255, 255, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-btn: 0 0 0 1px rgba(255, 255, 255, 0.08),
      0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

[data-theme="dark"] {
  --color-canvas: #0e0e12;
  --color-surface: #18181e;
  --color-field: #1e1e26;
  --color-hover: #26262f;
  --color-line: #2a2a36;
  --color-ink: #e4e3eb;
  --color-ink-2: #a8a8be;
  --color-ink-3: #6b6b82;
  --color-ink-4: #4a4a5e;
  --color-accent: #8b7bf7;
  --color-accent-dim: rgba(139, 123, 247, 0.12);

  --shadow-hairline: 0 0 0 1px rgba(255, 255, 255, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-btn: 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Scoped light theme — lets a container override dark-mode for preview */
[data-theme="light"] {
  --color-canvas: #ffffff;
  --color-surface: #f9f9fb;
  --color-field: #f1f1f5;
  --color-hover: #ebebf0;
  --color-line: #e4e4ea;
  --color-ink: #1a1a2e;
  --color-ink-2: #5a5a72;
  --color-ink-3: #8a8aa0;
  --color-ink-4: #b0b0c0;
  --color-accent: #7c5cfc;
  --color-accent-dim: rgba(124, 92, 252, 0.08);

  --shadow-hairline: 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-btn: 0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.06);
}

/* ─── Keyframes ─── */
@keyframes pixel-on {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 1; }
}

@keyframes shimmer-text {
  0% { background-position: 200% 50%; }
  100% { background-position: -200% 50%; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toast-in {
  from { opacity: 0; transform: translate(-50%, 12px) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, 0) scale(1); }
}

@keyframes toast-out {
  from { opacity: 1; transform: translate(-50%, 0) scale(1); }
  to { opacity: 0; transform: translate(-50%, 8px) scale(0.95); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes field-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes step-in {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes orbit {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}

@keyframes surfer-wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

/* ─── Base ─── */
body {
  background: var(--color-canvas);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  margin: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ─── Adaptive form animations ─── */
.animate-field-in {
  animation: field-in 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

.animate-step-in {
  animation: step-in 350ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

/* ─── Toaster overrides ─────────────────────────────────── */
[data-sonner-toaster] {
  font-family: inherit !important;
}
```

Note: the old `#root` selector from the Vite file is dropped (Next has no `#root` div); everything else is carried over verbatim.

- [ ] **Step 2: Add real Inter + JetBrains Mono font loading in `layout.tsx`**

Replace the full contents of `rareui-components/src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RareUI — UI Components & Figma Library",
  description:
    "Copy-paste UI components for React, plus a community Figma library you can paste straight into Figma.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-line)",
            },
          }}
        />
      </body>
    </html>
  );
}
```

`next/font/google` sets `--font-sans`/`--font-mono` as CSS variables scoped to the `<html>` element via `.variable`; since `globals.css`'s `@theme` block already defines `--font-sans`/`--font-mono` as fallbacks, the font loader's values take precedence once applied to `<html>`, giving real font files instead of the previous unloaded-family fallback. `SiteHeader` (Task 2) is intentionally not added here yet — this task only proves the token/font foundation renders.

- [ ] **Step 3: Verify via dev server**

Run: `cd "/Users/admin/All Project/RareUi/rareui-components" && npm run dev`
Open: `http://localhost:3000` in a browser
Expected: the existing Library catalog page (unchanged content, still at `/` for now — Task 12 moves it) renders in dark background (`#0e0e12`) instead of its previous light background, using a serif-free Inter-like font. No console errors. No CSS/PostCSS build errors in the terminal.

- [ ] **Step 4: Commit**

```bash
cd "/Users/admin/All Project/RareUi/rareui-components"
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: port RareUI theme tokens and add real font loading

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Build shared SiteHeader and wire it into the root layout

**Files:**
- Create: `rareui-components/src/components/SiteHeader.tsx`
- Modify: `rareui-components/src/app/layout.tsx`
- Modify: `rareui-components/src/app/page.tsx` (remove its own `<Header />` usage)
- Test: manual, via dev server

**Interfaces:**
- Consumes: theme tokens from Task 1 (`bg-canvas`, `text-ink`, `text-accent`, `border-line`, etc.)
- Produces: `SiteHeader` component (no props), rendered once from the root layout — every later page task assumes this is already present and does NOT render its own nav.

- [ ] **Step 1: Create `SiteHeader.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Components" },
  { href: "/library", label: "Library" },
  { href: "/figma-to-code", label: "Figma to Code" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4 sm:px-8">
      <a
        href="/"
        className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink transition-opacity hover:opacity-80"
      >
        Rare<span className="text-accent">UI</span>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-4">
          Beta
        </span>
      </a>
      <div className="flex items-center gap-3">
        {NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <a
              key={link.href}
              href={link.href}
              className={
                active
                  ? "rounded-full border border-accent/30 bg-accent-dim px-3 py-1.5 text-[12px] font-medium text-accent"
                  : "text-[12px] font-medium text-ink-3 transition-colors hover:text-ink"
              }
            >
              {link.label}
            </a>
          );
        })}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-hover hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </nav>
  );
}
```

Active-link detection: `/` only matches exactly (so it doesn't stay highlighted on `/components/edge-stepper` etc. — those pages show no top-level nav item active, which is correct since they're sub-pages of the Components section reached via card clicks, not the nav itself); `/library` and `/figma-to-code` match themselves or any sub-path (so `/library/admin` still highlights "Library").

- [ ] **Step 2: Render `SiteHeader` from the root layout**

In `rareui-components/src/app/layout.tsx`, add the import and render it as the first child of `<body>`, before `{children}`:

```tsx
import { SiteHeader } from "@/components/SiteHeader";
```

```tsx
      <body>
        <SiteHeader />
        {children}
        <Toaster
```

- [ ] **Step 3: Remove the Library catalog's own `<Header />` usage**

In `rareui-components/src/app/page.tsx`, remove the `import { Header } from "@/components/Header";` line and remove the `<Header />` element from the JSX (it currently renders as the first child inside the page's root `<div>`). Leave everything else in the file unchanged for now — Task 15 restyles it.

- [ ] **Step 4: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000`
Expected: one nav bar at the top (RareUI logo, Components/Library/Figma to Code links, GitHub button), no duplicate header. "Components" shows the active-pill style (accent border/background) since `/` matches it. Clicking "Library" or "Figma to Code" navigates to a 404 for now (their routes don't exist yet — expected until Tasks 12–13) but the nav itself renders with no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/SiteHeader.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add shared SiteHeader with active-link nav

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Move favicon/icons and confirm site metadata

**Files:**
- Create: `rareui-components/public/favicon.svg` (copied from Vite app)
- Create: `rareui-components/public/icons.svg` (copied from Vite app)
- Test: manual, via dev server

**Interfaces:**
- Consumes: nothing new
- Produces: nothing consumed by later tasks — purely an asset move

- [ ] **Step 1: Copy the favicon and icon assets**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/public/favicon.svg" \
   "/Users/admin/All Project/RareUi/rareui-components/public/favicon.svg"
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/public/icons.svg" \
   "/Users/admin/All Project/RareUi/rareui-components/public/icons.svg"
```

Next.js automatically serves any `favicon.svg` file placed directly in `public/` as the site favicon — no additional wiring needed in `layout.tsx` or `metadata`.

- [ ] **Step 2: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000`
Expected: browser tab shows the RareUI favicon (not the default Next.js icon or a blank tab icon). Page `<title>` reads "RareUI — UI Components & Figma Library" (set in Task 1, confirm it stuck).

- [ ] **Step 3: Commit**

```bash
git add public/favicon.svg public/icons.svg
git commit -m "feat: add RareUI favicon and icon assets

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Port presentational leaf components and cn utility

**Files:**
- Create: `rareui-components/src/lib/cn.ts`
- Create: `rareui-components/src/components/ui/ActionButton.tsx`
- Create: `rareui-components/src/components/ui/AiIcon.tsx`
- Create: `rareui-components/src/components/ui/CategorySection.tsx`
- Create: `rareui-components/src/components/ui/CheckIcon.tsx`
- Create: `rareui-components/src/components/ui/CloseIcon.tsx`
- Create: `rareui-components/src/components/ui/CodeIcon.tsx`
- Create: `rareui-components/src/components/ui/CopyIcon.tsx`
- Create: `rareui-components/src/components/ui/CopyToast.tsx`
- Create: `rareui-components/src/components/ui/InfoIcon.tsx`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Produces: `cn()` from `@/lib/cn` (className merge helper, used by edge-stepper/command-palette/adaptive-form components in Tasks 9–11); `ActionButton`, `AiIcon`, `CheckIcon`, `CloseIcon`, `CodeIcon`, `CopyIcon`, `InfoIcon`, `CategorySection`, `CopyToast` — all consumed by `PrimitiveShowcase` (Task 8) and `ComponentDetailPage`/`CodeModal`/`PromptModal` (Tasks 5–7).

- [ ] **Step 1: Copy `lib/cn.ts` verbatim**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/lib/cn.ts" \
   "/Users/admin/All Project/RareUi/rareui-components/src/lib/cn.ts"
```

No changes needed (pure function, no hooks, no Vite-specific imports — confirmed by grep in the spec's research phase). Note: `rareui-components/src/lib/` already has `clipboard.ts`, `supabase.ts`, `types.ts` — this is additive, no filename collision.

- [ ] **Step 2: Copy the 9 presentational `components/ui/` files verbatim, no `"use client"` needed**

```bash
cd "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui"
DEST="/Users/admin/All Project/RareUi/rareui-components/src/components/ui"
mkdir -p "$DEST"
for f in AiIcon.tsx CategorySection.tsx CheckIcon.tsx CloseIcon.tsx CodeIcon.tsx CopyIcon.tsx InfoIcon.tsx; do
  cp "$f" "$DEST/$f"
done
```

These 7 files use no React hooks and no browser-only APIs (confirmed by grep) — they're pure presentational SVG/markup and don't need a `"use client"` directive; Next.js bundles them into whichever client tree imports them.

- [ ] **Step 3: Copy `ActionButton.tsx` and `CopyToast.tsx`, add `"use client"`**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/ActionButton.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/ActionButton.tsx"
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/CopyToast.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/CopyToast.tsx"
```

Both use `useState`/`useCallback` — add `"use client";` as line 1 of each copied file (with a blank line after it, before the existing `import` line).

- [ ] **Step 4: Verify with typecheck**

Run: `cd "/Users/admin/All Project/RareUi/rareui-components" && npx tsc --noEmit`
Expected: no new errors related to any of the 9 files just added (pre-existing unrelated errors, if any, are out of scope for this task — there should be none, since this project typechecked clean before this session started).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cn.ts src/components/ui/ActionButton.tsx src/components/ui/AiIcon.tsx src/components/ui/CategorySection.tsx src/components/ui/CheckIcon.tsx src/components/ui/CloseIcon.tsx src/components/ui/CodeIcon.tsx src/components/ui/CopyIcon.tsx src/components/ui/CopyToast.tsx src/components/ui/InfoIcon.tsx
git commit -m "feat: port presentational leaf UI components and cn utility

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Port CodeModal and PromptModal

**Files:**
- Create: `rareui-components/src/components/ui/CodeModal.tsx`
- Create: `rareui-components/src/components/ui/PromptModal.tsx`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `CloseIcon`, `CheckIcon` (Task 4)
- Produces: `CodeModal`, `PromptModal` — consumed by `PrimitiveShowcase` (Task 8) and `ComponentDetailPage` (Task 7)

- [ ] **Step 1: Copy both files, add `"use client"`**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/CodeModal.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/CodeModal.tsx"
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/PromptModal.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/PromptModal.tsx"
```

Both use `useState`/`useEffect`/`useRef`/`createPortal` — add `"use client";` as line 1 of each (blank line, then the existing imports). No other changes: both gate their `createPortal(..., document.body)` call behind `if (!open) return null;` with `open` defaulting to a closed state wherever they're used, so `document` is never touched during Next's server-side render pass of these client components.

- [ ] **Step 2: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CodeModal.tsx src/components/ui/PromptModal.tsx
git commit -m "feat: port CodeModal and PromptModal

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Port shared utils, hooks, and data files

**Files:**
- Create: `rareui-components/src/utils/domToFigmaSvg.ts`
- Create: `rareui-components/src/utils/svgToCode.ts`
- Create: `rareui-components/src/hooks/useElapsedTime.ts`
- Create: `rareui-components/src/hooks/useLazyComponent.ts`
- Create: `rareui-components/src/data/commandItems.ts`
- Create: `rareui-components/src/data/contentBlocks.ts`
- Create: `rareui-components/src/data/formSteps.ts`
- Create: `rareui-components/src/data/outlineItems.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Produces: `domToFigmaSvg()` (used by `ComponentDetailPage`, Task 7), `convertSvgToCode()`/`extractHtmlFromClipboard()` (used by the Figma-to-Code page, Task 13), `useElapsedTime`/`useLazyComponent` hooks (used by edge-stepper loaders and `PrimitiveShowcase`), and the 4 sample-data modules (used by the three detail pages, Task 9–11, and the homepage, Task 12)

- [ ] **Step 1: Copy all 8 files verbatim**

```bash
SRC="/Users/admin/All Project/RareUi/rareui-edge-stepper/src"
DEST="/Users/admin/All Project/RareUi/rareui-components/src"
mkdir -p "$DEST/utils" "$DEST/hooks" "$DEST/data"
cp "$SRC/utils/domToFigmaSvg.ts" "$DEST/utils/domToFigmaSvg.ts"
cp "$SRC/utils/svgToCode.ts" "$DEST/utils/svgToCode.ts"
cp "$SRC/hooks/useElapsedTime.ts" "$DEST/hooks/useElapsedTime.ts"
cp "$SRC/hooks/useLazyComponent.ts" "$DEST/hooks/useLazyComponent.ts"
cp "$SRC/data/commandItems.ts" "$DEST/data/commandItems.ts"
cp "$SRC/data/contentBlocks.ts" "$DEST/data/contentBlocks.ts"
cp "$SRC/data/formSteps.ts" "$DEST/data/formSteps.ts"
cp "$SRC/data/outlineItems.ts" "$DEST/data/outlineItems.ts"
```

No `"use client"` directives needed on any of these — they're plain TypeScript modules (functions, hooks, data), not React components. A file that only exports a hook doesn't itself require the directive; the requirement applies to component files that render JSX or call the hook at the top of a Client Component tree, which happens where they're *consumed* (Tasks 4, 5, 7, 9–11 already account for this).

- [ ] **Step 2: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils src/hooks src/data
git commit -m "feat: port shared utils, hooks, and sample data

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: Port ComponentDetailPage and add the theme.css route handler

**Files:**
- Create: `rareui-components/src/components/ui/ComponentDetailPage.tsx`
- Create: `rareui-components/src/app/theme.css/route.ts`
- Modify: `rareui-components/src/components/ui/ComponentDetailPage.tsx` (remove its own `<nav>`, see Step 2)
- Test: manual, via dev server (once wired into a page in Task 9)

**Interfaces:**
- Consumes: `AiIcon`, `PromptModal` (Task 4/5), `domToFigmaSvg` (Task 6)
- Produces: `ComponentDetailPage` component, `props: { title, description, category, categoryGroup, installCommand?, files: {name, code}[], foundationFile?, foundationHref?, children }` — consumed by Tasks 9, 10, 11 (the three detail pages)

- [ ] **Step 1: Copy the file, add `"use client"`**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/ComponentDetailPage.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/ComponentDetailPage.tsx"
```

Add `"use client";` as line 1 (blank line, then the existing imports) — it uses `useState`/`useEffect`/`useRef`/`useCallback`.

- [ ] **Step 2: Remove the component's own top nav (now provided by the shared `SiteHeader`)**

In the copied `ComponentDetailPage.tsx`, delete the entire `<nav className="flex items-center justify-between px-5 py-4 sm:px-8">...</nav>` block — this is the section that renders "RareUI · Beta" and the GitHub link (roughly the JSX right after the opening `<div className="mx-auto min-h-svh max-w-4xl pb-16">`, before the `{/* ── Breadcrumb ── */}` comment). Keep the breadcrumb div immediately after it ("Components / {categoryGroup}") — that's page-specific context, not site nav, and its `<a href="/">Components</a>` link is still correct since `/` remains the Components homepage.

- [ ] **Step 3: Create the theme.css route handler**

```ts
// rareui-components/src/app/theme.css/route.ts
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export function GET() {
  const css = readFileSync(
    join(process.cwd(), "src/app/globals.css"),
    "utf-8"
  );
  return new NextResponse(css, {
    headers: { "Content-Type": "text/css; charset=utf-8" },
  });
}
```

This serves the real, live `globals.css` (the one Task 1 wrote) as raw text at `GET /theme.css` — the same file the app actually uses, so there's no duplicated token source. This replaces Vite's `?url` import that previously powered the "View file ↗" link on each detail page's Foundation note.

- [ ] **Step 4: Verify with typecheck (full render verified in Task 9)**

Run: `npx tsc --noEmit`
Expected: no new errors. (The route handler can also be spot-checked once the dev server is running: `curl http://localhost:3000/theme.css` should print the CSS file's contents with a `content-type: text/css` header.)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ComponentDetailPage.tsx "src/app/theme.css"
git commit -m "feat: port ComponentDetailPage and add theme.css route handler

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 8: Port PrimitiveShowcase and finalize the ui/ barrel export

**Files:**
- Create: `rareui-components/src/components/ui/PrimitiveShowcase.tsx`
- Create: `rareui-components/src/components/ui/index.ts`
- Test: `npx tsc --noEmit`

**Interfaces:**
- Consumes: `ActionButton`, `AiIcon`, `CodeIcon`, `CodeModal`, `PromptModal` (Tasks 4–5), `useLazyComponent` (Task 6)
- Produces: `PrimitiveShowcase` component, `props: { title, description, children, category?, staggerDelay?, minHeight?, code?, filePath?, codeNote?, installCommand?, foundationFile?, foundationHref?, extraFiles?, expandUrl? }` — consumed by the homepage (Task 12). `index.ts` barrel exports both `PrimitiveShowcase` and `ComponentDetailPage`.

- [ ] **Step 1: Copy `PrimitiveShowcase.tsx`, add `"use client"`**

```bash
cp "/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/ui/PrimitiveShowcase.tsx" \
   "/Users/admin/All Project/RareUi/rareui-components/src/components/ui/PrimitiveShowcase.tsx"
```

Add `"use client";` as line 1 — it uses `useState`/`useCallback`. No other changes.

- [ ] **Step 2: Write the barrel export**

```ts
// rareui-components/src/components/ui/index.ts
export { PrimitiveShowcase } from "./PrimitiveShowcase";
export { CategorySection } from "./CategorySection";
export { ActionButton } from "./ActionButton";
export { CopyIcon } from "./CopyIcon";
export { CodeIcon } from "./CodeIcon";
export { CodeModal } from "./CodeModal";
export { CloseIcon } from "./CloseIcon";
export { InfoIcon } from "./InfoIcon";
export { CopyToast } from "./CopyToast";
export { CheckIcon } from "./CheckIcon";
export { AiIcon } from "./AiIcon";
export { PromptModal } from "./PromptModal";
export { ComponentDetailPage } from "./ComponentDetailPage";
```

Identical to the Vite app's barrel, minus the `ExpandIcon` export — confirmed dead code (exported but never imported anywhere in the app), not ported per spec §6.

- [ ] **Step 3: Verify with typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PrimitiveShowcase.tsx src/components/ui/index.ts
git commit -m "feat: port PrimitiveShowcase and finalize ui/ barrel export

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 9: Port Edge Stepper and build its detail page

**Files:**
- Create: `rareui-components/src/components/edge-stepper/DotsLoader.tsx`
- Create: `rareui-components/src/components/edge-stepper/EdgeStepper.tsx`
- Create: `rareui-components/src/components/edge-stepper/LoadingState.tsx`
- Create: `rareui-components/src/components/edge-stepper/OrbitLoader.tsx`
- Create: `rareui-components/src/components/edge-stepper/OutlineItem.tsx`
- Create: `rareui-components/src/components/edge-stepper/OutlinePanel.tsx`
- Create: `rareui-components/src/components/edge-stepper/PixelGrid.tsx`
- Create: `rareui-components/src/components/edge-stepper/ShimmerText.tsx`
- Create: `rareui-components/src/components/edge-stepper/SurferLoader.tsx`
- Create: `rareui-components/src/components/edge-stepper/TickRail.tsx`
- Create: `rareui-components/src/components/edge-stepper/VariantSwitcher.tsx`
- Create: `rareui-components/src/components/edge-stepper/useEdgeStepper.ts`
- Create: `rareui-components/src/components/edge-stepper/index.ts`
- Create: `rareui-components/src/app/components/edge-stepper/page.tsx`
- Test: manual, via dev server

**Interfaces:**
- Consumes: `cn` (Task 4), `useElapsedTime` (Task 6), `ComponentDetailPage` (Task 7), `sampleOutline`/`contentBlocks` data (Task 6)
- Produces: `EdgeStepper` component rendered at `/components/edge-stepper`; the `EdgeStepperDemo` Client Component (Step 3) is also reused directly by Task 12's homepage

- [ ] **Step 1: Copy the 11 component files + hook + barrel verbatim, adding `"use client"` where needed**

```bash
SRC="/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/edge-stepper"
DEST="/Users/admin/All Project/RareUi/rareui-components/src/components/edge-stepper"
mkdir -p "$DEST"
cp "$SRC"/*.tsx "$SRC"/*.ts "$DEST/"
```

Add `"use client";` as line 1 to these 6 files (they use hooks — confirmed by grep): `EdgeStepper.tsx`, `LoadingState.tsx`, `OutlineItem.tsx`, `OutlinePanel.tsx`, `VariantSwitcher.tsx`, `useEdgeStepper.ts`. Leave these 5 unchanged (pure presentational, no hooks): `DotsLoader.tsx`, `OrbitLoader.tsx`, `PixelGrid.tsx`, `ShimmerText.tsx`, `SurferLoader.tsx`. `index.ts` needs no directive (re-export only).

- [ ] **Step 2: Create the detail page as a Server Component reading its own source**

```tsx
// rareui-components/src/app/components/edge-stepper/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { EdgeStepperDemo } from "./EdgeStepperDemo";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/edge-stepper", relativePath),
    "utf-8"
  );
}

export default function EdgeStepperPage() {
  const files = [
    { name: "EdgeStepper.tsx", code: readSource("EdgeStepper.tsx") },
    { name: "useEdgeStepper.ts", code: readSource("useEdgeStepper.ts") },
    { name: "TickRail.tsx", code: readSource("TickRail.tsx") },
    { name: "OutlinePanel.tsx", code: readSource("OutlinePanel.tsx") },
    { name: "OutlineItem.tsx", code: readSource("OutlineItem.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="Edge Stepper"
      description="A hover-reveal conversation outline with hierarchical navigation. Dock it to the edge of any scrollable content to give readers an always-available table of contents."
      category="Navigation"
      categoryGroup="Navigation & Discovery"
      installCommand="npx rareui add edge-stepper"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <EdgeStepperDemo />
    </ComponentDetailPage>
  );
}
```

- [ ] **Step 3: Create the client-side demo wrapper (the scroll-nav logic needs a Client Component boundary)**

```tsx
// rareui-components/src/app/components/edge-stepper/EdgeStepperDemo.tsx
"use client";

import { useCallback, useRef } from "react";
import { EdgeStepper } from "@/components/edge-stepper";
import { sampleOutline } from "@/data/outlineItems";
import { contentBlocks } from "@/data/contentBlocks";

export function EdgeStepperDemo() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNavigate = useCallback((id: string) => {
    const el = scrollRef.current?.querySelector(`[data-section-id="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
      <EdgeStepper items={sampleOutline} onNavigate={handleNavigate}>
        <div className="px-6 py-8 sm:px-10">
          {contentBlocks.map((block) => (
            <article
              key={block.id}
              data-section-id={block.id}
              className="mb-6 last:mb-0"
              style={{ paddingLeft: block.depth * 16 }}
            >
              <h3
                className={
                  block.depth === 0
                    ? "mb-1.5 text-[14px] font-semibold text-ink"
                    : block.depth === 1
                      ? "mb-1 text-[13px] font-medium text-ink-2"
                      : "mb-1 text-[12.5px] font-medium text-ink-3"
                }
              >
                {block.heading}
              </h3>
              <p
                className={
                  block.depth === 0
                    ? "text-[13px] leading-relaxed text-ink-3"
                    : "text-[12.5px] leading-relaxed text-ink-4"
                }
              >
                {block.body}
              </p>
            </article>
          ))}
        </div>
      </EdgeStepper>
    </div>
  );
}
```

This mirrors exactly what the Vite `expand.tsx` entry point did inline — split out here because a Next.js `page.tsx` that's a Server Component (needed for `fs.readFileSync`) can't itself use `useRef`/`useCallback`, so the interactive scroll-nav piece moves into its own small Client Component, imported and rendered as `children` from the server page.

- [ ] **Step 4: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/components/edge-stepper`
Expected: page renders with the shared `SiteHeader` at top (no duplicate nav), breadcrumb "Components / Navigation & Discovery", the Edge Stepper demo interactive and hoverable on the right edge, Install command showing `npx rareui add edge-stepper` with working Copy button, Code tab showing 5 file tabs (EdgeStepper.tsx active by default) with syntax-highlighted source, Light/Dark preview toggle working, "Figma" and AI-prompt buttons in the Preview toolbar functional (clicking Figma shows "Copying…" → "Copied!"), Foundation note's "View file ↗" link opens `/theme.css` and shows real CSS text. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/edge-stepper "src/app/components/edge-stepper"
git commit -m "feat: port Edge Stepper and its detail page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 10: Port Command Palette and build its detail page

**Files:**
- Create: `rareui-components/src/components/command-palette/CommandGroup.tsx`
- Create: `rareui-components/src/components/command-palette/CommandPalette.tsx`
- Create: `rareui-components/src/components/command-palette/CommandRow.tsx`
- Create: `rareui-components/src/components/command-palette/useCommandPalette.ts`
- Create: `rareui-components/src/components/command-palette/index.ts`
- Create: `rareui-components/src/app/components/command-palette/page.tsx`
- Test: manual, via dev server

**Interfaces:**
- Consumes: `cn` (Task 4), `ComponentDetailPage` (Task 7), `sampleCommands` data (Task 6)
- Produces: `CommandPalette` component rendered at `/components/command-palette`

- [ ] **Step 1: Copy the 4 component files + barrel verbatim, adding `"use client"` where needed**

```bash
SRC="/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/command-palette"
DEST="/Users/admin/All Project/RareUi/rareui-components/src/components/command-palette"
mkdir -p "$DEST"
cp "$SRC"/*.tsx "$SRC"/*.ts "$DEST/"
```

Add `"use client";` as line 1 to `CommandPalette.tsx`, `CommandRow.tsx`, `useCommandPalette.ts` (use hooks, confirmed by grep). Leave `CommandGroup.tsx` unchanged (no hooks). `index.ts` needs no directive.

- [ ] **Step 2: Create the detail page**

```tsx
// rareui-components/src/app/components/command-palette/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { CommandPalette } from "@/components/command-palette";
import { sampleCommands } from "@/data/commandItems";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/command-palette", relativePath),
    "utf-8"
  );
}

export default function CommandPalettePage() {
  const files = [
    { name: "CommandPalette.tsx", code: readSource("CommandPalette.tsx") },
    {
      name: "useCommandPalette.ts",
      code: readSource("useCommandPalette.ts"),
    },
    { name: "CommandGroup.tsx", code: readSource("CommandGroup.tsx") },
    { name: "CommandRow.tsx", code: readSource("CommandRow.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="AI Command Palette"
      description="One command center for everything."
      category="AI"
      categoryGroup="Navigation & Discovery"
      installCommand="npx rareui add command-palette"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <CommandPalette
          commands={sampleCommands}
          onSelect={(cmd) => console.log("Selected:", cmd.label)}
          embedded
        />
      </div>
    </ComponentDetailPage>
  );
}
```

This page's demo content has no interactive scroll logic like Edge Stepper's did, so no separate Client Component wrapper is needed — `CommandPalette` itself is already `"use client"` from Step 1, and a Server Component can render a Client Component directly as a child.

- [ ] **Step 3: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/components/command-palette`
Expected: shared nav at top, breadcrumb "Components / Navigation & Discovery", Command Palette demo centered and interactive (typing filters commands), Install/Code/Figma/AI-prompt sections all working same as Task 9's checks. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/command-palette "src/app/components/command-palette"
git commit -m "feat: port Command Palette and its detail page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 11: Port Adaptive Form Flow and build its detail page

**Files:**
- Create: `rareui-components/src/components/adaptive-form/AdaptiveFormFlow.tsx`
- Create: `rareui-components/src/components/adaptive-form/FormField.tsx`
- Create: `rareui-components/src/components/adaptive-form/StepIndicator.tsx`
- Create: `rareui-components/src/components/adaptive-form/useAdaptiveForm.ts`
- Create: `rareui-components/src/components/adaptive-form/index.ts`
- Create: `rareui-components/src/app/components/adaptive-form/page.tsx`
- Test: manual, via dev server

**Interfaces:**
- Consumes: `cn` (Task 4), `ComponentDetailPage` (Task 7), `sampleFormSteps` data (Task 6)
- Produces: `AdaptiveFormFlow` component rendered at `/components/adaptive-form`

- [ ] **Step 1: Copy the 3 component files + hook + barrel verbatim, adding `"use client"` where needed**

```bash
SRC="/Users/admin/All Project/RareUi/rareui-edge-stepper/src/components/adaptive-form"
DEST="/Users/admin/All Project/RareUi/rareui-components/src/components/adaptive-form"
mkdir -p "$DEST"
cp "$SRC"/*.tsx "$SRC"/*.ts "$DEST/"
```

Add `"use client";` as line 1 to `AdaptiveFormFlow.tsx`, `FormField.tsx`, `useAdaptiveForm.ts` (use hooks, confirmed by grep). `StepIndicator.tsx` is presentational (no hooks) but is only ever rendered inside the already-client `AdaptiveFormFlow` tree — leave it unchanged, no directive needed. `index.ts` needs no directive.

- [ ] **Step 2: Create the detail page**

```tsx
// rareui-components/src/app/components/adaptive-form/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import { ComponentDetailPage } from "@/components/ui/ComponentDetailPage";
import { AdaptiveFormFlow } from "@/components/adaptive-form";
import { sampleFormSteps } from "@/data/formSteps";

function readSource(relativePath: string): string {
  return readFileSync(
    join(process.cwd(), "src/components/adaptive-form", relativePath),
    "utf-8"
  );
}

export default function AdaptiveFormPage() {
  const files = [
    {
      name: "AdaptiveFormFlow.tsx",
      code: readSource("AdaptiveFormFlow.tsx"),
    },
    { name: "useAdaptiveForm.ts", code: readSource("useAdaptiveForm.ts") },
    { name: "StepIndicator.tsx", code: readSource("StepIndicator.tsx") },
    { name: "FormField.tsx", code: readSource("FormField.tsx") },
  ];

  return (
    <ComponentDetailPage
      title="Adaptive Form Flow"
      description="Forms that think ahead — fields appear based on prior answers."
      category="Forms"
      categoryGroup="Forms & Input"
      installCommand="npx rareui add adaptive-form"
      foundationFile="src/app/globals.css"
      foundationHref="/theme.css"
      files={files}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <AdaptiveFormFlow
          steps={sampleFormSteps}
          onSubmit={(v) => console.log("Form submitted:", v)}
        />
      </div>
    </ComponentDetailPage>
  );
}
```

- [ ] **Step 3: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/components/adaptive-form`
Expected: shared nav, breadcrumb "Components / Forms & Input", form demo centered and interactive (filling fields reveals subsequent steps), Install/Code/Figma/AI-prompt sections working. No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/adaptive-form "src/app/components/adaptive-form"
git commit -m "feat: port Adaptive Form Flow and its detail page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 12: Move Library catalog to /library and build the new RareUI homepage

**Files:**
- Create: `rareui-components/src/app/library/page.tsx` (moved from `src/app/page.tsx`)
- Modify: `rareui-components/src/app/page.tsx` (replaced entirely with new homepage content)
- Test: manual, via dev server

**Interfaces:**
- Consumes: `PrimitiveShowcase`, `CategorySection` (Task 8), `EdgeStepperDemo` (Task 9), `CommandPalette`/`AdaptiveFormFlow` component groups (Tasks 10–11), sample data (Task 6)
- Produces: nothing consumed by later tasks — this is the terminal homepage

**Correctness note:** the current Vite `App.tsx` passes `code`/`filePath`/`extraFiles` to every `PrimitiveShowcase` card (read via `?raw` imports), which is what makes the cards' "AI prompt" and "View code" hover buttons actually do something — `PrimitiveShowcase` no-ops both (`if (code) ...`) when `code` is missing. The homepage must therefore read each component's source files the same way the three detail pages do (Tasks 9–11), which means it **cannot** be a single top-level `"use client"` file — `fs.readFileSync` is server-only. It's split the same way Task 9 split Edge Stepper: a Server Component `page.tsx` that reads files and passes `code`/`filePath`/`extraFiles` down, reusing the already-built Client Component pieces for the interactive parts.

- [ ] **Step 1: Move the current Library catalog page to `/library`**

```bash
cd "/Users/admin/All Project/RareUi/rareui-components"
mkdir -p src/app/library
git mv src/app/page.tsx src/app/library/page.tsx
```

Do not edit its contents in this task — it still has its old light-theme inline styles (Task 15 restyles it). This step is purely relocating the route from `/` to `/library`.

- [ ] **Step 2: Write the new homepage as a Server Component at `src/app/page.tsx`**

```tsx
// rareui-components/src/app/page.tsx
import { readFileSync } from "fs";
import { join } from "path";
import { PrimitiveShowcase, CategorySection } from "@/components/ui";
import { EdgeStepperDemo } from "./components/edge-stepper/EdgeStepperDemo";
import { CommandPalette } from "@/components/command-palette";
import { sampleCommands } from "@/data/commandItems";
import { AdaptiveFormFlow } from "@/components/adaptive-form";
import { sampleFormSteps } from "@/data/formSteps";

function readSource(dir: string, relativePath: string): string {
  return readFileSync(join(process.cwd(), dir, relativePath), "utf-8");
}

export default function HomePage() {
  const edgeStepperFiles = [
    {
      name: "EdgeStepper.tsx",
      code: readSource("src/components/edge-stepper", "EdgeStepper.tsx"),
    },
    {
      name: "useEdgeStepper.ts",
      code: readSource("src/components/edge-stepper", "useEdgeStepper.ts"),
    },
    {
      name: "TickRail.tsx",
      code: readSource("src/components/edge-stepper", "TickRail.tsx"),
    },
    {
      name: "OutlinePanel.tsx",
      code: readSource("src/components/edge-stepper", "OutlinePanel.tsx"),
    },
    {
      name: "OutlineItem.tsx",
      code: readSource("src/components/edge-stepper", "OutlineItem.tsx"),
    },
  ];

  const commandPaletteFiles = [
    {
      name: "CommandPalette.tsx",
      code: readSource("src/components/command-palette", "CommandPalette.tsx"),
    },
    {
      name: "useCommandPalette.ts",
      code: readSource(
        "src/components/command-palette",
        "useCommandPalette.ts"
      ),
    },
    {
      name: "CommandGroup.tsx",
      code: readSource("src/components/command-palette", "CommandGroup.tsx"),
    },
    {
      name: "CommandRow.tsx",
      code: readSource("src/components/command-palette", "CommandRow.tsx"),
    },
  ];

  const adaptiveFormFiles = [
    {
      name: "AdaptiveFormFlow.tsx",
      code: readSource("src/components/adaptive-form", "AdaptiveFormFlow.tsx"),
    },
    {
      name: "useAdaptiveForm.ts",
      code: readSource("src/components/adaptive-form", "useAdaptiveForm.ts"),
    },
    {
      name: "StepIndicator.tsx",
      code: readSource("src/components/adaptive-form", "StepIndicator.tsx"),
    },
    {
      name: "FormField.tsx",
      code: readSource("src/components/adaptive-form", "FormField.tsx"),
    },
  ];

  return (
    <div className="mx-auto min-h-svh max-w-4xl">
      {/* ── Hero ── */}
      <header className="flex flex-col items-center px-5 pt-16 pb-20 text-center sm:px-8 sm:pt-24 sm:pb-28">
        <div className="mb-6 inline-flex items-center rounded-full border border-accent/20 bg-accent-dim px-4 py-1.5 text-[12px] font-medium text-accent">
          Free to use UI components
        </div>
        <h1 className="max-w-xl text-[32px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[48px]">
          UI components{" "}
          <span className="text-ink-3">for modern apps</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-3">
          Beautifully crafted, copy-paste primitives for everything your app
          needs: navigation, forms, commands, and more.
        </p>
        <a
          href="#components"
          className="mt-8 inline-flex items-center rounded-full bg-ink px-6 py-2.5 text-[13px] font-semibold text-canvas transition-opacity hover:opacity-90"
        >
          Browse components
        </a>
      </header>

      {/* ── Components ── */}
      <div id="components" className="scroll-mt-8">
        <CategorySection title="Navigation & Discovery" count={2}>
          <PrimitiveShowcase
            title="Edge Stepper"
            description="Hover-reveal conversation outline with hierarchical navigation."
            category="Navigation"
            minHeight={420}
            expandUrl="/components/edge-stepper"
            code={edgeStepperFiles[0].code}
            filePath="components/edge-stepper/EdgeStepper.tsx"
            extraFiles={edgeStepperFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add edge-stepper"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <EdgeStepperDemo />
          </PrimitiveShowcase>

          <PrimitiveShowcase
            title="AI Command Palette"
            description="One command center for everything."
            category="AI"
            staggerDelay={100}
            minHeight={420}
            expandUrl="/components/command-palette"
            code={commandPaletteFiles[0].code}
            filePath="components/command-palette/CommandPalette.tsx"
            extraFiles={commandPaletteFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add command-palette"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <CommandPalette
                commands={sampleCommands}
                onSelect={(cmd) => console.log("Selected:", cmd.label)}
                embedded
              />
            </div>
          </PrimitiveShowcase>
        </CategorySection>

        <CategorySection title="Forms & Input" count={1}>
          <PrimitiveShowcase
            title="Adaptive Form Flow"
            description="Forms that think ahead — fields appear based on prior answers."
            category="Forms"
            staggerDelay={0}
            minHeight={420}
            expandUrl="/components/adaptive-form"
            code={adaptiveFormFiles[0].code}
            filePath="components/adaptive-form/AdaptiveFormFlow.tsx"
            extraFiles={adaptiveFormFiles.slice(1).map((f) => ({
              path: f.name,
              code: f.code,
            }))}
            codeNote="Self-contained — needs only the foundation tokens."
            installCommand="npx rareui add adaptive-form"
            foundationFile="src/app/globals.css"
            foundationHref="/theme.css"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <AdaptiveFormFlow
                steps={sampleFormSteps}
                onSubmit={(v) => console.log("Form submitted:", v)}
              />
            </div>
          </PrimitiveShowcase>
        </CategorySection>
      </div>

      {/* ── Footer ── */}
      <footer className="flex flex-col items-center gap-3 border-t border-line/40 px-5 py-12 text-center sm:px-8">
        <span className="text-[14px] font-semibold text-ink">
          Rare<span className="text-accent">UI</span>
        </span>
        <p className="text-[12px] leading-relaxed text-ink-4">
          Built with React + Tailwind CSS v4 · Copy-paste · Tree-shakeable
        </p>
      </footer>
    </div>
  );
}
```

`EdgeStepperDemo` is imported from `./components/edge-stepper/EdgeStepperDemo` — the exact Client Component file Task 9 Step 3 already created at `src/app/components/edge-stepper/EdgeStepperDemo.tsx`. It's reused here unchanged (same scroll-nav logic, same `sampleOutline`/`contentBlocks` data), so the homepage's Edge Stepper demo and its detail-page demo are guaranteed to behave identically. `CommandPalette` and `AdaptiveFormFlow` are rendered directly as children of this Server Component — legal in Next.js (a Server Component can render an already-`"use client"` component as a normal child), no additional wrapper needed since neither has scroll-nav logic like Edge Stepper does.

Note the two concrete link fixes called out in the spec: `expandUrl` now points to `/components/edge-stepper`, `/components/command-palette`, `/components/adaptive-form` (not the old `.html` paths), and `foundationHref` now points to `/theme.css` (not a Vite `?url` import) — both already applied above, alongside the `code`/`filePath`/`extraFiles` fix. The nav/GitHub markup from the old `App.tsx` is dropped entirely — `SiteHeader` (Task 2) already provides it globally, and the footer's own "Components"/"GitHub" links are dropped too since they duplicate the shared nav.

- [ ] **Step 3: Verify via dev server**

Run: `npm run dev`
Open `http://localhost:3000` — expect the RareUI hero, "Browse components" button, both category sections rendering with working demos, clicking a card navigates to its detail page (`/components/edge-stepper` etc.) correctly.
On each of the 3 homepage cards, hover to reveal the "AI prompt" and "View code" buttons and click each: "View code" opens `CodeModal` showing that component's actual source (not empty); "AI prompt" opens `PromptModal` showing a real generated prompt containing that component's code — this is the specific regression this task's fix addresses, so confirm it explicitly rather than just glancing at the page.
Open `http://localhost:3000/library` — expect the Library catalog (still old styling until Task 15) rendering at this new path instead of `/`, with the shared `SiteHeader` now on top of it too (no more duplicate/missing nav).
Expected: no console errors on either page; "Components" nav link shows active on `/`, "Library" nav link shows active on `/library`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: move Library catalog to /library, add new RareUI homepage at /

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 13: Build the Figma-to-Code tool page

**Files:**
- Create: `rareui-components/src/app/figma-to-code/page.tsx`
- Test: manual, via dev server

**Interfaces:**
- Consumes: `convertSvgToCode`, `extractHtmlFromClipboard` from `@/utils/svgToCode` (Task 6)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Create the page (ported from the Vite `figma-to-code.tsx` entry, minus its own nav/StrictMode/createRoot boilerplate — Next handles mounting and `SiteHeader` already provides the nav)**

```tsx
// rareui-components/src/app/figma-to-code/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  convertSvgToCode,
  extractHtmlFromClipboard,
  type Framework,
} from "@/utils/svgToCode";

const frameworks: { id: Framework; label: string; note: string }[] = [
  { id: "react-tailwind", label: "React + Tailwind", note: "arbitrary values" },
  { id: "react-jsx", label: "React (JSX)", note: "inline style objects" },
  { id: "html-css", label: "HTML / CSS", note: "self-contained document" },
  { id: "vue-sfc", label: "Vue (SFC)", note: "single-file component" },
  { id: "svelte", label: "Svelte", note: "single-file component" },
];

export default function FigmaToCodePage() {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [framework, setFramework] = useState<Framework>("react-tailwind");
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      const clip = e.clipboardData;
      if (!clip) return;

      const svg = extractHtmlFromClipboard(clip);
      if (svg) {
        setSvgData(svg);
        setCode(convertSvgToCode(svg, framework));
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
        return;
      }

      const items = clip.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            setImageUrl(URL.createObjectURL(file));
            setSvgData(null);
            setCode(
              "// Pasted as image — for editable code, copy from Figma as SVG\n// (Right-click → Copy as SVG in Figma)"
            );
          }
          return;
        }
      }

      const text = clip.getData("text/plain");
      if (text?.trim().startsWith("<svg")) {
        setSvgData(text);
        setCode(convertSvgToCode(text, framework));
        const blob = new Blob([text], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
      }
    },
    [framework]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (svgData) {
      setCode(convertSvgToCode(svgData, framework));
    }
  }, [framework, svgData]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const svg = extractHtmlFromClipboard(e.dataTransfer);
      if (svg) {
        setSvgData(svg);
        setCode(convertSvgToCode(svg, framework));
        const blob = new Blob([svg], { type: "image/svg+xml" });
        setImageUrl(URL.createObjectURL(blob));
        return;
      }
      const file = e.dataTransfer.files[0];
      if (file?.type === "image/svg+xml") {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          setSvgData(text);
          setCode(convertSvgToCode(text, framework));
          const blob = new Blob([text], { type: "image/svg+xml" });
          setImageUrl(URL.createObjectURL(blob));
        };
        reader.readAsText(file);
      } else if (file?.type.startsWith("image/")) {
        setImageUrl(URL.createObjectURL(file));
        setSvgData(null);
        setCode("// Dropped as image — for editable code, use SVG files");
      }
    },
    [framework]
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
  }, [code]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const handleReset = useCallback(() => {
    setSvgData(null);
    setImageUrl(null);
    setCode("");
  }, []);

  return (
    <div className="mx-auto min-h-svh max-w-6xl">
      <header className="px-5 pt-6 pb-8 sm:px-8">
        <h1 className="text-[28px] font-bold tracking-tight text-ink sm:text-[36px]">
          Figma to Code
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-3">
          Paste a component from Figma, choose your technology, and get
          production-ready code.
        </p>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-16 sm:px-8 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-ink">Canvas</h2>
            {imageUrl && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-control border border-line px-2.5 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
          <div
            ref={canvasRef}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex min-h-[420px] items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed transition-colors ${
              isDragging
                ? "border-accent bg-accent-dim"
                : imageUrl
                  ? "border-line bg-surface"
                  : "border-line/60 bg-surface"
            }`}
          >
            {imageUrl ? (
              <div className="flex items-center justify-center p-6">
                <img
                  src={imageUrl}
                  alt="Pasted design"
                  className="max-h-[380px] max-w-full rounded-[8px] object-contain"
                  style={{
                    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 px-8 py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-field">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-ink-3"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-medium text-ink">
                    Paste from Figma
                  </p>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Select a component in Figma, right-click &rarr;{" "}
                    <span className="font-mono text-[12px] text-ink-2">
                      Copy/Paste as
                    </span>{" "}
                    &rarr;{" "}
                    <span className="font-mono text-[12px] text-ink-2">
                      Copy as SVG
                    </span>
                  </p>
                  <p className="mt-1 text-[12px] text-ink-4">
                    Then press{" "}
                    <kbd className="rounded-[3px] border border-line px-1.5 py-0.5 font-mono text-[11px]">
                      ⌘V
                    </kbd>{" "}
                    here
                  </p>
                </div>
                <p className="text-[11px] text-ink-4">
                  or drag &amp; drop an SVG file
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 lg:max-w-[480px]">
          <div className="mb-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ink">
              Technology
            </h2>
            <div className="flex flex-col gap-1">
              {frameworks.map((fw) => (
                <button
                  key={fw.id}
                  type="button"
                  onClick={() => setFramework(fw.id)}
                  className={`flex items-center justify-between rounded-control px-3 py-2.5 text-left transition-colors ${
                    framework === fw.id
                      ? "bg-accent-dim border border-accent/30 text-ink"
                      : "border border-transparent text-ink-2 hover:bg-hover hover:text-ink"
                  }`}
                >
                  <span className="text-[13px] font-medium">{fw.label}</span>
                  <span className="text-[11px] text-ink-4">{fw.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-ink">Code</h2>
              {code && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-control border border-line px-2.5 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="max-h-[500px] overflow-auto rounded-[12px] border border-line bg-canvas p-4">
              {code ? (
                <pre className="font-mono text-[12px] leading-[1.7] text-ink">
                  <code>{code}</code>
                </pre>
              ) : (
                <div className="flex items-center justify-center py-12 text-[13px] text-ink-4">
                  Paste a design to generate code
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/figma-to-code`
Expected: page renders with shared `SiteHeader` (Figma to Code shows active), empty paste-target canvas, technology list with React + Tailwind pre-selected. Paste a test SVG (e.g. `<svg width="100" height="100"><rect width="100" height="100" fill="red"/></svg>`) via ⌘V — expect it to render in the canvas and generate code in the right panel; switching frameworks regenerates the code. No console errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/figma-to-code"
git commit -m "feat: add Figma to Code tool page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 14: Move and restyle the admin page

**Files:**
- Create: `rareui-components/src/app/library/admin/page.tsx` (moved + restyled from `src/app/admin/page.tsx`)
- Test: manual, via dev server

**Interfaces:**
- Consumes: `extractFigmaClipboard`, `copyToFigmaClipboard`, `slugify` from `@/lib/clipboard` (unchanged, already exists)
- Produces: nothing consumed by later tasks

- [ ] **Step 1: Move the file**

```bash
cd "/Users/admin/All Project/RareUi/rareui-components"
mkdir -p src/app/library/admin
git mv src/app/admin/page.tsx src/app/library/admin/page.tsx
```

- [ ] **Step 2: Restyle inline styles to Tailwind tokens**

In the moved `src/app/library/admin/page.tsx`, replace every inline `style={{...}}` object with Tailwind utility classes using the token mapping below (applies to every occurrence in the file — the outer page wrapper, the header bar, the "Manage" section's component list rows, the `Field`/`inputStyle`/`secondaryButtonStyle` helpers at the bottom of the file, and all three numbered steps):

| Old inline value | New Tailwind class |
|---|---|
| `background: "var(--bg)"` | `bg-canvas` |
| `background: "var(--bg-card)"` / `"var(--bg-elevated)"` | `bg-surface` / `bg-field` |
| `background: "var(--bg-input)"` | `bg-field` |
| `color: "var(--text-primary)"` | `text-ink` |
| `color: "var(--text-secondary)"` | `text-ink-2` |
| `color: "var(--text-muted)"` | `text-ink-3` |
| `border: "1px solid var(--border)"` | `border border-line` |
| `border: "1px solid var(--border-strong)"` | `border border-line` (no separate "strong" token in RareUI's system — collapse to the same `border-line`) |
| `background: "var(--accent)"`, `color: "var(--accent-text)"` (primary buttons) | `bg-ink text-canvas` |
| `background: "var(--bg-elevated)"` (secondary buttons) | `bg-field text-ink border border-line` |
| `borderRadius: 8` / `10` / `12` | `rounded-control` (6px) or `rounded-[8px]`/`rounded-[10px]`/`rounded-[12px]` if the exact pixel value matters visually — use `rounded-control` for buttons/inputs, keep explicit pixel values for the larger card containers to preserve the existing layout rhythm |
| `fontSize: 13/14/20`, etc. | `text-[13px]`, `text-[14px]`, `text-[20px]` (kept as arbitrary values — same sizes, just Tailwind syntax) |
| `color: "var(--destructive, #ef4444)"` (delete button) | `text-red-400 border border-red-400/40` (dark-theme-appropriate red, no `--destructive` token exists in RareUI's system) |

Convert every `<div style={{...}}>`, `<button style={{...}}>`, `<input style={inputStyle}>`, etc. to `className="..."` using this mapping. The `Field`, `inputStyle`, and `secondaryButtonStyle` helper constants at the bottom of the file become unnecessary once converted — delete `inputStyle`/`secondaryButtonStyle` and change every `style={inputStyle}` usage to `className="w-full rounded-control border border-line bg-field px-3 py-2.5 text-[14px] text-ink outline-none"` inline, and every `style={secondaryButtonStyle}` to `className="rounded-control border border-line bg-field px-6 py-3 text-[14px] font-medium text-ink"`.

No logic changes anywhere in this file — every `useState`/`useCallback`/`useEffect`, every `fetch("/api/...")` call, the `x-admin-password` header handling, all stay byte-for-byte identical. This is a pure visual pass.

- [ ] **Step 3: Restyle the "← Back to catalog" sub-header to match the new pattern**

Replace the file's own `<header style={{...}}>...</header>` block (the one with "← Back to catalog · Admin — Extract Components") with:

```tsx
<div className="border-b border-line px-5 py-4 sm:px-8">
  <div className="flex items-center gap-2 text-[13px] text-ink-3">
    <a href="/library" className="transition-colors hover:text-ink">Library</a>
    <span className="text-ink-4">/</span>
    <span>Admin — Extract Components</span>
  </div>
</div>
```

Same breadcrumb pattern as the Components section's detail pages ("Components / Navigation & Discovery") — consistent site-wide convention, and the link now correctly points to `/library` (its new URL) instead of `/`.

- [ ] **Step 4: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/library/admin`
Expected: dark-themed page matching the rest of the site, breadcrumb "Library / Admin — Extract Components" with working back-link, existing component list still loads (calls the unchanged `/api/components` endpoint), password field still gates delete/upload actions, "Extract from Clipboard" flow still works end-to-end (copy a Figma component, click Extract, fill in details, Test Paste, Save to Library). No console errors, no visual regressions in layout (only colors/fonts should differ from before).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: move admin page to /library/admin and restyle to RareUI theme

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 15: Restyle the Library catalog's remaining components

**Files:**
- Modify: `rareui-components/src/components/SearchBar.tsx`
- Modify: `rareui-components/src/components/CategoryFilter.tsx`
- Modify: `rareui-components/src/components/ComponentCard.tsx`
- Modify: `rareui-components/src/components/CopyToFigmaButton.tsx`
- Modify: `rareui-components/src/components/ComponentSideSheet.tsx`
- Modify: `rareui-components/src/app/library/page.tsx`
- Delete: `rareui-components/src/components/Header.tsx`
- Test: manual, via dev server

**Interfaces:**
- Consumes: nothing new (these already work; only their styling changes)
- Produces: nothing consumed by later tasks — this is the final visual piece

- [ ] **Step 1: Delete the now-unused Header component**

```bash
cd "/Users/admin/All Project/RareUi/rareui-components"
git rm src/components/Header.tsx
```

Confirm nothing still imports it: `grep -rn "components/Header" src/` should return no results (Task 2's Step 3 already removed the import from `page.tsx` before it was moved to `library/page.tsx` in Task 12 — this just removes the now-orphaned file itself).

- [ ] **Step 2: Restyle `SearchBar.tsx`, `CategoryFilter.tsx`, `ComponentCard.tsx`, `CopyToFigmaButton.tsx`, `ComponentSideSheet.tsx`, and `library/page.tsx`**

Apply the same inline-style-to-Tailwind conversion described in Task 14 Step 2 (same token mapping table) to each of these 6 files. Concretely:

- `SearchBar.tsx`: the input's `background: "var(--bg-input)"` → `bg-field`, border → `border-line`, focus/blur handlers that manually toggle `borderColor` become a `focus:border-line focus:outline-none` Tailwind class (remove the `onFocus`/`onBlur` handlers entirely — Tailwind's `focus:` variant replaces them).
- `CategoryFilter.tsx`: active pill (`background: "var(--accent)"`, `color: "var(--accent-text)"`) → `bg-accent-dim border border-accent/30 text-accent` (matches the active-nav-link style from `SiteHeader`); inactive → `border border-line text-ink-3`.
- `ComponentCard.tsx`: card background/border/hover → `bg-surface border border-line/60 hover:border-line hover:shadow-[0_2px_20px_rgba(0,0,0,0.15)]` (same hover treatment as `PrimitiveShowcase`'s cards, for visual consistency between the two sections); remove the `onMouseEnter`/`onMouseLeave` inline handlers, replaced by the `hover:` Tailwind classes.
- `CopyToFigmaButton.tsx`: replace the `status`-driven inline `background`/`color` object with conditional Tailwind classes: idle → `bg-ink text-canvas`, copied → `bg-green-500/15 text-green-400`, error → `bg-red-500/15 text-red-400`.
- `ComponentSideSheet.tsx`: backdrop/modal background → `bg-canvas border border-line`; close button → `bg-field border border-line text-ink-3 hover:bg-hover`.
- `library/page.tsx`: page wrapper → `bg-canvas`; hero heading/description → `text-ink` / `text-ink-3` (matching the homepage's hero typography scale); category-filter/search row, results count, grid, empty state, and skeleton-loading pulse all get the same token mapping.

No logic changes in any of these 6 files — every `useState`, every `fetch`, the debounced search `useEffect`, the `navigator.clipboard.write()` call in `CopyToFigmaButton`, all stay identical. Pure visual pass, same as Task 14.

- [ ] **Step 3: Verify via dev server**

Run: `npm run dev`, open `http://localhost:3000/library`
Expected: catalog page now matches RareUI's dark theme (same background/text/accent colors as `/` and `/components/*`), search bar and category filter styled consistently, component cards match the visual weight of the homepage's `PrimitiveShowcase` cards, clicking a card opens the side sheet with matching styling, "Copy to Figma" button still functions (copy a component, switch to Figma, ⌘V — component pastes correctly, confirming the restyle didn't touch the actual clipboard-writing logic). No console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: restyle Library catalog components to RareUI theme

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 16: Cleanup and full nav sweep

**Files:**
- Delete: `rareui-edge-stepper/src/lib/libraryUrl.ts`
- Test: manual, via dev server — full site walkthrough

**Interfaces:**
- Consumes: everything from Tasks 1–15 (this is the final verification pass)
- Produces: nothing — terminal task

- [ ] **Step 1: Delete the now-obsolete external-link helper**

```bash
cd "/Users/admin/All Project/RareUi/rareui-edge-stepper"
rm src/lib/libraryUrl.ts
```

Per spec §8, this file (added when "Library" was an external tab pointing at a separate `localhost:3000` app) is no longer needed now that Library is an internal route. Note: this is a change to the **old Vite app**, not the Next app — do not delete or otherwise touch the rest of `rareui-edge-stepper/`, it stays in place untouched until you've confirmed the merge (spec §8 — deletion of the whole app is a separate, later decision).

- [ ] **Step 2: Full nav sweep — verify every route**

Run: `cd "/Users/admin/All Project/RareUi/rareui-components" && npm run dev`

Visit each URL and confirm the specific expectation:

1. `http://localhost:3000/` — RareUI homepage, hero + 2 category sections, "Components" nav pill active.
2. `http://localhost:3000/components/edge-stepper` — Edge Stepper detail page, "Components" nav pill active (not highlighted differently from `/`, since it's a sub-page reached by card click).
3. `http://localhost:3000/components/command-palette` — Command Palette detail page.
4. `http://localhost:3000/components/adaptive-form` — Adaptive Form detail page.
5. `http://localhost:3000/library` — Library catalog, dark-themed, "Library" nav pill active.
6. `http://localhost:3000/library/admin` — Admin tool, dark-themed, breadcrumb links back to `/library`.
7. `http://localhost:3000/figma-to-code` — Figma-to-Code tool, "Figma to Code" nav pill active.
8. From every page, click every `SiteHeader` nav link (Components, Library, Figma to Code, GitHub, logo) and confirm it lands on the right page with no 404s and no full-page reload flash (Next's client-side routing should make transitions instant).
9. Toggle a component detail page's Preview Light/Dark button and confirm only the preview pane switches, not the whole site (the `[data-theme]` scoping from Task 1 stays contained to that one `<div>`).

Expected: all 7 routes render correctly, no 404s, no console errors on any page, no visual "seam" between the Components and Library sections (same background color, same font, same nav).

- [ ] **Step 3: Commit**

```bash
cd "/Users/admin/All Project/RareUi/rareui-edge-stepper"
git add -A
git commit -m "chore: remove obsolete external-library-link helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(No commit needed in `rareui-components` for this task — Step 2 is verification-only, nothing changed there.)

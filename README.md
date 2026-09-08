# RareUI

Copy-paste UI components for React, plus a community Figma library you can paste straight into Figma — one site, one nav, one codebase.

RareUI used to be two separate apps: a Vite showcase site for hand-built components, and a Next.js + Supabase catalog of Figma components. They're now merged into a single Next.js app.

## What's here

**Components** — hand-built, interactive, copy-paste primitives with live source, install commands, and light/dark previews:
- **Edge Stepper** — hover-reveal conversation outline with hierarchical navigation
- **AI Command Palette** — a command center with grouped, searchable actions
- **Adaptive Form Flow** — a form that reveals fields based on prior answers

**Library** — a community-curated catalog of Figma components. Browse, click **Copy to Figma**, and paste directly into a Figma file — no plugin required. Includes an admin tool for extracting and publishing new components from your own clipboard.

**Figma to Code** — paste an SVG copied out of Figma and get back production-ready React + Tailwind, plain React, HTML/CSS, Vue, or Svelte.

## Routes

| Route | What it is |
|---|---|
| `/` | Homepage — hero + the 3 built-in components |
| `/components/edge-stepper` | Edge Stepper detail page (preview, install, source) |
| `/components/command-palette` | Command Palette detail page |
| `/components/adaptive-form` | Adaptive Form Flow detail page |
| `/library` | Figma component catalog (Supabase-backed) |
| `/library/admin` | Admin tool — extract components from Figma's clipboard and publish them |
| `/figma-to-code` | Paste an SVG, get code in 5 frameworks |

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The **Components** and **Figma to Code** sections work immediately with no setup.

The **Library** section (`/library`, `/library/admin`) needs a Supabase project — see [`SETUP-GUIDE.md`](./SETUP-GUIDE.md) for schema, storage bucket, and environment variable setup. Without it, `/library` will show a fetch error, but the rest of the site is unaffected.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme`, dark-first design system, `[data-theme]` scoping for per-preview light/dark toggles)
- **Supabase** — Postgres + Storage, powers the Library catalog and admin tool only
- Component source for each detail page's "Code" tab is read straight off disk at build time (`fs.readFileSync` in a Server Component) — no bundler-specific import tricks, and the pages prerender as static HTML

## Project structure

```
src/
├── app/
│   ├── page.tsx                        # Homepage
│   ├── layout.tsx                      # Root layout — theme, fonts, shared nav
│   ├── globals.css                     # Design tokens (dark-first, light/dark scoped)
│   ├── theme.css/route.ts              # Serves globals.css as raw CSS (for "View file" links)
│   ├── components/
│   │   ├── edge-stepper/page.tsx
│   │   ├── command-palette/page.tsx
│   │   └── adaptive-form/page.tsx      # Each detail page + its client-side demo wrapper
│   ├── figma-to-code/page.tsx
│   ├── library/
│   │   ├── page.tsx                    # Figma component catalog
│   │   └── admin/page.tsx              # Extraction/admin tool
│   └── api/                            # Library CRUD + clipboard endpoints (service-role gated)
├── components/
│   ├── ui/                             # PrimitiveShowcase, ComponentDetailPage, modals, icons
│   ├── edge-stepper/ · command-palette/ · adaptive-form/   # The 3 built-in components
│   ├── SiteHeader.tsx                  # Shared nav
│   └── SearchBar.tsx · CategoryFilter.tsx · ComponentCard.tsx · CopyToFigmaButton.tsx · ComponentSideSheet.tsx  # Library catalog UI
├── lib/                                # cn(), Supabase client, Figma clipboard read/write, types
├── utils/                              # SVG→code conversion, DOM→Figma-SVG export
├── hooks/
└── data/                               # Sample data for the Components section demos
supabase/
└── schema.sql                          # Library database schema
```

## How the Figma clipboard trick works

Figma reads `text/html` from the system clipboard on paste. Copying something in Figma embeds two base64-encoded blobs in HTML comments — `figmeta` (JSON metadata) and `figbuffer` (the component tree, in Kiwi binary format). The admin tool extracts these once and stores them in Supabase; **Copy to Figma** reconstructs the exact HTML Figma expects. Figma can't tell it apart from a native copy.

Full setup and admin walkthrough: [`SETUP-GUIDE.md`](./SETUP-GUIDE.md).

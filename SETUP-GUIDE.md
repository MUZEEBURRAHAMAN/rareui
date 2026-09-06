# RareUI — Setup Guide

## Quick Start

### 1. Install dependencies

```bash
cd /Users/muzeeburrahaman/Documents/rareui\ /rareui-components
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once the project is ready, go to **SQL Editor** and paste the contents of `supabase/schema.sql` — run it
3. Go to **Storage** → create a new bucket called `thumbnails` (set it to Public, 5MB limit)
4. Go to **Project Settings → API** and copy your Project URL and anon key

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the component catalog.

---

## How It Works

### Adding Components (Admin)

1. Open Figma and select a component you want to add
2. Copy it (Cmd+C)
3. Go to [http://localhost:3000/admin](http://localhost:3000/admin)
4. Click **"Extract from Clipboard"** — the tool reads Figma's encoded clipboard data
5. Fill in the name, category, tags, and optional thumbnail URL
6. Click **"Test Paste"** to verify — switch to Figma and Ctrl+V to check it works
7. Click **"Save to Library"** to store the component

### Browsing & Copying (Catalog)

1. Browse components at [http://localhost:3000](http://localhost:3000)
2. Filter by category or search by name
3. Click **"Copy to Figma"** on any component
4. Switch to Figma and press **Ctrl+V / Cmd+V** — the component appears

### How the Figma Paste Works

Figma reads `text/html` from the system clipboard on paste. When you copy something in Figma, it embeds two base64-encoded blobs inside HTML comments:

- **figmeta** — JSON metadata (file key, component info)
- **figbuffer** — Kiwi binary data (the actual component tree)

RareUI extracts these blobs once (via the admin tool), stores them in Supabase, and reconstructs the exact HTML format when a user clicks "Copy to Figma". Figma can't tell the difference between this and a native copy — it just works.

---

## Project Structure

```
rareui-components/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main catalog page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Theme tokens (light/dark)
│   │   ├── admin/page.tsx        # Component extraction tool
│   │   └── api/
│   │       ├── components/       # CRUD endpoints
│   │       │   ├── route.ts      # GET (list) + POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET single component
│   │       │       └── clipboard/
│   │       │           └── route.ts  # GET clipboard payload only
│   │       └── copy-event/
│   │           └── route.ts      # POST copy analytics
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── ComponentCard.tsx
│   │   └── CopyToFigmaButton.tsx
│   └── lib/
│       ├── types.ts              # TypeScript interfaces
│       ├── supabase.ts           # Supabase client
│       └── clipboard.ts         # Figma clipboard extract/write
├── supabase/
│   └── schema.sql                # Database schema
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local.example
```

---

## Deployment

Deploy to Vercel for the easiest setup:

```bash
npm i -g vercel
vercel
```

Set the same environment variables in Vercel's dashboard. The app must be served over HTTPS for the Clipboard API to work (Vercel handles this automatically).

---

## Browser Requirements

The Clipboard API (`navigator.clipboard.write()`) requires:
- **HTTPS** (or localhost for development)
- A **recent user gesture** (the copy happens inside a click handler)
- A modern browser: Chrome 66+, Edge 79+, Safari 13.1+, Firefox 87+

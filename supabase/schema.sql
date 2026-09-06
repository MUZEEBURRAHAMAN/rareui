-- ============================================================
-- RareUI Components — Supabase Schema
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Components table
CREATE TABLE components (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  category      TEXT NOT NULL DEFAULT 'website',
  tags          TEXT[] DEFAULT '{}',
  description   TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',

  -- Figma clipboard payload
  figmeta       TEXT NOT NULL,
  figbuffer     TEXT NOT NULL,
  display_name  TEXT NOT NULL DEFAULT 'Component',

  -- Tracking
  source_url    TEXT DEFAULT '',
  copy_count    INTEGER DEFAULT 0,
  version       INTEGER DEFAULT 1,
  is_published  BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_components_category ON components(category);
CREATE INDEX idx_components_tags ON components USING GIN(tags);
CREATE INDEX idx_components_published ON components(is_published);
CREATE INDEX idx_components_slug ON components(slug);

-- 3. Copy events table (analytics)
CREATE TABLE copy_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id) ON DELETE CASCADE,
  copied_at    TIMESTAMPTZ DEFAULT now(),
  user_agent   TEXT DEFAULT ''
);

CREATE INDEX idx_copy_events_component ON copy_events(component_id);
CREATE INDEX idx_copy_events_date ON copy_events(copied_at);

-- 4. Categories lookup (for filtering)
CREATE TABLE categories (
  id    TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  order_index INTEGER DEFAULT 0
);

INSERT INTO categories (id, label, order_index) VALUES
  ('website',   'Website',    1),
  ('mobile',    'Mobile',     2),
  ('dashboard', 'Dashboard',  3),
  ('marketing', 'Marketing',  4),
  ('ecommerce', 'E-commerce', 5),
  ('saas',      'SaaS',       6);

-- 5. Row Level Security (RLS)
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read access for published components
CREATE POLICY "Public can read published components"
  ON components FOR SELECT
  USING (is_published = true);

-- Public can insert copy events
CREATE POLICY "Public can insert copy events"
  ON copy_events FOR INSERT
  WITH CHECK (true);

-- Public can read categories
CREATE POLICY "Public can read categories"
  ON categories FOR SELECT
  USING (true);

-- Service role (used from API routes) can do everything
-- (service_role key bypasses RLS by default in Supabase)

-- 6. Function to increment copy count
CREATE OR REPLACE FUNCTION increment_copy_count(comp_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE components
  SET copy_count = copy_count + 1,
      updated_at = now()
  WHERE id = comp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Storage bucket for thumbnails
-- Run this separately in the Supabase Dashboard → Storage → New bucket
-- Bucket name: thumbnails
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/webp, image/svg+xml

-- 8. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER components_updated_at
  BEFORE UPDATE ON components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

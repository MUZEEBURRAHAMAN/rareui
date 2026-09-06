// ─── Database Types ──────────────────────────────────────────

export interface Component {
  id: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  description: string;
  thumbnail_url: string;
  figmeta: string;
  figbuffer: string;
  display_name: string;
  source_url: string;
  copy_count: number;
  version: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/** Listing response — excludes large clipboard blobs */
export type ComponentCard = Omit<Component, "figmeta" | "figbuffer">;

/** Clipboard payload — only what's needed for copy-to-Figma */
export interface ClipboardPayload {
  figmeta: string;
  figbuffer: string;
  display_name: string;
}

export interface Category {
  id: string;
  label: string;
  order_index: number;
}

export interface CopyEvent {
  id: string;
  component_id: string;
  copied_at: string;
  user_agent: string;
}

// ─── API Types ───────────────────────────────────────────────

export interface ComponentsListResponse {
  components: ComponentCard[];
  total: number;
}

export interface ComponentCreatePayload {
  name: string;
  slug: string;
  category: string;
  tags: string[];
  description: string;
  thumbnail_url?: string;
  figmeta: string;
  figbuffer: string;
  display_name: string;
  source_url?: string;
}

// ─── Figma Clipboard Extraction ──────────────────────────────

export interface FigmaClipboardData {
  rawHtml: string;
  figmeta: string | null;
  figbuffer: string | null;
  displayName: string | null;
  previewImage: string | null;
  isValidFigmaData: boolean;
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ComponentCard as ComponentCardType, Category } from "@/lib/types";
import { ComponentCard } from "@/components/ComponentCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { ComponentSideSheet } from "@/components/ComponentSideSheet";

// Default categories — used if Supabase isn't configured yet
const DEFAULT_CATEGORIES: Category[] = [
  { id: "website", label: "Website", order_index: 1 },
  { id: "mobile", label: "Mobile", order_index: 2 },
  { id: "dashboard", label: "Dashboard", order_index: 3 },
  { id: "marketing", label: "Marketing", order_index: 4 },
  { id: "ecommerce", label: "E-commerce", order_index: 5 },
  { id: "saas", label: "SaaS", order_index: 6 },
];

export default function CatalogPage() {
  const [components, setComponents] = useState<ComponentCardType[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState<ComponentCardType | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchComponents = useCallback(
    async (cat: string, q: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (cat !== "all") params.set("category", cat);
        if (q) params.set("search", q);
        params.set("limit", "50");

        const res = await fetch(`/api/components?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setComponents(data.components || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Fetch failed:", err);
        setComponents([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchComponents(selectedCategory, search);
  }, [selectedCategory, fetchComponents]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchComponents(selectedCategory, search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, selectedCategory, fetchComponents]);

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="m-0 mb-2 text-[28px] font-bold tracking-[-0.02em] text-ink">
            UI Components
          </h1>
          <p className="m-0 max-w-[42em] text-[15px] leading-[1.5] text-ink-3">
            Browse components, click copy, paste into Figma. No plugins, no
            extensions — just Ctrl+V.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Results count */}
        <div className="mb-4 text-[13px] text-ink-3">
          {loading
            ? "Loading..."
            : `${total} component${total !== 1 ? "s" : ""}`}
        </div>

        {/* Grid */}
        {!loading && components.length === 0 ? (
          <EmptyState hasSearch={!!search || selectedCategory !== "all"} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : components.map((comp) => (
                  <ComponentCard key={comp.id} component={comp} onClick={() => setSelectedComponent(comp)} />
                ))}
          </div>
        )}
      </main>

      <ComponentSideSheet
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-line px-6 py-6 text-center text-[13px] text-ink-3">
        Built with RareUI · Copy components, paste into Figma
      </footer>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="px-6 py-20 text-center text-ink-3">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-4 opacity-50"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <p className="m-0 mb-2 text-[15px] font-medium text-ink">
        {hasSearch ? "No components found" : "No components yet"}
      </p>
      <p className="m-0 text-[13px] text-ink-3">
        {hasSearch
          ? "Try a different search or category."
          : "Go to Admin to extract and upload your first Figma component."}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-line bg-surface">
      <div className="aspect-[16/10] animate-pulse bg-field" />
      <div className="px-3.5 pb-3.5 pt-3">
        <div className="mb-2 h-3.5 w-[60%] animate-pulse rounded bg-field" />
        <div className="h-3 w-[40%] animate-pulse rounded bg-field" />
      </div>
    </div>
  );
}

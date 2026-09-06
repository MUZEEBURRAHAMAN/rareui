"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ComponentCard as ComponentCardType, Category } from "@/lib/types";
import { ComponentCard } from "@/components/ComponentCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { Header } from "@/components/Header";
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
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            UI Components
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--text-secondary)",
              margin: 0,
              maxWidth: "42em",
              lineHeight: 1.5,
            }}
          >
            Browse components, click copy, paste into Figma. No plugins, no
            extensions — just Ctrl+V.
          </p>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Results count */}
        <div
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            marginBottom: 16,
          }}
        >
          {loading
            ? "Loading..."
            : `${total} component${total !== 1 ? "s" : ""}`}
        </div>

        {/* Grid */}
        {!loading && components.length === 0 ? (
          <EmptyState hasSearch={!!search || selectedCategory !== "all"} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
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
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px",
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 64,
        }}
      >
        Built with RareUI · Copy components, paste into Figma
      </footer>
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
        color: "var(--text-muted)",
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ margin: "0 auto 16px", opacity: 0.5 }}
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 8px" }}>
        {hasSearch ? "No components found" : "No components yet"}
      </p>
      <p style={{ fontSize: 13, margin: 0 }}>
        {hasSearch
          ? "Try a different search or category."
          : "Go to Admin to extract and upload your first Figma component."}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          aspectRatio: "16/10",
          background: "var(--bg-elevated)",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            height: 14,
            width: "60%",
            background: "var(--bg-elevated)",
            borderRadius: 4,
            marginBottom: 8,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 12,
            width: "40%",
            background: "var(--bg-elevated)",
            borderRadius: 4,
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

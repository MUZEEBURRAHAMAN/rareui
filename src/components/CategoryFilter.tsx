"use client";

import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  const allCategories = [{ id: "all", label: "All", order_index: 0 }, ...categories];

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
      }}
    >
      {allCategories.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "inherit",
              borderRadius: 20,
              border: "1px solid",
              borderColor: isActive ? "var(--accent)" : "var(--border)",
              background: isActive ? "var(--accent)" : "transparent",
              color: isActive ? "var(--accent-text)" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 150ms ease",
              whiteSpace: "nowrap",
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

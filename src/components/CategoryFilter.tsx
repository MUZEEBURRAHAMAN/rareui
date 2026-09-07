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
    <div className="flex flex-wrap gap-1.5">
      {allCategories.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={
              isActive
                ? "whitespace-nowrap rounded-full border border-accent/30 bg-accent-dim px-3.5 py-[7px] text-[13px] font-medium text-accent transition-all"
                : "whitespace-nowrap rounded-full border border-line px-3.5 py-[7px] text-[13px] font-medium text-ink-3 transition-all"
            }
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

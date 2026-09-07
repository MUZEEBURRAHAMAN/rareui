"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";

export type LoaderVariant = "drive" | "dots" | "orbit" | "surfer";

interface VariantSwitcherProps {
  active: LoaderVariant;
  onChange: (variant: LoaderVariant) => void;
}

const VARIANTS: { key: LoaderVariant; label: string }[] = [
  { key: "drive", label: "Drive" },
  { key: "dots", label: "Dots" },
  { key: "orbit", label: "Orbit" },
  { key: "surfer", label: "Surfer" },
];

export const VariantSwitcher = memo(function VariantSwitcher({
  active,
  onChange,
}: VariantSwitcherProps) {
  return (
    <div className="flex rounded-full bg-field p-0.5">
      {VARIANTS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11.5px] font-medium",
            "transition-[background-color,color,box-shadow] duration-150",
            active === key
              ? "bg-surface text-ink shadow-btn"
              : "text-ink-3 hover:text-ink-2"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
});
"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import type { FormField as FormFieldType } from "./useAdaptiveForm";

interface FormFieldProps {
  field: FormFieldType;
  value: string;
  onChange: (value: string) => void;
  index: number;
}

export const FormFieldRow = memo(function FormFieldRow({
  field,
  value,
  onChange,
  index,
}: FormFieldProps) {
  const base =
    "w-full rounded-control border border-line bg-canvas px-3 py-2 text-[13px] text-ink outline-none transition-colors duration-150 placeholder:text-ink-4 focus:border-accent focus:ring-1 focus:ring-accent/30";

  return (
    <div
      className="animate-field-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <label className="mb-1.5 block text-[12.5px] font-medium text-ink-2">
        {field.label}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={base}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={cn(base, "resize-none")}
        />
      )}

      {field.type === "select" && field.options && (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(base, !value && "text-ink-4")}
        >
          <option value="" disabled>
            {field.placeholder ?? "Select…"}
          </option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && field.options && (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-control border px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150",
                value === o.value
                  ? "border-accent bg-accent-dim text-accent"
                  : "border-line bg-canvas text-ink-3 hover:border-ink-4 hover:text-ink-2",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

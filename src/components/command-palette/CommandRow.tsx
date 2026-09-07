"use client";

import { memo, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { CommandItem } from "./useCommandPalette";

interface CommandRowProps {
  command: CommandItem;
  active: boolean;
  onSelect: (cmd: CommandItem) => void;
  onHover: () => void;
}

const iconMap: Record<string, string> = {
  search: "🔍",
  file: "📄",
  code: "💻",
  git: "🔀",
  settings: "⚙️",
  ai: "✨",
  deploy: "🚀",
  terminal: "▸",
  palette: "🎨",
  bug: "🐛",
  test: "🧪",
  docs: "📚",
};

export const CommandRow = memo(function CommandRow({
  command,
  active,
  onSelect,
  onHover,
}: CommandRowProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(command)}
      onMouseEnter={onHover}
      className={cn(
        "flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left transition-colors duration-100",
        active ? "bg-accent-dim text-ink" : "text-ink-2 hover:bg-hover",
      )}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] bg-field text-[12px]">
        {iconMap[command.icon ?? ""] ?? "→"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{command.label}</p>
        {command.description && (
          <p className="truncate text-[11px] text-ink-4">{command.description}</p>
        )}
      </div>
      {command.shortcut && (
        <kbd className="ml-auto shrink-0 rounded-[4px] border border-line bg-field px-1.5 py-0.5 font-mono text-[10px] text-ink-4">
          {command.shortcut}
        </kbd>
      )}
    </button>
  );
});

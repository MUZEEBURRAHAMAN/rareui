"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useCommandPalette, type CommandItem } from "./useCommandPalette";
import { CommandGroup } from "./CommandGroup";
import { CommandRow } from "./CommandRow";

interface CommandPaletteProps {
  commands: CommandItem[];
  onSelect?: (command: CommandItem) => void;
  /** When true, renders the palette inline without overlay (for showcases). */
  embedded?: boolean;
  children?: ReactNode;
}

export const CommandPalette = memo(function CommandPalette({
  commands,
  onSelect,
  embedded = false,
}: CommandPaletteProps) {
  const {
    open,
    query,
    setQuery,
    toggle,
    close,
    groups,
    flatList,
    activeIndex,
    setActiveIndex,
    select,
    handleKeyDown,
  } = useCommandPalette({ commands, onSelect });

  const inputRef = useRef<HTMLInputElement>(null);
  const embeddedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (embedded) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, embedded]);

  useEffect(() => {
    if (open && !embedded) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, embedded]);

  /* ── Palette panel (shared between embedded and overlay) ── */
  const palettePanel = (
    <div
      className={
        embedded
          ? "flex w-full max-w-md flex-col overflow-hidden rounded-window border border-line bg-surface shadow-hairline"
          : "fixed top-[20%] left-1/2 z-50 flex w-[min(480px,calc(100%-32px))] -translate-x-1/2 flex-col overflow-hidden rounded-window border border-line bg-surface shadow-hairline"
      }
      style={embedded ? undefined : { animation: "modal-in 200ms cubic-bezier(0.23,1,0.32,1)" }}
      onKeyDown={embedded ? undefined : handleKeyDown}
    >
      {/* Search input */}
      <div className="flex items-center gap-2 border-b border-line px-3">
        <svg
          className="shrink-0 text-ink-4"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={embedded ? embeddedInputRef : inputRef}
          type="text"
          value={embedded ? "" : query}
          onChange={embedded ? undefined : (e) => setQuery(e.target.value)}
          readOnly={embedded}
          placeholder="Type a command or search…"
          className="w-full bg-transparent py-3 text-[14px] text-ink outline-none placeholder:text-ink-4"
        />
        <kbd className="shrink-0 rounded-[4px] border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-4">
          esc
        </kbd>
      </div>

      {/* Results */}
      <div className="max-h-[320px] overflow-y-auto py-1">
        {(embedded ? commands : flatList).length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-ink-4">
            No commands found for &ldquo;{query}&rdquo;
          </div>
        ) : (
          (() => {
            const src = embedded ? commands : flatList;
            const grps = new Map<string, CommandItem[]>();
            for (const cmd of src) {
              const arr = grps.get(cmd.group) ?? [];
              arr.push(cmd);
              grps.set(cmd.group, arr);
            }
            return Array.from(grps.entries()).map(([group, items]) => (
              <CommandGroup key={group} label={group}>
                {items.map((cmd) => {
                  const idx = src.indexOf(cmd);
                  return (
                    <CommandRow
                      key={cmd.id}
                      command={cmd}
                      active={!embedded && idx === activeIndex}
                      onSelect={embedded ? () => {} : select}
                      onHover={embedded ? () => {} : () => setActiveIndex(idx)}
                    />
                  );
                })}
              </CommandGroup>
            ));
          })()
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 border-t border-line px-3 py-2">
        <span className="flex items-center gap-1 text-[10px] text-ink-4">
          <kbd className="rounded-[3px] border border-line px-1 py-0.5 font-mono">↑↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-4">
          <kbd className="rounded-[3px] border border-line px-1 py-0.5 font-mono">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-4">
          <kbd className="rounded-[3px] border border-line px-1 py-0.5 font-mono">esc</kbd>
          close
        </span>
      </div>
    </div>
  );

  /* ── Embedded mode: show palette inline ── */
  if (embedded) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        {palettePanel}
      </div>
    );
  }

  /* ── Full mode: trigger button + overlay ── */
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={toggle}
        className="flex items-center gap-2 rounded-control border border-line bg-field px-4 py-2.5 text-[13px] text-ink-3 shadow-hairline transition-all duration-150 hover:border-ink-4 hover:text-ink-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Search commands…</span>
        <kbd className="ml-4 rounded-[4px] border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-ink-4">
          ⌘K
        </kbd>
      </button>

      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-50 bg-ink/30"
              style={{ animation: "fade-in 120ms ease-out" }}
              onClick={close}
            />
            {palettePanel}
          </>,
          document.body,
        )}
    </div>
  );
});

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  group: string;
  shortcut?: string;
  action?: () => void;
}

interface UseCommandPaletteOptions {
  commands: CommandItem[];
  onSelect?: (command: CommandItem) => void;
}

export function useCommandPalette({ commands, onSelect }: UseCommandPaletteOptions) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const cmd of filtered) {
      const arr = map.get(cmd.group) ?? [];
      arr.push(cmd);
      map.set(cmd.group, arr);
    }
    return map;
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);

  const toggle = useCallback(() => {
    setOpen((v) => {
      if (!v) {
        setQuery("");
        setActiveIndex(0);
      }
      return !v;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const select = useCallback(
    (cmd: CommandItem) => {
      onSelect?.(cmd);
      cmd.action?.();
      close();
    },
    [onSelect, close],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatList.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatList.length) % flatList.length);
      } else if (e.key === "Enter" && flatList[activeIndex]) {
        e.preventDefault();
        select(flatList[activeIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    },
    [flatList, activeIndex, select, close],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  return {
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
  };
}

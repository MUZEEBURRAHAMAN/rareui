"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface OutlineItem {
  id: string;
  label: string;
  depth: number;
  isLink?: boolean;
  hasExpand?: boolean;
}

interface UseEdgeStepperOptions {
  items: OutlineItem[];
  /** Delay (ms) before closing after mouse leaves */
  closeDelay?: number;
  /** Delay (ms) before opening on tick-rail hover */
  openDelay?: number;
}

interface UseEdgeStepperReturn {
  isOpen: boolean;
  activeId: string;
  open: () => void;
  close: () => void;
  setActiveId: (id: string) => void;
  railProps: {
    onMouseEnter: () => void;
  };
  panelProps: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

/**
 * Headless interaction controller for the EdgeStepper.
 * Manages open/close state, hover timers, active tracking, and keyboard nav.
 */
export function useEdgeStepper({
  items,
  closeDelay = 350,
  openDelay = 0,
}: UseEdgeStepperOptions): UseEdgeStepperReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
  }, []);

  const open = useCallback(() => {
    clearTimers();
    setIsOpen(true);
  }, [clearTimers]);

  const close = useCallback(() => {
    clearTimers();
    setIsOpen(false);
  }, [clearTimers]);

  const scheduleClose = useCallback(() => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setIsOpen(false), closeDelay);
  }, [clearTimers, closeDelay]);

  const scheduleOpen = useCallback(() => {
    clearTimers();
    if (openDelay > 0) {
      openTimerRef.current = setTimeout(() => setIsOpen(true), openDelay);
    } else {
      setIsOpen(true);
    }
  }, [clearTimers, openDelay]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  // Cleanup timers on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    isOpen,
    activeId,
    open,
    close,
    setActiveId,
    railProps: {
      onMouseEnter: scheduleOpen,
    },
    panelProps: {
      onMouseEnter: () => clearTimers(),
      onMouseLeave: scheduleClose,
    },
  };
}
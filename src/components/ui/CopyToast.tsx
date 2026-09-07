"use client";

import { memo, useEffect, useState } from "react";

interface CopyToastProps {
  visible: boolean;
  onDone: () => void;
}

export const CopyToast = memo(function CopyToast({
  visible,
  onDone,
}: CopyToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    const t = setTimeout(() => {
      setMounted(false);
      setTimeout(onDone, 200);
    }, 1800);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  if (!visible && !mounted) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2
        rounded-control bg-ink px-4 py-2.5 shadow-lg"
      style={{
        animation: mounted
          ? "toast-in 250ms cubic-bezier(0.23, 1, 0.32, 1) both"
          : "toast-out 200ms ease-in both",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green-400"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span className="text-[13px] font-medium text-canvas">
        Copied to clipboard
      </span>
    </div>
  );
});

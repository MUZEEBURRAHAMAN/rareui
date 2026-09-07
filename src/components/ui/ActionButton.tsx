"use client";

import { memo, useCallback, useState, type ReactNode } from "react";
import { CheckIcon } from "./CheckIcon";

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
}

export const ActionButton = memo(function ActionButton({
  label,
  icon,
  onClick,
}: ActionButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    onClick?.();
    if (label.toLowerCase().includes("copy")) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [label, onClick]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied!" : label}
      onClick={handleClick}
      className={`flex size-7 items-center justify-center rounded-control
        bg-surface shadow-btn transition-colors duration-100
        focus-visible:ring-2 focus-visible:ring-accent ${
          copied
            ? "text-green-400"
            : "text-ink-3 hover:bg-hover hover:text-ink"
        }`}
    >
      {copied ? <CheckIcon /> : icon}
    </button>
  );
});

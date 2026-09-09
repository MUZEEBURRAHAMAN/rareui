"use client";

import { useState } from "react";
import { LockIcon, UnlockIcon } from "./icons";

interface AdminSessionBarProps {
  unlocked: boolean;
  onUnlock: (password: string) => void;
  onLock: () => void;
  /** Tighter copy for narrow columns, e.g. the Add Component form rail. */
  compact?: boolean;
}

export function AdminSessionBar({ unlocked, onUnlock, onLock, compact }: AdminSessionBarProps) {
  const [input, setInput] = useState("");

  if (unlocked) {
    return (
      <div className="mb-7 flex items-center gap-3 rounded-[8px] border border-line bg-surface px-3.5 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-green-400/10 text-green-500">
          <UnlockIcon size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13px] font-medium text-ink">Admin session unlocked</p>
          {!compact && (
            <p className="m-0 mt-0.5 text-[12px] text-ink-3">
              Cleared automatically when you close this tab.
            </p>
          )}
        </div>
        <button
          onClick={onLock}
          className="shrink-0 cursor-pointer rounded-control border border-line bg-field px-3 py-1.5 text-[12px] font-medium text-ink"
        >
          Lock
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) onUnlock(input.trim());
      }}
      className="mb-7 flex items-center gap-3 rounded-[8px] border border-line bg-surface px-3.5 py-2.5"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-field text-ink-3">
        <LockIcon size={13} />
      </div>
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={compact ? "Admin password" : "Enter admin password to unlock editing"}
        className="min-w-0 flex-1 rounded-control border border-line bg-field px-3 py-2 text-[13px] text-ink outline-none"
      />
      <button
        type="submit"
        disabled={!input.trim()}
        className="shrink-0 cursor-pointer rounded-control bg-ink px-3.5 py-2 text-[12px] font-medium text-canvas disabled:cursor-not-allowed disabled:opacity-40"
      >
        Unlock
      </button>
    </form>
  );
}

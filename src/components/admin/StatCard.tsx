import type { ReactNode } from "react";

// ─── Shell — shared chrome for every dashboard stat tile ─────

interface StatCardShellProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

export function StatCardShell({ icon, label, children }: StatCardShellProps) {
  return (
    <div className="flex min-h-[128px] flex-col gap-3.5 rounded-[12px] border border-line bg-surface p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-accent-dim text-accent">
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ─── Numeric variant — big mono value + optional subtext row ─

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  children?: ReactNode;
}

export function StatCard({ icon, label, value, children }: StatCardProps) {
  return (
    <StatCardShell icon={icon} label={label}>
      <div className="font-mono text-[30px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {value}
      </div>
      {children && <div className="mt-auto">{children}</div>}
    </StatCardShell>
  );
}

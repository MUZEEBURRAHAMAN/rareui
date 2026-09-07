import { memo } from "react";

interface CommandGroupProps {
  label: string;
  children: React.ReactNode;
}

export const CommandGroup = memo(function CommandGroup({
  label,
  children,
}: CommandGroupProps) {
  return (
    <div className="px-1.5 py-1">
      <p className="px-2 py-1 font-mono text-[10px] tracking-wider text-ink-4 uppercase">
        {label}
      </p>
      {children}
    </div>
  );
});

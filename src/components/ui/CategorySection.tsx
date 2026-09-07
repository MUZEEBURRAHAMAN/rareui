import { memo, type ReactNode } from "react";

interface CategorySectionProps {
  title: string;
  count: number;
  children: ReactNode;
}

export const CategorySection = memo(function CategorySection({
  title,
  count,
  children,
}: CategorySectionProps) {
  return (
    <section className="px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink sm:text-[20px]">
          {title}
        </h2>
        <span className="font-mono text-[12px] tabular-nums text-ink-4">
          {count} component{count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-10">{children}</div>
    </section>
  );
});

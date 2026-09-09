"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SearchBar } from "@/components/SearchBar";
import { AdminSessionBar } from "@/components/admin/AdminSessionBar";
import { StatCard, StatCardShell } from "@/components/admin/StatCard";
import { AdminComponentGrid } from "@/components/admin/AdminComponentGrid";
import { AdminComponentTable } from "@/components/admin/AdminComponentTable";
import { GridIcon, ListIcon, PlusIcon, BoxesIcon, CopiesIcon, StarIcon, BarsIcon } from "@/components/admin/icons";
import { useAdminSession } from "@/hooks/useAdminSession";
import { useAdminComponents } from "@/hooks/useAdminComponents";
import { CATEGORIES } from "@/lib/categories";

type View = "grid" | "table";

export default function AdminDashboardPage() {
  const { password, unlocked, unlock, lock } = useAdminSession();
  const { components, loading, deletingId, uploadingId, handleDelete, handleThumbnailUpload } =
    useAdminComponents(password);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState<View>("table");

  const stats = useMemo(() => {
    const total = components.length;
    const published = components.filter((c) => c.is_published).length;
    const totalCopies = components.reduce((sum, c) => sum + c.copy_count, 0);
    const mostCopied = components.reduce<typeof components[number] | null>(
      (top, c) => (!top || c.copy_count > top.copy_count ? c : top),
      null
    );

    const byCategory = new Map<string, number>();
    for (const c of components) {
      byCategory.set(c.category, (byCategory.get(c.category) || 0) + 1);
    }
    const categoryBreakdown = [...byCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const maxCategoryCount = categoryBreakdown[0]?.[1] || 1;

    return {
      total,
      published,
      draft: total - published,
      totalCopies,
      mostCopied,
      categoryBreakdown,
      maxCategoryCount,
    };
  }, [components]);

  const filtered = useMemo(() => {
    return components.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [components, search, category]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="border-b border-line px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] text-ink-3">
            <Link href="/library" className="transition-colors hover:text-ink">Library</Link>
            <span className="text-ink-4">/</span>
            <span className="font-medium text-ink">Admin</span>
          </div>
          <Link
            href="/library/admin/add"
            className="flex items-center gap-1.5 rounded-control bg-accent px-3.5 py-2 text-[13px] font-medium text-white"
          >
            <PlusIcon />
            Add Component
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-6 py-8 sm:px-8">
        <AdminSessionBar unlocked={unlocked} onUnlock={unlock} onLock={lock} />

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
          <StatCard icon={<BoxesIcon />} label="Components" value={stats.total}>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2 py-[3px] text-[11px] font-medium text-green-500">
                <span className="h-[5px] w-[5px] rounded-full bg-current" />
                {stats.published} published
              </span>
              {stats.draft > 0 && (
                <span className="rounded-full bg-field px-2 py-[3px] text-[11px] font-medium text-ink-3">
                  {stats.draft} draft
                </span>
              )}
            </div>
          </StatCard>

          <StatCard icon={<CopiesIcon />} label="Total Copies" value={stats.totalCopies}>
            <span className="text-[12px] text-ink-3">Across all {stats.total || 0} components</span>
          </StatCard>

          <StatCardShell icon={<StarIcon />} label="Most Copied">
            {stats.mostCopied ? (
              <div className="flex flex-1 items-center gap-2.5">
                <div className="h-9 w-[52px] shrink-0 overflow-hidden rounded-[6px] border border-line bg-field">
                  {stats.mostCopied.thumbnail_url && (
                    <img src={stats.mostCopied.thumbnail_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-semibold text-ink">
                    {stats.mostCopied.name}
                  </p>
                  <p className="m-0 mt-0.5 font-mono text-[12px] text-ink-3">
                    {stats.mostCopied.copy_count} copies
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-auto text-[13px] text-ink-3">No copies yet</p>
            )}
          </StatCardShell>

          <StatCardShell icon={<BarsIcon />} label="By Category">
            {stats.categoryBreakdown.length > 0 ? (
              <div className="flex flex-1 flex-col justify-center gap-2">
                {stats.categoryBreakdown.map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-[58px] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] capitalize text-ink-2">
                      {cat}
                    </span>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-field">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(count / stats.maxCategoryCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-3.5 shrink-0 text-right font-mono text-[11px] text-ink-3">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-auto text-[13px] text-ink-3">No components yet</p>
            )}
          </StatCardShell>
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
          <div className="flex flex-wrap items-center gap-3.5">
            <SearchBar value={search} onChange={setSearch} placeholder="Search components…" />
            <CategoryFilter categories={CATEGORIES} selected={category} onSelect={setCategory} />
          </div>

          <div className="flex items-center gap-0.5 rounded-control border border-line bg-field p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`flex h-7 w-7 items-center justify-center rounded-[4px] ${
                view === "grid" ? "bg-canvas text-ink shadow-hairline" : "text-ink-3"
              }`}
              title="Grid view"
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex h-7 w-7 items-center justify-center rounded-[4px] ${
                view === "table" ? "bg-canvas text-ink shadow-hairline" : "text-ink-3"
              }`}
              title="Table view"
            >
              <ListIcon />
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Existing Components</h2>
          <span className="text-[12.5px] text-ink-3">{filtered.length} shown</span>
        </div>

        {loading ? (
          <p className="text-[13px] text-ink-3">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-line px-4 py-10 text-center text-[13px] text-ink-3">
            {components.length === 0
              ? "No components yet — add your first one to get started."
              : "No components match your filters."}
          </p>
        ) : view === "grid" ? (
          <AdminComponentGrid
            components={filtered}
            deletingId={deletingId}
            uploadingId={uploadingId}
            onDelete={handleDelete}
            onUploadThumbnail={handleThumbnailUpload}
          />
        ) : (
          <AdminComponentTable
            components={filtered}
            deletingId={deletingId}
            uploadingId={uploadingId}
            onDelete={handleDelete}
            onUploadThumbnail={handleThumbnailUpload}
          />
        )}
      </main>
    </div>
  );
}

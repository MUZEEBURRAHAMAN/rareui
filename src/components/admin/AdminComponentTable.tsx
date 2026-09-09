import type { ComponentCard } from "@/lib/types";
import { UploadIcon, TrashIcon, NoImageIcon } from "./icons";

interface AdminComponentTableProps {
  components: ComponentCard[];
  deletingId: string | null;
  uploadingId: string | null;
  onDelete: (id: string, name: string) => void;
  onUploadThumbnail: (id: string, file: File) => void;
}

export function AdminComponentTable({
  components,
  deletingId,
  uploadingId,
  onDelete,
  onUploadThumbnail,
}: AdminComponentTableProps) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-line">
      <div className="grid grid-cols-[52px_1.7fr_0.85fr_0.6fr_0.7fr_auto] items-center gap-3.5 bg-field px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">
        <span />
        <span>Name</span>
        <span>Category</span>
        <span>Copies</span>
        <span>Status</span>
        <span />
      </div>

      {components.map((comp) => (
        <div
          key={comp.id}
          className="grid grid-cols-[52px_1.7fr_0.85fr_0.6fr_0.7fr_auto] items-center gap-3.5 border-t border-line bg-surface px-4 py-2.5"
        >
          <div className="flex h-8 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-line bg-field">
            {comp.thumbnail_url ? (
              <img src={comp.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <NoImageIcon size={14} />
            )}
          </div>

          <div className="min-w-0">
            <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px] font-medium text-ink">
              {comp.name}
            </p>
            <p className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-ink-4">
              {comp.slug}
            </p>
          </div>

          <span className="w-fit rounded bg-field px-2 py-[3px] text-[11px] font-medium uppercase tracking-[0.03em] text-ink-3">
            {comp.category}
          </span>

          <span className="font-mono text-[12.5px] text-ink-2">{comp.copy_count}</span>

          <span
            className={`w-fit rounded-full px-2 py-[3px] text-[11px] font-medium ${
              comp.is_published ? "bg-green-400/10 text-green-500" : "bg-field text-ink-3"
            }`}
          >
            {comp.is_published ? "Published" : "Draft"}
          </span>

          <div className="flex items-center justify-end gap-1.5">
            <label
              className={`flex h-7 w-7 items-center justify-center rounded-control border border-line bg-field text-ink-2 ${
                uploadingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
              }`}
              title="Upload thumbnail"
            >
              <UploadIcon />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadThumbnail(comp.id, file);
                  e.target.value = "";
                }}
                disabled={uploadingId === comp.id}
              />
            </label>
            <button
              onClick={() => onDelete(comp.id, comp.name)}
              disabled={deletingId === comp.id}
              className={`flex h-7 w-7 items-center justify-center rounded-control border border-red-400/40 bg-transparent text-red-400 ${
                deletingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
              }`}
              title="Delete"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

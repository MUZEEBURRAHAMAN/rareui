import type { ComponentCard } from "@/lib/types";
import { UploadIcon, TrashIcon, NoImageIcon } from "./icons";

interface AdminComponentGridProps {
  components: ComponentCard[];
  deletingId: string | null;
  uploadingId: string | null;
  onDelete: (id: string, name: string) => void;
  onUploadThumbnail: (id: string, file: File) => void;
}

export function AdminComponentGrid({
  components,
  deletingId,
  uploadingId,
  onDelete,
  onUploadThumbnail,
}: AdminComponentGridProps) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
      {components.map((comp) => (
        <div
          key={comp.id}
          className="overflow-hidden rounded-[12px] border border-line bg-surface"
        >
          <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-field">
            {comp.thumbnail_url ? (
              <img
                src={comp.thumbnail_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <NoImageIcon className="text-ink-3 opacity-50" />
            )}
            <span
              className={`absolute right-2 top-2 rounded-full px-2 py-[3px] text-[10px] font-medium ${
                comp.is_published
                  ? "bg-canvas/90 text-ink-2"
                  : "bg-canvas/90 text-ink-3"
              }`}
            >
              {comp.is_published ? "Published" : "Draft"}
            </span>
          </div>

          <div className="px-3.5 pb-3.5 pt-3">
            <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold text-ink">
              {comp.name}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded bg-field px-[7px] py-[3px] text-[11px] font-medium uppercase tracking-[0.04em] text-ink-3">
                {comp.category}
              </span>
              <span className="font-mono text-[11px] text-ink-3">
                {comp.copy_count} copies
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-control border border-line bg-field px-2.5 py-1.5 text-[12px] font-medium text-ink ${
                  uploadingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
                }`}
              >
                <UploadIcon />
                {uploadingId === comp.id ? "Uploading…" : "Thumbnail"}
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
                className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-control border border-red-400/40 bg-transparent text-red-400 ${
                  deletingId === comp.id ? "cursor-wait opacity-50" : "cursor-pointer"
                }`}
                title="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

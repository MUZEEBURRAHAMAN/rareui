"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ComponentCard } from "@/lib/types";

/** Shared fetch/delete/upload logic for the admin dashboard and add-component page. */
export function useAdminComponents(password: string) {
  const [components, setComponents] = useState<ComponentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/components?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setComponents(data.components || []);
    } catch {
      setComponents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!password) {
        toast.error("Unlock the admin session first");
        return;
      }
      if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

      setDeletingId(id);
      try {
        const res = await fetch(`/api/components/${id}`, {
          method: "DELETE",
          headers: { "x-admin-password": password },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Delete failed");
        }
        toast.success(`"${name}" deleted`);
        setComponents((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [password]
  );

  const handleThumbnailUpload = useCallback(
    async (componentId: string, file: File) => {
      if (!password) {
        toast.error("Unlock the admin session first");
        return;
      }

      setUploadingId(componentId);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("componentId", componentId);

        const res = await fetch("/api/upload-thumbnail", {
          method: "POST",
          headers: { "x-admin-password": password },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        toast.success("Thumbnail uploaded");
        setComponents((prev) =>
          prev.map((c) =>
            c.id === componentId ? { ...c, thumbnail_url: data.thumbnail_url } : c
          )
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingId(null);
      }
    },
    [password]
  );

  return {
    components,
    loading,
    deletingId,
    uploadingId,
    refetch,
    handleDelete,
    handleThumbnailUpload,
  };
}

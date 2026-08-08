"use client";

import { useEffect, useState } from "react";

// Override hanya field yang bisa diedit admin; field kaya (foto, fasilitas) tetap dari data statis
export interface CmsOverrideItem {
  id: string;
  nama?: string;
  harga?: number;
  kapasitas?: number;
  deskripsi?: string;
  durasi?: string;
  stok?: number;
  tagline?: string;
}

export interface CmsContent {
  villa: CmsOverrideItem[];
  edu: CmsOverrideItem[];
  products: CmsOverrideItem[];
}

const EMPTY: CmsContent = { villa: [], edu: [], products: [] };

let cached: CmsContent | null = null;
let inflight: Promise<CmsContent> | null = null;

async function loadCms(): Promise<CmsContent> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetch("/api/cms-content")
    .then((res) => res.json())
    .then((json) => {
      cached = (json?.content as CmsContent) || EMPTY;
      return cached as CmsContent;
    })
    .catch(() => EMPTY)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateCmsContent() {
  cached = null;
}

/**
 * Hook: mengembalikan override CMS. Aman untuk SSR (mulai dari EMPTY).
 */
export function useCmsContent(): CmsContent {
  const [content, setContent] = useState<CmsContent>(cached || EMPTY);

  useEffect(() => {
    let mounted = true;
    loadCms().then((c) => {
      if (mounted) setContent(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return content;
}

/**
 * Gabungkan data statis (kaya field) dengan override CMS berdasarkan id.
 * Field statis dipertahankan; hanya field yang ada di override yang menimpa.
 */
export function mergeById<T extends { id: string }>(
  staticArr: T[],
  overrides: CmsOverrideItem[]
): T[] {
  if (!overrides || overrides.length === 0) return staticArr;
  return staticArr.map((item) => {
    const ov = overrides.find((o) => o.id === item.id);
    if (!ov) return item;
    const merged: Record<string, unknown> = { ...item };
    // hanya timpa bila override punya nilai (bukan undefined)
    Object.entries(ov).forEach(([k, v]) => {
      if (k !== "id" && v !== undefined && v !== null && v !== "") {
        merged[k] = v;
      }
    });
    return merged as T;
  });
}

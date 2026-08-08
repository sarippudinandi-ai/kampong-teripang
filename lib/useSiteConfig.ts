"use client";

import { useEffect, useState } from "react";

export interface SiteConfig {
  whatsapp_number: string;
  business_name: string;
}

const DEFAULT_CONFIG: SiteConfig = {
  whatsapp_number: "6283161259104",
  business_name: "MeLamun Villa",
};

// Simple module-level cache so multiple components share one fetch
let cached: SiteConfig | null = null;
let inflight: Promise<SiteConfig> | null = null;

async function loadConfig(): Promise<SiteConfig> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetch("/api/site-config")
    .then((res) => res.json())
    .then((json) => {
      cached = json?.config || DEFAULT_CONFIG;
      return cached as SiteConfig;
    })
    .catch(() => DEFAULT_CONFIG)
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Clears the cache (call after admin updates the config).
 */
export function invalidateSiteConfig() {
  cached = null;
}

/**
 * Hook returning the global site config (WhatsApp number, business name).
 * Falls back to sane defaults so the UI never breaks.
 */
export function useSiteConfig(): SiteConfig {
  const [config, setConfig] = useState<SiteConfig>(cached || DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;
    loadConfig().then((c) => {
      if (mounted) setConfig(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return config;
}

/**
 * Builds a wa.me link from the global number + optional message.
 */
export function buildWaLink(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

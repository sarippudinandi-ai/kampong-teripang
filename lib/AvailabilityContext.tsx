"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { DayAvailability } from "./availability";

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchAvailability(): Promise<{ data: DayAvailability[]; source: string }> {
  try {
    const res = await fetch("/api/availability", {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      console.error("[Availability] API error:", res.status, await res.text());
      return { data: [], source: "api-error" };
    }
    const json = await res.json();
    if (Array.isArray(json)) {
      console.log("[Availability] Loaded from DB:", json.length, "records");
      return { data: json, source: "database" };
    }
    return { data: [], source: "empty" };
  } catch (err) {
    console.error("[Availability] Fetch failed:", err);
    return { data: [], source: "fetch-error" };
  }
}

async function upsertDay(day: DayAvailability): Promise<boolean> {
  try {
    const res = await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(day),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("[Availability] Upsert error:", json);
      return false;
    }
    console.log("[Availability] Saved:", day.tanggal);
    return true;
  } catch (err) {
    console.error("[Availability] Upsert failed:", err);
    return false;
  }
}

async function deleteDay(tanggal: string): Promise<boolean> {
  try {
    const res = await fetch("/api/availability", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tanggal }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface AvailabilityContextType {
  data: DayAvailability[];
  loading: boolean;
  source: string;
  updateDay: (day: DayAvailability) => Promise<void>;
  removeDay: (tanggal: string) => Promise<void>;
  resetAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | null>(null);

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  // Mulai dengan array kosong — TIDAK pakai defaultAvailability
  // supaya data dari DB yang selalu menang
  const [data, setData] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("init");

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await fetchAvailability();
    setData(result.data);
    setSource(result.source);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateDay = useCallback(async (day: DayAvailability) => {
    const hasBooking = day.rooms.some(
      (r) => r.status === "terpesan" || r.status === "maintenance"
    );

    // Optimistic update dulu
    setData((prev) => {
      const filtered = prev.filter((d) => d.tanggal !== day.tanggal);
      return hasBooking ? [...filtered, day] : filtered;
    });

    // Simpan ke DB
    let ok: boolean;
    if (hasBooking) {
      ok = await upsertDay(day);
    } else {
      ok = await deleteDay(day.tanggal);
    }

    // Kalau gagal, refresh dari DB untuk konsistensi
    if (!ok) {
      console.warn("[Availability] Save failed, refreshing from DB...");
      await refresh();
    }
  }, [refresh]);

  const removeDay = useCallback(async (tanggal: string) => {
    setData((prev) => prev.filter((d) => d.tanggal !== tanggal));
    const ok = await deleteDay(tanggal);
    if (!ok) await refresh();
  }, [refresh]);

  const resetAll = useCallback(async () => {
    const current = [...data];
    setData([]);
    await Promise.all(current.map((d) => deleteDay(d.tanggal)));
  }, [data]);

  return (
    <AvailabilityContext.Provider
      value={{ data, loading, source, updateDay, removeDay, resetAll, refresh }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
}

export function useAvailability() {
  const ctx = useContext(AvailabilityContext);
  if (!ctx) throw new Error("useAvailability must be used inside AvailabilityProvider");
  return ctx;
}

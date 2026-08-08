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
  updating: boolean;
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
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAvailability();
      setData(result.data);
      setSource(result.source);
    } catch (error) {
      console.error('[Availability] Refresh error:', error);
      setSource('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      if (!mounted) return;
      
      setLoading(true);
      try {
        const result = await fetchAvailability();
        
        if (mounted && !controller.signal.aborted) {
          setData(result.data);
          setSource(result.source);
        }
      } catch (error) {
        if (mounted && !controller.signal.aborted) {
          console.error('[Availability] Initial load error:', error);
          setSource('error');
        }
      } finally {
        if (mounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const updateDay = useCallback(async (day: DayAvailability) => {
    // Prevent concurrent updates
    if (updating) {
      console.warn('[Availability] Update already in progress, skipping');
      return;
    }

    setUpdating(true);

    const hasBooking = day.rooms.some(
      (r) => r.status === "terpesan" || r.status === "maintenance"
    );

    // Save previous state for rollback
    const previousData = [...data];

    try {
      // Optimistic update
      setData((prev) => {
        const filtered = prev.filter((d) => d.tanggal !== day.tanggal);
        return hasBooking ? [...filtered, day] : filtered;
      });

      // Attempt to save to DB
      let success: boolean;
      if (hasBooking) {
        success = await upsertDay(day);
      } else {
        success = await deleteDay(day.tanggal);
      }

      if (!success) {
        throw new Error('Failed to save to database');
      }

      console.log('[Availability] Update successful:', day.tanggal);
    } catch (error) {
      console.error('[Availability] Update failed, rolling back:', error);
      
      // Rollback to previous state
      setData(previousData);
      
      // Refresh from DB to ensure consistency
      await refresh();
      
      throw error; // Re-throw untuk error handling di component
    } finally {
      setUpdating(false);
    }
  }, [data, updating, refresh]);

  const removeDay = useCallback(async (tanggal: string) => {
    if (updating) {
      console.warn('[Availability] Update in progress, skipping delete');
      return;
    }

    setUpdating(true);
    const previousData = [...data];

    try {
      // Optimistic update
      setData((prev) => prev.filter((d) => d.tanggal !== tanggal));
      
      const success = await deleteDay(tanggal);
      
      if (!success) {
        throw new Error('Failed to delete from database');
      }
    } catch (error) {
      console.error('[Availability] Delete failed, rolling back:', error);
      setData(previousData);
      await refresh();
    } finally {
      setUpdating(false);
    }
  }, [data, updating, refresh]);

  const resetAll = useCallback(async () => {
    if (updating) {
      console.warn('[Availability] Update in progress, skipping reset');
      return;
    }

    setUpdating(true);
    const previousData = [...data];

    try {
      // Optimistic update
      setData([]);
      
      // Delete all from DB
      await Promise.all(previousData.map((d) => deleteDay(d.tanggal)));
      
      console.log('[Availability] Reset complete');
    } catch (error) {
      console.error('[Availability] Reset failed:', error);
      setData(previousData);
    } finally {
      setUpdating(false);
    }
  }, [data, updating]);

  return (
    <AvailabilityContext.Provider
      value={{ data, loading, updating, source, updateDay, removeDay, resetAll, refresh }}
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

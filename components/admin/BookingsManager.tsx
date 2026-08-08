"use client";

import { useState } from "react";
import { ListChecks, History } from "lucide-react";
import BookingsRealtimeList from "./BookingsRealtimeList";
import BookingsHistory from "./BookingsHistory";

export default function BookingsManager() {
  const [tab, setTab] = useState<"active" | "history">("active");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("active")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
            tab === "active"
              ? "btn-gold"
              : "glass text-white/60 hover:text-white"
          }`}
        >
          <ListChecks size={16} />
          Booking Aktif
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
            tab === "history"
              ? "btn-gold"
              : "glass text-white/60 hover:text-white"
          }`}
        >
          <History size={16} />
          Riwayat
        </button>
      </div>

      {/* Tab Content */}
      {tab === "active" ? <BookingsRealtimeList /> : <BookingsHistory />}
    </div>
  );
}

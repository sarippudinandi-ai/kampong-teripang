"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAvailability } from "@/lib/AvailabilityContext";
import {
  VILLA_ROOMS,
  PAKET_GROUPS,
  RoomId,
  countAvailable,
  countAvailableByPaket,
  getDayColor,
  formatDateKey,
  DayAvailability,
} from "@/lib/availability";

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

interface Props {
  isAdmin?: boolean;
}

export default function AvailabilityCalendar({ isAdmin = false }: Props) {
  const { data, updateDay, removeDay, loading, source, refresh } = useAvailability();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editRooms, setEditRooms] = useState<DayAvailability["rooms"]>([]);
  const [saving, setSaving] = useState(false);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const getDayData = (day: number) =>
    data.find((d) => d.tanggal === formatDateKey(viewYear, viewMonth, day));

  const handleDayClick = (day: number) => {
    const dateKey = formatDateKey(viewYear, viewMonth, day);
    const isPast = new Date(dateKey) < new Date(today.toDateString());
    if (isPast && !isAdmin) return;

    setSelectedDate(selectedDate === dateKey ? null : dateKey);

    if (isAdmin) {
      const existing = data.find((d) => d.tanggal === dateKey);
      const rooms = VILLA_ROOMS.map((room) => {
        const found = existing?.rooms.find((r) => r.roomId === room.id);
        return found ?? { roomId: room.id as RoomId, status: "tersedia" as const };
      });
      setEditRooms(rooms);
    }
  };

  const handleRoomStatus = (roomId: RoomId, status: "tersedia" | "terpesan" | "maintenance") => {
    setEditRooms((prev) => prev.map((r) => r.roomId === roomId ? { ...r, status } : r));
  };

  const handleRoomField = (roomId: RoomId, field: "namaTamu" | "catatan", value: string) => {
    setEditRooms((prev) => prev.map((r) => r.roomId === roomId ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    await updateDay({ tanggal: selectedDate, rooms: editRooms });
    // Refresh dari DB untuk konfirmasi data tersimpan
    await refresh();
    setSaving(false);
    setSelectedDate(null);
  };

  const handleClear = async () => {
    if (!selectedDate) return;
    setSaving(true);
    await removeDay(selectedDate);
    await refresh();
    setSaving(false);
    setSelectedDate(null);
  };

  // ── Warna sel ──────────────────────────────────────────────────────────────
  const getCellClass = (day: number): string => {
    const dateKey = formatDateKey(viewYear, viewMonth, day);
    const isPast = new Date(dateKey) < new Date(today.toDateString());
    const isToday = dateKey === formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = selectedDate === dateKey;
    const dayData = getDayData(day);
    const color = getDayColor(dayData);

    if (isPast) return "bg-white/5 text-white/20 cursor-default";

    let base = "";
    if (color === "full") {
      base = "bg-red-500 text-white font-bold shadow-lg shadow-red-500/40 hover:bg-red-400";
    } else if (color === "almost") {
      base = "bg-orange-500/80 text-white font-semibold hover:bg-orange-500";
    } else if (color === "half") {
      base = "bg-yellow-500/40 text-yellow-200 hover:bg-yellow-500/60";
    } else if (color === "available") {
      base = "bg-green-500/20 text-green-300 hover:bg-green-500/30";
    } else {
      base = "bg-white/5 text-white/70 hover:bg-white/10";
    }

    return `${base}${isToday ? " ring-2 ring-sand" : ""}${isSelected ? " ring-2 ring-white" : ""} cursor-pointer transition-all`;
  };

  const selectedDayData = selectedDate ? data.find((d) => d.tanggal === selectedDate) ?? null : null;
  const availableCount = selectedDayData ? countAvailable(selectedDayData) : 9;

  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-white/40 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Memuat data...
            </span>
          ) : (
            <span className="text-white/40 text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${source === "database" ? "bg-green-400" : "bg-orange-400"}`} />
              {source === "database"
                ? `${data.length} tanggal dari database`
                : "Data lokal (DB belum terhubung)"}
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          className="text-white/30 hover:text-sand text-xs transition-colors"
          title="Refresh data"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Nav bulan */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Bulan sebelumnya">
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-serif text-xl text-white">{MONTHS[viewMonth]} {viewYear}</h3>
        <button onClick={nextMonth} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition-colors" aria-label="Bulan berikutnya">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Header hari */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-white/40 text-xs font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dayData = getDayData(day);
          const avail = dayData ? countAvailable(dayData) : 9;
          const color = getDayColor(dayData);

          return (
            <button
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`relative aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 ${getCellClass(day)}`}
              title={`${day} ${MONTHS[viewMonth]} — ${avail}/9 kamar tersedia`}
            >
              <span className="text-sm leading-none">{day}</span>
              {/* 9 dot indikator kamar */}
              {color !== "empty" && (
                <div className="flex gap-px flex-wrap justify-center w-5">
                  {VILLA_ROOMS.map((room) => {
                    const rd = dayData?.rooms.find((r) => r.roomId === room.id);
                    const booked = rd?.status === "terpesan" || rd?.status === "maintenance";
                    return (
                      <span key={room.id} className={`w-1 h-1 rounded-full ${booked ? "bg-white/30" : "bg-white"}`} />
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white/10" /><span className="text-white/50">Semua tersedia (9)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/30" /><span className="text-white/50">Tersedia (6-8)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500/40" /><span className="text-white/50">Tersedia (3-5)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/80" /><span className="text-white/50">Sisa 1-2 kamar</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-white/50">FULL (0 kamar)</span></div>
      </div>

      {/* ── Detail panel (pengunjung) ── */}
      {!isAdmin && selectedDate && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
          <div className="bg-ocean-teal/20 px-4 py-3 flex items-center justify-between">
            <p className="text-white text-sm font-medium">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              availableCount === 0 ? "bg-red-500 text-white"
              : availableCount <= 2 ? "bg-orange-500 text-white"
              : "bg-green-500/30 text-green-300"
            }`}>
              {availableCount === 0 ? "FULL" : `${availableCount}/9 tersedia`}
            </span>
          </div>

          {/* Per paket */}
          {PAKET_GROUPS.map((group) => {
            const availPaket = countAvailableByPaket(selectedDayData, group.paket);
            return (
              <div key={group.paket} className="border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/5">
                  <p className="text-white/80 text-sm font-medium">{group.paket}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    availPaket === 0 ? "bg-red-500/20 text-red-400"
                    : availPaket === 1 ? "bg-orange-500/20 text-orange-400"
                    : "bg-green-500/15 text-green-400"
                  }`}>
                    {availPaket === 0 ? "Penuh" : `${availPaket}/3 kamar`}
                  </span>
                </div>
                {group.rooms.map((roomId) => {
                  const room = VILLA_ROOMS.find((r) => r.id === roomId)!;
                  const rd = selectedDayData?.rooms.find((r) => r.roomId === roomId);
                  const status = rd?.status ?? "tersedia";
                  return (
                    <div key={roomId} className="flex items-center justify-between px-6 py-2 bg-white/3">
                      <p className="text-white/50 text-xs">{room.nama}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        status === "tersedia" ? "bg-green-500/15 text-green-400"
                        : status === "terpesan" ? "bg-red-500/15 text-red-400"
                        : "bg-yellow-500/15 text-yellow-400"
                      }`}>
                        {status === "tersedia" ? "✓ Tersedia" : status === "terpesan" ? "✗ Terpesan" : "⚠ Maintenance"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="px-4 py-3 bg-white/3 flex items-center justify-between">
            <button onClick={() => setSelectedDate(null)} className="text-white/30 text-xs hover:text-white/60">Tutup</button>
            {availableCount > 0 && (
              <a href="/villa#booking" className="btn-gold text-xs px-4 py-1.5 rounded-full font-semibold">
                Pesan Sekarang →
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Admin edit panel ── */}
      {isAdmin && selectedDate && (
        <div className="mt-4 rounded-2xl overflow-hidden border border-white/10">
          <div className="bg-ocean-teal/20 px-4 py-3">
            <p className="text-white text-sm font-medium">
              Edit: {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <p className="text-white/40 text-xs mt-0.5">Perubahan langsung sync ke halaman utama</p>
          </div>

          {/* Edit per paket */}
          {PAKET_GROUPS.map((group) => (
            <div key={group.paket} className="border-b border-white/5 last:border-0">
              <div className="px-4 py-2 bg-white/5">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{group.paket}</p>
              </div>
              {group.rooms.map((roomId) => {
                const room = VILLA_ROOMS.find((r) => r.id === roomId)!;
                const roomEdit = editRooms.find((r) => r.roomId === roomId) ?? {
                  roomId: roomId as RoomId, status: "tersedia" as const,
                };
                return (
                  <div key={roomId} className="px-4 py-3 bg-white/3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-white/70 text-xs">{room.nama}</p>
                      <select
                        value={roomEdit.status}
                        onChange={(e) => handleRoomStatus(roomId as RoomId, e.target.value as "tersedia" | "terpesan" | "maintenance")}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-sand"
                      >
                        <option value="tersedia" className="bg-ocean-deep">✓ Tersedia</option>
                        <option value="terpesan" className="bg-ocean-deep">✗ Terpesan</option>
                        <option value="maintenance" className="bg-ocean-deep">⚠ Maintenance</option>
                      </select>
                    </div>
                    {roomEdit.status === "terpesan" && (
                      <input
                        type="text"
                        value={roomEdit.namaTamu ?? ""}
                        onChange={(e) => handleRoomField(roomId as RoomId, "namaTamu", e.target.value)}
                        placeholder="Nama tamu (opsional)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sand placeholder-white/20"
                      />
                    )}
                    {roomEdit.status === "maintenance" && (
                      <input
                        type="text"
                        value={roomEdit.catatan ?? ""}
                        onChange={(e) => handleRoomField(roomId as RoomId, "catatan", e.target.value)}
                        placeholder="Catatan maintenance"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-sand placeholder-white/20"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <div className="px-4 py-3 bg-white/3 flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-gold flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
              {saving ? "Menyimpan..." : "✓ Simpan ke Database"}
            </button>
            <button onClick={handleClear} disabled={saving} className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-colors disabled:opacity-60">
              Reset
            </button>
            <button onClick={() => setSelectedDate(null)} className="glass text-white/50 px-4 py-2 rounded-lg text-sm hover:text-white transition-colors">
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

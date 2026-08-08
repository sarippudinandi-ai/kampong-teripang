"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, X } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  base_price: number;
}

interface BookingRow {
  id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  booking_status: string;
  guest_name: string;
}

interface LockRow {
  room_id: string;
  check_in: string;
  check_out: string;
  expires_at: string;
}

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"];

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function RoomAvailabilityAdmin() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [locks, setLocks] = useState<LockRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  // Rentang bulan yang sedang dilihat (untuk query)
  const monthStart = dateKey(viewYear, viewMonth, 1);
  const monthEndDate = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthEnd = dateKey(viewYear, viewMonth, monthEndDate);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes, locksRes] = await Promise.all([
        supabase
          .from("rooms")
          .select("id, room_number, room_name, room_type, base_price")
          .order("floor_level")
          .order("position_order"),
        supabase
          .from("bookings")
          .select("id, room_id, check_in, check_out, booking_status, guest_name")
          .in("booking_status", ACTIVE_STATUSES)
          .lte("check_in", monthEnd)
          .gt("check_out", monthStart),
        supabase
          .from("room_locks")
          .select("room_id, check_in, check_out, expires_at")
          .gt("expires_at", new Date().toISOString())
          .lte("check_in", monthEnd)
          .gt("check_out", monthStart),
      ]);

      if (roomsRes.data) setRooms(roomsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
      if (locksRes.data) setLocks(locksRes.data);
    } catch (err) {
      console.error("[RoomAvailabilityAdmin] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [monthStart, monthEnd]);

  // Initial + saat bulan berganti
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // REAL-TIME SYNC: refetch saat bookings / room_locks berubah
  useEffect(() => {
    const channel = supabase
      .channel("avail-admin-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_locks" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const totalRooms = rooms.length || 9;

  // Hitung jumlah kamar terisi (booking + lock) pada satu tanggal
  const occupiedOnDate = (dk: string): number => {
    const occupiedRoomIds = new Set<string>();
    bookings.forEach((b) => {
      if (b.check_in <= dk && b.check_out > dk) occupiedRoomIds.add(b.room_id);
    });
    locks.forEach((l) => {
      if (l.check_in <= dk && l.check_out > dk) occupiedRoomIds.add(l.room_id);
    });
    return occupiedRoomIds.size;
  };

  const availableOnDate = (dk: string): number =>
    Math.max(0, totalRooms - occupiedOnDate(dk));

  // ── Kalender grid ──
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const getCellClass = (day: number): string => {
    const dk = dateKey(viewYear, viewMonth, day);
    const isPast = new Date(dk) < new Date(today.toDateString());
    const isToday = dk === dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = selectedDate === dk;

    if (isPast) return "bg-white/5 text-white/20 cursor-pointer";

    const avail = availableOnDate(dk);
    let base: string;
    if (avail === 0) base = "bg-red-500 text-white font-bold shadow-lg shadow-red-500/40 hover:bg-red-400";
    else if (avail <= 2) base = "bg-orange-500/80 text-white font-semibold hover:bg-orange-500";
    else if (avail <= Math.floor(totalRooms / 2)) base = "bg-yellow-500/40 text-yellow-200 hover:bg-yellow-500/60";
    else base = "bg-green-500/20 text-green-300 hover:bg-green-500/30";

    return `${base}${isToday ? " ring-2 ring-sand" : ""}${isSelected ? " ring-2 ring-white" : ""} cursor-pointer transition-all`;
  };

  // Daftar kamar + status untuk tanggal terpilih
  const roomsStatusForSelected = () => {
    if (!selectedDate) return [];
    return rooms.map((room) => {
      const booking = bookings.find(
        (b) => b.room_id === room.id && b.check_in <= selectedDate && b.check_out > selectedDate
      );
      const lock = locks.find(
        (l) => l.room_id === room.id && l.check_in <= selectedDate && l.check_out > selectedDate
      );
      let status: "available" | "booked" | "locked" = "available";
      if (booking) status = "booked";
      else if (lock) status = "locked";
      return { room, status, booking };
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── KIRI: Kalender Okupansi ── */}
        <div className="glass rounded-3xl p-5 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/40 text-xs flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${loading ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
              {loading ? "Memuat okupansi..." : `${totalRooms} kamar · real-time`}
            </span>
            <button
              onClick={fetchData}
              className="text-white/30 hover:text-sand text-xs transition-colors flex items-center gap-1"
              title="Refresh"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>

          {/* Nav bulan */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prevMonth} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-serif text-xl text-white">{MONTHS[viewMonth]} {viewYear}</h3>
            <button onClick={nextMonth} className="w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10 transition-colors">
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
              const dk = dateKey(viewYear, viewMonth, day);
              const avail = availableOnDate(dk);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(selectedDate === dk ? null : dk)}
                  className={`relative aspect-square rounded-xl text-sm flex flex-col items-center justify-center gap-0.5 ${getCellClass(day)}`}
                  title={`${day} ${MONTHS[viewMonth]} — ${avail}/${totalRooms} kamar tersedia`}
                >
                  <span className="text-sm leading-none">{day}</span>
                  <span className="text-[9px] opacity-80">{avail}/{totalRooms}</span>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/30" /><span className="text-white/50">Banyak tersedia</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-500/40" /><span className="text-white/50">Separuh</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/80" /><span className="text-white/50">Sisa 1-2</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-500" /><span className="text-white/50">FULL</span></div>
          </div>
        </div>

        {/* ── KANAN: Detail tanggal + tombol Manual Booking ── */}
        <div className="glass rounded-3xl p-6">
          {!selectedDate ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <span className="text-3xl mb-2">📅</span>
              <p className="text-white/60 font-medium">Pilih tanggal di kalender</p>
              <p className="text-white/30 text-xs mt-1">
                Lihat status kamar & buat booking manual untuk tanggal itu
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5">
                    {availableOnDate(selectedDate)}/{totalRooms} kamar tersedia
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-gold px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5"
                >
                  <Plus size={16} /> Booking Manual
                </button>
              </div>

              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {roomsStatusForSelected().map(({ room, status, booking }) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between px-4 py-2.5 bg-white/5 rounded-xl"
                  >
                    <div>
                      <p className="text-white/80 text-sm">{room.room_name}</p>
                      <p className="text-white/30 text-xs">
                        {room.room_number} · {booking ? booking.guest_name : "—"}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        status === "available"
                          ? "bg-green-500/15 text-green-400"
                          : status === "booked"
                          ? "bg-red-500/15 text-red-400"
                          : "bg-yellow-500/15 text-yellow-400"
                      }`}
                    >
                      {status === "available" ? "✓ Tersedia" : status === "booked" ? "✗ Terisi" : "⏳ Ditahan"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Manual Booking Form */}
      {showForm && selectedDate && (
        <ManualBookingForm
          selectedDate={selectedDate}
          rooms={rooms}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// Manual Booking Form (admin override) — memanggil POST /api/bookings
// ============================================================
function ManualBookingForm({
  selectedDate,
  rooms,
  onClose,
  onSuccess,
}: {
  selectedDate: string;
  rooms: Room[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const nextDay = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();

  const [guestName, setGuestName] = useState("");
  const [guestWa, setGuestWa] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkIn, setCheckIn] = useState(selectedDate);
  const [checkOut, setCheckOut] = useState(nextDay);
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "");
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!guestName.trim() || !guestWa.trim() || !roomId) {
      setError("Nama, WhatsApp, dan kamar wajib diisi.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("Tanggal check-out harus setelah check-in.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          // email opsional di form; API butuh format email valid -> placeholder bila kosong
          guest_email: guestEmail.trim() || `tamu+${guestWa.replace(/\D/g, "")}@kelongmelamun.local`,
          guest_wa: guestWa.replace(/\D/g, ""),
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guestCount,
          notes: notes.trim() ? `[MANUAL ADMIN] ${notes.trim()}` : "[MANUAL ADMIN]",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.details
            ? `${data.error}: ${JSON.stringify(data.details)}`
            : data?.error || "Gagal membuat booking."
        );
        return;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ocean-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 bg-ocean-mid/90 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-serif text-white">Booking Manual (Admin)</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-white/50 text-xs mb-1">Nama Tamu *</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand placeholder-white/20"
              placeholder="cth: Budi Santoso"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-xs mb-1">WhatsApp *</label>
              <input
                type="text"
                value={guestWa}
                onChange={(e) => setGuestWa(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand placeholder-white/20"
                placeholder="08123456789"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">Email (opsional)</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand placeholder-white/20"
                placeholder="opsional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-xs mb-1">Check-in *</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">Check-out *</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/50 text-xs mb-1">Kamar *</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id} className="bg-ocean-deep">
                    {r.room_name} ({r.room_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-white/50 text-xs mb-1">Jumlah Tamu</label>
              <input
                type="number"
                min={1}
                max={20}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs mb-1">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sand resize-none placeholder-white/20"
              placeholder="cth: booking via telepon"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-gold flex-1 py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                "Buat Booking"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="glass px-5 py-3 rounded-xl text-white/60 hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

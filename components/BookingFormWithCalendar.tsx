"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Room {
  room_id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  base_price: number;
  amenities: string[];
  photo_url: string;
  is_available: boolean;
}

export default function BookingFormWithCalendar() {
  const router = useRouter();

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestWa, setGuestWa] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [roomType, setRoomType] = useState<string>("standard");

  // UI state
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);

  // Soft-lock: session id unik per tab browser (Module 03)
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return "ssr-session";
    const existing = sessionStorage.getItem("booking_session_id");
    if (existing) return existing;
    const id =
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem("booking_session_id", id);
    return id;
  });
  const [lockedRoomId, setLockedRoomId] = useState<string>("");

  // Lepas soft-lock saat komponen unmount / pengguna meninggalkan halaman
  useEffect(() => {
    return () => {
      try {
        fetch("/api/rooms/lock", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locked_by: sessionId }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // abaikan
      }
    };
  }, [sessionId]);

  // Room type options
  const roomTypes = [
    { value: "standard", label: "Sea Healing Room (Standard)", price: 850000 },
    { value: "deluxe", label: "Kelong Deluxe Suite", price: 1350000 },
    { value: "family", label: "Family Kelong House", price: 2200000 },
  ];

  // Set minimum check-in date to today
  const today = new Date().toISOString().split("T")[0];

  // Calculate nights and price when dates change
  useEffect(() => {
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nightCount = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (nightCount > 0) {
        setNights(nightCount);

        // Calculate price based on selected room
        if (selectedRoomId && availableRooms.length > 0) {
          const room = availableRooms.find((r) => r.room_id === selectedRoomId);
          if (room) {
            setTotalPrice(nightCount * room.base_price);
          }
        } else {
          // Use default price for room type
          const roomTypeData = roomTypes.find((rt) => rt.value === roomType);
          if (roomTypeData) {
            setTotalPrice(nightCount * roomTypeData.price);
          }
        }
      }
    }
  }, [checkIn, checkOut, selectedRoomId, availableRooms, roomType]);

  // Fetch available rooms when dates or room type change
  useEffect(() => {
    if (checkIn && checkOut && checkOut > checkIn) {
      fetchAvailableRooms();
    }
  }, [checkIn, checkOut, roomType]);

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    setError("");

    try {
      // FAIL-SAFE: bersihkan booking pending kadaluarsa sebelum cek ketersediaan.
      // Fire-and-forget (tidak memblok UI). Membuat kamar yang locknya sudah
      // lewat 30 menit kembali hijau secara otomatis tanpa pg_cron.
      try {
        await fetch("/api/cron/expire-bookings", {
          method: "POST",
          headers: { "x-internal-sweep": "1" },
        });
      } catch {
        // abaikan kegagalan sweep — cek ketersediaan tetap lanjut
      }

      // DEBUG: Log parameters being sent
      console.log("🔍 Fetching rooms with params:", {
        check_in: checkIn,
        check_out: checkOut,
        filter_type: roomType || null,
      });

      // Call PostgreSQL RPC function
      // Note: input param renamed to 'filter_type' to avoid conflict with
      // the 'room_type' output column in RETURNS TABLE (Postgres 42P13).
      const { data, error } = await supabase.rpc("get_available_rooms_v2", {
        check_in: checkIn,
        check_out: checkOut,
        filter_type: roomType || null,
      });

      console.log("📦 RPC Response:", { data, error });

      if (error) {
        console.error("Error fetching rooms:", error);
        setError("Gagal mengecek ketersediaan kamar");
        setAvailableRooms([]);
        return;
      }

      // Filter only available rooms
      const available = data?.filter((room: any) => room.is_available) || [];
      setAvailableRooms(available);

      // Auto-select first available room
      if (available.length > 0) {
        setSelectedRoomId(available[0].room_id);
      } else {
        setSelectedRoomId("");
        setError("Tidak ada kamar tersedia untuk tanggal yang dipilih");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Terjadi kesalahan saat mengecek ketersediaan");
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Pilih kamar + soft-lock real-time (Module 03).
  // Klik kamar kosong -> backend menahan kamar 10 menit di semua perangkat.
  const selectRoomAndLock = async (roomId: string) => {
    setSelectedRoomId(roomId);

    if (!checkIn || !checkOut) return;

    try {
      const res = await fetch("/api/rooms/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: roomId,
          check_in: checkIn,
          check_out: checkOut,
          locked_by: sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.locked) {
        // Ditolak: kamar baru saja ditahan/dipesan orang lain
        setError(
          data.message ||
            "Kamar baru saja ditahan orang lain. Memuat ulang ketersediaan..."
        );
        setSelectedRoomId("");
        setLockedRoomId("");
        fetchAvailableRooms();
        return;
      }

      setLockedRoomId(roomId);
      setError("");
    } catch {
      // Degradasi anggun: jika lock gagal, tetap izinkan lanjut
      setLockedRoomId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate form
      if (!guestName || !guestEmail || !guestWa) {
        setError("Mohon lengkapi data tamu");
        setLoading(false);
        return;
      }

      if (!checkIn || !checkOut || checkOut <= checkIn) {
        setError("Tanggal check-in dan check-out tidak valid");
        setLoading(false);
        return;
      }

      if (!selectedRoomId) {
        setError("Mohon pilih kamar");
        setLoading(false);
        return;
      }

      // Create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guest_name: guestName,
          guest_email: guestEmail,
          guest_wa: guestWa,
          room_id: selectedRoomId,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guestCount,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Gagal membuat reservasi");
        setLoading(false);
        return;
      }

      // Success - booking PENDING sudah menahan kamar, lepas soft-lock
      try {
        await fetch("/api/rooms/lock", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locked_by: sessionId }),
        });
      } catch {
        // abaikan, lock akan kadaluarsa sendiri
      }

      // Redirect to checkout page
      router.push(`/checkout/${data.booking.booking_id}`);
    } catch (err) {
      console.error("Booking error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 sm:p-8 space-y-6">
      <h2 className="text-2xl font-serif text-white mb-6">
        Booking Kamar Villa
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              No. WhatsApp *
            </label>
            <input
              type="tel"
              value={guestWa}
              onChange={(e) => setGuestWa(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
              placeholder="628123456789"
              required
            />
            <p className="text-xs text-white/40 mt-1">
              Contoh: 628123456789 (gunakan kode negara)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Jumlah Tamu *
            </label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(parseInt(e.target.value))}
              min="1"
              max="20"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
              required
            />
          </div>
        </div>

        {/* Room Type Selection */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Tipe Kamar *
          </label>
          <select
            value={roomType}
            onChange={(e) => {
              setRoomType(e.target.value);
              setSelectedRoomId(""); // Reset room selection
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
          >
            {roomTypes.map((type) => (
              <option key={type.value} value={type.value} className="bg-ocean-deep">
                {type.label} - Rp {type.price.toLocaleString("id-ID")}/malam
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Check-in *
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={today}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Check-out *
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || today}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
              required
            />
          </div>
        </div>

        {/* Available Rooms Display */}
        {loadingRooms && (
          <div className="text-center py-4">
            <p className="text-white/60">Mengecek ketersediaan kamar...</p>
          </div>
        )}

        {!loadingRooms && availableRooms.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Pilih Kamar ({availableRooms.length} tersedia)
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              {availableRooms.map((room) => (
                <div
                  key={room.room_id}
                  onClick={() => selectRoomAndLock(room.room_id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedRoomId === room.room_id
                      ? "border-sand bg-sand/10"
                      : "border-white/10 bg-white/5 hover:border-sand/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-white">
                        {room.room_number}
                      </h4>
                      <p className="text-sm text-white/60">{room.room_name}</p>
                      <p className="text-sm text-white/40 mt-1">
                        Kapasitas: {room.capacity} orang
                      </p>
                      <p className="text-sm font-medium text-sand mt-2">
                        Rp {room.base_price.toLocaleString("id-ID")}/malam
                      </p>
                    </div>
                    {selectedRoomId === room.room_id && (
                      <div className="flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-sand"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Catatan (Opsional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors resize-none"
            placeholder="Permintaan khusus atau informasi tambahan"
          />
        </div>

        {/* Price Summary */}
        {nights > 0 && totalPrice > 0 && (
          <div className="bg-ocean-teal/20 border border-ocean-teal/30 p-4 rounded-xl">
            <h3 className="font-semibold text-white mb-2">
              Ringkasan Harga
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">{nights} malam</span>
                <span className="text-white">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-base">
                  <span className="text-white">Total</span>
                  <span className="text-sand font-serif text-lg">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedRoomId || loadingRooms}
          className="btn-gold w-full py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading
            ? "Memproses..."
            : loadingRooms
            ? "Mengecek ketersediaan..."
            : "Lanjutkan ke Pembayaran"}
        </button>

        <p className="text-white/30 text-xs text-center">
          Setelah submit, Anda akan diarahkan ke halaman checkout untuk konfirmasi pembayaran via WhatsApp
        </p>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Users,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  X,
} from "lucide-react";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  floor_level: number;
  position_order: number;
  base_price: number;
  status: string;
}

interface RoomWithBooking extends Room {
  current_booking?: {
    id: string;
    booking_id: string;
    guest_name: string;
    guest_wa: string;
    booking_status: string;
    payment_status: string;
    check_in: string;
    check_out: string;
    total_price: number;
  };
  active_lock?: {
    id: string;
    locked_by: string;
    is_admin: boolean;
    expires_at: string;
  };
}

export default function CinemaRoomGridUpgraded() {
  const [rooms, setRooms] = useState<RoomWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBooking | null>(null);
  const [showModal, setShowModal] = useState(false);
  // Tanggal yang sedang dilihat (Blueprint #2: klik tanggal -> grid berubah)
  const [viewDate, setViewDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchRooms();

    // Setup Realtime subscription
    const channel = supabase
      .channel("rooms-bookings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          console.log("[Realtime] Booking changed, refreshing rooms...");
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          console.log("[Realtime] Room changed, refreshing...");
          fetchRooms();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_locks" },
        () => {
          console.log("[Realtime] Lock changed, refreshing...");
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewDate]);

  const fetchRooms = async () => {
    try {
      // Get all rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .order("floor_level")
        .order("position_order");

      if (roomsError) {
        console.error("Error fetching rooms:", roomsError);
        return;
      }

      // Get bookings yang aktif pada tanggal yang dipilih (viewDate)
      // Booking aktif bila: check_in <= viewDate < check_out
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("booking_status", ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"])
        .lte("check_in", viewDate)
        .gt("check_out", viewDate);

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      }

      // Get active soft-locks overlapping viewDate (Module 03)
      // Lock aktif bila: expires_at > now DAN check_in <= viewDate < check_out
      const nowIso = new Date().toISOString();
      const { data: locksData } = await supabase
        .from("room_locks")
        .select("*")
        .gt("expires_at", nowIso)
        .lte("check_in", viewDate)
        .gt("check_out", viewDate);

      // Merge rooms with current bookings + active locks
      const roomsWithBookings: RoomWithBooking[] = (roomsData || []).map((room) => {
        const currentBooking = (bookingsData || []).find(
          (booking) => booking.room_id === room.id
        );

        const activeLock = (locksData || []).find(
          (lock) => lock.room_id === room.id
        );

        return {
          ...room,
          current_booking: currentBooking
            ? {
                id: currentBooking.id,
                booking_id: currentBooking.booking_id,
                guest_name: currentBooking.guest_name,
                guest_wa: currentBooking.guest_wa,
                booking_status: currentBooking.booking_status,
                payment_status: currentBooking.payment_status,
                check_in: currentBooking.check_in,
                check_out: currentBooking.check_out,
                total_price: currentBooking.total_price,
              }
            : undefined,
          active_lock: activeLock
            ? {
                id: activeLock.id,
                locked_by: activeLock.locked_by,
                is_admin: activeLock.is_admin,
                expires_at: activeLock.expires_at,
              }
            : undefined,
        };
      });

      setRooms(roomsWithBookings);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
    }
  };

  // Admin soft-lock: tahan kamar kosong untuk viewDate agar tak diserobot online
  const handleAdminLock = async (room: RoomWithBooking) => {
    const nextDay = new Date(viewDate + "T00:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const checkOut = nextDay.toISOString().split("T")[0];

    try {
      const res = await fetch("/api/rooms/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: room.id,
          check_in: viewDate,
          check_out: checkOut,
          locked_by: "admin",
          is_admin: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.locked) {
        // Tampilkan error spesifik dari server, bukan tebakan
        const msg =
          data.message ||
          data.error ||
          (data.details ? JSON.stringify(data.details) : null) ||
          "Gagal menahan kamar.";
        alert(msg);
        return;
      }
      setShowModal(false);
      fetchRooms();
    } catch {
      alert("Gagal menahan kamar.");
    }
  };

  // Lepas semua soft-lock admin
  const handleAdminUnlock = async () => {
    try {
      await fetch("/api/rooms/lock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked_by: "admin" }),
      });
      setShowModal(false);
      fetchRooms();
    } catch {
      alert("Gagal melepas lock.");
    }
  };

  const getRoomColor = (room: RoomWithBooking): string => {
    // Priority 1: Check if there's an active booking
    if (room.current_booking) {
      const { booking_status, payment_status } = room.current_booking;

      // Kuning = Booked tapi PENDING_PAYMENT
      if (booking_status === "PENDING_PAYMENT" && payment_status === "UNPAID") {
        return "bg-yellow-500/80 hover:bg-yellow-500 border-yellow-400/60";
      }

      // Merah = CONFIRMED (paid) or CHECKED_IN
      if (
        (booking_status === "CONFIRMED" && payment_status === "PAID") ||
        booking_status === "CHECKED_IN"
      ) {
        return "bg-red-500/80 hover:bg-red-500 border-red-400/60";
      }
    }

    // Priority 1.5: Soft-lock aktif (ditahan sementara) = kuning
    if (room.active_lock) {
      return "bg-yellow-500/70 hover:bg-yellow-500 border-yellow-400/60";
    }

    // Priority 2: Check room status
    if (room.status === "maintenance") {
      return "bg-orange-500/80 hover:bg-orange-500 border-orange-400/60";
    }

    if (room.status === "blocked") {
      return "bg-white/10 hover:bg-white/20 border-white/20";
    }

    // Default: Hijau = Available
    return "bg-emerald-500/80 hover:bg-emerald-500 border-emerald-400/60";
  };

  const getRoomIcon = (room: RoomWithBooking) => {
    if (room.current_booking) {
      const { booking_status } = room.current_booking;

      if (booking_status === "PENDING_PAYMENT") {
        return <Clock size={20} className="text-white" />;
      }

      if (booking_status === "CONFIRMED" || booking_status === "CHECKED_IN") {
        return <Users size={20} className="text-white" />;
      }
    }

    if (room.status === "maintenance") {
      return <Wrench size={20} className="text-white" />;
    }

    if (room.status === "blocked") {
      return <XCircle size={20} className="text-white/70" />;
    }

    return <CheckCircle size={20} className="text-white" />;
  };

  const getRoomLabel = (room: RoomWithBooking): string => {
    if (room.current_booking) {
      const { booking_status } = room.current_booking;

      if (booking_status === "PENDING_PAYMENT") {
        return "Pending Payment";
      }

      if (booking_status === "CONFIRMED") {
        return "Confirmed";
      }

      if (booking_status === "CHECKED_IN") {
        return "Checked In";
      }
    }

    if (room.status === "maintenance") {
      return "Maintenance";
    }

    if (room.status === "blocked") {
      return "Blocked";
    }

    if (room.active_lock) {
      return room.active_lock.is_admin ? "Ditahan Admin" : "Ditahan";
    }

    return "Available";
  };

  const handleRoomClick = (room: RoomWithBooking) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  const openWhatsApp = (waNumber: string, guestName: string) => {
    const message = encodeURIComponent(
      `Halo ${guestName}, terima kasih telah menginap di Kelong Melamun.`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  // Group rooms by floor
  const groupedRooms = rooms.reduce((acc, room) => {
    if (!acc[room.floor_level]) {
      acc[room.floor_level] = [];
    }
    acc[room.floor_level].push(room);
    return acc;
  }, {} as Record<number, RoomWithBooking[]>);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sand mx-auto mb-4"></div>
        <p className="text-white/50">Memuat data kamar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Picker — Blueprint #2: klik/pilih tanggal, grid langsung berubah */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
              Tanggal Ditampilkan
            </h3>
            <p className="text-sm text-white/70">
              Status kamar untuk tanggal terpilih (dari data booking real-time)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(viewDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                setViewDate(d.toISOString().split("T")[0]);
              }}
              className="px-3 py-2 glass rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Hari sebelumnya"
            >
              ‹
            </button>
            <input
              type="date"
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-sand transition-colors [color-scheme:dark]"
            />
            <button
              onClick={() => {
                const d = new Date(viewDate + "T00:00:00");
                d.setDate(d.getDate() + 1);
                setViewDate(d.toISOString().split("T")[0]);
              }}
              className="px-3 py-2 glass rounded-lg text-white/70 hover:text-white transition-colors"
              aria-label="Hari berikutnya"
            >
              ›
            </button>
            <button
              onClick={() => setViewDate(new Date().toISOString().split("T")[0])}
              className="px-3 py-2 glass rounded-lg text-sand text-sm hover:bg-white/10 transition-colors"
            >
              Hari Ini
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="glass rounded-3xl p-6">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">
          Status Kamar Cinema-Style
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500/80 rounded-md"></div>
            <span className="text-sm text-white/70">Tersedia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500/80 rounded-md"></div>
            <span className="text-sm text-white/70">Menunggu Bayar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500/80 rounded-md"></div>
            <span className="text-sm text-white/70">Terkonfirmasi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500/80 rounded-md"></div>
            <span className="text-sm text-white/70">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white/10 border border-white/20 rounded-md"></div>
            <span className="text-sm text-white/70">Diblokir</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="space-y-6">
        {Object.entries(groupedRooms)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([floor, floorRooms]) => (
            <div key={floor} className="glass rounded-3xl p-6">
              <h3 className="text-lg font-serif text-white mb-4">
                Lantai {floor}
                <span className="text-sand/80 text-sm ml-2 capitalize font-sans">
                  {floorRooms[0].room_type}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {floorRooms
                  .sort((a, b) => a.position_order - b.position_order)
                  .map((room) => (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      className={`${getRoomColor(
                        room
                      )} border rounded-xl p-4 transition-all transform hover:scale-105 hover:shadow-lg cursor-pointer`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {getRoomIcon(room)}
                        <span className="text-white font-bold text-lg">
                          {room.room_number}
                        </span>
                        <span className="text-white/90 text-xs text-center">
                          {getRoomLabel(room)}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          ))}
      </div>

      {/* Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 bg-ocean-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 bg-ocean-mid/90 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-2xl font-serif text-white">
                {selectedRoom.room_name}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Info */}
              <div>
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  Informasi Kamar
                </h3>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Nomor Kamar:</span>
                    <span className="font-medium text-white">{selectedRoom.room_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Tipe:</span>
                    <span className="font-medium text-white capitalize">
                      {selectedRoom.room_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Kapasitas:</span>
                    <span className="font-medium text-white">
                      {selectedRoom.capacity} tamu
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Harga Dasar:</span>
                    <span className="font-medium text-sand">
                      Rp {selectedRoom.base_price.toLocaleString("id-ID")}/malam
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Status:</span>
                    <span className="font-medium text-white">{getRoomLabel(selectedRoom)}</span>
                  </div>
                </div>
              </div>

              {/* Current Booking */}
              {selectedRoom.current_booking && (
                <div>
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                    Booking Saat Ini
                  </h3>
                  <div className="bg-ocean-teal/20 border border-ocean-teal/40 p-4 rounded-xl space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 font-medium">Booking ID:</span>
                      <span className="font-bold text-sand">
                        {selectedRoom.current_booking.booking_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Tamu:</span>
                      <span className="font-medium text-white">
                        {selectedRoom.current_booking.guest_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Check-in:</span>
                      <span className="font-medium text-white">
                        {new Date(
                          selectedRoom.current_booking.check_in + "T00:00:00"
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Check-out:</span>
                      <span className="font-medium text-white">
                        {new Date(
                          selectedRoom.current_booking.check_out + "T00:00:00"
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Harga:</span>
                      <span className="font-bold text-emerald-400">
                        Rp{" "}
                        {selectedRoom.current_booking.total_price.toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Status:</span>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedRoom.current_booking.booking_status ===
                            "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                          }`}
                        >
                          {selectedRoom.current_booking.booking_status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedRoom.current_booking.payment_status === "PAID"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-red-500/20 text-red-300 border border-red-500/40"
                          }`}
                        >
                          {selectedRoom.current_booking.payment_status}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() =>
                        openWhatsApp(
                          selectedRoom.current_booking!.guest_wa,
                          selectedRoom.current_booking!.guest_name
                        )
                      }
                      className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-emerald-500/90 text-white font-medium rounded-xl hover:bg-emerald-500 transition-colors"
                    >
                      <Phone size={18} />
                      Hubungi Tamu via WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* No Booking */}
              {!selectedRoom.current_booking && (
                <div className="space-y-4">
                  {selectedRoom.active_lock ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-6 rounded-xl text-center">
                      <Clock size={40} className="text-yellow-400 mx-auto mb-3" />
                      <p className="text-yellow-300 font-medium">
                        Kamar sedang ditahan
                        {selectedRoom.active_lock.is_admin ? " oleh Admin" : " oleh calon tamu"}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        Berlaku sampai{" "}
                        {new Date(selectedRoom.active_lock.expires_at).toLocaleTimeString("id-ID")}
                      </p>
                      {selectedRoom.active_lock.is_admin && (
                        <button
                          onClick={handleAdminUnlock}
                          className="mt-4 w-full py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                        >
                          Lepas Tahanan (Unlock)
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl text-center">
                        <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
                        <p className="text-emerald-300 font-medium">
                          Kamar tersedia untuk dipesan
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          Tanggal: {new Date(viewDate + "T00:00:00").toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      {/* Blueprint #5: Admin tahan kamar agar tak diserobot online */}
                      <button
                        onClick={() => handleAdminLock(selectedRoom)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500/90 text-ocean-deep font-semibold rounded-xl hover:bg-yellow-500 transition-colors"
                      >
                        <Clock size={18} />
                        Tahan Kamar (Soft-Lock 10 menit)
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

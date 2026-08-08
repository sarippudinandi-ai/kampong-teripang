"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with Realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Booking {
  id: string;
  booking_id: string;
  guest_name: string;
  guest_email: string;
  guest_wa: string;
  room_number: string;
  room_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  nights: number;
  guest_count: number;
  total_price: number;
  booking_status: string;
  payment_status: string;
  status_color: string;
  timeline_status: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  days_until_checkin: number;
}

export default function BookingsRealtimeList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // Fetch bookings (HANYA status AKTIF: pending, confirmed, checked-in)
  const ACTIVE_STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"];

  const fetchBookings = async () => {
    try {
      let query = supabase.from("vw_bookings_dashboard").select("*");

      if (filter !== "all") {
        query = query.eq("booking_status", filter);
      } else {
        // Default: tampilkan hanya booking aktif (riwayat pindah ke tab Riwayat)
        query = query.in("booking_status", ACTIVE_STATUSES);
      }

      query = query.order("created_at", { ascending: false }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bookings:", error);
        return;
      }

      setBookings(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [filter]);

  // Setup Realtime subscription
  useEffect(() => {
    console.log("[Realtime] Setting up subscription for bookings table...");

    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          console.log("[Realtime] Change detected:", payload);

          if (payload.eventType === "INSERT") {
            showNotificationToast("🎉 Booking baru masuk!");
            fetchBookings();
          } else if (payload.eventType === "UPDATE") {
            showNotificationToast("🔄 Booking diupdate");
            fetchBookings();
          } else if (payload.eventType === "DELETE") {
            showNotificationToast("🗑️ Booking dihapus");
            fetchBookings();
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
      });

    return () => {
      console.log("[Realtime] Cleaning up subscription...");
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotificationToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);

    setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    // Note: visual toast only. Audio file (/notification.mp3) intentionally
    // not played to avoid a 404 network error when the asset is absent.
  };

  const handleUpdateStatus = async (
    bookingId: string,
    bookingStatus: string,
    paymentStatus: string
  ) => {
    setUpdating(bookingId);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_status: bookingStatus,
          payment_status: paymentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show the specific server error (MISI 3)
        const msg = data?.details
          ? `${data.error}\n\nDetail: ${data.details}`
          : data?.error || "Gagal mengupdate status";
        alert(msg);
        return;
      }

      showNotificationToast("✅ Status berhasil diupdate");
    } catch (err) {
      console.error("Error updating status:", err);
      alert(
        "Gagal mengupdate status: " +
          (err instanceof Error ? err.message : "kesalahan jaringan")
      );
    } finally {
      setUpdating(null);
    }
  };

  const handleConfirmPayment = (bookingId: string) => {
    if (confirm("Konfirmasi pembayaran untuk booking ini?")) {
      handleUpdateStatus(bookingId, "CONFIRMED", "PAID");
    }
  };

  const handleCheckIn = (bookingId: string) => {
    if (confirm("Check-in tamu ini sekarang?")) {
      handleUpdateStatus(bookingId, "CHECKED_IN", "PAID");
    }
  };

  const handleCheckOut = (bookingId: string) => {
    if (confirm("Check-out tamu ini sekarang?")) {
      handleUpdateStatus(bookingId, "CHECKED_OUT", "PAID");
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    // Double-confirmation (Blueprint #5: anti human-error)
    const first = confirm("Batalkan booking ini?");
    if (!first) return;

    const second = confirm(
      "⚠️ KONFIRMASI AKHIR\n\n" +
        "Tindakan ini akan:\n" +
        "• Mengubah status menjadi CANCELLED\n" +
        "• Melepas kamar agar bisa dipesan lagi\n\n" +
        "Tindakan TIDAK BISA dibatalkan. Lanjutkan?"
    );
    if (!second) return;

    handleUpdateStatus(bookingId, "CANCELLED", "UNPAID");
  };

  const openWhatsApp = (waNumber: string, guestName: string, bookingId: string) => {
    const message = encodeURIComponent(
      `Halo ${guestName}, terima kasih telah melakukan booking di Kelong Melamun dengan ID: ${bookingId}. Ada yang bisa kami bantu?`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  const getStatusBadge = (status: string, color: string) => {
    const colors: Record<string, string> = {
      warning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      error: "bg-red-500/20 text-red-300 border-red-500/40",
      info: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      default: "bg-white/10 text-white/70 border-white/20",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          colors[color] || colors.default
        }`}
      >
        {status}
      </span>
    );
  };

  const getTimelineBadge = (timeline: string, daysUntil: number) => {
    if (timeline === "today") {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium border border-red-500/30">
          🔥 Hari Ini
        </span>
      );
    } else if (timeline === "upcoming") {
      return (
        <span className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded text-xs font-medium border border-orange-500/30">
          ⏰ {daysUntil} hari lagi
        </span>
      );
    } else if (timeline === "current") {
      return (
        <span className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded text-xs font-medium border border-sky-500/30">
          🏠 Sedang Menginap
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sand mx-auto mb-4"></div>
        <p className="text-white/50">Memuat data booking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Realtime Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50">
          <div className="glass border border-sand/40 rounded-xl shadow-2xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-sand rounded-full animate-pulse"></div>
            </div>
            <p className="font-medium text-white">{notificationMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-serif text-white">Bookings Management</h2>
          <p className="text-sm text-white/50 mt-1">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              Real-time updates aktif
            </span>
          </p>
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-sand transition-colors"
        >
          <option value="all" className="bg-ocean-deep">Semua (Aktif)</option>
          <option value="PENDING_PAYMENT" className="bg-ocean-deep">Menunggu Pembayaran</option>
          <option value="CONFIRMED" className="bg-ocean-deep">Terkonfirmasi</option>
          <option value="CHECKED_IN" className="bg-ocean-deep">Check-in</option>
        </select>
      </div>

      {/* Bookings Count */}
      <div className="glass rounded-2xl px-4 py-3">
        <p className="text-sm text-white/70">
          <strong className="text-sand">{bookings.length}</strong> booking ditemukan
        </p>
      </div>

      {/* Bookings Table */}
      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                {["Booking ID", "Tamu", "Kamar", "Tanggal", "Harga", "Status", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-white/40">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">🌊</span>
                      <p className="text-white/60 font-medium">Belum ada pesanan aktif saat ini</p>
                      <p className="text-white/30 text-xs">
                        Booking baru akan muncul di sini secara real-time
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-sand">
                          {booking.booking_id}
                        </span>
                        {getTimelineBadge(
                          booking.timeline_status,
                          booking.days_until_checkin
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {booking.guest_name}
                        </span>
                        <span className="text-xs text-white/40">
                          {booking.guest_email}
                        </span>
                        <span className="text-xs text-white/40">
                          +{booking.guest_wa}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {booking.room_name}
                        </span>
                        <span className="text-xs text-white/40">
                          ({booking.room_number}) • {booking.guest_count} tamu
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      <div className="flex flex-col">
                        <span>
                          {new Date(booking.check_in + "T00:00:00").toLocaleDateString("id-ID")}
                        </span>
                        <span className="text-xs text-white/40">
                          {booking.nights} malam
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      Rp {booking.total_price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(booking.booking_status, booking.status_color)}
                        <span
                          className={`text-xs px-2 py-1 rounded text-center ${
                            booking.payment_status === "PAID"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {booking.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {booking.booking_status === "PENDING_PAYMENT" && (
                          <button
                            onClick={() => handleConfirmPayment(booking.id)}
                            disabled={updating === booking.id}
                            className="px-3 py-1 bg-emerald-500/90 text-white text-xs rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                          >
                            {updating === booking.id ? "..." : "Konfirmasi"}
                          </button>
                        )}
                        {booking.booking_status === "CONFIRMED" && (
                          <button
                            onClick={() => handleCheckIn(booking.id)}
                            disabled={updating === booking.id}
                            className="px-3 py-1 bg-sky-500/90 text-white text-xs rounded-lg hover:bg-sky-500 disabled:opacity-50 transition-colors"
                          >
                            {updating === booking.id ? "..." : "Check-in"}
                          </button>
                        )}
                        {booking.booking_status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleCheckOut(booking.id)}
                            disabled={updating === booking.id}
                            className="px-3 py-1 bg-indigo-500/90 text-white text-xs rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                          >
                            {updating === booking.id ? "..." : "Check-out"}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            openWhatsApp(
                              booking.guest_wa,
                              booking.guest_name,
                              booking.booking_id
                            )
                          }
                          className="px-3 py-1 bg-emerald-500/90 text-white text-xs rounded-lg hover:bg-emerald-500 flex items-center justify-center gap-1 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          WA
                        </button>
                        {booking.booking_status !== "CANCELLED" &&
                          booking.booking_status !== "CHECKED_OUT" && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={updating === booking.id}
                            className="px-3 py-1 bg-red-500/90 text-white text-xs rounded-lg hover:bg-red-500 disabled:opacity-50 transition-colors"
                          >
                            {updating === booking.id ? "..." : "Batal"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

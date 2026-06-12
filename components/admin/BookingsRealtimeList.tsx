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

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      let query = supabase.from("vw_bookings_dashboard").select("*");

      if (filter !== "all") {
        query = query.eq("booking_status", filter);
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
            // New booking created
            showNotificationToast("🎉 Booking baru masuk!");
            fetchBookings(); // Refresh list
          } else if (payload.eventType === "UPDATE") {
            // Booking updated
            showNotificationToast("🔄 Booking diupdate");
            fetchBookings(); // Refresh list
          } else if (payload.eventType === "DELETE") {
            // Booking deleted
            showNotificationToast("🗑️ Booking dihapus");
            fetchBookings(); // Refresh list
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log("[Realtime] Cleaning up subscription...");
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotificationToast = (message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);

    // Play notification sound (optional)
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(() => {
        // Ignore if sound file doesn't exist
      });
    } catch (e) {
      // Ignore sound errors
    }
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
        alert(`Error: ${data.error}`);
        return;
      }

      // Success - data will be updated via Realtime
      showNotificationToast("✅ Status berhasil diupdate");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Gagal mengupdate status");
    } finally {
      setUpdating(null);
    }
  };

  const handleConfirmPayment = (bookingId: string) => {
    if (confirm("Konfirmasi pembayaran untuk booking ini?")) {
      handleUpdateStatus(bookingId, "CONFIRMED", "PAID");
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    if (confirm("Batalkan booking ini?")) {
      handleUpdateStatus(bookingId, "CANCELLED", "UNPAID");
    }
  };

  const openWhatsApp = (waNumber: string, guestName: string, bookingId: string) => {
    const message = encodeURIComponent(
      `Halo ${guestName}, terima kasih telah melakukan booking di Kelong Melamun dengan ID: ${bookingId}. Ada yang bisa kami bantu?`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  const getStatusBadge = (status: string, color: string) => {
    const colors: Record<string, string> = {
      warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
      success: "bg-green-100 text-green-700 border-green-300",
      error: "bg-red-100 text-red-700 border-red-300",
      info: "bg-blue-100 text-blue-700 border-blue-300",
      default: "bg-gray-100 text-gray-700 border-gray-300",
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
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
          🔥 Hari Ini
        </span>
      );
    } else if (timeline === "upcoming") {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
          ⏰ {daysUntil} hari lagi
        </span>
      );
    } else if (timeline === "current") {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          🏠 Sedang Menginap
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Realtime Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-white border-2 border-blue-500 rounded-lg shadow-2xl p-4 flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="font-medium text-gray-900">{notificationMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Bookings Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Real-time updates active
            </span>
          </p>
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Semua Status</option>
          <option value="PENDING_PAYMENT">Menunggu Pembayaran</option>
          <option value="CONFIRMED">Terkonfirmasi</option>
          <option value="CHECKED_IN">Check-in</option>
          <option value="CHECKED_OUT">Check-out</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      {/* Bookings Count */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>{bookings.length}</strong> booking{bookings.length !== 1 ? "s" : ""}{" "}
          found
        </p>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada booking ditemukan
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-blue-600">
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
                        <span className="text-sm font-medium text-gray-900">
                          {booking.guest_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {booking.guest_email}
                        </span>
                        <span className="text-xs text-gray-500">
                          +{booking.guest_wa}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {booking.room_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({booking.room_number}) • {booking.guest_count} tamu
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span>
                          {new Date(booking.check_in).toLocaleDateString("id-ID")}
                        </span>
                        <span className="text-xs text-gray-500">
                          {booking.nights} malam
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rp {booking.total_price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(booking.booking_status, booking.status_color)}
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            booking.payment_status === "PAID"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
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
                            className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
                          >
                            {updating === booking.id ? "..." : "Konfirmasi"}
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
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          WA
                        </button>
                        {booking.booking_status !== "CANCELLED" && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={updating === booking.id}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-50"
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

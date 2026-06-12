"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

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
  notes?: string;
  created_at: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.booking_id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Admin WhatsApp number from env
  const ADMIN_WA_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WA_NUMBER || "6283161259104";

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings?booking_id=${bookingId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Booking tidak ditemukan");
        setLoading(false);
        return;
      }

      setBooking(data.booking);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching booking:", err);
      setError("Terjadi kesalahan saat mengambil data booking");
      setLoading(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!booking) return "";

    const message = `Halo Admin Kelong Melamun,

Saya ingin konfirmasi pembayaran untuk booking berikut:

📋 *Booking ID:* ${booking.booking_id}
👤 *Nama:* ${booking.guest_name}
📧 *Email:* ${booking.guest_email}
📱 *WhatsApp:* ${booking.guest_wa}

🏠 *Kamar:* ${booking.room_name} (${booking.room_number})
📅 *Check-in:* ${new Date(booking.check_in).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
📅 *Check-out:* ${new Date(booking.check_out).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })}
🌙 *Jumlah Malam:* ${booking.nights} malam
👥 *Jumlah Tamu:* ${booking.guest_count} orang

💰 *Total Pembayaran:* Rp ${booking.total_price.toLocaleString("id-ID")}

Mohon informasi detail pembayaran. Terima kasih!`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleDownloadReceipt = () => {
    // Simple text receipt
    if (!booking) return;

    const receipt = `
KELONG MELAMUN - BOOKING RECEIPT
================================

Booking ID: ${booking.booking_id}
Status: ${booking.booking_status}
Payment: ${booking.payment_status}

GUEST INFORMATION
-----------------
Name: ${booking.guest_name}
Email: ${booking.guest_email}
WhatsApp: ${booking.guest_wa}

BOOKING DETAILS
---------------
Room: ${booking.room_name} (${booking.room_number})
Type: ${booking.room_type}
Check-in: ${new Date(booking.check_in).toLocaleDateString("id-ID")}
Check-out: ${new Date(booking.check_out).toLocaleDateString("id-ID")}
Nights: ${booking.nights}
Guests: ${booking.guest_count}

PAYMENT SUMMARY
---------------
Total Price: Rp ${booking.total_price.toLocaleString("id-ID")}

Booked on: ${new Date(booking.created_at).toLocaleString("id-ID")}

NEXT STEPS
----------
1. Contact admin via WhatsApp to confirm payment
2. Transfer to provided bank account
3. Send proof of payment
4. Wait for confirmation

Contact: +${ADMIN_WA_NUMBER}
Website: ${window.location.origin}

Thank you for choosing Kelong Melamun!
    `;

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `booking-${booking.booking_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Booking Tidak Ditemukan
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/villa")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Halaman Villa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Berhasil Dibuat!
          </h1>
          <p className="text-gray-600 mb-4">
            Terima kasih telah memilih Kelong Melamun
          </p>
          <div className="inline-block bg-blue-50 px-6 py-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Booking ID Anda:</p>
            <p className="text-2xl font-bold text-blue-600">
              {booking.booking_id}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b">
            Detail Booking
          </h2>

          <div className="space-y-4">
            {/* Guest Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Informasi Tamu
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-medium">{booking.guest_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{booking.guest_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">WhatsApp:</span>
                  <span className="font-medium">+{booking.guest_wa}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Tamu:</span>
                  <span className="font-medium">{booking.guest_count} orang</span>
                </div>
              </div>
            </div>

            {/* Room Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Informasi Kamar
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kamar:</span>
                  <span className="font-medium">
                    {booking.room_name} ({booking.room_number})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipe:</span>
                  <span className="font-medium capitalize">
                    {booking.room_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Date Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Tanggal Menginap
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-medium">
                    {new Date(booking.check_in).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-medium">
                    {new Date(booking.check_out).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jumlah Malam:</span>
                  <span className="font-medium">{booking.nights} malam</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                  Catatan
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Price Summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Ringkasan Pembayaran
              </h3>
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Total Pembayaran:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rp {booking.total_price.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Status
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Booking Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.booking_status === "CONFIRMED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.booking_status === "PENDING_PAYMENT"
                      ? "Menunggu Pembayaran"
                      : booking.booking_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.payment_status === "PAID"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {booking.payment_status === "UNPAID" ? "Belum Dibayar" : booking.payment_status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Langkah Selanjutnya
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              <span>
                Klik tombol <strong>"Hubungi Admin via WhatsApp"</strong> di bawah
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              <span>Admin akan memberikan detail rekening untuk pembayaran</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              <span>
                Lakukan transfer sesuai total pembayaran (Rp{" "}
                {booking.total_price.toLocaleString("id-ID")})
              </span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              <span>Kirim bukti transfer ke admin via WhatsApp</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              <span>
                Tunggu konfirmasi dari admin. Booking Anda akan dikonfirmasi dalam
                1x24 jam
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-lg"
          >
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Hubungi Admin via WhatsApp
          </button>

          <button
            onClick={handleDownloadReceipt}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Receipt
          </button>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}

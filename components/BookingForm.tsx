"use client";

import { useState } from "react";
import { z } from "zod";
import { User, Mail, Phone, Users, MessageSquare, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculateNights } from "@/lib/booking-utils";

// ──────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMA
// ──────────────────────────────────────────────────────────────

const bookingFormSchema = z.object({
  nama: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s.]+$/, "Nama hanya boleh berisi huruf dan spasi"),
  email: z
    .string()
    .email("Format email tidak valid")
    .max(255, "Email terlalu panjang"),
  no_wa: z
    .string()
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp harus 10-15 digit angka"),
  tamu: z
    .number()
    .int("Jumlah tamu harus bilangan bulat")
    .min(1, "Minimal 1 tamu")
    .max(20, "Maksimal 20 tamu"),
  catatan: z
    .string()
    .max(500, "Catatan maksimal 500 karakter")
    .optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

interface BookingFormProps {
  checkIn: Date;
  checkOut: Date;
  roomType: "standard" | "deluxe" | "family";
  roomId?: string;
  basePrice: number;
  capacity: number;
}

interface FormErrors {
  [key: string]: string;
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

export default function BookingForm({
  checkIn,
  checkOut,
  roomType,
  roomId,
  basePrice,
  capacity,
}: BookingFormProps) {
  const router = useRouter();
  
  const [formData, setFormData] = useState<BookingFormData>({
    nama: "",
    email: "",
    no_wa: "",
    tamu: 2,
    catatan: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const nights = calculateNights(checkIn, checkOut);
  const totalPrice = basePrice * nights;

  // ──────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tamu" ? parseInt(value) || 1 : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    try {
      bookingFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Additional validation: guest count vs capacity
    if (formData.tamu > capacity) {
      setErrors({ tamu: `Kamar ini maksimal ${capacity} tamu` });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const paketMap: Record<string, string> = {
        standard: "villa-standard",
        deluxe: "villa-deluxe",
        family: "villa-family",
      };
      
      const payload = {
        ...formData,
        paket: paketMap[roomType],
        room_id: roomId,
        check_in: checkIn.toISOString().split("T")[0],
        check_out: checkOut.toISOString().split("T")[0],
        total_bayar: totalPrice,
        tipe_order: "villa",
      };
      
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) {
          // Handle Zod validation errors from API
          const newErrors: FormErrors = {};
          data.details.forEach((err: { field: string; message: string }) => {
            newErrors[err.field] = err.message;
          });
          setErrors(newErrors);
          setSubmitError(data.error || "Validasi gagal");
        } else {
          setSubmitError(data.error || data.suggestion || "Gagal membuat reservasi");
        }
        return;
      }
      
      // Success!
      setSubmitSuccess(true);
      
      // Redirect to checkout page
      setTimeout(() => {
        router.push(`/checkout/${data.booking_code || data.order_id}`);
      }, 1500);
      
    } catch (error) {
      console.error("Booking submission error:", error);
      setSubmitError("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Booking Summary Card */}
      <div className="glass-darker rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-serif text-white border-b border-white/10 pb-3">
          Ringkasan Pemesanan
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Tipe Kamar</span>
            <span className="text-white font-medium capitalize">{roomType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Check-in</span>
            <span className="text-white font-medium">
              {checkIn.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Check-out</span>
            <span className="text-white font-medium">
              {checkOut.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Durasi</span>
            <span className="text-white font-medium">{nights} malam</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-white/10">
            <span className="text-white/60">Total Harga</span>
            <span className="text-sand text-xl font-bold">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="glass rounded-2xl p-6 space-y-5">
        <h3 className="text-xl font-serif text-white border-b border-white/10 pb-3">
          Data Pemesan
        </h3>

        {/* Name */}
        <div>
          <label htmlFor="nama" className="block text-white/80 text-sm font-medium mb-2">
            Nama Lengkap *
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              className={`w-full bg-white/5 border ${
                errors.nama ? "border-red-500" : "border-white/10"
              } rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sand transition-all`}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>
          {errors.nama && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.nama}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-white/80 text-sm font-medium mb-2">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full bg-white/5 border ${
                errors.email ? "border-red-500" : "border-white/10"
              } rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sand transition-all`}
              placeholder="email@example.com"
              required
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.email}
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <label htmlFor="no_wa" className="block text-white/80 text-sm font-medium mb-2">
            Nomor WhatsApp *
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="tel"
              id="no_wa"
              name="no_wa"
              value={formData.no_wa}
              onChange={handleInputChange}
              className={`w-full bg-white/5 border ${
                errors.no_wa ? "border-red-500" : "border-white/10"
              } rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sand transition-all`}
              placeholder="08123456789"
              required
            />
          </div>
          {errors.no_wa && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.no_wa}
            </p>
          )}
          <p className="text-white/40 text-xs mt-1">Format: 08xxx atau 628xxx (10-15 digit)</p>
        </div>

        {/* Guest Count */}
        <div>
          <label htmlFor="tamu" className="block text-white/80 text-sm font-medium mb-2">
            Jumlah Tamu *
          </label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="number"
              id="tamu"
              name="tamu"
              value={formData.tamu}
              onChange={handleInputChange}
              min={1}
              max={capacity}
              className={`w-full bg-white/5 border ${
                errors.tamu ? "border-red-500" : "border-white/10"
              } rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sand transition-all`}
              required
            />
          </div>
          {errors.tamu && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.tamu}
            </p>
          )}
          <p className="text-white/40 text-xs mt-1">Maksimal {capacity} tamu untuk kamar ini</p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="catatan" className="block text-white/80 text-sm font-medium mb-2">
            Catatan Tambahan (Opsional)
          </label>
          <div className="relative">
            <MessageSquare
              className="absolute left-4 top-4 text-white/40"
              size={18}
            />
            <textarea
              id="catatan"
              name="catatan"
              value={formData.catatan}
              onChange={handleInputChange}
              rows={4}
              maxLength={500}
              className={`w-full bg-white/5 border ${
                errors.catatan ? "border-red-500" : "border-white/10"
              } rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sand transition-all resize-none`}
              placeholder="Permintaan khusus atau informasi tambahan..."
            />
          </div>
          {errors.catatan && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.catatan}
            </p>
          )}
          <p className="text-white/40 text-xs mt-1">
            {formData.catatan?.length || 0} / 500 karakter
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {submitError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-400 font-medium">Gagal Membuat Reservasi</p>
            <p className="text-red-300/80 text-sm mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {submitSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-emerald-400 font-medium">Reservasi Berhasil!</p>
            <p className="text-emerald-300/80 text-sm mt-1">
              Mengalihkan ke halaman pembayaran...
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting || submitSuccess}
        className="w-full btn-gold py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {submitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Memproses...
          </>
        ) : submitSuccess ? (
          <>
            <CheckCircle size={20} />
            Berhasil!
          </>
        ) : (
          "Lanjut ke Pembayaran"
        )}
      </button>

      {/* Terms */}
      <p className="text-white/40 text-xs text-center">
        Dengan melanjutkan, Anda menyetujui{" "}
        <a href="/terms" className="text-sand hover:underline">
          Syarat & Ketentuan
        </a>{" "}
        kami
      </p>
    </form>
  );
}

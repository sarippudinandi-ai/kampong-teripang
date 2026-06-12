/**
 * Booking Utility Functions
 * Helper functions for booking management and calculations
 */

import { RoomStatus, BookingStatus, PaymentStatus } from "@/components/admin/CinemaRoomGrid";

// ──────────────────────────────────────────────────────────────
// DATE UTILITIES
// ──────────────────────────────────────────────────────────────

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Generate array of dates between check-in and check-out (exclusive of check-out)
 */
export function getDateRange(checkIn: string | Date, checkOut: string | Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  let currentDate = new Date(start);
  while (currentDate < end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format date for display (Indonesian locale)
 */
export function formatDate(date: string | Date, format: "short" | "long" = "long"): string {
  const d = new Date(date);
  
  if (format === "short") {
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// ──────────────────────────────────────────────────────────────
// BOOKING CALCULATIONS
// ──────────────────────────────────────────────────────────────

/**
 * Calculate total price based on room rate and nights
 */
export function calculateTotalPrice(
  basePrice: number,
  nights: number,
  discountPercent: number = 0
): number {
  const subtotal = basePrice * nights;
  const discount = subtotal * (discountPercent / 100);
  return subtotal - discount;
}

/**
 * Generate booking reference code
 */
export function generateBookingCode(transactionId: string): string {
  const prefix = "KM";
  const code = transactionId.slice(0, 8).toUpperCase();
  return `${prefix}-${code}`;
}

/**
 * Calculate booking advance days (how many days before check-in)
 */
export function calculateAdvanceDays(
  bookingDate: string | Date,
  checkInDate: string | Date
): number {
  const booking = new Date(bookingDate);
  const checkIn = new Date(checkInDate);
  const diffTime = checkIn.getTime() - booking.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// ──────────────────────────────────────────────────────────────
// STATUS UTILITIES
// ──────────────────────────────────────────────────────────────

/**
 * Check if room status allows new bookings
 */
export function isRoomBookable(status: RoomStatus): boolean {
  return status === "available";
}

/**
 * Check if booking can be modified
 */
export function isBookingModifiable(status: BookingStatus): boolean {
  return ["inquiry", "pending", "confirmed"].includes(status);
}

/**
 * Check if booking can be cancelled
 */
export function isBookingCancellable(status: BookingStatus): boolean {
  return ["inquiry", "pending", "confirmed"].includes(status);
}

/**
 * Get next possible booking status
 */
export function getNextBookingStatus(current: BookingStatus): BookingStatus[] {
  const transitions: Record<BookingStatus, BookingStatus[]> = {
    inquiry: ["pending", "cancelled"],
    pending: ["confirmed", "cancelled"],
    confirmed: ["checked_in", "cancelled"],
    checked_in: ["checked_out"],
    checked_out: [],
    cancelled: [],
  };
  
  return transitions[current] || [];
}

/**
 * Check if payment is completed
 */
export function isPaymentCompleted(status: PaymentStatus): boolean {
  return status === "paid";
}

// ──────────────────────────────────────────────────────────────
// VALIDATION UTILITIES
// ──────────────────────────────────────────────────────────────

/**
 * Validate check-in and check-out dates
 */
export function validateBookingDates(
  checkIn: string | Date,
  checkOut: string | Date
): { valid: boolean; error?: string } {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (start < today) {
    return { valid: false, error: "Check-in date cannot be in the past" };
  }
  
  if (end <= start) {
    return { valid: false, error: "Check-out must be after check-in" };
  }
  
  const nights = calculateNights(start, end);
  if (nights < 1) {
    return { valid: false, error: "Minimum 1 night stay required" };
  }
  
  if (nights > 30) {
    return { valid: false, error: "Maximum 30 nights stay allowed" };
  }
  
  return { valid: true };
}

/**
 * Validate guest count for room capacity
 */
export function validateGuestCount(
  guestCount: number,
  roomCapacity: number
): { valid: boolean; error?: string } {
  if (guestCount < 1) {
    return { valid: false, error: "At least 1 guest required" };
  }
  
  if (guestCount > roomCapacity) {
    return {
      valid: false,
      error: `Room capacity is ${roomCapacity} guests`,
    };
  }
  
  return { valid: true };
}

// ──────────────────────────────────────────────────────────────
// FORMATTING UTILITIES
// ──────────────────────────────────────────────────────────────

/**
 * Format currency (Indonesian Rupiah)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format phone number for WhatsApp (remove +, spaces, dashes)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, "");
  
  // Add country code if not present
  if (!cleaned.startsWith("62")) {
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    } else {
      cleaned = "62" + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Generate WhatsApp message for booking confirmation
 */
export function generateWhatsAppMessage(data: {
  guestName: string;
  roomName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  totalPrice: number;
  bookingCode?: string;
}): string {
  const message = [
    "🌊 *KONFIRMASI BOOKING - KELONG MELAMUN VILLA*",
    "═══════════════════════════",
    ``,
    `Halo ${data.guestName}! 👋`,
    ``,
    `Terima kasih telah memilih Kelong Melamun Villa. Berikut detail reservasi Anda:`,
    ``,
    `🏨 *Kamar:* ${data.roomName} (${data.roomNumber})`,
    `📅 *Check-in:* ${formatDate(data.checkIn)}`,
    `📅 *Check-out:* ${formatDate(data.checkOut)}`,
    `🌙 *Durasi:* ${data.nights} malam`,
    `👥 *Jumlah Tamu:* ${data.guestCount} orang`,
    data.bookingCode ? `📋 *Kode Booking:* ${data.bookingCode}` : "",
    ``,
    `💰 *Total Pembayaran:* ${formatCurrency(data.totalPrice)}`,
    ``,
    `═══════════════════════════`,
    ``,
    `Untuk melanjutkan reservasi, mohon konfirmasi ketersediaan dan metode pembayaran.`,
    ``,
    `Kami siap membantu jika ada pertanyaan! 🙏`,
  ]
    .filter(Boolean)
    .join("\n");
  
  return message;
}

/**
 * Calculate cancellation fee based on days before check-in
 */
export function calculateCancellationFee(
  totalPrice: number,
  daysBeforeCheckIn: number
): { refundAmount: number; feeAmount: number; feePercentage: number } {
  let feePercentage = 0;
  
  if (daysBeforeCheckIn < 3) {
    feePercentage = 100; // No refund
  } else if (daysBeforeCheckIn < 7) {
    feePercentage = 50; // 50% fee
  } else {
    feePercentage = 0; // Full refund
  }
  
  const feeAmount = (totalPrice * feePercentage) / 100;
  const refundAmount = totalPrice - feeAmount;
  
  return { refundAmount, feeAmount, feePercentage };
}

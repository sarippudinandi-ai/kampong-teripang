"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  DollarSign,
  Clock,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { formatDate, formatCurrency, calculateNights } from "@/lib/booking-utils";

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

interface UpcomingBooking {
  id: string;
  nama_pemesan: string;
  email: string;
  no_wa: string;
  booking_status: "inquiry" | "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  status_pembayaran: "pending" | "paid" | "failed" | "refunded";
  check_in: string;
  check_out: string;
  guest_count: number;
  total_bayar: number;
  created_at: string;
  room_number?: string;
  room_name?: string;
  room_type?: string;
}

interface UpcomingBookingsListProps {
  limit?: number;
  showActions?: boolean;
  onBookingClick?: (booking: UpcomingBooking) => void;
}

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; color: string; icon: JSX.Element } {
  switch (status) {
    case "inquiry":
      return { 
        label: "Inquiry", 
        color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: <AlertCircle size={14} />
      };
    case "pending":
      return { 
        label: "Pending", 
        color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        icon: <Clock size={14} />
      };
    case "confirmed":
      return { 
        label: "Confirmed", 
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: <CheckCircle size={14} />
      };
    case "checked_in":
      return { 
        label: "Checked In", 
        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        icon: <Home size={14} />
      };
    case "cancelled":
      return { 
        label: "Cancelled", 
        color: "bg-red-500/20 text-red-300 border-red-500/30",
        icon: <XCircle size={14} />
      };
    default:
      return { 
        label: status, 
        color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
        icon: <AlertCircle size={14} />
      };
  }
}

function getDaysUntilCheckIn(checkInDate: string): number {
  const checkIn = new Date(checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);
  
  const diffTime = checkIn.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ──────────────────────────────────────────────────────────────
// BOOKING CARD COMPONENT
// ──────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: UpcomingBooking;
  onClick?: () => void;
}

function BookingCard({ booking, onClick }: BookingCardProps) {
  const statusBadge = getStatusBadge(booking.booking_status);
  const nights = calculateNights(booking.check_in, booking.check_out);
  const daysUntil = getDaysUntilCheckIn(booking.check_in);
  
  const isUpcoming = daysUntil >= 0 && booking.booking_status !== "cancelled";
  const isToday = daysUntil === 0;
  const isPast = daysUntil < 0;

  return (
    <button
      onClick={onClick}
      className="w-full glass-darker rounded-2xl p-4 hover:bg-white/5 transition-all text-left group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <User size={16} />
            {booking.nama_pemesan}
          </h3>
          {booking.room_number && (
            <p className="text-white/60 text-sm mt-1">
              {booking.room_name} ({booking.room_number})
            </p>
          )}
        </div>
        
        <div className={`${statusBadge.color} border rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1`}>
          {statusBadge.icon}
          {statusBadge.label}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-white/40" />
          <div>
            <div className="text-white/60 text-xs">Check-in</div>
            <div className="text-white font-medium">{formatDate(booking.check_in, "short")}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-white/40" />
          <div>
            <div className="text-white/60 text-xs">Check-out</div>
            <div className="text-white font-medium">{formatDate(booking.check_out, "short")}</div>
          </div>
        </div>
      </div>

      {/* Info Row */}
      <div className="flex items-center justify-between text-sm border-t border-white/10 pt-3">
        <div className="flex items-center gap-4">
          <span className="text-white/60">
            {nights} {nights === 1 ? "night" : "nights"}
          </span>
          <span className="text-white/60">
            {booking.guest_count} {booking.guest_count === 1 ? "guest" : "guests"}
          </span>
        </div>
        
        <div className="text-sand font-semibold">
          {formatCurrency(booking.total_bayar)}
        </div>
      </div>

      {/* Days Until Check-in (only for upcoming) */}
      {isUpcoming && (
        <div className="mt-3 pt-3 border-t border-white/10">
          {isToday ? (
            <div className="text-emerald-400 text-xs font-medium flex items-center gap-1">
              <Clock size={12} />
              Check-in hari ini!
            </div>
          ) : daysUntil === 1 ? (
            <div className="text-yellow-400 text-xs font-medium flex items-center gap-1">
              <Clock size={12} />
              Check-in besok
            </div>
          ) : (
            <div className="text-white/60 text-xs flex items-center gap-1">
              <Clock size={12} />
              {daysUntil} hari lagi
            </div>
          )}
        </div>
      )}

      {isPast && booking.booking_status !== "cancelled" && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-red-400 text-xs font-medium">
            Check-in terlewat!
          </div>
        </div>
      )}

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-2xl transition-colors pointer-events-none" />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

export default function UpcomingBookingsList({ 
  limit = 10, 
  showActions = false,
  onBookingClick 
}: UpcomingBookingsListProps) {
  const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/admin/bookings/upcoming");
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      // Mock data for development
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    
    const daysUntil = getDaysUntilCheckIn(booking.check_in);
    
    if (filter === "today") return daysUntil === 0;
    if (filter === "week") return daysUntil >= 0 && daysUntil <= 7;
    if (filter === "month") return daysUntil >= 0 && daysUntil <= 30;
    
    return true;
  }).slice(0, limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock size={32} className="text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "Semua" },
          { value: "today", label: "Hari Ini" },
          { value: "week", label: "Minggu Ini" },
          { value: "month", label: "Bulan Ini" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as typeof filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === tab.value
                ? "bg-sand text-white"
                : "glass-darker text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="glass-darker rounded-2xl p-12 text-center">
          <Calendar size={48} className="text-white/20 mx-auto mb-4" />
          <h3 className="text-white/60 text-lg font-medium">
            Tidak ada booking untuk filter ini
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => onBookingClick?.(booking)}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-darker rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">
            {bookings.filter(b => getDaysUntilCheckIn(b.check_in) === 0).length}
          </div>
          <div className="text-white/60 text-xs mt-1">Check-in Hari Ini</div>
        </div>
        
        <div className="glass-darker rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {bookings.filter(b => b.booking_status === "confirmed").length}
          </div>
          <div className="text-white/60 text-xs mt-1">Confirmed</div>
        </div>
        
        <div className="glass-darker rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {bookings.filter(b => b.booking_status === "pending").length}
          </div>
          <div className="text-white/60 text-xs mt-1">Pending</div>
        </div>
      </div>
    </div>
  );
}

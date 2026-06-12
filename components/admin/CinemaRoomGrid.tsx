"use client";

import { useState, useEffect } from "react";
import { 
  Armchair, 
  Info, 
  Users, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Wrench,
  X
} from "lucide-react";

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export type RoomStatus = "available" | "occupied" | "maintenance" | "blocked";
export type BookingStatus = "inquiry" | "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  capacity: number;
  floor_level: number;
  position_order: number;
  base_price: number;
  status: RoomStatus;
  amenities: string[];
  photo_url?: string;
  current_guest?: string;
  current_transaction_id?: string;
}

export interface Transaction {
  id: string;
  nama_pemesan: string;
  email: string;
  no_wa: string;
  booking_status: BookingStatus;
  status_pembayaran: PaymentStatus;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_bayar: number;
  created_at: string;
  admin_notes?: string;
  detail_order?: Record<string, unknown>;
}

interface CinemaRoomGridProps {
  onRoomClick?: (room: Room, transaction?: Transaction) => void;
  onStatusChange?: (roomId: string, newStatus: RoomStatus) => Promise<void>;
}

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

function getRoomStatusColor(status: RoomStatus): string {
  switch (status) {
    case "available":
      return "bg-emerald-500 hover:bg-emerald-600";
    case "occupied":
      return "bg-red-500 hover:bg-red-600";
    case "maintenance":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "blocked":
      return "bg-gray-500 hover:bg-gray-600";
    default:
      return "bg-gray-400";
  }
}

function getRoomStatusIcon(status: RoomStatus) {
  switch (status) {
    case "available":
      return <CheckCircle size={16} />;
    case "occupied":
      return <Users size={16} />;
    case "maintenance":
      return <Wrench size={16} />;
    case "blocked":
      return <XCircle size={16} />;
    default:
      return <Info size={16} />;
  }
}

function getRoomStatusLabel(status: RoomStatus): string {
  switch (status) {
    case "available":
      return "Tersedia";
    case "occupied":
      return "Terisi";
    case "maintenance":
      return "Maintenance";
    case "blocked":
      return "Diblokir";
    default:
      return "Unknown";
  }
}

function getBookingStatusBadge(status: BookingStatus): { label: string; color: string } {
  switch (status) {
    case "inquiry":
      return { label: "Inquiry", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    case "pending":
      return { label: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    case "confirmed":
      return { label: "Confirmed", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    case "checked_in":
      return { label: "Checked In", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
    case "checked_out":
      return { label: "Checked Out", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
    case "cancelled":
      return { label: "Cancelled", color: "bg-red-500/20 text-red-300 border-red-500/30" };
    default:
      return { label: status, color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
  }
}

function getPaymentStatusBadge(status: PaymentStatus): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Belum Bayar", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    case "paid":
      return { label: "Lunas", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    case "failed":
      return { label: "Gagal", color: "bg-red-500/20 text-red-300 border-red-500/30" };
    case "refunded":
      return { label: "Refund", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
    default:
      return { label: status, color: "bg-gray-500/20 text-gray-300 border-gray-500/30" };
  }
}

// ──────────────────────────────────────────────────────────────
// ROOM CARD COMPONENT (Cinema Seat Style)
// ──────────────────────────────────────────────────────────────

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

function RoomCard({ room, onClick }: RoomCardProps) {
  const statusColor = getRoomStatusColor(room.status);
  const statusIcon = getRoomStatusIcon(room.status);

  return (
    <button
      onClick={onClick}
      className={`
        relative group
        ${statusColor}
        rounded-2xl p-4
        transition-all duration-300
        shadow-lg hover:shadow-2xl hover:scale-105
        min-h-[120px]
        flex flex-col items-center justify-center
        text-white font-medium
      `}
    >
      {/* Room Number (Large) */}
      <div className="text-3xl font-bold mb-2">
        {room.room_number}
      </div>

      {/* Status Icon */}
      <div className="flex items-center gap-2 text-sm opacity-90">
        {statusIcon}
        <span>{getRoomStatusLabel(room.status)}</span>
      </div>

      {/* Capacity Badge */}
      <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
        <Users size={12} />
        <span>{room.capacity}</span>
      </div>

      {/* Room Type Badge */}
      <div className="absolute bottom-2 left-2 right-2 text-xs opacity-80 truncate text-center">
        {room.room_type.toUpperCase()}
      </div>

      {/* Guest Name (if occupied) */}
      {room.status === "occupied" && room.current_guest && (
        <div className="absolute inset-x-2 bottom-8 text-xs font-normal bg-white/10 backdrop-blur-sm rounded-lg px-2 py-1 truncate text-center">
          👤 {room.current_guest}
        </div>
      )}

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-2xl transition-colors pointer-events-none" />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// ROOM DETAIL MODAL
// ──────────────────────────────────────────────────────────────

interface RoomDetailModalProps {
  room: Room;
  transaction?: Transaction;
  onClose: () => void;
  onContactGuest?: (transaction: Transaction) => void;
  onUpdateStatus?: (status: BookingStatus, paymentStatus?: PaymentStatus) => Promise<void>;
}

function RoomDetailModal({ 
  room, 
  transaction, 
  onClose, 
  onContactGuest,
  onUpdateStatus 
}: RoomDetailModalProps) {
  const [updating, setUpdating] = useState(false);

  const bookingBadge = transaction ? getBookingStatusBadge(transaction.booking_status) : null;
  const paymentBadge = transaction ? getPaymentStatusBadge(transaction.status_pembayaran) : null;

  const handleUpdateStatus = async (bookingStatus: BookingStatus, paymentStatus?: PaymentStatus) => {
    if (!onUpdateStatus) return;
    setUpdating(true);
    try {
      await onUpdateStatus(bookingStatus, paymentStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleContactGuest = () => {
    if (transaction && onContactGuest) {
      onContactGuest(transaction);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-darker rounded-t-3xl p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${getRoomStatusColor(room.status)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
              {room.room_number}
            </div>
            <div>
              <h2 className="text-2xl font-serif text-white">{room.room_name}</h2>
              <p className="text-white/60 text-sm">{room.room_type.toUpperCase()} • {room.capacity} Guests</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Room Info */}
          <div className="glass-darker rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Armchair size={18} />
              Room Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white/60">Status</span>
                <p className="text-white font-medium flex items-center gap-2 mt-1">
                  {getRoomStatusIcon(room.status)}
                  {getRoomStatusLabel(room.status)}
                </p>
              </div>
              <div>
                <span className="text-white/60">Base Price</span>
                <p className="text-white font-medium mt-1">
                  Rp {room.base_price.toLocaleString("id-ID")} / night
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-white/60">Amenities</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {room.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/80"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Guest/Transaction Info */}
          {transaction ? (
            <>
              <div className="glass-darker rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Users size={18} />
                  Guest Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Name</span>
                    <span className="text-white font-medium">{transaction.nama_pemesan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 flex items-center gap-1">
                      <Mail size={14} /> Email
                    </span>
                    <span className="text-white font-medium">{transaction.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 flex items-center gap-1">
                      <Phone size={14} /> WhatsApp
                    </span>
                    <span className="text-white font-medium">{transaction.no_wa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60 flex items-center gap-1">
                      <Users size={14} /> Guests
                    </span>
                    <span className="text-white font-medium">{transaction.guest_count} person(s)</span>
                  </div>
                </div>
              </div>

              <div className="glass-darker rounded-2xl p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Calendar size={18} />
                  Booking Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Check-in</span>
                    <span className="text-white font-medium">
                      {new Date(transaction.check_in).toLocaleDateString("id-ID", { 
                        weekday: "short", 
                        year: "numeric", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Check-out</span>
                    <span className="text-white font-medium">
                      {new Date(transaction.check_out).toLocaleDateString("id-ID", { 
                        weekday: "short", 
                        year: "numeric", 
                        month: "short", 
                        day: "numeric" 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Duration</span>
                    <span className="text-white font-medium">
                      {Math.ceil(
                        (new Date(transaction.check_out).getTime() - new Date(transaction.check_in).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      )} nights
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/10">
                    <span className="text-white/60 flex items-center gap-1">
                      <DollarSign size={14} /> Total Payment
                    </span>
                    <span className="text-sand text-lg font-bold">
                      Rp {transaction.total_bayar.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-3">
                {bookingBadge && (
                  <div className={`flex-1 ${bookingBadge.color} border rounded-xl px-4 py-3 text-center font-medium text-sm`}>
                    Booking: {bookingBadge.label}
                  </div>
                )}
                {paymentBadge && (
                  <div className={`flex-1 ${paymentBadge.color} border rounded-xl px-4 py-3 text-center font-medium text-sm`}>
                    Payment: {paymentBadge.label}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {transaction.admin_notes && (
                <div className="glass-darker rounded-2xl p-4">
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Info size={18} />
                    Admin Notes
                  </h3>
                  <p className="text-white/70 text-sm">{transaction.admin_notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleContactGuest}
                  className="btn-gold py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  Contact Guest
                </button>

                {transaction.booking_status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus("confirmed", "paid")}
                    disabled={updating}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {updating ? "Processing..." : "Confirm Booking"}
                  </button>
                )}

                {transaction.booking_status === "confirmed" && (
                  <button
                    onClick={() => handleUpdateStatus("checked_in")}
                    disabled={updating}
                    className="bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {updating ? "Processing..." : "Check In"}
                  </button>
                )}

                {transaction.booking_status === "checked_in" && (
                  <button
                    onClick={() => handleUpdateStatus("checked_out")}
                    disabled={updating}
                    className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {updating ? "Processing..." : "Check Out"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="glass-darker rounded-2xl p-8 text-center">
              <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
              <h3 className="text-white font-serif text-xl mb-2">Room Available</h3>
              <p className="text-white/60 text-sm">
                This room is currently available for booking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MAIN CINEMA ROOM GRID COMPONENT
// ──────────────────────────────────────────────────────────────

export default function CinemaRoomGrid({ onRoomClick, onStatusChange }: CinemaRoomGridProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch rooms data
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/rooms");
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room: Room) => {
    setSelectedRoom(room);
    
    // Fetch transaction if room is occupied
    if (room.status === "occupied" && room.current_transaction_id) {
      try {
        const response = await fetch(`/api/admin/transactions/${room.current_transaction_id}`);
        const data = await response.json();
        setSelectedTransaction(data.transaction);
      } catch (error) {
        console.error("Failed to fetch transaction:", error);
        setSelectedTransaction(null);
      }
    } else {
      setSelectedTransaction(null);
    }
    
    setShowModal(true);
    onRoomClick?.(room);
  };

  const handleContactGuest = (transaction: Transaction) => {
    const message = [
      `🏨 *BOOKING CONFIRMATION - ${selectedRoom?.room_number}*`,
      `═══════════════════════`,
      `📋 Booking ID: ${transaction.id.slice(0, 8)}`,
      `🏠 Room: ${selectedRoom?.room_name}`,
      `📅 Check-in: ${new Date(transaction.check_in).toLocaleDateString("id-ID")}`,
      `📅 Check-out: ${new Date(transaction.check_out).toLocaleDateString("id-ID")}`,
      `💰 Total: Rp ${transaction.total_bayar.toLocaleString("id-ID")}`,
      ``,
      `Terima kasih, ${transaction.nama_pemesan}! 🙏`,
    ].join("\n");

    const waUrl = `https://wa.me/${transaction.no_wa}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleUpdateStatus = async (bookingStatus: BookingStatus, paymentStatus?: PaymentStatus) => {
    if (!selectedTransaction || !selectedRoom) return;

    try {
      const response = await fetch(`/api/admin/transactions/${selectedTransaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_status: bookingStatus,
          status_pembayaran: paymentStatus || selectedTransaction.status_pembayaran,
          confirmed_by: "admin", // TODO: Get from auth context
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      // Refresh data
      await fetchRooms();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update status:", error);
      throw error;
    }
  };

  // Group rooms by floor level (row)
  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor_level]) {
      acc[room.floor_level] = [];
    }
    acc[room.floor_level].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  const floorLevels = Object.keys(roomsByFloor)
    .map(Number)
    .sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock size={32} className="text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-white/60 font-medium">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-white/80">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-white/80">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-white/80">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-white/80">Blocked</span>
          </div>
        </div>

        {/* Room Grid (Cinema Style) */}
        <div className="space-y-8">
          {floorLevels.map((floorLevel) => (
            <div key={floorLevel}>
              {/* Floor Label */}
              <div className="text-white/40 text-xs font-medium mb-3 uppercase tracking-wider">
                {floorLevel === 1 && "Standard Rooms"}
                {floorLevel === 2 && "Deluxe Suites"}
                {floorLevel === 3 && "Family Houses"}
              </div>

              {/* Room Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {roomsByFloor[floorLevel]
                  .sort((a, b) => a.position_order - b.position_order)
                  .map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onClick={() => handleRoomClick(room)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          <div className="glass-darker rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {rooms.filter((r) => r.status === "available").length}
            </div>
            <div className="text-white/60 text-sm mt-1">Available</div>
          </div>
          <div className="glass-darker rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {rooms.filter((r) => r.status === "occupied").length}
            </div>
            <div className="text-white/60 text-sm mt-1">Occupied</div>
          </div>
          <div className="glass-darker rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {rooms.filter((r) => r.status === "maintenance").length}
            </div>
            <div className="text-white/60 text-sm mt-1">Maintenance</div>
          </div>
          <div className="glass-darker rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {rooms.length}
            </div>
            <div className="text-white/60 text-sm mt-1">Total Rooms</div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          transaction={selectedTransaction || undefined}
          onClose={() => setShowModal(false)}
          onContactGuest={handleContactGuest}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  );
}

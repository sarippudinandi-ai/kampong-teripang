"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Users,
  Calendar,
  DollarSign,
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
}

export default function CinemaRoomGridUpgraded() {
  const [rooms, setRooms] = useState<RoomWithBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithBooking | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

      // Get current bookings (CONFIRMED or PENDING_PAYMENT that are active)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("booking_status", ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"])
        .lte("check_in", new Date().toISOString().split("T")[0])
        .gte("check_out", new Date().toISOString().split("T")[0]);

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      }

      // Merge rooms with current bookings
      const roomsWithBookings: RoomWithBooking[] = (roomsData || []).map((room) => {
        const currentBooking = (bookingsData || []).find(
          (booking) => booking.room_id === room.id
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
        };
      });

      setRooms(roomsWithBookings);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setLoading(false);
    }
  };

  const getRoomColor = (room: RoomWithBooking): string => {
    // Priority 1: Check if there's an active booking
    if (room.current_booking) {
      const { booking_status, payment_status } = room.current_booking;

      // Kuning = Booked tapi PENDING_PAYMENT
      if (booking_status === "PENDING_PAYMENT" && payment_status === "UNPAID") {
        return "bg-yellow-400 hover:bg-yellow-500 border-yellow-600";
      }

      // Merah = CONFIRMED (paid) or CHECKED_IN
      if (
        (booking_status === "CONFIRMED" && payment_status === "PAID") ||
        booking_status === "CHECKED_IN"
      ) {
        return "bg-red-500 hover:bg-red-600 border-red-700";
      }
    }

    // Priority 2: Check room status
    if (room.status === "maintenance") {
      return "bg-orange-500 hover:bg-orange-600 border-orange-700";
    }

    if (room.status === "blocked") {
      return "bg-gray-500 hover:bg-gray-600 border-gray-700";
    }

    // Default: Hijau = Available
    return "bg-green-500 hover:bg-green-600 border-green-700";
  };

  const getRoomIcon = (room: RoomWithBooking) => {
    if (room.current_booking) {
      const { booking_status, payment_status } = room.current_booking;

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
      return <XCircle size={20} className="text-white" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase mb-4">
          Cinema-Style Room Status
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <span className="text-sm text-gray-700">Pending Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Confirmed/Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-700">Maintenance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-700">Blocked</span>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="space-y-6">
        {Object.entries(groupedRooms)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([floor, floorRooms]) => (
            <div key={floor} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Floor {floor} - {floorRooms[0].room_type.toUpperCase()}
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
                      )} border-2 rounded-lg p-4 transition-all transform hover:scale-105 hover:shadow-lg cursor-pointer`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {getRoomIcon(room)}
                        <span className="text-white font-bold text-lg">
                          {room.room_number}
                        </span>
                        <span className="text-white text-xs text-center">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRoom.room_name}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Room Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Room Information
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Number:</span>
                    <span className="font-medium">{selectedRoom.room_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">
                      {selectedRoom.room_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">
                      {selectedRoom.capacity} guests
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span className="font-medium">
                      Rp {selectedRoom.base_price.toLocaleString("id-ID")}/night
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{getRoomLabel(selectedRoom)}</span>
                  </div>
                </div>
              </div>

              {/* Current Booking */}
              {selectedRoom.current_booking && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    Current Booking
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Booking ID:</span>
                      <span className="font-bold text-blue-600">
                        {selectedRoom.current_booking.booking_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Guest:</span>
                      <span className="font-medium">
                        {selectedRoom.current_booking.guest_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Check-in:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedRoom.current_booking.check_in
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Check-out:</span>
                      <span className="font-medium">
                        {new Date(
                          selectedRoom.current_booking.check_out
                        ).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Total Price:</span>
                      <span className="font-bold text-green-600">
                        Rp{" "}
                        {selectedRoom.current_booking.total_price.toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Status:</span>
                      <div className="flex gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedRoom.current_booking.booking_status ===
                            "CONFIRMED"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {selectedRoom.current_booking.booking_status}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedRoom.current_booking.payment_status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
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
                      className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Phone size={18} />
                      Contact Guest via WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* No Booking */}
              {!selectedRoom.current_booking && (
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                  <p className="text-green-700 font-medium">
                    Room is available for booking
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Users, Info, CheckCircle, XCircle } from "lucide-react";
import { formatDate, calculateNights } from "@/lib/booking-utils";

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

interface RoomAvailability {
  room_id: string;
  room_number: string;
  room_type: string;
  capacity: number;
  base_price: number;
  date: string;
  is_available: boolean;
  booking_id: string | null;
}

interface AvailabilitySummary {
  date: string;
  available_count: number;
  total_count: number;
  room_types: {
    [key: string]: {
      available: number;
      total: number;
    };
  };
}

interface BookingAvailabilityCalendarProps {
  roomType?: "standard" | "deluxe" | "family" | "all";
  onDateSelect?: (checkIn: Date, checkOut: Date) => void;
  selectedCheckIn?: Date | null;
  selectedCheckOut?: Date | null;
}

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    dates.push(new Date(year, month, day));
  }
  
  return dates;
}

function getStartPadding(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  return firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
}

function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────

export default function BookingAvailabilityCalendar({
  roomType = "all",
  onDateSelect,
  selectedCheckIn,
  selectedCheckOut,
}: BookingAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availability, setAvailability] = useState<Map<string, AvailabilitySummary>>(new Map());
  const [loading, setLoading] = useState(false);
  const [tempCheckIn, setTempCheckIn] = useState<Date | null>(selectedCheckIn || null);
  const [tempCheckOut, setTempCheckOut] = useState<Date | null>(selectedCheckOut || null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Fetch availability data
  useEffect(() => {
    fetchAvailability();
  }, [currentMonth, currentYear, roomType]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      
      const response = await fetch(
        `/api/availability?start_date=${formatDateKey(firstDay)}&end_date=${formatDateKey(lastDay)}&room_type=${roomType}`
      );
      
      if (!response.ok) throw new Error("Failed to fetch availability");
      
      const data = await response.json();
      
      // Process data into map
      const availabilityMap = new Map<string, AvailabilitySummary>();
      
      data.availability.forEach((item: RoomAvailability) => {
        const dateKey = item.date;
        
        if (!availabilityMap.has(dateKey)) {
          availabilityMap.set(dateKey, {
            date: dateKey,
            available_count: 0,
            total_count: 0,
            room_types: {},
          });
        }
        
        const summary = availabilityMap.get(dateKey)!;
        summary.total_count++;
        
        if (item.is_available) {
          summary.available_count++;
        }
        
        // Track by room type
        if (!summary.room_types[item.room_type]) {
          summary.room_types[item.room_type] = { available: 0, total: 0 };
        }
        
        summary.room_types[item.room_type].total++;
        if (item.is_available) {
          summary.room_types[item.room_type].available++;
        }
      });
      
      setAvailability(availabilityMap);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    if (isDateInPast(date)) return;
    
    const dateKey = formatDateKey(date);
    const summary = availability.get(dateKey);
    
    // Don't allow selection if no rooms available
    if (summary && summary.available_count === 0) return;
    
    // Selection logic: check-in -> check-out
    if (!tempCheckIn || (tempCheckIn && tempCheckOut)) {
      // Start new selection
      setTempCheckIn(date);
      setTempCheckOut(null);
    } else if (tempCheckIn && !tempCheckOut) {
      // Set check-out
      if (date <= tempCheckIn) {
        // If clicked date is before check-in, reset
        setTempCheckIn(date);
        setTempCheckOut(null);
      } else {
        setTempCheckOut(date);
        onDateSelect?.(tempCheckIn, date);
      }
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getDateClassName = (date: Date): string => {
    const dateKey = formatDateKey(date);
    const summary = availability.get(dateKey);
    const isPast = isDateInPast(date);
    const isCheckIn = tempCheckIn && formatDateKey(tempCheckIn) === dateKey;
    const isCheckOut = tempCheckOut && formatDateKey(tempCheckOut) === dateKey;
    
    // Check if date is in selected range
    const isInRange = tempCheckIn && tempCheckOut &&
      date > tempCheckIn && date < tempCheckOut;
    
    // Check if date is in hover range
    const isInHoverRange = tempCheckIn && !tempCheckOut && hoveredDate &&
      date > tempCheckIn && date < hoveredDate;
    
    let className = "relative h-16 border border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ";
    
    if (isPast) {
      className += "bg-gray-800/20 text-gray-600 cursor-not-allowed ";
    } else if (isCheckIn || isCheckOut) {
      className += "bg-sand text-darkblue font-bold ring-2 ring-sand ";
    } else if (isInRange || isInHoverRange) {
      className += "bg-sand/30 text-white ";
    } else if (!summary || summary.available_count === 0) {
      className += "bg-red-500/10 text-red-400 cursor-not-allowed ";
    } else if (summary.available_count < summary.total_count / 2) {
      className += "bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 ";
    } else {
      className += "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 ";
    }
    
    return className;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const startPadding = getStartPadding(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="glass rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="text-sand" size={24} />
          <h2 className="text-2xl font-serif text-white">{monthName}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl glass-darker hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl glass-darker hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500/50"></div>
          <span className="text-white/60">Banyak Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/50"></div>
          <span className="text-white/60">Terbatas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500/50"></div>
          <span className="text-white/60">Penuh</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-sand"></div>
          <span className="text-white/60">Dipilih</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-white/40 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for padding */}
          {Array.from({ length: startPadding }).map((_, idx) => (
            <div key={`padding-${idx}`} className="h-16"></div>
          ))}

          {/* Actual dates */}
          {daysInMonth.map((date) => {
            const dateKey = formatDateKey(date);
            const summary = availability.get(dateKey);
            const isPast = isDateInPast(date);
            
            return (
              <button
                key={dateKey}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
                className={getDateClassName(date)}
                disabled={isPast || (summary ? summary.available_count === 0 : false)}
              >
                <div className="text-lg font-semibold">{date.getDate()}</div>
                
                {!isPast && summary && (
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {summary.available_count > 0 ? (
                      <span>{summary.available_count} kamar</span>
                    ) : (
                      <span>Penuh</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Range Info */}
      {tempCheckIn && (
        <div className="glass-darker rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white/60">Check-in</span>
              <p className="text-white font-medium mt-1">{formatDate(tempCheckIn, "short")}</p>
            </div>
            
            {tempCheckOut && (
              <>
                <div className="text-white/40">→</div>
                <div>
                  <span className="text-white/60">Check-out</span>
                  <p className="text-white font-medium mt-1">{formatDate(tempCheckOut, "short")}</p>
                </div>
                
                <div>
                  <span className="text-white/60">Durasi</span>
                  <p className="text-sand font-bold mt-1">
                    {calculateNights(tempCheckIn, tempCheckOut)} malam
                  </p>
                </div>
              </>
            )}
          </div>
          
          {!tempCheckOut && (
            <p className="text-white/40 text-xs flex items-center gap-2">
              <Info size={14} />
              Pilih tanggal check-out untuk melanjutkan
            </p>
          )}
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-darkblue/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="text-white text-sm flex items-center gap-2">
            <div className="animate-spin">⏳</div>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
}

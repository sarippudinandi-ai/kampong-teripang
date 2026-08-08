// ─── Availability System ─────────────────────────────────────────────────────
// Mirror of the `rooms` table (cinema_inventory seed): A1-A4, B1-B3, C1-C2 = 9 rooms
// Kept in sync with Cinema Grid so both show the SAME rooms/names/structure.

export const VILLA_ROOMS = [
  { id: "A1", nama: "Sea Healing A1", paket: "Sea Healing Room (Standard)", kapasitas: 2 },
  { id: "A2", nama: "Sea Healing A2", paket: "Sea Healing Room (Standard)", kapasitas: 2 },
  { id: "A3", nama: "Sea Healing A3", paket: "Sea Healing Room (Standard)", kapasitas: 2 },
  { id: "A4", nama: "Sea Healing A4", paket: "Sea Healing Room (Standard)", kapasitas: 2 },
  { id: "B1", nama: "Deluxe Suite B1", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "B2", nama: "Deluxe Suite B2", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "B3", nama: "Deluxe Suite B3", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "C1", nama: "Family House C1", paket: "Family Kelong House", kapasitas: 6 },
  { id: "C2", nama: "Family House C2", paket: "Family Kelong House", kapasitas: 6 },
] as const;

export type RoomId = (typeof VILLA_ROOMS)[number]["id"];

// Grup paket untuk tampilan (mirror room_type grouping of the rooms table)
export const PAKET_GROUPS = [
  {
    paket: "Sea Healing Room (Standard)",
    rooms: ["A1", "A2", "A3", "A4"] as RoomId[],
  },
  {
    paket: "Kelong Deluxe Suite",
    rooms: ["B1", "B2", "B3"] as RoomId[],
  },
  {
    paket: "Family Kelong House",
    rooms: ["C1", "C2"] as RoomId[],
  },
];

export interface RoomBooking {
  roomId: RoomId;
  status: "tersedia" | "terpesan" | "maintenance";
  namaTamu?: string;
  catatan?: string;
}

export interface DayAvailability {
  tanggal: string; // "YYYY-MM-DD"
  rooms: RoomBooking[];
}

// Berapa kamar tersedia di hari tertentu
export function countAvailable(day: DayAvailability): number {
  const booked = day.rooms.filter(
    (r) => r.status === "terpesan" || r.status === "maintenance"
  ).length;
  return VILLA_ROOMS.length - booked; // 9 - booked
}

// Berapa kamar tersedia per paket
export function countAvailableByPaket(
  day: DayAvailability | undefined | null,
  paket: string
): number {
  const group = PAKET_GROUPS.find((g) => g.paket === paket);
  if (!group) return 0;
  const total = group.rooms.length;
  if (!day) return total;
  const booked = group.rooms.filter((roomId) => {
    const r = day.rooms.find((rb) => rb.roomId === roomId);
    return r && (r.status === "terpesan" || r.status === "maintenance");
  }).length;
  return total - booked;
}

export type DayColor = "full" | "almost" | "half" | "available" | "empty";

export function getDayColor(day: DayAvailability | undefined | null): DayColor {
  if (!day) return "empty";
  const avail = countAvailable(day);
  if (avail === 0) return "full";
  if (avail <= 2) return "almost";
  if (avail <= 5) return "half";
  return "available";
}

export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Default data dummy ───────────────────────────────────────────────────────
// (Tidak dipakai runtime — context mulai dari array kosong & ambil dari DB)
export const defaultAvailability: DayAvailability[] = [];

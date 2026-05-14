// ─── Availability System ─────────────────────────────────────────────────────
// 3 paket villa × 3 kamar per paket = 9 kamar total

export const VILLA_ROOMS = [
  { id: "sea-healing-1", nama: "Sea Healing Room 1", paket: "Sea Healing Room", kapasitas: 2 },
  { id: "sea-healing-2", nama: "Sea Healing Room 2", paket: "Sea Healing Room", kapasitas: 2 },
  { id: "sea-healing-3", nama: "Sea Healing Room 3", paket: "Sea Healing Room", kapasitas: 2 },
  { id: "deluxe-suite-1", nama: "Kelong Deluxe Suite 1", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "deluxe-suite-2", nama: "Kelong Deluxe Suite 2", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "deluxe-suite-3", nama: "Kelong Deluxe Suite 3", paket: "Kelong Deluxe Suite", kapasitas: 2 },
  { id: "family-house-1", nama: "Family Kelong House 1", paket: "Family Kelong House", kapasitas: 6 },
  { id: "family-house-2", nama: "Family Kelong House 2", paket: "Family Kelong House", kapasitas: 6 },
  { id: "family-house-3", nama: "Family Kelong House 3", paket: "Family Kelong House", kapasitas: 6 },
] as const;

export type RoomId = (typeof VILLA_ROOMS)[number]["id"];

// Grup paket untuk tampilan
export const PAKET_GROUPS = [
  {
    paket: "Sea Healing Room",
    rooms: ["sea-healing-1", "sea-healing-2", "sea-healing-3"] as RoomId[],
  },
  {
    paket: "Kelong Deluxe Suite",
    rooms: ["deluxe-suite-1", "deluxe-suite-2", "deluxe-suite-3"] as RoomId[],
  },
  {
    paket: "Family Kelong House",
    rooms: ["family-house-1", "family-house-2", "family-house-3"] as RoomId[],
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
  if (!group) return 3;
  if (!day) return 3;
  const booked = group.rooms.filter((roomId) => {
    const r = day.rooms.find((rb) => rb.roomId === roomId);
    return r && (r.status === "terpesan" || r.status === "maintenance");
  }).length;
  return 3 - booked;
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
export const defaultAvailability: DayAvailability[] = [
  {
    tanggal: "2025-06-07",
    rooms: [
      { roomId: "sea-healing-1", status: "terpesan", namaTamu: "Budi S." },
      { roomId: "sea-healing-2", status: "terpesan", namaTamu: "Rina K." },
      { roomId: "sea-healing-3", status: "terpesan", namaTamu: "Doni P." },
      { roomId: "deluxe-suite-1", status: "terpesan", namaTamu: "Keluarga Tan" },
      { roomId: "deluxe-suite-2", status: "terpesan", namaTamu: "Ahmad F." },
      { roomId: "deluxe-suite-3", status: "terpesan", namaTamu: "Sarah T." },
      { roomId: "family-house-1", status: "terpesan", namaTamu: "Keluarga Besar" },
      { roomId: "family-house-2", status: "terpesan", namaTamu: "Wati R." },
      { roomId: "family-house-3", status: "terpesan", namaTamu: "Hendra L." },
    ],
  },
  {
    tanggal: "2025-06-14",
    rooms: [
      { roomId: "sea-healing-1", status: "terpesan", namaTamu: "Maya S." },
      { roomId: "sea-healing-2", status: "terpesan", namaTamu: "Rizky A." },
      { roomId: "deluxe-suite-1", status: "terpesan", namaTamu: "Lina W." },
      { roomId: "family-house-1", status: "terpesan", namaTamu: "Putri N." },
    ],
  },
  {
    tanggal: "2025-06-21",
    rooms: VILLA_ROOMS.map((r) => ({
      roomId: r.id,
      status: "maintenance" as const,
      catatan: "Perawatan fasilitas",
    })),
  },
  {
    tanggal: "2025-07-04",
    rooms: [
      { roomId: "sea-healing-1", status: "terpesan", namaTamu: "Eko B." },
      { roomId: "sea-healing-2", status: "terpesan", namaTamu: "Sari M." },
      { roomId: "sea-healing-3", status: "terpesan", namaTamu: "Joko W." },
      { roomId: "deluxe-suite-1", status: "terpesan", namaTamu: "Keluarga Joko" },
      { roomId: "deluxe-suite-2", status: "terpesan", namaTamu: "Nita R." },
      { roomId: "deluxe-suite-3", status: "terpesan", namaTamu: "Bayu P." },
      { roomId: "family-house-1", status: "terpesan", namaTamu: "Keluarga Besar 2" },
      { roomId: "family-house-2", status: "terpesan", namaTamu: "Tono S." },
      { roomId: "family-house-3", status: "terpesan", namaTamu: "Dewi A." },
    ],
  },
  {
    tanggal: "2025-07-12",
    rooms: [
      { roomId: "sea-healing-1", status: "terpesan", namaTamu: "Rudi H." },
      { roomId: "deluxe-suite-1", status: "terpesan", namaTamu: "Ani K." },
      { roomId: "deluxe-suite-2", status: "terpesan", namaTamu: "Beni S." },
    ],
  },
];

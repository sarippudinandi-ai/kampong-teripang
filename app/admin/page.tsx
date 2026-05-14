"use client";

import { useState } from "react";
import { Check, Save, Eye, EyeOff } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { useAvailability } from "@/lib/AvailabilityContext";
import { VILLA_ROOMS, PAKET_GROUPS, countAvailable, getDayColor } from "@/lib/availability";

// ─── Types ───────────────────────────────────────────────
interface VillaPackage {
  id: string;
  nama: string;
  harga: number;
  kapasitas: number;
  deskripsi: string;
}

interface EduPackage {
  id: string;
  nama: string;
  harga: number;
  kapasitas: number;
  durasi: string;
}

interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  tagline: string;
}

// ─── Initial Data (sama dengan lib/data.ts) ──────────────
const initialVilla: VillaPackage[] = [
  { id: "villa-standard", nama: "Sea Healing Room", harga: 850000, kapasitas: 2, deskripsi: "Kamar kelong di atas laut dengan pemandangan 360° Selat Bintan." },
  { id: "villa-deluxe", nama: "Kelong Deluxe Suite", harga: 1350000, kapasitas: 2, deskripsi: "Suite premium dengan dek privat langsung di atas laut." },
  { id: "villa-family", nama: "Family Kelong House", harga: 2200000, kapasitas: 6, deskripsi: "Rumah kelong keluarga dengan 2 kamar tidur." },
];

const initialEdu: EduPackage[] = [
  { id: "school-of-fish", nama: "School of Fish", harga: 350000, kapasitas: 15, durasi: "4 jam" },
  { id: "lamun-warrior", nama: "Lamun Warrior", harga: 275000, kapasitas: 20, durasi: "3 jam" },
  { id: "open-trip-bekarang", nama: "Open Trip: Tradisi Bekarang", harga: 450000, kapasitas: 12, durasi: "Full day (8 jam)" },
];

const initialProducts: Product[] = [
  { id: "seacume", nama: "Seacume", harga: 285000, stok: 50, tagline: "Sea Cucumber Collagen Drink" },
  { id: "fitsea", nama: "Fitsea", harga: 195000, stok: 75, tagline: "Sea Collagen Capsule" },
  { id: "forayya", nama: "Forayya", harga: 320000, stok: 40, tagline: "Sea Collagen Skincare Serum" },
];

// ─── Password sederhana ───────────────────────────────────
const ADMIN_PASSWORD = "melamun2024";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const [villa, setVilla] = useState<VillaPackage[]>(initialVilla);
  const [edu, setEdu] = useState<EduPackage[]>(initialEdu);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<"villa" | "edu" | "produk" | "info" | "kalender">("kalender");
  const [saved, setSaved] = useState(false);

  // ── Availability dari shared context ──
  const { data: availability, removeDay, resetAll } = useAvailability();

  // Info kontak
  const [waNumber, setWaNumber] = useState("6283161259104");
  const [adminName, setAdminName] = useState("MeLamun Villa");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Password salah. Coba lagi.");
    }
  };

  const handleSave = () => {
    // Tampilkan notifikasi saved
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    // Di sini nanti bisa connect ke Supabase untuk simpan ke database
  };

  const formatRp = (val: number) =>
    new Intl.NumberFormat("id-ID").format(val);

  // ─── Login Screen ─────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-ocean-deep">
        <div className="glass rounded-3xl p-10 w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-white mb-2">
              Mē<span className="text-sand">lamun</span>
            </h1>
            <p className="text-white/50 text-sm">Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password admin"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="btn-gold w-full py-3 rounded-xl font-semibold"
            >
              Masuk
            </button>
          </form>
          <p className="text-white/20 text-xs text-center mt-6">
            Akses terbatas untuk admin
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ──────────────────────────────────
  return (
    <div className="min-h-screen bg-ocean-deep pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-white">
              Admin <span className="text-sand">CMS</span>
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Kelola harga, stok, dan informasi website
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-green-400 text-sm">
                <Check size={16} /> Tersimpan!
              </span>
            )}
            <button
              onClick={handleSave}
              className="btn-gold px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2"
            >
              <Save size={16} /> Simpan Perubahan
            </button>
            <button
              onClick={() => setAuthenticated(false)}
              className="glass px-4 py-2.5 rounded-full text-sm text-white/60 hover:text-white transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["kalender", "villa", "edu", "produk", "info"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "btn-gold"
                  : "glass text-white/60 hover:text-white"
              }`}
            >
              {tab === "kalender" ? "📅 Kalender" : tab === "villa" ? "🏠 Villa" : tab === "edu" ? "🌿 Edu Trip" : tab === "produk" ? "🛍️ Produk" : "📞 Info Kontak"}
            </button>
          ))}
        </div>

        {/* ── TAB: KALENDER ── */}
        {activeTab === "kalender" && (
          <div>
            <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-white font-semibold">Kalender Ketersediaan Kamar</h2>
                <p className="text-white/50 text-sm mt-1">
                  Klik tanggal → atur status tiap kamar. Perubahan <span className="text-sand">langsung sync</span> ke halaman utama.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="glass rounded-xl px-4 py-2 text-sm text-white/60">
                  Total kamar: <span className="text-white font-semibold">9</span>
                  <span className="text-white/30 mx-1">·</span>
                  3 paket × 3 kamar
                </div>
                <div className="glass rounded-xl px-4 py-2 text-sm text-white/60">
                  Hari penuh:{" "}
                  <span className="text-red-400 font-semibold">
                    {availability.filter((d) => countAvailable(d) === 0).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Kalender — pakai context, tidak perlu prop data */}
              <AvailabilityCalendar isAdmin={true} />

              {/* Daftar booking */}
              <div className="glass rounded-3xl p-6">
                <h3 className="text-white font-medium mb-4 flex items-center justify-between">
                  Daftar Booking
                  <span className="text-white/40 text-xs font-normal">{availability.length} tanggal</span>
                </h3>

                {availability.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">
                    Belum ada data. Klik tanggal di kalender untuk menambah.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {[...availability]
                      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
                      .map((day) => {
                        const avail = countAvailable(day);
                        const color = getDayColor(day);
                        return (
                          <div key={day.tanggal} className="bg-white/5 rounded-xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                              <p className="text-white text-sm font-medium">
                                {new Date(day.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                                })}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  color === "full" ? "bg-red-500 text-white"
                                  : color === "almost" ? "bg-orange-500/80 text-white"
                                  : color === "half" ? "bg-yellow-500/40 text-yellow-200"
                                  : "bg-green-500/20 text-green-400"
                                }`}>
                                  {avail === 0 ? "FULL" : `${avail}/9 tersedia`}
                                </span>
                                <button
                                  onClick={() => removeDay(day.tanggal)}
                                  className="text-white/20 hover:text-red-400 transition-colors text-lg leading-none"
                                  title="Hapus tanggal ini"
                                >×</button>
                              </div>
                            </div>
                            {/* Per paket */}
                            {PAKET_GROUPS.map((group) => {
                              const bookedInGroup = group.rooms.filter((rid) => {
                                const r = day.rooms.find((rb) => rb.roomId === rid);
                                return r && r.status !== "tersedia";
                              }).length;
                              if (bookedInGroup === 0) return null;
                              return (
                                <div key={group.paket} className="border-t border-white/5">
                                  <div className="px-4 py-1.5 bg-white/3">
                                    <p className="text-white/50 text-xs font-medium">{group.paket}</p>
                                  </div>
                                  {group.rooms.map((roomId) => {
                                    const room = VILLA_ROOMS.find((r) => r.id === roomId)!;
                                    const rd = day.rooms.find((r) => r.roomId === roomId);
                                    if (!rd || rd.status === "tersedia") return null;
                                    return (
                                      <div key={roomId} className="flex items-center justify-between px-6 py-1.5">
                                        <div>
                                          <p className="text-white/60 text-xs">{room.nama}</p>
                                          {rd.namaTamu && <p className="text-white/30 text-xs">{rd.namaTamu}</p>}
                                          {rd.catatan && <p className="text-white/30 text-xs">{rd.catatan}</p>}
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                          rd.status === "terpesan" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"
                                        }`}>
                                          {rd.status === "terpesan" ? "Terpesan" : "Maintenance"}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <p className="text-white/30 text-xs">Klik × untuk hapus per tanggal</p>
                  <button onClick={resetAll} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">
                    Reset semua
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: VILLA ── */}
        {activeTab === "villa" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Paket Villa & Harga</h2>
            {villa.map((pkg, i) => (
              <div key={pkg.id} className="glass rounded-2xl p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-white/50 text-xs mb-1">Nama Paket</label>
                    <input
                      type="text"
                      value={pkg.nama}
                      onChange={(e) => {
                        const updated = [...villa];
                        updated[i] = { ...updated[i], nama: e.target.value };
                        setVilla(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Harga / Malam (Rp)</label>
                    <input
                      type="number"
                      value={pkg.harga}
                      onChange={(e) => {
                        const updated = [...villa];
                        updated[i] = { ...updated[i], harga: Number(e.target.value) };
                        setVilla(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                    <p className="text-sand text-xs mt-1">Rp {formatRp(pkg.harga)}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Kapasitas (tamu)</label>
                    <input
                      type="number"
                      value={pkg.kapasitas}
                      onChange={(e) => {
                        const updated = [...villa];
                        updated[i] = { ...updated[i], kapasitas: Number(e.target.value) };
                        setVilla(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-white/50 text-xs mb-1">Deskripsi</label>
                    <textarea
                      value={pkg.deskripsi}
                      onChange={(e) => {
                        const updated = [...villa];
                        updated[i] = { ...updated[i], deskripsi: e.target.value };
                        setVilla(updated);
                      }}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: EDU TRIP ── */}
        {activeTab === "edu" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Paket Edu Trip & Open Trip</h2>
            {edu.map((pkg, i) => (
              <div key={pkg.id} className="glass rounded-2xl p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-white/50 text-xs mb-1">Nama Paket</label>
                    <input
                      type="text"
                      value={pkg.nama}
                      onChange={(e) => {
                        const updated = [...edu];
                        updated[i] = { ...updated[i], nama: e.target.value };
                        setEdu(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Harga / Orang (Rp)</label>
                    <input
                      type="number"
                      value={pkg.harga}
                      onChange={(e) => {
                        const updated = [...edu];
                        updated[i] = { ...updated[i], harga: Number(e.target.value) };
                        setEdu(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                    <p className="text-sand text-xs mt-1">Rp {formatRp(pkg.harga)}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Maks. Peserta</label>
                    <input
                      type="number"
                      value={pkg.kapasitas}
                      onChange={(e) => {
                        const updated = [...edu];
                        updated[i] = { ...updated[i], kapasitas: Number(e.target.value) };
                        setEdu(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-white/50 text-xs mb-1">Durasi</label>
                    <input
                      type="text"
                      value={pkg.durasi}
                      onChange={(e) => {
                        const updated = [...edu];
                        updated[i] = { ...updated[i], durasi: e.target.value };
                        setEdu(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: PRODUK ── */}
        {activeTab === "produk" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Produk Housome Store</h2>
            {products.map((prod, i) => (
              <div key={prod.id} className="glass rounded-2xl p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-white/50 text-xs mb-1">Nama Produk</label>
                    <input
                      type="text"
                      value={prod.nama}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[i] = { ...updated[i], nama: e.target.value };
                        setProducts(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Harga (Rp)</label>
                    <input
                      type="number"
                      value={prod.harga}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[i] = { ...updated[i], harga: Number(e.target.value) };
                        setProducts(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                    <p className="text-sand text-xs mt-1">Rp {formatRp(prod.harga)}</p>
                  </div>
                  <div>
                    <label className="block text-white/50 text-xs mb-1">Stok</label>
                    <input
                      type="number"
                      value={prod.stok}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[i] = { ...updated[i], stok: Number(e.target.value) };
                        setProducts(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                    <p className={`text-xs mt-1 ${prod.stok > 10 ? "text-green-400" : prod.stok > 0 ? "text-yellow-400" : "text-red-400"}`}>
                      {prod.stok > 10 ? "✓ Stok Aman" : prod.stok > 0 ? "⚠ Stok Menipis" : "✗ Habis"}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="block text-white/50 text-xs mb-1">Tagline</label>
                    <input
                      type="text"
                      value={prod.tagline}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[i] = { ...updated[i], tagline: e.target.value };
                        setProducts(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: INFO KONTAK ── */}
        {activeTab === "info" && (
          <div className="space-y-4">
            <h2 className="text-white font-semibold mb-4">Informasi Kontak & WhatsApp</h2>
            <div className="glass rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-white/50 text-xs mb-1">
                  Nomor WhatsApp Admin (tanpa +)
                </label>
                <input
                  type="text"
                  value={waNumber}
                  onChange={(e) => setWaNumber(e.target.value)}
                  placeholder="6283161259104"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                />
                <p className="text-white/40 text-xs mt-1">
                  Format: 628xxxxxxxxxx (tanpa spasi atau tanda +)
                </p>
              </div>
              <div>
                <label className="block text-white/50 text-xs mb-1">Nama Admin / Bisnis</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sand"
                />
              </div>
              <div className="bg-ocean-teal/20 rounded-xl p-4 border border-ocean-teal/30">
                <p className="text-white/70 text-sm mb-2 font-medium">Preview link WA:</p>
                <code className="text-sand text-xs break-all">
                  https://wa.me/{waNumber}
                </code>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-medium mb-3">Panduan Penggunaan CMS</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>• Edit harga, stok, atau nama di field yang tersedia</li>
                <li>• Klik <strong className="text-sand">Simpan Perubahan</strong> setelah selesai edit</li>
                <li>• Perubahan harga akan langsung terlihat di halaman website</li>
                <li>• Untuk koneksi database permanen, hubungkan ke Supabase</li>
                <li>• Password admin dapat diubah di file <code className="text-sand">app/admin/page.tsx</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* Save button bottom */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="btn-gold px-8 py-3 rounded-full font-semibold flex items-center gap-2"
          >
            <Save size={16} /> Simpan Semua Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

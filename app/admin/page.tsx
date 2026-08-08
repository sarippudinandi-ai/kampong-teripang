"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Check, Save, Eye, EyeOff, Bell, LayoutGrid, CalendarRange, ClipboardList } from "lucide-react";
import CinemaRoomGridUpgraded from "@/components/admin/CinemaRoomGridUpgraded";
import BookingsManager from "@/components/admin/BookingsManager";
import RoomAvailabilityAdmin from "@/components/admin/RoomAvailabilityAdmin";
import { invalidateSiteConfig } from "@/lib/useSiteConfig";
import { invalidateCmsContent, mergeById } from "@/lib/cmsContent";

// Supabase client for admin-wide realtime notifications
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [villa, setVilla] = useState<VillaPackage[]>(initialVilla);
  const [edu, setEdu] = useState<EduPackage[]>(initialEdu);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<"villa" | "edu" | "produk" | "info" | "dashboard">("dashboard");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCount, setActiveCount] = useState<number | null>(null);

  // Admin-wide realtime notification toast (MISI 5)
  const [adminToast, setAdminToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAdminToast = (msg: string) => {
    setAdminToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setAdminToast(null), 4000);
  };

  // ── Info kontak ──
  const [waNumber, setWaNumber] = useState("6283161259104");
  const [adminName, setAdminName] = useState("MeLamun Villa");
  const [savingContact, setSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  // Load global site config (WhatsApp number) once authenticated (MISI 4)
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((json) => {
        if (json?.config) {
          setWaNumber(json.config.whatsapp_number || "6283161259104");
          setAdminName(json.config.business_name || "MeLamun Villa");
        }
      })
      .catch(() => {});
  }, [authenticated]);

  // Load CMS content overrides (harga/nama/stok) once authenticated
  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/cms-content")
      .then((r) => r.json())
      .then((json) => {
        const c = json?.content;
        if (!c) return;
        if (Array.isArray(c.villa) && c.villa.length)
          setVilla((prev) => mergeById(prev, c.villa));
        if (Array.isArray(c.edu) && c.edu.length)
          setEdu((prev) => mergeById(prev, c.edu));
        if (Array.isArray(c.products) && c.products.length)
          setProducts((prev) => mergeById(prev, c.products));
      })
      .catch(() => {});
  }, [authenticated]);

  // Admin-wide realtime listener: toast on new/updated bookings (MISI 5)
  useEffect(() => {
    if (!authenticated) return;

    // Hitung jumlah booking aktif (live)
    const fetchActiveCount = async () => {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("booking_status", ["PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"]);
      setActiveCount(count ?? 0);
    };

    fetchActiveCount();

    const channel = supabase
      .channel("admin-global-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const name = (payload.new as any)?.guest_name || "Tamu";
          showAdminToast(`🎉 Booking baru dari ${name}!`);
          fetchActiveCount();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        () => {
          showAdminToast("🔄 Status booking diperbarui");
          fetchActiveCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticated]);

  // Save global contact config to Supabase (MISI 4)
  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      const res = await fetch("/api/site-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_number: waNumber,
          business_name: adminName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menyimpan kontak");
        return;
      }
      invalidateSiteConfig(); // so landing components refetch new number
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2500);
    } catch {
      alert("Gagal menyimpan kontak");
    } finally {
      setSavingContact(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setAuthError("");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAuthenticated(true);
        setPassword(""); // Clear password from memory
      } else {
        setAuthError(data.error || "Password salah. Coba lagi.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/verify", { method: "DELETE" });
      setAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ villa, edu, products }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Gagal menyimpan perubahan");
        return;
      }
      invalidateCmsContent(); // agar landing fetch ulang data terbaru
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Gagal menyimpan perubahan. Periksa koneksi.");
    } finally {
      setSaving(false);
    }
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
              disabled={loggingIn}
              className="btn-gold w-full py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loggingIn ? "Memverifikasi..." : "Masuk"}
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
      {/* Realtime notification toast (MISI 5) */}
      {adminToast && (
        <div className="fixed top-24 right-6 z-[60]">
          <div className="glass border border-sand/40 rounded-xl shadow-2xl px-5 py-4 flex items-center gap-3 animate-pulse">
            <Bell size={18} className="text-sand" />
            <p className="font-medium text-white text-sm">{adminToast}</p>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-white">
              Admin <span className="text-sand">CMS</span>
            </h1>
            <p className="text-white/50 text-sm mt-1 flex items-center gap-2 flex-wrap">
              <span>Kelola harga, stok, dan informasi website</span>
              {activeCount !== null && (
                <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-0.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeCount} booking aktif
                </span>
              )}
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
              disabled={saving}
              className="btn-gold px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={16} /> {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              onClick={handleLogout}
              className="glass px-4 py-2.5 rounded-full text-sm text-white/60 hover:text-white transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["dashboard", "villa", "edu", "produk", "info"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "btn-gold"
                  : "glass text-white/60 hover:text-white"
              }`}
            >
              {tab === "dashboard" ? (
                <span className="inline-flex items-center gap-1.5">
                  📊 Dashboard
                  {activeCount !== null && activeCount > 0 && (
                    <span className={`text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center ${
                      activeTab === "dashboard" ? "bg-ocean-deep/30 text-ocean-deep" : "bg-sand text-ocean-deep"
                    }`}>
                      {activeCount}
                    </span>
                  )}
                </span>
              ) : tab === "villa" ? "🏠 Villa"
                : tab === "edu" ? "🌿 Edu Trip"
                : tab === "produk" ? "🛍️ Produk"
                : "📞 Info Kontak"}
            </button>
          ))}
        </div>

        {/* ── TAB: DASHBOARD (Cinema Grid + Bookings + Kalender) — MISI 1 ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Cinema-Style Room Grid */}
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-sand/15 border border-sand/30 flex items-center justify-center text-sand shrink-0">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h2 className="text-white font-serif text-2xl leading-tight">Status Kamar</h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    🟢 Tersedia · 🟡 Menunggu Bayar · 🔴 Terkonfirmasi · 🟠 Maintenance
                  </p>
                </div>
              </div>
              <CinemaRoomGridUpgraded />
            </div>

            {/* Booking Management: Aktif + Riwayat (tab switcher) */}
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-sand/15 border border-sand/30 flex items-center justify-center text-sand shrink-0">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h2 className="text-white font-serif text-2xl leading-tight">Manajemen Booking</h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    Kelola booking aktif &amp; lihat riwayat pesanan
                  </p>
                </div>
              </div>
              <BookingsManager />
            </div>

            {/* Ketersediaan Kamar — okupansi real-time + booking manual */}
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-sand/15 border border-sand/30 flex items-center justify-center text-sand shrink-0">
                  <CalendarRange size={20} />
                </div>
                <div>
                  <h2 className="text-white font-serif text-2xl leading-tight">Ketersediaan Kamar</h2>
                  <p className="text-white/50 text-xs mt-0.5">
                    Okupansi <span className="text-sand">real-time</span> · klik tanggal untuk booking manual
                  </p>
                </div>
              </div>

              <RoomAvailabilityAdmin />
            </div>
          </div>
        )}

        {/* ── TAB: VILLA ── */}
        {activeTab === "villa" && (
          <div className="space-y-4">
            <h2 className="text-white font-serif text-2xl mb-4">Paket Villa &amp; Harga</h2>
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
            <h2 className="text-white font-serif text-2xl mb-4">Paket Edu Trip &amp; Open Trip</h2>
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
            <h2 className="text-white font-serif text-2xl mb-4">Produk Housome Store</h2>
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
            <h2 className="text-white font-serif text-2xl mb-4">Informasi Kontak &amp; WhatsApp</h2>
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact}
                  className="btn-gold px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={16} />
                  {savingContact ? "Menyimpan..." : "Simpan Nomor WhatsApp"}
                </button>
                {contactSaved && (
                  <span className="flex items-center gap-1.5 text-green-400 text-sm">
                    <Check size={16} /> Tersimpan & sinkron ke seluruh halaman!
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs">
                Nomor ini otomatis dipakai tombol WhatsApp di seluruh website (navbar, footer, tombol floating).
              </p>
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

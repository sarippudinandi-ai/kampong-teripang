"use client";

import { useState } from "react";
import { Calendar, Users, ArrowRight, CheckCircle } from "lucide-react";

interface Package {
  id: string;
  nama: string;
  harga: number;
  kapasitas: number;
}

interface BookingWidgetProps {
  packages: Package[];
}

export default function BookingWidget({ packages }: BookingWidgetProps) {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_wa: "",
    paket: packages[0]?.id || "",
    check_in: "",
    check_out: "",
    tamu: 2,
    catatan: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const selectedPackage = packages.find((p) => p.id === form.paket);

  const getNights = () => {
    if (!form.check_in || !form.check_out) return 0;
    const diff =
      new Date(form.check_out).getTime() - new Date(form.check_in).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const totalPrice = selectedPackage
    ? selectedPackage.harga * getNights()
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const nights = getNights();
      const pkg = selectedPackage;

      const message = [
        "🌊 *RESERVASI MELAMUN KELONG VILLA*",
        "─────────────────────",
        `📋 *Paket:* ${pkg?.nama || form.paket}`,
        `📅 *Check-in:* ${form.check_in}`,
        `📅 *Check-out:* ${form.check_out}`,
        `🌙 *Durasi:* ${nights} malam`,
        `👥 *Jumlah Tamu:* ${form.tamu} orang`,
        "─────────────────────",
        `👤 *Nama:* ${form.nama}`,
        `📱 *No. WA:* ${form.no_wa}`,
        `📧 *Email:* ${form.email}`,
        ...(form.catatan ? [`📝 *Catatan:* ${form.catatan}`] : []),
        "─────────────────────",
        `💰 *Total Estimasi:* Rp ${totalPrice > 0 ? totalPrice.toLocaleString("id-ID") : "-"}`,
        "",
        "Mohon konfirmasi ketersediaan dan detail pembayaran. Terima kasih! 🙏",
      ].join("\n");

      const waUrl = `https://wa.me/6283161259104?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
        <h3 className="font-serif text-3xl text-white mb-3">
          Pesan Terkirim ke WhatsApp!
        </h3>
        <p className="text-white/60 mb-6">
          Terima kasih, <strong className="text-white">{form.nama}</strong>!
          Tim kami akan segera membalas pesan WhatsApp Anda untuk konfirmasi ketersediaan.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
        >
          Buat Reservasi Lain
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-3xl p-6 sm:p-8 space-y-6"
    >
      {/* Package Selection */}
      <div>
        <label className="block text-white/70 text-sm mb-2">
          Pilih Paket
        </label>
        <select
          value={form.paket}
          onChange={(e) => setForm({ ...form, paket: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
          required
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id} className="bg-ocean-deep">
              {pkg.nama} — Rp {pkg.harga.toLocaleString("id-ID")} / malam
            </option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">
            <Calendar size={14} className="inline mr-1" />
            Check-in
          </label>
          <input
            type="date"
            value={form.check_in}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setForm({ ...form, check_in: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">
            <Calendar size={14} className="inline mr-1" />
            Check-out
          </label>
          <input
            type="date"
            value={form.check_out}
            min={form.check_in || new Date().toISOString().split("T")[0]}
            onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
            required
          />
        </div>
      </div>

      {/* Guests */}
      <div>
        <label className="block text-white/70 text-sm mb-2">
          <Users size={14} className="inline mr-1" />
          Jumlah Tamu
        </label>
        <select
          value={form.tamu}
          onChange={(e) => setForm({ ...form, tamu: Number(e.target.value) })}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand transition-colors"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n} className="bg-ocean-deep">
              {n} tamu
            </option>
          ))}
        </select>
      </div>

      {/* Personal Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/70 text-sm mb-2">Nama Lengkap</label>
          <input
            type="text"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Nama Anda"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
            required
          />
        </div>
        <div>
          <label className="block text-white/70 text-sm mb-2">No. WhatsApp</label>
          <input
            type="tel"
            value={form.no_wa}
            onChange={(e) => setForm({ ...form, no_wa: e.target.value })}
            placeholder="08xxxxxxxxxx"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-2">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="email@anda.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-white/70 text-sm mb-2">
          Catatan (opsional)
        </label>
        <textarea
          value={form.catatan}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
          placeholder="Permintaan khusus, alergi makanan, dll."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand transition-colors resize-none"
        />
      </div>

      {/* Price Summary */}
      {getNights() > 0 && selectedPackage && (
        <div className="bg-ocean-teal/20 rounded-xl p-4 border border-ocean-teal/30">
          <div className="flex justify-between text-sm text-white/70 mb-2">
            <span>
              Rp {selectedPackage.harga.toLocaleString("id-ID")} × {getNights()}{" "}
              malam
            </span>
            <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-semibold text-white border-t border-white/10 pt-2">
            <span>Total</span>
            <span className="text-sand font-serif text-lg">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-gold w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          "Memproses..."
        ) : (
          <>
            Chat WhatsApp & Pesan <ArrowRight size={18} />
          </>
        )}
      </button>

      <p className="text-white/30 text-xs text-center">
        Anda akan diarahkan ke WhatsApp untuk konfirmasi booking
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Clock,
  Users,
  Calendar,
  Check,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { EDU_PACKAGES } from "@/lib/data";

export default function EduTourPage() {
  const [bookingPkg, setBookingPkg] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_wa: "",
    tanggal: "",
    peserta: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedPkg = EDU_PACKAGES.find((p) => p.id === bookingPkg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const total = selectedPkg ? selectedPkg.harga * form.peserta : 0;

      const message = [
        "🌿 *PENDAFTARAN EDU TRIP / OPEN TRIP*",
        "─────────────────────",
        `📋 *Paket:* ${selectedPkg?.nama || bookingPkg}`,
        `📅 *Tanggal:* ${form.tanggal}`,
        `👥 *Jumlah Peserta:* ${form.peserta} orang`,
        "─────────────────────",
        `👤 *Nama:* ${form.nama}`,
        `📱 *No. WA:* ${form.no_wa}`,
        `📧 *Email:* ${form.email}`,
        "─────────────────────",
        `💰 *Total:* Rp ${total.toLocaleString("id-ID")}`,
        "",
        "Mohon konfirmasi ketersediaan slot dan detail selanjutnya. Terima kasih! 🙏",
      ].join("\n");

      const waUrl = `https://wa.me/6283161259104?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
      setSuccess(true);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=85"
          alt="Edu Tour Kampong Teripang"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ocean-deep/60 via-transparent to-ocean-deep/80" />
        <div className="absolute inset-0 flex items-end pb-16 px-6 sm:px-10 lg:px-16">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-sand" />
                <span className="text-sand text-sm tracking-widest uppercase">
                  Go-Blue Edu
                </span>
              </div>
              <h1 className="font-serif text-5xl sm:text-6xl text-white mb-4">
                Edu-Tourism & Open Trip
              </h1>
              <p className="text-white/70 text-lg max-w-xl">
                Belajar langsung dari alam dan nelayan lokal. Setiap perjalanan
                adalah pelajaran yang tak ada di buku teks.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-serif text-4xl text-white mb-4">
            Paket Tersedia
          </h2>
          <p className="text-white/50 max-w-xl">
            Pilih pengalaman yang paling sesuai dengan minat Anda. Semua paket
            dipandu oleh nelayan dan pemandu lokal berpengalaman.
          </p>
        </motion.div>

        <div className="space-y-8">
          {EDU_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-3xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-5 gap-0">
                {/* Image */}
                <div className="lg:col-span-2 img-zoom h-64 lg:h-auto overflow-hidden">
                  <Image
                    src={pkg.foto_url}
                    alt={pkg.nama}
                    width={600}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="lg:col-span-3 p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <span className="text-sand text-xs tracking-widest uppercase">
                        {pkg.tipe === "tour" ? "Open Trip" : "Program"}
                      </span>
                      <h3 className="font-serif text-3xl text-white mt-1">
                        {pkg.nama}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40 text-xs">Per orang</p>
                      <p className="font-serif text-3xl text-sand">
                        Rp {pkg.harga.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <p className="text-white/60 leading-relaxed mb-6">
                    {pkg.deskripsi}
                  </p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-6 mb-6 text-sm text-white/50">
                    <span className="flex items-center gap-2">
                      <Clock size={15} className="text-sand" />
                      {pkg.durasi}
                    </span>
                    <span className="flex items-center gap-2">
                      <Users size={15} className="text-sand" />
                      Maks. {pkg.kapasitas} orang
                    </span>
                    <span className="flex items-center gap-2">
                      <Calendar size={15} className="text-sand" />
                      {pkg.jadwal.join(", ")}
                    </span>
                  </div>

                  {/* Includes */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {pkg.includes.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-2 text-white/60 text-sm"
                      >
                        <Check size={13} className="text-sand shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setBookingPkg(pkg.id)}
                    className="btn-gold px-7 py-3 rounded-full text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    Daftar Sekarang <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {bookingPkg && !success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-ocean-mid border border-white/10 rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-serif text-2xl text-white">
                  Daftar Trip
                </h3>
                <p className="text-sand text-sm mt-1">{selectedPkg?.nama}</p>
              </div>
              <button
                onClick={() => setBookingPkg(null)}
                className="text-white/40 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Nama Anda"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  No. WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.no_wa}
                  onChange={(e) => setForm({ ...form, no_wa: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@anda.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-sand"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Tanggal Trip
                </label>
                <input
                  type="date"
                  value={form.tanggal}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setForm({ ...form, tanggal: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Jumlah Peserta
                </label>
                <select
                  value={form.peserta}
                  onChange={(e) =>
                    setForm({ ...form, peserta: Number(e.target.value) })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-sand"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n} className="bg-ocean-deep">
                      {n} orang
                    </option>
                  ))}
                </select>
              </div>

              {selectedPkg && (
                <div className="bg-ocean-teal/20 rounded-xl p-4 border border-ocean-teal/30">
                  <div className="flex justify-between text-sm text-white/70 mb-1">
                    <span>
                      Rp {selectedPkg.harga.toLocaleString("id-ID")} ×{" "}
                      {form.peserta} orang
                    </span>
                    <span className="text-sand font-semibold">
                      Rp{" "}
                      {(selectedPkg.harga * form.peserta).toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Memproses..." : "Chat WhatsApp & Daftar"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-ocean-mid border border-white/10 rounded-3xl p-10 w-full max-w-md text-center"
          >
            <CheckCircle size={56} className="text-green-400 mx-auto mb-4" />
            <h3 className="font-serif text-3xl text-white mb-3">
              Pendaftaran Berhasil!
            </h3>
            <p className="text-white/60 mb-6">
              Kami akan menghubungi Anda via WhatsApp untuk konfirmasi jadwal
              dan pembayaran.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setBookingPkg(null);
              }}
              className="btn-gold px-8 py-3 rounded-full font-semibold"
            >
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

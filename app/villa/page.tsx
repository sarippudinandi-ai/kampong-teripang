"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Check,
  Users,
  Wifi,
  Waves,
  Coffee,
  Star,
} from "lucide-react";
import { VILLA_PACKAGES } from "@/lib/data";
import BookingWidget from "@/components/BookingWidget";

const facilities = [
  { icon: Wifi, label: "WiFi Gratis" },
  { icon: Waves, label: "Akses Laut Langsung" },
  { icon: Coffee, label: "Sarapan Termasuk" },
  { icon: Star, label: "Sea Healing Experience" },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
];

export default function VillaPage() {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1920&q=85"
          alt="MeLamun Kelong Villa"
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
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-px bg-sand" />
                <span className="text-sand text-sm tracking-widest uppercase">
                  The Stay
                </span>
              </div>
              <h1 className="font-serif text-5xl sm:text-6xl text-white mb-4">
                MeLamun Kelong Villa
              </h1>
              <p className="text-white/70 text-lg max-w-xl">
                Tidur di atas laut. Bangun dengan sunrise Bintan. Rasakan Sea
                Healing yang sesungguhnya.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Facilities Bar */}
      <section className="bg-ocean-mid border-y border-white/10">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24 py-6">
          <div className="flex flex-wrap justify-center gap-8">
            {facilities.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-white/70">
                <f.icon size={18} className="text-sand" />
                <span className="text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main image */}
          <div className="lg:col-span-2 img-zoom rounded-2xl overflow-hidden h-80 lg:h-[480px]">
            <Image
              src={galleryImages[selectedImage]}
              alt="Villa gallery"
              width={900}
              height={600}
              className="w-full h-full object-cover transition-all duration-500"
            />
          </div>
          {/* Thumbnails */}
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-3">
            {galleryImages.slice(0, 6).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`img-zoom rounded-xl overflow-hidden h-24 lg:h-[140px] transition-all ${
                  selectedImage === i
                    ? "ring-2 ring-sand"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Gallery ${i + 1}`}
                  width={200}
                  height={150}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Villa Packages */}
      <section className="py-16 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-serif text-4xl text-white mb-4">
            Pilih Paket Menginap
          </h2>
          <p className="text-white/50 max-w-xl">
            Setiap paket dirancang untuk memberikan pengalaman kelong yang
            autentik dan tak terlupakan.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {VILLA_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl overflow-hidden card-hover"
            >
              <div className="img-zoom h-48 overflow-hidden">
                <Image
                  src={pkg.foto_url}
                  alt={pkg.nama}
                  width={400}
                  height={250}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-xl text-white mb-2">
                  {pkg.nama}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {pkg.deskripsi}
                </p>

                <div className="flex items-center gap-4 mb-4 text-white/50 text-sm">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {pkg.kapasitas} tamu
                  </span>
                </div>

                <ul className="space-y-2 mb-6">
                  {pkg.fasilitas.slice(0, 4).map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-white/60 text-sm"
                    >
                      <Check size={14} className="text-sand shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white/40 text-xs">Mulai dari</p>
                    <p className="font-serif text-2xl text-sand">
                      Rp {pkg.harga.toLocaleString("id-ID")}
                    </p>
                    <p className="text-white/40 text-xs">/ malam</p>
                  </div>
                  <a
                    href="#booking"
                    className="btn-gold px-5 py-2.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
                  >
                    Pesan
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Booking Widget */}
      <section id="booking" className="py-16 bg-ocean-mid/30">
        <div className="max-w-4xl mx-auto px-8 sm:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-serif text-4xl text-white mb-4">
              Buat Reservasi
            </h2>
            <p className="text-white/50">
              Isi form di bawah dan kami akan konfirmasi ketersediaan dalam 1x24
              jam
            </p>
          </motion.div>
          <BookingWidget packages={VILLA_PACKAGES} />
        </div>
      </section>

      {/* Sea Healing Info */}
      <section className="py-24 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="section-divider mb-6" />
            <h2 className="font-serif text-4xl text-white mb-6">
              Apa itu <span className="text-sand italic">Sea Healing</span>?
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Sea Healing adalah konsep pemulihan holistik yang kami kembangkan
              — menggabungkan terapi suara ombak, udara laut yang kaya ion
              negatif, dan ketenangan visual laut biru yang tak bertepi.
            </p>
            <p className="text-white/60 leading-relaxed mb-6">
              Penelitian menunjukkan bahwa berada di dekat laut menurunkan
              kortisol (hormon stres), meningkatkan serotonin, dan memperbaiki
              kualitas tidur secara signifikan.
            </p>
            <p className="text-white/60 leading-relaxed">
              Di MeLamun Villa, Anda tidak hanya menginap — Anda menyembuhkan
              diri dengan cara yang paling alami.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="img-zoom rounded-3xl overflow-hidden h-96"
          >
            <Image
              src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80"
              alt="Sea Healing di MeLamun Villa"
              width={700}
              height={500}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </section>
    </>
  );
}

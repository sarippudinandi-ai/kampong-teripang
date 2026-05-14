"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";

const pillars = [
  {
    emoji: "🌊",
    title: "Stay Experience",
    subtitle: "MeLamun Villa",
    desc: "Tidur di atas laut dalam villa kelong autentik. Sunrise, ombak, dan bintang malam jadi teman istirahat Anda.",
    href: "/villa",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80",
    color: "from-ocean-teal/80",
  },
  {
    emoji: "🌿",
    title: "Go-Blue Edu",
    subtitle: "Edu-Tourism & Open Trip",
    desc: "Selami dunia teripang bersama nelayan lokal. School of Fish, Lamun Warrior, dan tradisi Bekarang menanti.",
    href: "/edu-tour",
    image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80",
    color: "from-emerald-900/80",
  },
  {
    emoji: "🛍️",
    title: "Housome Store",
    subtitle: "Produk Kolagen Teripang",
    desc: "Bawa pulang kesehatan dari laut. Seacume, Fitsea, dan Forayya — kolagen teripang murni dari Bintan.",
    href: "/store",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    color: "from-amber-900/80",
  },
];

const stats = [
  { value: "100+", label: "Tamu Puas" },
  { value: "3", label: "Paket Wisata" },
  { value: "5★", label: "Rating Rata-rata" },
  { value: "2019", label: "Berdiri Sejak" },
];

const reviews = [
  {
    name: "Rina Kusuma",
    origin: "Jakarta",
    text: "Pengalaman paling unik yang pernah saya rasakan. Tidur di atas laut, bangun dengan sunrise yang luar biasa. Benar-benar healing!",
    rating: 5,
  },
  {
    name: "Ahmad Fauzi",
    origin: "Surabaya",
    text: "School of Fish membuka mata saya tentang pentingnya teripang. Pak nelayan sangat ramah dan informatif. Wajib dicoba!",
    rating: 5,
  },
  {
    name: "Sarah Tan",
    origin: "Singapura",
    text: "Forayya serum sudah saya pakai 2 bulan, kulit terasa lebih lembab dan cerah. Produk alami terbaik yang pernah saya coba.",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <HeroSection />

      {/* ── STATS BAR ── */}
      <section className="bg-ocean-mid border-y border-white/10">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-serif text-3xl text-sand mb-1">{stat.value}</div>
                <div className="text-white/50 text-xs tracking-widest uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRODUCTION ── */}
      <section className="py-24 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-divider mb-6" />
            <h2 className="font-serif text-4xl sm:text-5xl text-white leading-tight mb-6">
              Edu-Ekowisata Teripang{" "}
              <span className="text-sand italic">Pertama di Dunia</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Di ujung timur Pulau Bintan, tersembunyi sebuah kampung nelayan yang menyimpan
              kekayaan luar biasa. Kampong Teripang bukan sekadar destinasi wisata — ini adalah
              ekosistem hidup yang menyatukan tradisi, sains, dan keindahan alam laut.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Kami percaya bahwa wisata terbaik adalah yang memberi dampak nyata — bagi tamu
              yang pulang lebih sehat, bagi nelayan yang hidupnya lebih sejahtera, dan bagi
              laut yang terjaga kelestariannya.
            </p>
            <Link
              href="/our-story"
              className="inline-flex items-center gap-2 text-sand hover:text-sand-light transition-colors text-sm font-medium"
            >
              Baca Kisah Kami <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="img-zoom rounded-2xl overflow-hidden h-64">
                <Image
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80"
                  alt="Kehidupan bawah laut Bintan"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="img-zoom rounded-2xl overflow-hidden h-64 mt-8">
                <Image
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80"
                  alt="Sunset kelong Bintan"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-full text-center whitespace-nowrap">
              <span className="text-sand text-sm font-semibold">🌊 Bintan, Kepulauan Riau</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 3 PILLARS ── */}
      <section className="py-24 bg-ocean-mid/30">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="section-divider mx-auto mb-6" />
            <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4">
              Tiga Pilar Pengalaman
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Setiap kunjungan ke Kampong Teripang adalah perjalanan lengkap —
              menginap, belajar, dan membawa pulang kesehatan.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link href={pillar.href} className="block group">
                  <div className="card-hover relative rounded-3xl overflow-hidden h-96">
                    <Image
                      src={pillar.image}
                      alt={pillar.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${pillar.color} to-transparent`} />
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <div className="w-10 h-10 rounded-full glass flex items-center justify-center mb-4">
                        <span className="text-lg">{pillar.emoji}</span>
                      </div>
                      <p className="text-sand text-xs tracking-widest uppercase mb-1">
                        {pillar.subtitle}
                      </p>
                      <h3 className="font-serif text-2xl text-white mb-2">{pillar.title}</h3>
                      <p className="text-white/70 text-sm leading-relaxed">{pillar.desc}</p>
                      <div className="flex items-center gap-2 mt-4 text-sand text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Jelajahi <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEKARANG SECTION ── */}
      <section className="py-24 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="img-zoom rounded-3xl overflow-hidden h-[500px]">
              <Image
                src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
                alt="Tradisi Bekarang Bintan"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute bottom-8 left-8 right-8 glass rounded-2xl p-6">
              <p className="font-serif text-lg text-white/90 italic leading-relaxed">
                &ldquo;Bekarang bukan sekadar memanen — ini adalah doa, syukur, dan janji
                untuk menjaga laut bagi generasi berikutnya.&rdquo;
              </p>
              <p className="text-sand text-sm mt-3">— Pak Hamid, Nelayan Senior</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <div className="section-divider mb-6" />
            <span className="text-sand text-xs tracking-widest uppercase mb-4 block">
              Kearifan Lokal
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl text-white leading-tight mb-6">
              Tradisi <span className="text-sand italic">Bekarang</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              <strong className="text-white">Bekarang</strong> adalah ritual panen teripang
              komunal yang telah diwariskan selama ratusan tahun oleh masyarakat pesisir Bintan.
              Setiap bulan purnama, nelayan berkumpul, berdoa bersama, lalu turun ke laut dengan
              perahu tradisional.
            </p>
            <p className="text-white/60 leading-relaxed mb-8">
              Kini, Anda bisa menjadi bagian dari tradisi ini. Bergabunglah dalam Open Trip
              Bekarang dan rasakan sendiri kearifan yang tak ternilai ini.
            </p>
            <Link
              href="/edu-tour"
              className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              Ikut Open Trip Bekarang <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── AVAILABILITY CALENDAR ── */}
      <section className="py-24 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="section-divider mb-6" />
            <h2 className="font-serif text-4xl sm:text-5xl text-white leading-tight mb-6">
              Cek <span className="text-sand italic">Ketersediaan</span>
            </h2>
            <p className="text-white/60 leading-relaxed mb-6">
              Lihat jadwal ketersediaan villa dan open trip secara real-time.
              Tanggal yang masih kosong siap untuk Anda pesan sekarang.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-white/10 shrink-0" />
                <span className="text-white/60 text-sm">Tersedia — bisa dipesan</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-red-500/40 shrink-0" />
                <span className="text-white/60 text-sm">Penuh — sudah ada tamu</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-yellow-500/40 shrink-0" />
                <span className="text-white/60 text-sm">Maintenance — tidak tersedia sementara</span>
              </div>
            </div>
            <Link
              href="/villa#booking"
              className="btn-gold inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              Pesan Tanggal Tersedia <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <AvailabilityCalendar />
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-ocean-mid/30">
        <div className="max-w-6xl mx-auto px-8 sm:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-4xl text-white mb-4">Kata Mereka</h2>
            <p className="text-white/50">
              Pengalaman nyata dari tamu yang telah merasakan keajaiban Kampong Teripang
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-sand fill-sand" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ocean-teal flex items-center justify-center text-white font-semibold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{review.name}</p>
                    <p className="text-white/40 text-xs">{review.origin}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1920&q=80"
            alt="MeLamun Villa dari atas"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-ocean-deep/75" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight">
              Siap Merasakan{" "}
              <span className="text-sand italic">Keajaiban Laut</span>?
            </h2>
            <p className="text-white/60 text-lg mb-10 leading-relaxed">
              Pesan villa Anda sekarang dan jadilah bagian dari gerakan edu-ekowisata
              yang mengubah cara dunia memandang teripang.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/villa#booking"
                className="btn-gold px-8 py-4 rounded-full text-base font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                Pesan Sekarang <ArrowRight size={18} />
              </Link>
              <a
                href="https://wa.me/6283161259104"
                target="_blank"
                rel="noopener noreferrer"
                className="glass px-8 py-4 rounded-full text-base font-light text-white hover:bg-white/10 transition-all"
              >
                Tanya via WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

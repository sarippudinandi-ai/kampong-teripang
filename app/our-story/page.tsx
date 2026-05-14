"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FAQS } from "@/lib/data";

const timeline = [
  {
    year: "2015",
    title: "Awal Mula",
    desc: "Sekelompok nelayan muda Bintan mulai membudidayakan teripang secara tradisional, terinspirasi dari tradisi Bekarang leluhur mereka.",
  },
  {
    year: "2018",
    title: "Riset & Pengembangan",
    desc: "Bermitra dengan peneliti kelautan untuk mengembangkan teknik budidaya teripang yang berkelanjutan dan ramah lingkungan.",
  },
  {
    year: "2019",
    title: "Kampong Teripang Berdiri",
    desc: "Resmi mendirikan Kampong Teripang sebagai pusat budidaya dan edukasi teripang pertama di Bintan.",
  },
  {
    year: "2021",
    title: "MeLamun Villa Dibuka",
    desc: "Membuka villa kelong di atas laut untuk wisatawan yang ingin merasakan pengalaman menginap autentik sambil belajar tentang teripang.",
  },
  {
    year: "2022",
    title: "Housome Store Diluncurkan",
    desc: "Meluncurkan lini produk kolagen teripang: Seacume, Fitsea, dan Forayya — membawa manfaat laut ke kehidupan sehari-hari.",
  },
  {
    year: "2024",
    title: "Ekspansi Digital",
    desc: "Membangun platform digital untuk menjangkau lebih banyak wisatawan dan pelanggan produk dari seluruh Indonesia dan mancanegara.",
  },
];

const blogPosts = [
  {
    id: 1,
    title: "Mengapa Teripang Disebut 'Emas Hitam' Laut?",
    excerpt:
      "Teripang telah digunakan dalam pengobatan tradisional Asia selama ribuan tahun. Kini sains modern membuktikan apa yang nenek moyang kita sudah tahu...",
    date: "15 Nov 2024",
    category: "Edukasi",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
  },
  {
    id: 2,
    title: "Tradisi Bekarang: Ketika Panen Adalah Doa",
    excerpt:
      "Setiap bulan purnama, nelayan Kampong Teripang berkumpul untuk ritual Bekarang. Ini bukan sekadar panen — ini adalah perayaan hubungan manusia dengan laut...",
    date: "2 Nov 2024",
    category: "Budaya",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  },
  {
    id: 3,
    title: "5 Manfaat Kolagen Teripang yang Terbukti Secara Ilmiah",
    excerpt:
      "Dari regenerasi kulit hingga kesehatan sendi, kolagen teripang memiliki profil nutrisi yang luar biasa. Berikut penelitian terbaru yang mendukungnya...",
    date: "20 Okt 2024",
    category: "Kesehatan",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
  },
];

export default function OurStoryPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85"
          alt="Our Story Kampong Teripang"
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
                  Our Story
                </span>
              </div>
              <h1 className="font-serif text-5xl sm:text-6xl text-white mb-4">
                Kisah Kami
              </h1>
              <p className="text-white/70 text-lg max-w-xl">
                Dari tradisi nelayan Bintan yang berusia ratusan tahun, lahirlah
                ekosistem digital edu-ekowisata pertama di dunia.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {[
            {
              title: "Visi",
              desc: "Menjadi platform edu-ekowisata teripang pertama di dunia yang menyatukan pengalaman menginap, edukasi, dan produk kesehatan.",
              icon: "🌊",
            },
            {
              title: "Misi",
              desc: "Memberdayakan nelayan lokal, melestarikan ekosistem laut, dan mengedukasi dunia tentang kekayaan teripang Bintan.",
              icon: "🎯",
            },
            {
              title: "Nilai",
              desc: "Keberlanjutan, kearifan lokal, transparansi, dan dampak nyata bagi komunitas dan lingkungan.",
              icon: "💚",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-serif text-2xl text-white mb-3">
                {item.title}
              </h3>
              <p className="text-white/60 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-ocean-mid/30">
        <div className="max-w-4xl mx-auto px-8 sm:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="section-divider mx-auto mb-6" />
            <h2 className="font-serif text-4xl text-white mb-4">
              Perjalanan Kami
            </h2>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-ocean-teal/40" />

            <div className="space-y-8">
              {timeline.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-8"
                >
                  {/* Dot */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full glass border border-sand/30 flex items-center justify-center">
                      <span className="text-sand text-sm font-semibold">
                        {item.year}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="glass rounded-2xl p-6 flex-1">
                    <h3 className="font-serif text-xl text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blog" className="py-20 px-8 sm:px-14 lg:px-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="section-divider mb-6" />
          <h2 className="font-serif text-4xl text-white mb-4">
            Artikel & Cerita
          </h2>
          <p className="text-white/50">
            Pengetahuan, budaya, dan kisah dari Kampong Teripang
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {blogPosts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl overflow-hidden card-hover cursor-pointer"
            >
              <div className="img-zoom h-48 overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sand text-xs tracking-widest uppercase">
                    {post.category}
                  </span>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="text-white/40 text-xs">{post.date}</span>
                </div>
                <h3 className="font-serif text-xl text-white mb-3 leading-snug">
                  {post.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-ocean-mid/30">
        <div className="max-w-3xl mx-auto px-8 sm:px-14 lg:px-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-4xl text-white mb-4">
              Pertanyaan Umum
            </h2>
            <p className="text-white/50">
              Semua yang perlu Anda ketahui sebelum berkunjung
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-white font-medium pr-4">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={18} className="text-sand shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-white/40 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-white/60 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

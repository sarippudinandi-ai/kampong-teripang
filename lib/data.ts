// Static data / dummy content — ganti via CMS atau Supabase nanti

export const VILLA_PACKAGES = [
  {
    id: "villa-standard",
    nama: "Sea Healing Room",
    deskripsi:
      "Kamar kelong di atas laut dengan pemandangan 360° Selat Bintan. Tidur diiringi suara ombak, bangun dengan sunrise di atas air.",
    harga: 850000,
    kapasitas: 2,
    fasilitas: [
      "Kamar di atas laut",
      "AC & kipas angin",
      "Sarapan pagi",
      "Snorkeling gear",
      "Akses dermaga pribadi",
      "WiFi",
    ],
    foto_url:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80",
    tipe: "stay" as const,
  },
  {
    id: "villa-deluxe",
    nama: "Kelong Deluxe Suite",
    deskripsi:
      "Suite premium dengan dek privat langsung di atas laut. Nikmati makan malam romantis di bawah bintang sambil mendengar deburan ombak.",
    harga: 1350000,
    kapasitas: 2,
    fasilitas: [
      "Dek privat di atas laut",
      "Bathtub outdoor",
      "Sarapan & makan malam",
      "Kayak & paddleboard",
      "Tur teripang eksklusif",
      "WiFi & Smart TV",
    ],
    foto_url:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    tipe: "stay" as const,
  },
  {
    id: "villa-family",
    nama: "Family Kelong House",
    deskripsi:
      "Rumah kelong keluarga dengan 2 kamar tidur. Sempurna untuk liburan keluarga yang ingin merasakan kehidupan nelayan Bintan yang autentik.",
    harga: 2200000,
    kapasitas: 6,
    fasilitas: [
      "2 kamar tidur",
      "Ruang keluarga di atas laut",
      "Dapur mini",
      "Sarapan untuk semua tamu",
      "Aktivitas memancing",
      "Tur edukasi teripang",
    ],
    foto_url:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    tipe: "stay" as const,
  },
];

export const EDU_PACKAGES = [
  {
    id: "school-of-fish",
    nama: "School of Fish",
    deskripsi:
      "Program edukasi intensif budidaya teripang bersama nelayan lokal. Pelajari siklus hidup teripang, teknik pembesaran, dan nilai ekonominya.",
    harga: 350000,
    durasi: "4 jam",
    kapasitas: 15,
    jadwal: ["Sabtu", "Minggu"],
    foto_url:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    tipe: "tour" as const,
    includes: [
      "Pemandu lokal berpengalaman",
      "Snorkeling di padang lamun",
      "Sertifikat peserta",
      "Makan siang seafood",
    ],
  },
  {
    id: "lamun-warrior",
    nama: "Lamun Warrior",
    deskripsi:
      "Bergabunglah dengan misi pelestarian padang lamun (seagrass). Tanam lamun, pantau ekosistem, dan jadilah bagian dari gerakan konservasi laut Bintan.",
    harga: 275000,
    durasi: "3 jam",
    kapasitas: 20,
    jadwal: ["Sabtu", "Minggu", "Hari Libur"],
    foto_url:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    tipe: "tour" as const,
    includes: [
      "Kit penanaman lamun",
      "Briefing konservasi",
      "Sertifikat Lamun Warrior",
      "Snack & minuman",
    ],
  },
  {
    id: "open-trip-bekarang",
    nama: "Open Trip: Tradisi Bekarang",
    deskripsi:
      "Ikuti tradisi 'Bekarang' — ritual panen teripang komunal yang telah diwariskan turun-temurun oleh masyarakat pesisir Bintan. Pengalaman budaya yang tak terlupakan.",
    harga: 450000,
    durasi: "Full day (8 jam)",
    kapasitas: 12,
    jadwal: ["Setiap hari Minggu pertama bulan"],
    foto_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    tipe: "tour" as const,
    includes: [
      "Transportasi perahu tradisional",
      "Makan siang & makan malam",
      "Pemandu budaya lokal",
      "Oleh-oleh produk teripang",
    ],
  },
];

export const PRODUCTS = [
  {
    id: "seacume",
    nama: "Seacume",
    tagline: "Sea Cucumber Collagen Drink",
    deskripsi:
      "Minuman kolagen premium dari ekstrak teripang laut Bintan. Diformulasikan untuk regenerasi kulit, kesehatan sendi, dan vitalitas tubuh dari dalam.",
    manfaat: [
      "Regenerasi kolagen kulit",
      "Kesehatan sendi & tulang",
      "Meningkatkan imunitas",
      "Anti-aging alami",
      "Mempercepat pemulihan luka",
    ],
    harga: 285000,
    stok: 50,
    berat: "250ml / botol",
    kategori: "minuman",
    foto_url:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80",
  },
  {
    id: "fitsea",
    nama: "Fitsea",
    tagline: "Sea Collagen Capsule",
    deskripsi:
      "Kapsul kolagen teripang untuk gaya hidup aktif. Kandungan kolagen tipe I & III membantu pemulihan otot, fleksibilitas sendi, dan stamina harian.",
    manfaat: [
      "Pemulihan otot pasca olahraga",
      "Fleksibilitas sendi",
      "Stamina & energi harian",
      "Kesehatan kulit dari dalam",
      "Bebas pengawet buatan",
    ],
    harga: 195000,
    stok: 75,
    berat: "30 kapsul / botol",
    kategori: "suplemen",
    foto_url:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80",
  },
  {
    id: "forayya",
    nama: "Forayya",
    tagline: "Sea Collagen Skincare Serum",
    deskripsi:
      "Serum wajah dengan kolagen teripang murni. Formula ringan yang meresap cepat, memberikan hidrasi intensif, mencerahkan, dan mengurangi tanda penuaan.",
    manfaat: [
      "Hidrasi intensif 24 jam",
      "Mencerahkan kulit kusam",
      "Mengurangi kerutan halus",
      "Memperkuat skin barrier",
      "Cocok semua jenis kulit",
    ],
    harga: 320000,
    stok: 40,
    berat: "30ml / botol",
    kategori: "skincare",
    foto_url:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
  },
];

export const GALLERY_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&q=80",
    alt: "Padang lamun Bintan",
  },
  {
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
    alt: "Kehidupan bawah laut",
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    alt: "Sunset di kelong",
  },
  {
    url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&q=80",
    alt: "Kelong di atas laut",
  },
];

export const FAQS = [
  {
    q: "Apa itu Kampong Teripang?",
    a: "Kampong Teripang adalah komunitas nelayan teripang di Bintan yang mengembangkan wisata edu-ekowisata berbasis budidaya teripang dan kearifan lokal.",
  },
  {
    q: "Bagaimana cara menuju MeLamun Villa?",
    a: "Dari Tanjungpinang, perjalanan sekitar 45 menit dengan mobil + 15 menit perahu. Kami menyediakan layanan jemput dari pelabuhan.",
  },
  {
    q: "Apakah bisa membawa anak-anak?",
    a: "Sangat bisa! Kami memiliki paket keluarga dan aktivitas yang ramah anak. Anak-anak akan belajar tentang laut dengan cara yang menyenangkan.",
  },
  {
    q: "Apakah ada sinyal internet di villa?",
    a: "Ya, tersedia WiFi di seluruh area villa. Namun kami sarankan untuk menikmati ketenangan alam dan sesekali disconnect dari gadget.",
  },
  {
    q: "Bagaimana kebijakan pembatalan?",
    a: "Pembatalan lebih dari 7 hari sebelum check-in mendapat refund 100%. Pembatalan 3-7 hari mendapat refund 50%. Kurang dari 3 hari tidak dapat direfund.",
  },
];

-- ============================================
-- KAMPONG TERIPANG DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  no_wa TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings (Villa & Tour packages)
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  deskripsi TEXT,
  harga INTEGER NOT NULL,
  tipe TEXT CHECK (tipe IN ('stay', 'tour')) NOT NULL,
  fasilitas JSONB DEFAULT '[]',
  foto_url TEXT,
  kapasitas INTEGER,
  durasi TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability calendar
CREATE TABLE IF NOT EXISTS availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  tanggal DATE NOT NULL,
  status TEXT CHECK (status IN ('tersedia', 'penuh')) DEFAULT 'tersedia',
  UNIQUE(listing_id, tanggal)
);

-- Products (Housome Store)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  tagline TEXT,
  deskripsi TEXT,
  manfaat JSONB DEFAULT '[]',
  harga INTEGER NOT NULL,
  stok INTEGER DEFAULT 0,
  foto_url TEXT,
  berat TEXT,
  kategori TEXT,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  nama_pemesan TEXT NOT NULL,
  email TEXT NOT NULL,
  no_wa TEXT NOT NULL,
  total_bayar INTEGER NOT NULL,
  status_pembayaran TEXT CHECK (status_pembayaran IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  xendit_external_id TEXT,
  xendit_invoice_url TEXT,
  tipe_order TEXT CHECK (tipe_order IN ('villa', 'produk', 'tour')) NOT NULL,
  detail_order JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA (Dummy)
-- ============================================

INSERT INTO listings (id, nama, deskripsi, harga, tipe, fasilitas, foto_url, kapasitas) VALUES
('villa-standard', 'Sea Healing Room', 'Kamar kelong di atas laut dengan pemandangan 360° Selat Bintan.', 850000, 'stay', '["Kamar di atas laut","AC & kipas angin","Sarapan pagi","Snorkeling gear","Akses dermaga pribadi","WiFi"]', 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800', 2),
('villa-deluxe', 'Kelong Deluxe Suite', 'Suite premium dengan dek privat langsung di atas laut.', 1350000, 'stay', '["Dek privat di atas laut","Bathtub outdoor","Sarapan & makan malam","Kayak & paddleboard","Tur teripang eksklusif","WiFi & Smart TV"]', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 2),
('villa-family', 'Family Kelong House', 'Rumah kelong keluarga dengan 2 kamar tidur.', 2200000, 'stay', '["2 kamar tidur","Ruang keluarga di atas laut","Dapur mini","Sarapan untuk semua tamu","Aktivitas memancing","Tur edukasi teripang"]', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 6),
('school-of-fish', 'School of Fish', 'Program edukasi intensif budidaya teripang bersama nelayan lokal.', 350000, 'tour', '["Pemandu lokal berpengalaman","Snorkeling di padang lamun","Sertifikat peserta","Makan siang seafood"]', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', 15),
('lamun-warrior', 'Lamun Warrior', 'Bergabunglah dengan misi pelestarian padang lamun.', 275000, 'tour', '["Kit penanaman lamun","Briefing konservasi","Sertifikat Lamun Warrior","Snack & minuman"]', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800', 20),
('open-trip-bekarang', 'Open Trip: Tradisi Bekarang', 'Ikuti tradisi Bekarang — ritual panen teripang komunal.', 450000, 'tour', '["Transportasi perahu tradisional","Makan siang & makan malam","Pemandu budaya lokal","Oleh-oleh produk teripang"]', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, nama, tagline, deskripsi, manfaat, harga, stok, foto_url, berat, kategori) VALUES
('seacume', 'Seacume', 'Sea Cucumber Collagen Drink', 'Minuman kolagen premium dari ekstrak teripang laut Bintan.', '["Regenerasi kolagen kulit","Kesehatan sendi & tulang","Meningkatkan imunitas","Anti-aging alami","Mempercepat pemulihan luka"]', 285000, 50, 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800', '250ml / botol', 'minuman'),
('fitsea', 'Fitsea', 'Sea Collagen Capsule', 'Kapsul kolagen teripang untuk gaya hidup aktif.', '["Pemulihan otot pasca olahraga","Fleksibilitas sendi","Stamina & energi harian","Kesehatan kulit dari dalam","Bebas pengawet buatan"]', 195000, 75, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800', '30 kapsul / botol', 'suplemen'),
('forayya', 'Forayya', 'Sea Collagen Skincare Serum', 'Serum wajah dengan kolagen teripang murni.', '["Hidrasi intensif 24 jam","Mencerahkan kulit kusam","Mengurangi kerutan halus","Memperkuat skin barrier","Cocok semua jenis kulit"]', 320000, 40, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', '30ml / botol', 'skincare')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read for listings and products
CREATE POLICY "Public can read listings" ON listings FOR SELECT USING (aktif = TRUE);
CREATE POLICY "Public can read products" ON products FOR SELECT USING (aktif = TRUE);
CREATE POLICY "Public can read availability" ON availability FOR SELECT USING (TRUE);

-- Allow insert for transactions (anyone can create order)
CREATE POLICY "Anyone can create transaction" ON transactions FOR INSERT WITH CHECK (TRUE);

-- Only authenticated users can read their own transactions
CREATE POLICY "Users read own transactions" ON transactions FOR SELECT USING (email = current_user);

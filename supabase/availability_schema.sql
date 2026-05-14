-- ============================================================
-- AVAILABILITY TABLE
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS availability (
  tanggal DATE PRIMARY KEY,
  rooms   JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Siapa saja bisa baca (untuk tampil di home)
CREATE POLICY "Public can read availability"
  ON availability FOR SELECT USING (true);

-- Siapa saja bisa insert/update/delete (admin via anon key)
-- Nanti bisa diperketat dengan auth jika perlu
CREATE POLICY "Public can write availability"
  ON availability FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER availability_updated_at
  BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

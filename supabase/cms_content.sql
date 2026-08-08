-- ============================================================
-- CMS CONTENT (editable harga/stok/nama untuk Villa, Edu, Produk)
-- Singleton row id=1, kolom JSONB. Run once di Supabase SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS cms_content (
  id INTEGER PRIMARY KEY DEFAULT 1,
  villa JSONB DEFAULT '[]'::jsonb,
  edu JSONB DEFAULT '[]'::jsonb,
  products JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cms_single_row CHECK (id = 1)
);

-- Seed singleton row (kosong; admin akan mengisi via tombol Simpan)
INSERT INTO cms_content (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS: publik boleh baca; update digate oleh API admin (cookie auth)
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read cms_content" ON cms_content;
CREATE POLICY "Public can read cms_content" ON cms_content
FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can update cms_content" ON cms_content;
CREATE POLICY "Public can update cms_content" ON cms_content
FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- Realtime agar landing memantul perubahan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'cms_content'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cms_content;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Realtime publication skip: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '✅ cms_content siap (villa, edu, products JSONB)';
END $$;

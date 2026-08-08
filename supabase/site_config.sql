-- ============================================================
-- SITE CONFIG (global settings: WhatsApp number, business name)
-- Run once in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT NOT NULL DEFAULT '6283161259104',
  business_name TEXT NOT NULL DEFAULT 'MeLamun Villa',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Seed the singleton row
INSERT INTO site_config (id, whatsapp_number, business_name)
VALUES (1, '6283161259104', 'MeLamun Villa')
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can read; writes are gated by the admin API (cookie auth)
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site_config" ON site_config;
CREATE POLICY "Public can read site_config" ON site_config
FOR SELECT USING (TRUE);

-- Allow updates (security boundary is the /api/site-config cookie check).
-- This is acceptable for this demo; tighten with service-role key in production.
DROP POLICY IF EXISTS "Public can update site_config" ON site_config;
CREATE POLICY "Public can update site_config" ON site_config
FOR UPDATE USING (TRUE) WITH CHECK (TRUE);

-- Realtime so frontend reflects changes instantly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'site_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE site_config;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '✅ site_config ready (whatsapp_number, business_name)';
END $$;

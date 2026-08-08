IF NOT EXISTS --ndexesforprfrma IFNOISTSEX IF NOT ISTSEX IF NOT ISTSEX IF NOT ISTSEX IF NOT ISTSEX IF NOT ISTS345
-- ============================================-- STEP 6: ROW LEVEL SECURITY (LS) POLICIES
-- ============================================

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nyone can create bookings" ON bookings;
DROP POLCY IF EXITS "Anyone can read bookings by booking_id" ON bookings;
DROP POLICY IF XISTS"Authenticated can read all bookings" O bookings;
DRP POLICY IF EXISS "Authenticated can update bookings" ON bookings;
DROP POLY IF XISTS"Authenticatedcan delete bookngs" ON bookings;

CREATE POLICY "Anyoncan create bookings ON bookings
FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read bookings by bookingid" ON 
FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated can rea ll bookings" ON booking
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Autenticated can update bookings" ON okings
FOR UPDATE USING (uth.ole() = 'authenticate');

CREATE POLICY Authenticatedan delete bookings" ON bookings
FOR DELETE USING (auth.ole() = 'authntic)NABEATMALTER PUBLICATIONsupase_reatimDD;

-- ============================================
--SUCCSS MESSGE
-- ============================================

DO $$
GIN
 AISE NTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ BOOKINGS FLOSCHEMA INSTALD SUCCSSFULY';
 RAI NOTIE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  ASE NOICE ''  RAISE NOTICE '📋 Tables: bookings'; RAISE NOTICE '🔧 Functions: 6 total';
  RAISE NOTICE '⚡ Tiggers: 3 ttal';
 RAISE NOTICE '📊 Views: vw_bookings_dashbar';
  RAISE NOTICE '🔐 RLSP: 5 total';
  RAISE NOTICE'📡Realim:Enabld';  AISE NTICE '';
  RAISENTE'🚀NT EP:';
 RISE NOTICE '   1. EablReltime i SupabaseDashboad';
  RAISE NOTICE '      Database → Rplicion → Enabl"';
  RAISE NOTICE '   2. Test: SELECT *FRM vw_bookings_dashboard;';
  RAISE OTICE '   3. Test: SELECTgenerate__id();';
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$
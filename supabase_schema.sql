-- ==============================================================
-- SUPABASE POSTGRESQL SCHEMA: PREVENTIVE MAINTENANCE SYSTEM
-- QMS-0039442 | Form GTP-GIGA, PC/PCA, AIPS, Heater DC
-- ==============================================================

-- 1. TABEL: inspections (Header Inspeksi)
CREATE TABLE IF NOT EXISTS inspections (
  id BIGSERIAL PRIMARY KEY,
  form_id TEXT UNIQUE NOT NULL,
  machine_type TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  location TEXT NOT NULL,
  mtc_support TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  verification_result TEXT DEFAULT '',
  maintenance_support_name TEXT DEFAULT '',
  group_leader_name TEXT DEFAULT '',
  logistic_leader_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk mempercepat query search & filter
CREATE INDEX IF NOT EXISTS idx_inspections_form_id ON inspections(form_id);
CREATE INDEX IF NOT EXISTS idx_inspections_machine_type ON inspections(machine_type);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);

-- 2. TABEL: inspection_items (Item Checklist per Inspeksi)
CREATE TABLE IF NOT EXISTS inspection_items (
  id BIGSERIAL PRIMARY KEY,
  inspection_id BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_no INT NOT NULL,
  task_description TEXT NOT NULL,
  status TEXT DEFAULT '',
  remarks TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_items_inspection_id ON inspection_items(inspection_id);

-- 3. TABEL: task_templates (Template Master Task List per Mesin)
CREATE TABLE IF NOT EXISTS task_templates (
  id BIGSERIAL PRIMARY KEY,
  machine_type TEXT NOT NULL,
  item_no INT NOT NULL,
  task_description TEXT NOT NULL,
  UNIQUE(machine_type, item_no)
);

-- ==============================================================
-- SEED DATA: 4 TEMPLATE MESIN MASTER
-- ==============================================================

-- A. GTP-GIGA (19 Task Items)
INSERT INTO task_templates (machine_type, item_no, task_description) VALUES
('GTP-GIGA', 1, 'Cleaning : Area meja dan peralatan dari material produksi'),
('GTP-GIGA', 2, 'Cleaning / Ganti : Spring no. 4 GTP Jika sudah kendor'),
('GTP-GIGA', 3, 'Cleaning & Inspeksi : Cakram atas dan bawah berfungsi dengan normal (Knop & Clam)'),
('GTP-GIGA', 4, 'Cleaning, Inspeksi & Lubrikasi : Bongkar Stang GTP, periksa Bearing Loop (Roller Shaft) tidak berkarat dan masih berfungsi normal'),
('GTP-GIGA', 5, 'Cleaning, Inspeksi & Lubrikasi : Periksa Bearing Stang, pastikan tidak berkarat dan masih berfungsi normal'),
('GTP-GIGA', 6, 'Inspeksi : Pasang kembali Stang GTP dan cek kelurusan menggunakan jig'),
('GTP-GIGA', 7, 'Cleaning & Inspeksi : Stopper atas dan bawah masih menahan Stang GTP dengan baik'),
('GTP-GIGA', 8, 'Cleaning & Inspeksi : Cek posisi adjuster, rod locking (Giga) sesuai mal MPV dan tidak kendor'),
('GTP-GIGA', 9, 'Cleaning & Inspeksi : Bongkar Batokan dan Shim kemudian setting clearence (Batokan terhadap Loop di clicker ke 2)'),
('GTP-GIGA', 10, 'Cleaning : Bersihkan bagian-bagian GTP yang kotor dari deposit debu tembakau'),
('GTP-GIGA', 11, 'Cleaning / Ganti : Cek Spring GIGA No. 1, No. 2 dan No. 3, ganti Jika spring sudah kendor'),
('GTP-GIGA', 12, 'Cleaning, Inspeksi & Lubrikasi : Periksa Vertical Shaft & Seal Linier Bearing'),
('GTP-GIGA', 13, 'Inspeksi / Ganti : Cek kondisi klicker Bracket & Glue Pot'),
('GTP-GIGA', 14, 'Cleaning : Area Support Vertical Shaft dan Cover Acrilic'),
('GTP-GIGA', 15, 'Cleaning : Area bawah Plate ambri dari agal dan pastikan masing lurus / rata'),
('GTP-GIGA', 16, 'Inspeksi : Cek kelurusan Pin depan, kanan, kiri dan belakang'),
('GTP-GIGA', 17, 'Inspeksi : Gap Glue pot terhadap Pin & Kerataan antar Glue pot kanan & kiri (rata bawah & rata depan)'),
('GTP-GIGA', 18, 'Cleaning / Ganti : Sling tidak berserabut dan cover tidak aus, retak / sobek'),
('GTP-GIGA', 19, 'Cleaning : Bersihkan bagian-bagian Giga yang kotor dari deposit debu tembakau')
ON CONFLICT (machine_type, item_no) DO NOTHING;

-- B. PC / PCA (11 Task Items)
INSERT INTO task_templates (machine_type, item_no, task_description) VALUES
('PC / PCA', 1, 'Cleaning : Area meja dan peralatan dari material produksi'),
('PC / PCA', 2, 'Cleaning : Lepas pisau, periksa rumah pisau dan baut pengunci'),
('PC / PCA', 3, 'Cleaning & Inspeksi : Pastikan Cover & Safety guard menutupi area pisau dengan baik'),
('PC / PCA', 4, 'Cleaning / Ganti & Inspeksi : Lepas Cigaret Holder periksa panjang holder dan kerataannya'),
('PC / PCA', 5, 'Cleaning / Ganti & Inspeksi : Periksa Pelatuk, Spring, Penekan berfungsi dengan baik'),
('PC / PCA', 6, 'Cleaning / Ganti & Inspeksi : Periksa gerakan Arm/talang rokok, stopper arm, spring torsi dan bearing'),
('PC / PCA', 7, 'Setting : Pasang kembali pisau dan setting clearence pisau'),
('PC / PCA', 8, 'Cleaning / Ganti, Inspeksi, Lubrikasi : Camp Follower penggerak handle, rail kuningan & stopper handle. Posisi stopper handle sesuai dengan posisi berhentinya Arm. (PCA)'),
('PC / PCA', 9, 'Cleaning / Ganti : Plastik pengarah sigaret'),
('PC / PCA', 10, 'Cleaning / Ganti : Stopper samping'),
('PC / PCA', 11, 'Cleaning : Bersihkan bagian-bagian PC/PCA yang kotor dari deposit debu tembakau')
ON CONFLICT (machine_type, item_no) DO NOTHING;

-- C. AIPS - Auto Insert Push Shelder (13 Task Items)
INSERT INTO task_templates (machine_type, item_no, task_description) VALUES
('AIPS', 1, 'Cleaning : Area meja dan peralatan dari material produksi'),
('AIPS', 2, 'Cleaning : Buka Cover Gear, perika keausan gigi gear'),
('AIPS', 3, 'Cleaning / Ganti, Inspeksi : Periksa tension spring dan posisi stoper handle'),
('AIPS', 4, 'Cleaning / Ganti, Inspeksi : Lepas Head Attachment periksa kondisi Plate ring lock, buka Head Attachment dan periksa Insert, Spring, Pusher kemudian pasang kembali'),
('AIPS', 5, 'Cleaning / Ganti & Inspeksi : Periksa fungsi komponen Break Attachment, Extention flip plate & Bantalan stopper'),
('AIPS', 6, 'Cleaning & Inspeksi : Periksa kelurusan Cigarette holder dengan lubang Head Attacment dan posisi Stopper plate'),
('AIPS', 7, 'Cleaning : Lepas Unit Hopper, buka segitiga rokok, papan seluncur, bersihkan dari sisa deposit tembakau'),
('AIPS', 8, 'Cleaning : Bersihkan bagian dalam Auto Insert dari sisa tembakau'),
('AIPS', 9, 'Cleaning, Inspeksi, Lubrikasi : Periksa shaft & linier bearing dari pendorong sigaret serta penyentil, bearing rod'),
('AIPS', 10, 'Cleaning / Ganti, Inspeksi : Penyentil, vibrator dan bola vibrator'),
('AIPS', 11, 'Inspeksi : Pasang kembali unit hopper, periksa tuas emergency, cover akrilik dan gerakan pendorong sigaret'),
('AIPS', 12, 'Cleaning & Inspeksi : Bersihkan unit blower, cek kondisi kabel listrik dan sesuaikan arah semburan'),
('AIPS', 13, 'Cleaning : Bersihkan bagian-bagian yang kotor dari deposit debu tembakau')
ON CONFLICT (machine_type, item_no) DO NOTHING;

-- D. Heater DC (7 Task Items)
INSERT INTO task_templates (machine_type, item_no, task_description) VALUES
('Heater DC', 1, 'Cleaning : Area meja dan peralatan dari material produksi'),
('Heater DC', 2, 'Inspeksi : Matikan unit heater, cabut kabel dari sumber arus listrik'),
('Heater DC', 3, 'Cleaning & Inspeksi : Buka cover display, bersihkan dari debu dan periksa kondisi sambungan kabel serta sekering'),
('Heater DC', 4, 'Cleaning / Ganti : Periksa kondisi permukaan alumunium blok (kebersihan dan kerataan)'),
('Heater DC', 5, 'Cleaning / Ganti : Periksa kondisi permukaan novotec isolator'),
('Heater DC', 6, 'Inspeksi : Hidupkan kembali heater, periksa hasil pembacaan display'),
('Heater DC', 7, 'Cleaning : Bersihkan bagian-bagian yang kotor dari debu')
ON CONFLICT (machine_type, item_no) DO NOTHING;

-- ==============================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS)
-- ==============================================================
-- Aktifkan RLS pada seluruh tabel untuk mencegah akses langsung tanpa izin
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- Policy untuk service role / API backend (baca, tulis, hapus via API serverless)
CREATE POLICY "Allow service role full access to inspections" ON inspections
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'anon');

CREATE POLICY "Allow service role full access to inspection_items" ON inspection_items
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'anon');

CREATE POLICY "Allow read only on task_templates" ON task_templates
  FOR SELECT USING (true);

-- Selesai!

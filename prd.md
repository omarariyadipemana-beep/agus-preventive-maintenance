# PRD: Aplikasi Preventive Maintenance
## QMS-0039442 | Form GTP-GIGA, PCA, AIPS

================================================================================
## ZONA ATAS: SPESIFIKASI KEBUTUHAN PRODUK (BLUEPRINT)
================================================================================

### 1. Nama Projek & Problem Statement
- **Nama**: Aplikasi Preventive Maintenance
- **Masalah**: Formulir perawatan mesin (GTP-GIGA, PCA, AIPS) masih manual berbasis kertas. Perlu digitalisasi agar:
  - Riwayat inspeksi tersimpan rapi dan bisa dicari kembali
  - Laporan bisa dicetak (PDF) dan diekspor (Excel)
  - Dashboard monitoring status inspeksi tersedia

### 2. Peran Pengguna
- **Maintenance Support**: Mengisi form checklist inspeksi
- **Group Leader / LPU**: Memverifikasi hasil inspeksi
- **Logistik Leader**: Mengetahui status inspeksi
- (Tanpa sistem login — akses terbuka di jaringan LAN)

### 3. Arsitektur & Lingkungan Kerja
- **Frontend**: HTML + CSS + JavaScript (Single Page Application)
- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **Akses**: Multi-user via LAN (server Node.js diakses dari perangkat lain)
- **Arsitektur**: Monolith (1 server, 1 database file)

### 4. Alur Kerja Aplikasi (User Flow)
1. Buka aplikasi → tampil **Dashboard** (ringkasan inspeksi bulan ini)
2. Klik menu **"Buat Inspeksi Baru"** → muncul form dengan:
   - Header: ID Alat, Lokasi, Mtc Support, Tanggal (ID form otomatis)
   - Pilih tipe mesin: GTP-GIGA (nanti PCA, AIPS menyusul)
   - 19 task list tampil otomatis sesuai tipe mesin
   - Isi status OK/NOT OKE per item (radio button)
   - Isi keterangan per item (opsional)
   - Isi Hasil Verifikasi (OK/NOK)
   - Isi nama Maintenance Support, Group Leader, Logistik Leader
3. Klik **Simpan** → data tersimpan ke SQLite
4. Kembali ke **Riwayat Inspeksi** → tampil tabel histori
5. Klik detail → bisa **Cetak PDF** atau **Export Excel**

### 5. Desain Basis Data

**Tabel: inspections**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto increment |
| form_id | TEXT | PM-YYYYMM-001 (unik) |
| machine_type | TEXT | GTP-GIGA / PCA / AIPS |
| equipment_id | TEXT | ID Alat |
| location | TEXT | Lokasi |
| mtc_support | TEXT | Nama Maintenance Support |
| inspection_date | TEXT | Tanggal inspeksi (YYYY-MM-DD) |
| verification_result | TEXT | OK / NOK |
| maintenance_support_name | TEXT | Nama penanda tangan MTC Support |
| group_leader_name | TEXT | Nama penanda tangan Group Leader |
| logistic_leader_name | TEXT | Nama penanda tangan Logistik Leader |
| created_at | TEXT | Timestamp pembuatan |

**Tabel: inspection_items**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto increment |
| inspection_id | INTEGER | FK ke inspections.id |
| item_no | INTEGER | Nomor urut task (1-19) |
| task_description | TEXT | Deskripsi task |
| status | TEXT | OK / NOT OKE / (kosong) |
| remarks | TEXT | Keterangan |

**Tabel: task_templates**
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PRIMARY KEY | Auto increment |
| machine_type | TEXT | GTP-GIGA / PCA / AIPS |
| item_no | INTEGER | Nomor urut |
| task_description | TEXT | Deskripsi task checklist |

### 6. Aturan Validasi & Logika Khusus
- **ID Form otomatis**: Format PM-YYYYMM-XXX, dihitung dari MAX+1 di periode bulan berjalan
- **Semua status wajib diisi** sebelum bisa Simpan (validasi frontend)
- **Tanggal default**: Hari ini
- **Task list otomatis muncul** berdasarkan tipe mesin yang dipilih

### 7. Rencana Antarmuka
- **Halaman Dashboard**: Kartu metrik (total inspeksi, OK vs NOK), tabel riwayat terbaru
- **Halaman Form Inspeksi**: Form input sesuai layout PDF
- **Halaman Riwayat**: Tabel histori dengan search & filter
- **Halaman Detail**: View detail inspeksi + tombol Cetak PDF & Export Excel

### 8. Kriteria Pengujian
- [ ] Form bisa diisi lengkap dan disimpan
- [ ] ID form otomatis ter-generate dengan benar
- [ ] Data tersimpan di SQLite dan bisa dilihat di riwayat
- [ ] Dashboard menampilkan ringkasan OK vs NOK bulan ini
- [ ] Cetak PDF menghasilkan layout mirip form asli PDF
- [ ] Export Excel menghasilkan file .xlsx yang bisa dibuka
- [ ] Tampilan responsif di HP dan PC
- [ ] Bisa diakses dari perangkat lain di jaringan LAN

### 9. Task List GTP-GIGA (19 Item dari PDF)
1. Cleaning : Area meja dan peralatan dari material produksi
2. Cleaning / Ganti : Spring no. 4 GTP Jika sudah kendor
3. Cleaning & Inspeksi : Cakram atas dan bawah berfungsi dengan normal (Knop & Clam)
4. Cleaning, Inspeksi & Lubrikasi : Bongkar Stang GTP, periksa Bearing Loop (Roller Shaft) tidak berkarat dan masih berfungsi normal
5. Cleaning, Inspeksi & Lubrikasi : Periksa Bearing Stang, pastikan tidak berkarat dan masih berfungsi normal
6. Inspeksi : Pasang kembali Stang GTP dan cek kelurusan menggunakan jig
7. Cleaning & Inspeksi : Stopper atas dan bawah masih menahan Stang GTP dengan baik
8. Cleaning & Inspeksi : Cek posisi adjuster, rod locking (Giga) sesuai mal MPV dan tidak kendor
9. Cleaning & Inspeksi : Bongkar Batokan dan Shim kemudian setting clearence (Batokan terhadap Loop di clicker ke 2)
10. Cleaning : Bersihkan bagian-bagian GTP yang kotor dari deposit debu tembakau
11. Cleaning / Ganti : Cek Spring GIGA No. 1, No. 2 dan No. 3, ganti Jika spring sudah kendor
12. Cleaning, Inspeksi & Lubrikasi : Periksa Vertical Shaft & Seal Linier Bearing
13. Inspeksi / Ganti : Cek kondisi klicker Bracket & Glue Pot
14. Cleaning : Area Support Vertical Shaft dan Cover Acrilic
15. Cleaning : Area bawah Plate ambri dari agal dan pastikan masing lurus / rata
16. Inspeksi : Cek kelurusan Pin depan, kanan, kiri dan belakang
17. Inspeksi : Gap Glue pot terhadap Pin & Kerataan antar Glue pot kanan & kiri (rata bawah & rata depan)
18. Cleaning / Ganti : Sling tidak berserabut dan cover tidak aus, retak / sobek
19. Cleaning : Bersihkan bagian-bagian Giga yang kotor dari deposit debu tembakau

### 10. Task List PC / PCA (11 Item dari PDF)
1. Cleaning : Area meja dan peralatan dari material produksi
2. Cleaning : Lepas pisau, periksa rumah pisau dan baut pengunci
3. Cleaning & Inspeksi : Pastikan Cover & Safety guard menutupi area pisau dengan baik
4. Cleaning / Ganti & Inspeksi : Lepas Cigaret Holder periksa panjang holder dan kerataannya
5. Cleaning / Ganti & Inspeksi : Periksa Pelatuk, Spring, Penekan berfungsi dengan baik
6. Cleaning / Ganti & Inspeksi : Periksa gerakan Arm/talang rokok, stopper arm, spring torsi dan bearing
7. Setting : Pasang kembali pisau dan setting clearence pisau
8. Cleaning / Ganti, Inspeksi, Lubrikasi : Camp Follower penggerak handle, rail kuningan & stopper handle. Posisi stopper handle sesuai dengan posisi berhentinya Arm. (PCA)
9. Cleaning / Ganti : Plastik pengarah sigaret
10. Cleaning / Ganti : Stopper samping
11. Cleaning : Bersihkan bagian-bagian PC/PCA yang kotor dari deposit debu tembakau

### 11. Task List AIPS - Auto Insert Push Shelder (13 Item dari PDF)
1. Cleaning : Area meja dan peralatan dari material produksi
2. Cleaning : Buka Cover Gear, perika keausan gigi gear
3. Cleaning / Ganti, Inspeksi : Periksa tension spring dan posisi stoper handle
4. Cleaning / Ganti, Inspeksi : Lepas Head Attachment periksa kondisi Plate ring lock, buka Head Attachment dan periksa Insert, Spring, Pusher kemudian pasang kembali
5. Cleaning / Ganti & Inspeksi : Periksa fungsi komponen Break Attachment, Extention flip plate & Bantalan stopper
6. Cleaning & Inspeksi : Periksa kelurusan Cigarette holder dengan lubang Head Attacment dan posisi Stopper plate
7. Cleaning : Lepas Unit Hopper, buka segitiga rokok, papan seluncur, bersihkan dari sisa deposit tembakau
8. Cleaning : Bersihkan bagian dalam Auto Insert dari sisa tembakau
9. Cleaning, Inspeksi, Lubrikasi : Periksa shaft & linier bearing dari pendorong sigaret serta penyentil, bearing rod
10. Cleaning / Ganti, Inspeksi : Penyentil, vibrator dan bola vibrator
11. Inspeksi : Pasang kembali unit hopper, periksa tuas emergency, cover akrilik dan gerakan pendorong sigaret
12. Cleaning & Inspeksi : Bersihkan unit blower, cek kondisi kabel listrik dan sesuaikan arah semburan
13. Cleaning : Bersihkan bagian-bagian yang kotor dari deposit debu tembakau

### 12. Task List Heater DC (7 Item dari PDF)
1. Cleaning : Area meja dan peralatan dari material produksi
2. Inspeksi : Matikan unit heater, cabut kabel dari sumber arus listrik
3. Cleaning & Inspeksi : Buka cover display, bersihkan dari debu dan periksa kondisi sambungan kabel serta sekering
4. Cleaning / Ganti : Periksa kondisi permukaan alumunium blok (kebersihan dan kerataan)
5. Cleaning / Ganti : Periksa kondisi permukaan novotec isolator
6. Inspeksi : Hidupkan kembali heater, periksa hasil pembacaan display
7. Cleaning : Bersihkan bagian-bagian yang kotor dari debu

================================================================================
## ZONA BAWAH: MASTER CONTEXT & LOGIKA SISTEM TERKINI
================================================================================

### Status Arsitektur Aktif
- Stack: Node.js + Express + SQLite + Vanilla HTML/CSS/JS
- Mode: Monolith
- Server: localhost:3001 (bisa diakses LAN via IP port 3001)
- Database: ./database.sqlite
- Tipe Mesin Aktif:
  1. GTP-GIGA (19 tasks)
  2. PC / PCA (11 tasks)
  3. AIPS (13 tasks)
  4. Heater DC (7 tasks)

### Skema Database Aktif
- inspections (12 kolom)
- inspection_items (6 kolom)
- task_templates (4 kolom)

### Log Pembaruan
- v1.0.0 (Initial): Form GTP-GIGA, Dashboard OK/NOK, Cetak PDF, Export Excel, Port 3000
- v1.1.0: Pindah ke Port 3001 (Port 3000 in use by HRIS). Penambahan form template PC / PCA, AIPS, dan Heater DC.
- v1.2.0: Sistem Proteksi Akses PIN:
  * Role User (PIN 2323): Akses Form Inspeksi Baru & Riwayat (Read-Only). Dashboard disembunyikan. Tombol hapus disembunyikan.
  * Role Admin (PIN 3434): Akses penuh ke Dashboard, Form Inspeksi, Riwayat, dan Hapus Data.
  * Fitur Kunci Layar (Logout) & PIN Pad numerik interaktif.
- v1.3.0: Dukungan Deployment Cloud (Vercel Serverless + Supabase PostgreSQL):
  * DDL skema database PostgreSQL di `supabase_schema.sql` (tabel, relasi cascade, indeks performa, seed 4 mesin).
  * Vercel Serverless Function Express di `api/index.js` menggunakan `@supabase/supabase-js`.
  * Konfigurasi deployment di `vercel.json` dan `.gitignore`.
- v1.4.0: Optimalisasi UI Mobile, Tombol Status Modern & Validasi NOT OKE:
  * Tombol OK/NOT OKE diubah menjadi segmented toggle modern dengan ikon SVG (centang/silang) dan touch-target 44px ramah jempol.
  * Tampilan Riwayat di HP otomatis beralih menjadi Responsive Card View (bebas overflow/teks kepotong).
  * Validasi ketat: jika memilih NOT OKE, kolom keterangan wajib diisi alasan, input otomatis disorot merah dan fokus, serta submit diblokir jika kosong.
- v1.5.0: Optimalisasi Cetak PDF Presisi 1 Halaman A4 (Single-Page A4 Guarantee):
  * Deklarasi `@page { size: A4 portrait; margin: 6mm 10mm; }` untuk memanfaatkan seluruh area cetak A4.
  * Blok 3 tanda tangan dikunci selalu horizontal sejajar (`repeat(3, 1fr)`) baik dicetak dari Laptop maupun ponsel HP.
  * Isolasi media query responsif HP dengan `@media screen and (max-width: 768px)` agar aturan tampilan mobile tidak bocor ke mesin cetak.
  * Kompaktifikasi padding, font-size, dan batas tanda tangan (26px) dengan `page-break-inside: avoid` sehingga seluruh form (7–19 item) pas tepat dalam 1 lembar halaman.
- v1.6.0: Audit & Perbaikan Responsif Desktop + Mobile (7 Fix):
  * Metric Cards selalu 3 kolom sejajar di semua ukuran layar, menghapus inkonsistensi layout.
  * Task Table di HP diubah dari horizontal-scroll menjadi stacked card layout per item (tanpa scroll horizontal).
  * Print Area Detail dibungkus `overflow-x: auto` di HP dengan `word-break: break-word`.
  * Tombol aksi Detail Page disusun ulang dengan CSS Grid (Kembali full-width di atas, Cetak PDF & Export Excel sejajar).
  * Signatures Grid selalu 3 kolom di semua viewport (konsisten dengan standar form resmi).
  * `.mobile-cards-list` di-hidden eksplisit di desktop untuk mencegah duplikat.
  * Print Info Grid responsif: 2 kolom rata di HP, 1 kolom di ≤400px.
  * Proteksi cetak: Reset `@media print` agar stacked-card CSS mobile tidak bocor ke output cetak.




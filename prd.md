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
- **Backend**: Node.js + Express.js (Local LAN) & Vercel Serverless Function (Cloud)
- **Database**: SQLite (better-sqlite3 untuk LAN) & Supabase PostgreSQL (Cloud)
- **Akses & Deployment**: 
  * Local: Multi-user via LAN (port 3001)
  * Production Live URL: **`https://formmaintenance.vercel.app`**
- **Arsitektur**: Dual-stack (Monolith LAN & Cloud Serverless)

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
- Tipe Peralatan Aktif:
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
- v1.7.0: Dashboard Interaktif — Temuan NOT OKE & Drill-down Peringatan:
  * Widget peringatan NOT OKE interaktif dengan pulse badge, rincian mesin, ID alat, nomor item, dan kotak alasan/keterangan kontras.
  * Tombol pintas "Buka Form Inspeksi" langsung membawa ke detail form terkait.
  * State 100% OK: Banner perayaan hijau jika seluruh item checklist dalam kondisi OK.
  * Interaktivitas Progress Bar: Bagian merah & legend NOT OKE dapat diklik untuk auto-scroll dan memberi animasi kilau ke temuan.
  * Sinkronisasi data real-time baik pada backend SQLite (`server.js`) maupun Vercel + Supabase (`api/index.js`).
- v1.8.0: Transformasi Halaman Detail Inspeksi di HP (Konsep A: Mobile Card / Row View):
  * Di layar HP (<= 768px), tabel 4 kolom `.print-table` ditransformasikan menjadi Card/Row view yang lega per item.
  * Nomor item dan Status Badge berdampingan di baris atas, deskripsi task melebar 100% (anti-pecah kata per huruf).
  * Catatan / Remarks tampil sebagai kotak catatan minimalis di bawah task.
  * Output Cetak A4 tetap 100% terjaga sebagai tabel lembar kerja resmi via reset komprehensif di `@media print`.
- v1.9.0: Perbaikan Bagian Bawah Form Inspeksi di HP (Tanda Tangan & Tombol Aksi):
  * Di HP (<= 768px), blok tanda tangan diubah menjadi 1 kolom vertikal bertumpuk sehingga seluruh 3 penanda tangan (termasuk Logistik Leader) tampil utuh tanpa terpotong ke kanan.
  * Tombol aksi Reset & Simpan Inspeksi diubah menjadi grid 2 kolom proporsional (1fr 2fr) dengan touch-target 48px dan ruang nafas yang cukup dari navbar bawah.
- v2.0.0: Transformasi Tema Visual — Fresh & Vibrant Violet-Cyan (Inspirasi Telco & Modern Mobile App):
  * Pengadopsian palet Electric Violet (`#7c3aed`), Vibrant Cyan (`#06b6d4`), Coral Red (`#f43f5e`), dan kanvas Soft Lavender (`#f8f9ff`).
  * Desain sidebar desktop Deep Indigo, bottom navbar mobile putih bersih (*Clean White*), kartu metrik bergaya e-wallet, dan bar progres bergradasi Cyan-Violet.
  * Tetap menjaga isolasi cetak A4 100% formal pabrik.
  * Domain aktif produksi resmi diperbarui menjadi: **`https://formmaintenance.vercel.app`**.







- v2.0.1: Penggantian istilah label antarmuka dari 'Tipe Mesin' menjadi 'Tipe Peralatan'.
- v2.0.2: Penggantian ikon brand dengan ikon Icons8 resmi.
- v2.0.3: Penambahan Favicon tab browser menggunakan aset Icons8.
- v2.1.0: Hardening Keamanan Komprehensif:
  * Eliminasi PIN dari kode browser (PIN disimpan & divalidasi server-side).
  * Proteksi token sesi kriptografis pada setiap endpoint API (X-Auth-Token).
  * Enforcing RBAC server-side (Dashboard & Delete hanya Admin).
  * Rate limiting anti brute-force dan anti spam traffic (express-rate-limit).
  * Proteksi CORS untuk domain resmi ormmaintenance.vercel.app.
  * Sanitasi input search dan eliminasi kebocoran pesan error internal.
  * Dukungan RLS pada skema database Supabase.
- v2.1.1: Pembersihan tampilan bocoran PIN pada modal login dan penghapusan karakter sisa literal head.
- v2.2.0: Integrasi Kolom Gambar Panduan Visual SOP Mesin (GTP & GIGA):
  * Penambahan kolom 'GAMBAR' di antara kolom 'No' dan 'Task List' pada tabel checklist formulir (#taskTable).
  * Penyediaan 19 aset foto komponen GTP-GIGA resolusi proporsional di public/images/tasks/gtp-giga/.
  * Fitur interaktif Click-to-Zoom (Lightbox Modal) untuk memudahkan operator/teknisi di lapangan memeriksa detail fisik komponen secara tajam.
  * Fallback placeholder netral jika tipe mesin belum memiliki foto panduan visual.
  * Penyelarasan CSS responsif mobile berbasis kelas semantik (.td-status, .td-remarks, .td-img) agar layout kartu smartphone tetap presisi dan anti-geser.
  * Proteksi cetak PDF A4 tetap terjaga dalam 1 halaman formal pabrik.
- v2.2.1: Perbaikan Sesi Serverless Vercel (Stateless HMAC-SHA256 Token):
  * Mengeliminasi `sessions = new Map()` di RAM serverless yang memicu error 401 dan logout paksa saat submit form.
  * Menerapkan pembuatan dan validasi token kriptografis stateless HMAC-SHA256 yang kebal cold start dan container recycle.
  * Menyimpan token secara redundan di `localStorage` dan `sessionStorage` pada browser pengguna.
  * Masa aktif sesi stabil hingga 14 hari tanpa logout mendadak di tengah inspeksi.
- v2.2.2: Redesain Tampilan Mobile Form Checklist (Fit, Banner Foto Jelas, Jos Jis):
  * Header nomor item diubah menjadi pill badge modern (Item #1, Item #2).
  * Foto panduan diperbesar menjadi banner lebar 100% kartu (~155px tinggi) dengan kanvas kontras gelap dan object-fit contain.
  * Floating pill badge [ 🔍 Perbesar ] di sudut foto untuk mempermudah akses Lightbox.
  * Teks deskripsi tugas tertata rapi di bawah foto dengan tipografi hierarki jelas.
  * Toggle tombol OK / NOT OKE diubah menjadi full-width 50%-50% (touch target jempol 42px).
  * Input keterangan dibuat selebar kartu penuh (fit width).
- v2.3.0: Penambahan Kolom Foto Hasil Laporan, Export JPG Resolusi Tinggi, dan Fix Metrik Dashboard:
  * Menambahkan kolom GAMBAR pada tabel laporan cetak/detail (`#printTable`) di antara No dan Task List dengan thumbnail 64x36px komponen mesin GTP-GIGA (interaktif dengan modal Lightbox pembesaran).
  * Mengganti tombol "Cetak PDF" dengan "Export JPG" menggunakan library lokal `html2canvas.min.js` (skala 2x Retina, 95% JPEG quality), memudahkan penyimpanan gambar laporan langsung ke galeri HP dan share instan ke WhatsApp grup.
  * Memperbaiki bug ringkasan bulanan Dashboard di mana perhitungan `endOfMonth` menggunakan hardcode `-31`. Pada bulan dengan 30 hari seperti November, ini memicu error PostgreSQL 22008 (date out of range) sehingga metrik kembali bernilai 0. Perhitungan diperbaiki dinamis menggunakan `new Date(year, month + 1, 0).getDate()`.
- v2.3.1: Perbaikan Kotak Foto Hitam pada Hasil Export JPG Laporan:
  * Mengeliminasi warna latar belakang gelap (#090d16) pada wadah thumbnail (.print-thumb-wrap), diganti menjadi putih bersih (#ffffff) dengan batas bingkai abu-abu halus (#cbd5e1).
  * Menyematkan seluruh 19 foto komponen GTP-GIGA langsung sebagai Base64 Data URL melalui modul lokal `public/gtp-giga-images.js` (159 KB), menghilangkan dependensi jaringan, CORS cache collision, dan delay muat gambar.
  * Menghapus atribut `crossOrigin="anonymous"` pada tag gambar detail laporan yang sebelumnya memicu penolakan cache browser.
  * Menambahkan parameter `windowWidth: 1024` dan `allowTaint: true` pada `html2canvas` agar hasil unduh JPG selalu proporsional dalam format tabel resmi standar perusahaan (QMS-0039442) terlepas dari resolusi layar perangkat yang digunakan.
- v2.3.2: Standardisasi Format Export JPG Resmi Pabrik (Fixed 880px / 1760px Retina Layout):
  * Mengintegrasikan fungsi `onclone` pada `html2canvas` yang secara terisolasi memformat dokumen cetak `#printArea` pada lebar tetap 880px (proporsi A4 resmi perusahaan), mencegah kanvas tertekan mengikuti viewport sempit ponsel (342px).
  * Memperbesar dimensi wadah thumbnail foto komponen menjadi 72px × 42px (hampir 3x lebih besar) dengan latar belakang kontras lembut (#f8fafc), menampilkan komponen mesin GTP-GIGA secara tajam, jelas, dan berkontras tinggi.
  * Menjamin seluruh teks kolom Task List, Status, Keterangan, dan tanda tangan tersusun presisi dalam layout tabel formal tanpa teks terlipat sempit, siap kirim ke WhatsApp pimpinan.
- v2.3.3: Implementasi HTML5 Canvas Buffer untuk Render Foto Komponen (Anti-Kosong):
  * Mengeliminasi tag `<img>` pada kolom foto tabel laporan cetak dan menggantinya dengan elemen native `<canvas class="print-thumb-canvas" width="186" height="99">`.
  * Menghilangkan bug `naturalWidth === 0` pada pustaka `html2canvas` yang sebelumnya memicu *skip* penggambaran foto karena delay decoding asinkron pada kloningan DOM.
  * Menyalin pixel buffer secara sinkron pada callback `onclone` (`cctx.drawImage(origCvs, 0, 0)`), menjamin 100% seluruh foto komponen mesin GTP-GIGA tercetak utuh, jernih, dan tidak akan pernah kosong.
- v2.3.4: Cache Busting Aset Statis & Eliminasi Stale Cache Mobile Browser:
  * Menambahkan parameter query versi unik `?v=20261103_v234` pada seluruh aset skrip dan stylesheet di `public/index.html`, memaksa browser HP memuat kode JavaScript terbaru tanpa terhalang disk cache.
  * Mengonfigurasi header HTTP `no-cache, no-store, must-revalidate` pada `api/index.js` static serving.
  * Memperbarui versi footer antarmuka menjadi `v2.3.4` sebagai konfirmasi visual langsung di perangkat pengguna.
- v2.4.0: Pure Native HTML5 Canvas Report Generator (Eliminasi html2canvas):
  * Mengganti pustaka pihak ketiga `html2canvas` dengan mesin grafis native HTML5 2D Context API (`generateInspectionReportCanvas`), melukis tabel laporan dan menaruh foto komponen GTP-GIGA secara presisi (`ctx.drawImage`) dengan resolusi 2x Retina (1760 × 2584 px).
  * Menghilangkan 100% kegagalan render gambar, async decode race conditions, dan memori leak pada browser ponsel.
  * Menyediakan modal pratinjau instan di mana pengguna di HP dapat langsung melihat hasil gambar dan menyimpannya lewat tombol unduh maupun fitur *long-press* simpan/bagikan ke WhatsApp.
- v2.5.0: Integrasi Foto Panduan Visual SOP & Komponen Mesin Heater DC, AIPS, dan PC / PCA:
  * Menambahkan total 31 foto komponen mesin baru (Heater DC: 7 foto, AIPS: 13 foto, PC/PCA: 11 foto) melengkapi GTP-GIGA (19 foto) sehingga seluruh 4 tipe mesin kini memiliki 100% foto panduan visual (total 50 foto).
  * Mengintegrasikan pustaka Base64 instan multi-mesin `public/machine-task-images.js` (`window.MACHINE_TASK_IMAGES`), kebal CORS, tanpa latensi jaringan, dan offline-ready.
  * Mengaktifkan kolom GAMBAR dan modal Lightbox perbesar foto (click-to-zoom) pada form pengisian checklist untuk semua 4 tipe mesin.
  * Mengaktifkan thumbnail kanvas foto komponen pada tabel detail riwayat laporan inspeksi untuk semua tipe mesin.
  * Memutakhirkan mesin pelukis native HTML5 2D Canvas (`generateInspectionReportCanvas`) untuk melukis foto komponen Heater DC, AIPS, PC/PCA, maupun GTP-GIGA langsung ke dokumen ekspor JPG resolusi Retina 2x (1760 px).
  * Pembaruan query cache-buster ke `?v=20261103_v250` dan footer dokumen resmi ke `QMS-0039442 v2.5.0`.

- v2.6.0: Dashboard Monitoring Kondisi Per Tipe Mesin & Redesain Kartu Laporan Mobile Jos Jis:
  * Menambahkan section "Monitoring Kondisi Mesin" pada Dashboard utama dengan 4 kartu ringkasan visual untuk masing-masing tipe mesin: GTP-GIGA (19 items), AIPS (13 items), Heater DC (7 items), dan PC / PCA (11 items).
  * Setiap kartu mesin menampilkan indikator kesehatan dinamis (`✓ AMAN` atau `⚠️ X MASALAH`), total inspeksi yang terlaksana, jumlah checklist yang diperiksa, dan progress bar rasio status OK vs NOT OKE.
  * Menambahkan bilah filter tab interaktif (`Semua Peralatan`, `GTP-GIGA`, `AIPS`, `Heater DC`, `PC / PCA`) dengan warning badge jumlah temuan NOT OKE. Filter berjalan seketika (0 ms) dalam memori tanpa request ulang ke server.
  * Memutakhirkan endpoint `GET /api/dashboard` pada `api/index.js` dan `server.js` untuk mengembalikan payload agregasi `byMachine`.
  * Meredesain tampilan kartu detail laporan pada layar ponsel (`#page-detail`) menggunakan 2-column CSS Grid terstruktur:
    - Nomor item (`ITEM #X`) di sudut kiri atas dan status badge (`OK` / `NOT OKE`) di sudut kanan atas sejajar rapi.
    - Foto komponen tampil sebagai banner horizontal lapang dengan latar kontras gelap `#090d16` dan tombol "🔍 Ketuk foto untuk zoom".
    - Teks deskripsi pekerjaan berada mandiri di bawah foto tanpa saling menumpuk/tumpang tindih (anti-overlap).
    - Menghilangkan simbol dash liar (`-`) pada item tanpa catatan, dan menampilkan kotak catatan berbingkai khusus warna perhatian untuk temuan NOT OKE.
  * Pembaruan query cache-buster ke `?v=20261103_v260` dan footer dokumen resmi ke `QMS-0039442 v2.6.0`.

- v2.7.0: Kontainerisasi Docker Compose & Kesiapan Hosting Mandiri Ubuntu 26.04 LTS:
  * Menyediakan `Dockerfile` multi-stage build berbasis Node.js 20 Bookworm LTS dengan kompilasi otomatis modul native `better-sqlite3` dan user non-root `node`.
  * Menyediakan `docker-compose.yml` standar produksi dengan volume persisten `./data:/app/data`, healthcheck otomatis, dan rotasi log.
  * Memodernisasi `server.js` dengan dukungan konfigurasi port dinamis (`process.env.PORT`), path database (`process.env.DB_PATH`), dan handler Graceful Shutdown (`SIGTERM`/`SIGINT`) untuk keamanan data SQLite.
  * Menyediakan template `.env.docker.example` dan panduan lengkap deploy di server Ubuntu `PANDUAN_UBUNTU_DOCKER.md`.

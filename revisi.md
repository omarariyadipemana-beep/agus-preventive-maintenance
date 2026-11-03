# Riwayat Revisi Terakhir: v2.0.0 (SELESAI DITERAPKAN)
- Transformasi Tema Visual: Fresh & Vibrant Violet-Cyan (Inspirasi Telco & Modern Mobile App):
  1. **Palet Warna Baru:** Mengganti palet lama menjadi Electric Violet (`#7c3aed`), Vibrant Cyan (`#06b6d4`), Coral Red Salmon (`#f43f5e`), dan kanvas Soft Lavender Mist (`#f8f9ff`).
  2. **Sidebar Desktop Modern:** Gradasi Deep Indigo Night (`#1e1b4b`) dengan aksen hover ungu dan glowing icon Cyan.
  3. **Mobile Bottom Nav Bersih:** Latar belakang putih bersih (*Clean White*) dengan border tipis lavender, ikon aktif Electric Violet (`#7c3aed`), dan bayangan halus.
  4. **Metric Cards E-Wallet Style:** Kartu metrik dengan border lavender halus, ikon gradasi lembut, dan bar indikator atas yang muncul saat hover.
  5. **Progress Bar Cyan ke Violet:** Bar item OK menggunakan gradasi Cyan-Violet ala kuota meter aplikasi mobile, dan item NOT OKE menggunakan Coral Salmon.
  6. **Buttons & Form Toggles:** Tombol primer bergradasi Electric Violet dengan bayangan mewah; toggle status OK menggunakan Cyan toska dan NOT OKE menggunakan Coral Red.
  7. **PIN Overlay:** Tampilan keypad dan indikator PIN bernuansa Violet-Cyan modern.
  8. **Proteksi Cetak A4:** Cetak PDF 1 halaman A4 tetap 100% monokrom/formal pabrik via isolasi `@media print`.
- Pembaruan Domain Produksi Vercel:
  * Domain aktif produksi resmi diperbarui menjadi: **`https://formmaintenance.vercel.app`**
- Seluruh spesifikasi telah disinkronkan ke zona bawah `prd.md`.

---

# Revisi v2.0.2: Penggantian Ikon Brand (SELESAI DITERAPKAN)
- Ikon SVG brand pada sidebar telah diganti dengan ikon Icons8 dari URL yang diberikan.
- Ikon menggunakan elemen gambar dengan teks alternatif `Ikon Preventive Maintenance`.
- Fungsi navigasi dan ikon menu lainnya tetap tidak berubah.
- Validasi format berhasil dengan `git diff --check`.

# Revisi v2.0.3: Penambahan Favicon (SELESAI DITERAPKAN)
- Ikon Icons8 ditambahkan sebagai favicon pada tab browser.
- Sumber ikon: https://img.icons8.com/?size=80&id=J5OHINhSdwbD&format=png

---

# Revisi v2.1.0: Hardening Keamanan Menyeluruh (SELESAI DITERAPKAN)
- **1. Autentikasi PIN Server-Side:** PIN `2323` dan `3434` dihapus 100% dari kode JavaScript frontend (public/app.js). Verifikasi kini ditangani secara aman di endpoint server POST /api/auth/verify-pin yang mengembalikan cryptographic session token acak.
- **2. Middleware Autentikasi API:** Seluruh endpoint API kini diproteksi dengan header X-Auth-Token. Request tanpa token valid langsung ditolak (401 Unauthorized).
- **3. Role-Based Access Control (RBAC):** Endpoint DELETE /api/inspections/:id dan GET /api/dashboard dikunci secara server-side hanya untuk role admin.
- **4. Rate Limiting:** Pembatasan brute-force PIN maksimal 5 kali per menit, dan pembatasan traffic API umum maksimal 100 request per menit per IP (express-rate-limit).
- **5. CORS Restriction:** Akses API dibatasi hanya untuk origin resmi (formmaintenance.vercel.app dan localhost).
- **6. Sanitasi Search Filter:** Input parameter pencarian pada integrasi Supabase dibersihkan dari karakter manipulasi filter.
- **7. Proteksi Error Leakage:** Pesan error internal sistem tidak lagi diekspos ke client publik.
- **8. Skema RLS Supabase:** Menambahkan definisi kebijakan Row Level Security pada supabase_schema.sql.

---

# Revisi v2.1.1: Pembersihan Tampilan PIN & String Literal Head (SELESAI DITERAPKAN)
- Menghapus tampilan bocoran PIN (`Role akses: User / Admin`) pada modal login di public/index.html.
- Menghapus karakter sisa literal head pada tag link favicon di public/index.html yang merender teks di atas halaman.

---

# Revisi v2.2.0: Integrasi Kolom Gambar Panduan Visual SOP Mesin GTP & GIGA (SELESAI DITERAPKAN)
- **1. Kolom GAMBAR Baru:** Menambahkan kolom `GAMBAR` tepat di antara kolom `No` dan `Task List` pada tabel formulir inspeksi (`#taskTable`) di `public/index.html`.
- **2. Aset 19 Foto Mesin GTP-GIGA:** 19 foto komponen teknis telah diekstraksi dari dokumen resmi PDF ke `public/images/tasks/gtp-giga/1.jpg` s/d `19.jpg` (resolusi proporsional, total ukuran ~120 KB, sangat ringan).
- **3. Fitur Interaktif Click-to-Zoom (Lightbox Modal):**
  * Thumbnail di tabel berukuran proporsional (~72px × 40px) dengan hover micro-interaction halus dan ikon pembesar.
  * Saat diklik/ditap, terbuka modal Lightbox `#taskImageModal` dengan foto beresolusi penuh, badge nomor item, judul SOP, deskripsi panduan, serta tombol tutup (X), klik latar belakang, atau tombol `ESC`.
- **4. Graceful Fallback Mesin Lain:** Jika memilih tipe mesin selain GTP-GIGA (seperti PCA, AIPS, Heater DC), sistem menampilkan placeholder netral elegan tanpa error.
- **5. Hardening CSS Responsif Mobile & Print Proteksi:**
  * Selektor CSS responsif mobile diperbarui dari `nth-child` kaku menjadi kelas semantik (`.td-status`, `.td-remarks`, `.td-img`).
  * Di layar ponsel, thumbnail tampil rapi dengan teks panduan `🔍 Ketuk foto untuk zoom`, dan tombol `OK / NOT OKE` tetap presisi.
  * Cetak A4 PDF tetap terlindungi 100% formal tanpa terpotong di lembar kerja pabrik.


---

# Revisi v2.2.1: Perbaikan Sesi Serverless - Eliminasi Bug Kick-Out Saat Simpan Form (SELESAI DITERAPKAN)
## Penuntasan Masalah Sesi Hilang di Vercel Menggunakan Stateless HMAC-SHA256 Token

### 1. Akar Masalah Teknis (Root Cause Analysis)
- **Penyebab Utama:** Sistem autentikasi sebelumnya menyimpan token sesi di dalam variabel memori RAM: `const sessions = new Map()`.
- **Karakteristik Vercel Serverless:** Di hosting Vercel, setiap request HTTP berjalan di wadah (container) serverless yang **stateless** (tidak berbagi RAM antar instance dan mati otomatis saat jeda idle).
- **Kronologi Bug Saat Form Disubmit:**
  1. Pengguna memasukkan PIN di modal awal (`POST /api/auth/verify-pin`), ditangani oleh Container Serverless A. Token disimpan di RAM Container A.
  2. Pengguna mengisi formulir 19 item inspeksi (membutuhkan waktu 1-3 menit).
  3. Selama waktu pengisian, Container A mati karena idle timeout.
  4. Saat pengguna mengklik tombol "Simpan Inspeksi", request `POST /api/inspections` dikirim ke Vercel dan ditangani oleh Container Serverless B.
  5. Container B memiliki RAM baru (`sessions` masih kosong). Pengecekan `sessions.has(token)` menghasilkan `false`.
  6. Server merespons dengan HTTP `401 Unauthorized` ("Akses ditolak").
  7. Frontend menangkap kode 401 dan otomatis memicu `lockScreen()`, yang langsung mengeluarkan pengguna ke layar input PIN (`pinOverlay`) dan membatalkan penyimpanan form!

### 2. Solusi & Rekayasa Arsitektur yang Diterapkan
1. **Transisi ke Stateless Cryptographic HMAC-SHA256 Token:**
   - Menghapus ketergantungan pada `sessions = new Map()` di RAM server.
   - Mengubah mekanisme pembuatan token menjadi **Stateless Cryptographic Signature** (menggunakan modul bawaan Node.js `crypto`):
     * Format payload token: `role:timestamp:nonce`
     * Ditandatangani secara kriptografis dengan algoritma HMAC-SHA256 menggunakan secret key server.
     * Token di-encode menggunakan Base64URL yang aman untuk header HTTP.
   - Verifikasi Token di Middleware:
     * Serverless membaca token dari header `X-Auth-Token`.
     * Memverifikasi keaslian signature secara matematis (`crypto.timingSafeEqual`) tanpa memerlukan query database atau RAM session.
     * Memvalidasi masa berlaku token (aktif selama 14 hari).
     * Jika tanda tangan valid, request langsung diizinkan (`req.userRole = role`) seketika (0 ms latency).
   - **Hasil:** Kebal 100% terhadap cold start, container recycle, multi-region routing di Vercel, maupun restart server LAN!

2. **Penyelarasan Sinkron Dual-Stack (`api/index.js` & `server.js`):**
   - Menerapkan fungsi `createSignedToken(role)` dan `verifySignedToken(token)` yang identik pada serverless Vercel (`api/index.js`) dan server lokal SQLite (`server.js`).

3. **Penguatan Sesi di Frontend (`public/app.js`):**
   - Menyimpan token autentikasi di `localStorage` sebagai pelapis redundansi selain `sessionStorage`, sehingga jika pengguna berpindah aplikasi atau tab browser di HP saat inspeksi, login tidak terputus.

### 3. File yang Telah Diubah:
1. `api/index.js` : Mengganti `sessions = new Map()` dengan Stateless HMAC-SHA256 Token generator & validator.
2. `server.js` : Menyelaraskan fungsi HMAC token yang sama pada backend LAN.
3. `public/app.js` : Sinkronisasi penyimpanan token redundan di `localStorage` dan pelindung sesi.

### 4. Status Eksekusi:
- [x] Investigasi akar masalah (serverless in-memory session loss).
- [x] Perancangan arsitektur stateless cryptographic HMAC token.
- [x] Implementasi HMAC-SHA256 token di `api/index.js`, `server.js`, dan `public/app.js`.
- [x] Pengujian unit test cryptographic signature.
- [x] Selesai diterapkan dan siap di-deploy ke Vercel Production.


---

# Revisi v2.2.2: Redesain Tampilan Mobile Form Checklist - Fit, Banner Foto Jelas & Touch-Friendly (SELESAI DITERAPKAN)
## Transformasi Tampilan Kartu Inspeksi Mobile (Jos Jis)

### 1. Masalah Tampilan Sebelumnya pada Layar Smartphone
- Nomor urut 1. berdiri sendiri di baris atas.
- Foto panduan berukuran terlalu kecil (thumbnail mini 76px x 44px) yang membuat teknisi kesulitan melihat komponen mesin tanpa harus terus-menerus mengklik zoom.
- Teks petunjuk Ketuk foto untuk zoom terhimpit di samping foto dan terpotong ke bawah menjadi 4 baris sempit.
- Tombol status OK / NOT OKE dan kolom keterangan belum memanfaatkan lebar layar ponsel secara optimal (kurang fit).

### 2. Solusi & Rekayasa Arsitektur Kartu Mobile yang Diterapkan
1. **Header Kartu Elegan (Item Badge):**
   - Nomor urut diubah menjadi pill badge modern: Item #1, Item #2, dst. (warna Electric Violet berlatar lembut).
2. **Banner Foto Komponen yang Lebar & Jelas (Fit Width):**
   - Foto diperbesar memenuhi lebar kartu (width: 100%) dengan tinggi proporsional (~155px) dan kanvas kontras gelap (#090d16) agar komponen fisik mesin terlihat sangat jelas seketika tanpa perlu dizoom.
   - Menggunakan object-fit: contain sehingga tidak ada bagian mesin atau teks panduan yang terpotong.
   - Menyematkan floating glassmorphic badge di pojok kanan bawah foto: [ 🔍 Perbesar ] yang membuka Lightbox saat diklik.
3. **Tipografi Deskripsi Tugas yang Rapi:**
   - Menempatkan deskripsi pekerjaan (**Cleaning / Inspeksi / Ganti**) tepat di bawah banner foto dengan hierarki teks yang tegas, mudah dibaca (*scannable*), dan tidak terhimpit.
4. **Tombol Status Berukuran Penuh (Thumb-Friendly):**
   - Mengubah toggle status menjadi selebar 100% layar kartu: tombol [ ✓ OK ] (50%) dan [ ✗ NOT OKE ] (50%) dengan tinggi 42px sehingga sangat nyaman ditekan oleh jempol operator di lapangan.
5. **Kolom Keterangan Nyaman:**
   - Input keterangan dibuat full width dengan padding ergonomis dan border radius modern.
6. **Proteksi Tampilan Desktop & Cetak:**
   - Seluruh perubahan tampilan ini diisolasi murni di dalam media query mobile @media (max-width: 768px) pada public/style.css.
   - Tampilan desktop (tabel multi-kolom) dan cetak PDF A4 tetap 100% aman tanpa terganggu.

### 3. File yang Telah Diubah:
1. public/style.css : Tata letak flex mobile .task-table tbody tr, banner foto lebar, badge nomor, dan toggle tombol jempol 100% fit.

### 4. Status Eksekusi:
- [x] Analisis screenshot tampilan mobile dari pengguna.
- [x] Perancangan CSS card layout mobile modern.
- [x] Implementasi CSS mobile di public/style.css.
- [x] Selesai diterapkan dan siap di-deploy ke Vercel Production.


---

# DRAFT RENCANA REVISI: v2.3.0 (MENUNGGU PERSETUJUAN: "OKE TERAPKAN")
## Penambahan Kolom Foto pada Hasil Laporan & Fitur Export Gambar JPG (Pengganti PDF)

### 1. Latar Belakang & Kebutuhan Pengguna
- Pengguna telah menguji proses pengisian dan penyimpanan form, data tersimpan dengan sukses ke database.
- Pengguna meminta agar halaman hasil laporan inspeksi (`#printArea` / `#printTable`) juga **menyertakan kolom GAMBAR** persis seperti form inputan (di antara kolom `NO` dan `TASK LIST`).
- Pengguna meminta agar tombol ekspor laporan **tidak lagi menggunakan format PDF**, melainkan **di-export langsung sebagai file gambar JPG** resolusi tinggi agar lebih mudah dan praktis dibagikan (misalnya via WhatsApp, email, atau disimpan di galeri smartphone).

### 2. Rencana Implementasi Teknis
1. **Pustaka Konversi Gambar Ringan & Offline (`public/html2canvas.min.js`):**
   - Menyiapkan modul `html2canvas.min.js` di dalam folder `public/` agar proses konversi DOM ke gambar berjalan 100% lokal, cepat, dan tanpa dependensi eksternal.
   - Diimpor di `public/index.html` sebelum `app.js`.
2. **Perubahan Header & Tombol Aksi di Halaman Laporan (`public/index.html`):**
   - Menyisipkan header `<th class="th-img">Gambar</th>` di antara `<th class="th-no">No</th>` dan `<th class="th-task">Task List</th>` pada tabel hasil laporan (`#printTable`).
   - Mengganti tombol `#btnPrintPDF` ("Cetak PDF") menjadi `#btnExportJPG` dengan label **"Export JPG"** dan ikon unduh visual.
3. **Logika Render Gambar & Download JPG (`public/app.js`):**
   - Di fungsi `renderDetail(data)`:
     * Menyisipkan elemen `<td>` berisi thumbnail foto komponen mesin (`/images/tasks/gtp-giga/${item.item_no}.jpg`).
     * Menjaga atribut `crossOrigin="anonymous"` agar `html2canvas` dapat merender gambar tanpa kendala taint canvas.
     * Thumbnail foto juga dapat diklik untuk zoom (Lightbox) saat dibuka di browser.
   - Di event handler `#btnExportJPG`:
     * Menggunakan `html2canvas(printArea, { scale: 2, backgroundColor: '#ffffff', useCORS: true })` untuk menghasilkan gambar beresolusi tajam (*2x crisp scale*).
     * Mengonversi canvas ke format JPEG kualitas tinggi (95%).
     * Otomatis mengunduh berkas dengan nama file formal: `FORM_PREVENTIVE_MTC_${formId}.jpg`.
4. **Pembaruan Styling Tabel Laporan (`public/style.css`):**
   - Mengatur lebar kolom `.print-table .th-img` dan `.print-table td.td-img` (~65px) serta thumbnail `.print-thumb-img` (~56px × 32px, rounded halus, border tipis).
   - Menjamin tata letak hasil cetak tetap padat, elegan, dan seluruh teks serta foto terbaca sangat jelas di gambar JPG yang diunduh.

### 3. File yang Akan Diubah:
1. `public/index.html` : Struktur kolom gambar di `#printTable`, penggantian tombol "Export JPG", dan pemanggilan `html2canvas.min.js`.
2. `public/app.js` : Logika penyisipan thumbnail foto di `renderDetail` dan handler unduh gambar JPG resolusi tinggi.
3. `public/style.css` : Styling kolom gambar di tabel laporan dan optimalisasi canvas putih.
4. `public/html2canvas.min.js` : Aset pustaka lokal konversi DOM ke kanvas gambar.

### 4. Status Eksekusi:
- [x] Analisis kebutuhan & dokumen contoh hasil laporan dari pengguna.
- [x] Pemasangan pustaka `html2canvas.min.js` ke folder `public/` (offline-ready, zero CDN dependency).
- [x] Penyusunan draf konsep & konfirmasi persetujuan pengguna.
- [x] Implementasi kolom GAMBAR pada `#printTable` di detail laporan inspeksi (`public/index.html`, `public/app.js`, `public/style.css`).
- [x] Implementasi fitur **Export JPG** (2x Retina scale, 95% JPEG quality) menggantikan Cetak PDF.
- [x] Perbaikan query Dashboard (`api/index.js`): menghitung akhir bulan secara dinamis (`new Date(year, month + 1, 0).getDate()`) untuk mencegah error Postgres out of range tanggal 31 pada bulan 30 hari (November).
- [x] Verifikasi lokal & deployment produksi Vercel (`v2.3.0`). (STATUS: SELESAI DITERAPKAN)

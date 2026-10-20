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
- Sumber ikon: https://img.icons8.com/?size=80&id=J5OHINhSdwbD&format=png`r

---

# Revisi v2.1.0: Hardening Keamanan Menyeluruh (SELESAI DITERAPKAN)
- **1. Autentikasi PIN Server-Side:** PIN `2323` dan `3434` dihapus 100% dari kode JavaScript frontend (public/app.js). Verifikasi kini ditangani secara aman di endpoint server POST /api/auth/verify-pin yang mengembalikan cryptographic session token acak.
- **2. Middleware Autentikasi API:** Seluruh endpoint API kini diproteksi dengan header X-Auth-Token. Request tanpa token valid langsung ditolak (401 Unauthorized).
- **3. Role-Based Access Control (RBAC):** Endpoint DELETE /api/inspections/:id dan GET /api/dashboard dikunci secara server-side hanya untuk role dmin.
- **4. Rate Limiting:** Pembatasan brute-force PIN maksimal 5 kali per menit, dan pembatasan traffic API umum maksimal 100 request per menit per IP (express-rate-limit).
- **5. CORS Restriction:** Akses API dibatasi hanya untuk origin resmi (ormmaintenance.vercel.app dan localhost).
- **6. Sanitasi Search Filter:** Input parameter pencarian pada integrasi Supabase dibersihkan dari karakter manipulasi filter.
- **7. Proteksi Error Leakage:** Pesan error internal sistem tidak lagi diekspos ke client publik.
- **8. Skema RLS Supabase:** Menambahkan definisi kebijakan Row Level Security pada supabase_schema.sql.
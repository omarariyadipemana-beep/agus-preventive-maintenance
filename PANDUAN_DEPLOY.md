# Panduan Praktis Deploy: Supabase + GitHub + Vercel
================================================================================

Seluruh berkas kode, handler serverless, skema database, dan konfigurasi Vercel sudah siap di folder projek ini. Ikuti 3 langkah mudah berikut untuk menjalankannya secara online:

---

## LANGKAH 1: Setup Database di Supabase (Gratis)

1. Buka [https://supabase.com](https://supabase.com) dan login/daftar dengan akun GitHub Anda.
2. Klik tombol **"New Project"**.
3. Isi form:
   - **Name**: `preventive-maintenance` (atau nama lain bebas)
   - **Database Password**: Buat password yang kuat (simpan baik-baik)
   - **Region**: Pilih `Singapore (ap-southeast-1)` (paling cepat untuk Indonesia)
4. Tunggu sekitar 1-2 menit hingga database selesai disiapkan.
5. Di menu sidebar kiri Supabase, klik **SQL Editor**.
6. Klik **"New query"**, lalu copy seluruh isi berkas [supabase_schema.sql](file:///c:/Users/Mustofa/agus_mantenance/supabase_schema.sql) dan paste ke editor tersebut.
7. Klik tombol **"Run"** (ikon play hijau di kanan bawah).
   *Hasilnya: 3 tabel (`inspections`, `inspection_items`, `task_templates`) otomatis dibuat lengkap dengan template task 4 mesin!*
8. Sekarang ambil kredensial API:
   - Buka menu **Project Settings** (ikon gerigi di kiri bawah) -> klik **API**.
   - Catat dua nilai ini:
     * **Project URL** (misal: `https://xyzcompany.supabase.co`)
     * **Project API Keys (service_role atau anon)**: Copy kuncinya.

---

## LANGKAH 2: Push Kode ke GitHub

1. Buka [https://github.com](https://github.com) lalu buat repository baru:
   - Klik tombol **"+"** di kanan atas -> **"New repository"**.
   - Beri nama repository, misalnya: `preventive-maintenance`.
   - Pilih **Private** atau **Public** (bebas).
   - **JANGAN** centang "Add a README" atau ".gitignore" (karena sudah dibuatkan).
   - Klik **"Create repository"**.
2. Di layar GitHub akan muncul URL repository Anda (misal: `https://github.com/username/preventive-maintenance.git`).
3. Buka **Terminal / Command Prompt** di komputer ini, lalu jalankan 3 baris perintah ini (ganti URL dengan milik Anda):

```bash
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/preventive-maintenance.git
git push -u origin main
```

*(Jika diminta login GitHub, silakan lakukan login/autentikasi)*.

---

## LANGKAH 3: Deploy di Vercel (Gratis & Online 24/7)

1. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** -> pilih **"Project"**.
3. Cari repository `preventive-maintenance` yang baru saja Anda push, lalu klik tombol **"Import"**.
4. Di bagian **"Environment Variables"**, tambahkan 2 variabel dari Langkah 1:
   - Key: `SUPABASE_URL` -> Value: `https://xyzcompany.supabase.co`
   - Key: `SUPABASE_KEY` -> Value: `kunci_api_supabase_anda`
5. Klik tombol **"Deploy"**!
6. Tunggu sekitar 1 menit hingga proses build selesai.

🎉 **SELESAI!** Vercel akan memberikan domain gratis berakhiran `.vercel.app` (misal: `https://preventive-maintenance-seven.vercel.app`).

Aplikasi Anda kini sudah **online 24/7**, bisa diakses oleh teknisi langsung dari HP di area pabrik, dengan database cloud Supabase dan proteksi PIN `2323` (User) & `3434` (Admin)!

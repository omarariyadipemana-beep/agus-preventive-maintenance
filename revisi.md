# Riwayat Revisi Terakhir: v1.9.0 (SELESAI DITERAPKAN)
- Perbaikan Bagian Bawah Form Inspeksi di HP (Tanda Tangan & Tombol Aksi):
  1. **Tanda Tangan Tidak Terpotong Lagi:** Di layar HP (<= 768px), `.signatures-grid` diubah menjadi 1 kolom vertikal bertumpuk (`grid-template-columns: 1fr`). Seluruh 3 penanda tangan (Maintenance Support, Group Leader / LPU, dan Logistik Leader) tampil utuh, lebar input 100%, dan bebas overflow ke kanan.
  2. **Tombol Aksi Proporsional & Mudah Disentuh:** Di HP, `.form-actions` diubah menjadi grid 2 kolom (`grid-template-columns: 1fr 2fr`) dengan tinggi 48px dan padding bawah yang lega sehingga tidak tertutup atau menabrak bottom navigation bar.
  3. **Integritas Desktop & Cetak A4:** Di desktop dan cetak PDF A4, blok tanda tangan tetap otomatis 3 kolom sejajar presisi.
- Seluruh spesifikasi telah disinkronkan ke zona bawah `prd.md`.

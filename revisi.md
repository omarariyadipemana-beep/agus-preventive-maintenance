# Riwayat Revisi Terakhir: v1.6.0 (SELESAI DITERAPKAN)
- Audit & Perbaikan Responsif Desktop + Mobile (7 Fix):
  1. **FIX #1 — Metric Cards:** Grid selalu 3 kolom sejajar di semua ukuran layar (768px & 400px), menghapus inkonsistensi layout 1 kolom.
  2. **FIX #2 — Task Table Mobile:** Diubah dari horizontal-scroll ke **stacked card layout** per item (No+Deskripsi → Status toggle → Keterangan vertikal). Tanpa scroll horizontal, touch-target 38px+.
  3. **FIX #3 — Print Area Detail:** Tabel detail inspeksi dibungkus `overflow-x: auto` di layar HP, `word-break: break-word` agar teks task terbaca utuh.
  4. **FIX #4 — Detail Header Buttons:** Tombol aksi ("Cetak PDF", "Export Excel", "Kembali") disusun ulang dengan CSS Grid 2 kolom + tombol Kembali full-width di atas.
  5. **FIX #5 — Signatures Grid:** Selalu 3 kolom di semua ukuran layar (konsisten dengan standar form resmi), hanya font & padding yang mengecil.
  6. **FIX #6 — Mobile Cards List:** Ditambahkan `display: none` eksplisit di desktop untuk mencegah duplikat konten.
  7. **FIX #7 — Print Info Grid:** Di HP menjadi 2 kolom rata (2x2 + item terakhir full-width), di layar ≤400px menjadi 1 kolom.
  - Proteksi cetak: Ditambahkan reset `@media print` agar stacked-card CSS mobile tidak bocor ke output cetak.
- Seluruh spesifikasi telah disinkronkan ke zona bawah `prd.md`.



# Riwayat Revisi Terakhir: v1.8.0 (SELESAI DITERAPKAN)
- Transformasi Halaman Detail Inspeksi di HP (Konsep A: Mobile Card / Row View):
  1. **Eliminasi Teks Terpotong Vertikal:** Di layar ponsel (<= 768px), tabel kaku 4 kolom `.print-table` ditransformasikan menjadi tampilan baris kartu (Card/Row view) yang lega.
  2. **Struktur Baris Kartu Mobile:**
     - Nomor item (`Item #1`) sejajar dengan Status Badge (`OK` hijau atau `NOT OKE` merah) di pojok kanan atas.
     - Deskripsi task list melebar 100% horizontal (`line-height: 1.55`, `font-size: 0.8125rem`) tanpa terpecah per huruf.
     - Kotak catatan / Remarks tampil rapi di bagian bawah item.
  3. **Garansi Proteksi Cetak A4:** Seluruh aturan kartu mobile di-reset secara total di `@media print` (`display: table`, `table-row`, `table-cell`), sehingga fungsi Cetak PDF 1 halaman A4 tetap 100% identik dengan formulir fisik.
- Seluruh spesifikasi telah disinkronkan ke zona bawah `prd.md`.

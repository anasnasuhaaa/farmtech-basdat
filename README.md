# Farm Tech

Website demonstrasi manajemen satu peternakan untuk tugas Basis Data. Next.js memakai Supabase Auth dan PostgreSQL. Migrasi SQL adalah sumber kebenaran; Prisma tetap terpasang tetapi tidak dipakai untuk CRUD.

## Menjalankan lokal

1. `npm ci`
2. Salin `.env.example` ke `.env`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dari project Supabase.
3. Jalankan migrasi dan buat tiga akun sesuai [DEMO_SETUP.md](DEMO_SETUP.md).
4. `npm run dev`, lalu buka `/login`.

Pemeriksaan lokal: `npm test`, `npm run typecheck`, `npm run lint`, dan `npm run build`. Build memakai webpack agar lebih stabil pada mesin demo Windows.

## Alur demo

- Administrator mengelola master, pengguna, transaksi, pembatalan, dashboard, dan laporan.
- Pemilik membaca data operasional serta laporan dan mencetak PDF melalui dialog browser.
- ABK mencatat transaksi operasional dan pemasukan lainnya; buku keuangan penuh tetap tertutup.
- Pakan masuk otomatis menambah stok dan membuat pengeluaran keuangan. Mix pakan memakai biaya rata-rata per kg dari riwayat perolehan dan produksi. Pengeluaran pakan mengurangi stok.
- Panen boleh disimpan sebelum sortir. Sortir penuh menambah stok kategori telur. Distribusi mengurangi stok dan otomatis membuat pemasukan.
- Koreksi transaksi dilakukan Administrator dengan membatalkan lalu mencatat ulang. Pembatalan yang akan membuat stok negatif ditolak.

Stok pakan, stok telur, populasi aktif, dan saldo dihitung dari transaksi. Detail mix, sortir, dan distribusi memakai tabel weak entity dengan nomor detail per parent. Aksi multi-tabel dijalankan dalam satu fungsi PostgreSQL agar gagal atau berhasil bersama.

## Indikator demo

Rumus terpusat di `lib/business/metrics.ts`. HDP = telur harian / populasi aktif hari itu × 100; HHP = telur harian / jumlah awal populasi yang sudah masuk pada hari itu × 100; FCR = pakan keluar kg harian / berat telur utuh kg harian. Denominator nol ditampilkan sebagai `-`. Untuk kepentingan demo, seluruh kandang dan kategori ternak dihitung bersama.

## Batasan

Migrasi dan akun Supabase perlu dibuat manual di project pemilik; perintah lokal di atas tidak menerapkan migrasi remote. Tidak ada Reseller, Kesehatan, Vaksin, multi-farm, payment gateway, atau deployment dalam aplikasi ini.

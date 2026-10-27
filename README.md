# Farm Tech

Aplikasi demo manajemen peternakan menggunakan Next.js dan Supabase. Autentikasi memakai Supabase Auth; izin Administrator, Pemilik, dan ABK diperiksa di server dan PostgreSQL RLS.

## Menjalankan aplikasi

Gunakan Node.js 22 atau lebih baru. Jalankan `npm install`. Jika `.env` belum ada, salin `.env.example` menjadi `.env`, lalu isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Jika sudah terisi, pertahankan nilainya.

Siapkan database dengan salah satu cara berikut.

### Melalui SQL Editor Supabase

```bash
npm run db:sql
```

Buka `supabase/setup-demo.sql`, salin **seluruh isinya** ke **Supabase Dashboard → SQL Editor → New query**, lalu klik **Run**. File ini membuat tabel, fungsi, RLS, data awal, dan ketiga akun demo yang emailnya sudah terverifikasi. Tidak perlu mengubah pengaturan konfirmasi email atau mengirim email.

File SQL boleh dijalankan ulang: migration yang tercatat dilewati dan data operasional dipertahankan. Ketiga akun `@farmtech.test` akan diaktifkan kembali dengan role dan password demo aslinya.

### Melalui koneksi PostgreSQL

Tambahkan `DATABASE_URL` dari connection string PostgreSQL Supabase ke `.env`. Gunakan Session pooler port 5432 jika jaringan tidak mendukung IPv6, dan URL-encode karakter khusus pada password. Variabel ini hanya dipakai script database dan tidak dikirim ke browser.

```bash
npm run db:setup
```

`db:migrate` hanya menerapkan migration; `db:seed` hanya menyiapkan akun dan data demo. SQL Editor dan script memakai catatan migration yang sama. Setup tidak menghapus tabel atau data aplikasi.

Setelah database siap:

```bash
npm run db:verify
npm run dev
```

Buka http://localhost:3000. Pilih role, lalu klik **Masuk sebagai …**. Form email/password juga tersedia.

| Role | Email | Password | Akses |
| --- | --- | --- | --- |
| Administrator | admin@farmtech.test | Admin123! | Operasional, keuangan, master data, pengguna |
| Pemilik | pemilik@farmtech.test | Pemilik123! | Pemantauan operasional dan laporan keuangan |
| ABK | abk@farmtech.test | Abk123! | Pencatatan operasional dan pemasukan lainnya |

Akun di atas memang ditampilkan publik untuk demo. Data awal berisi 1.000 petelur, pembelian pakan, dan tujuh hari panen, sortir, pemakaian pakan, serta penjualan telur. Menjalankan seed ulang mempertahankan transaksi demo yang sudah dicatat.

## Pemeriksaan

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run db:verify
npx playwright install chromium
npm run test:e2e
```

`db:verify` menguji login ketiga akun pada Supabase yang terkonfigurasi, role, akses tabel dashboard, dan pembatasan data keuangan ABK. Pengujian browser memeriksa kedua cara login untuk setiap role, sesi setelah reload, menu, stok pakan, logout, dan penolakan halaman terlindungi setelah logout.

Untuk menjalankan hasil build production: `npm start`.

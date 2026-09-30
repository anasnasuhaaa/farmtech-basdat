# Setup demo Farm Tech

1. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di `.env`.
2. Jalankan migration SQL berurutan melalui Supabase SQL Editor. Tidak perlu service role key atau Supabase CLI.
3. Di Supabase Authentication, buat dan konfirmasi tiga user:
   - `admin@farmtech.test` / `Admin123!`
   - `pemilik@farmtech.test` / `Pemilik123!`
   - `abk@farmtech.test` / `Abk123!`
4. Login pertama membuat profil dan subclass role masing-masing melalui `bootstrap_current_demo_user()`.
5. Jalankan `npm run dev`, lalu buka `/login`.

Credential di atas hanya untuk demo. Jangan gunakan untuk sistem produksi.

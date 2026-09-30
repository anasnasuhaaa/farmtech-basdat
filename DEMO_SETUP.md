# Setup demo Farm Tech

1. Isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` di `.env`.
2. Jalankan migration SQL berurutan melalui Supabase SQL Editor:
   - `supabase/migrations/001_farm_tech_schema.sql`
   - `supabase/migrations/002_farm_tech_rls.sql`
   - `supabase/migrations/003_farm_tech_seed.sql`
   - `supabase/migrations/004_farm_tech_livestock_feed.sql`
   - `supabase/migrations/005_farm_tech_eggs_finance.sql`
   - `supabase/migrations/006_farm_tech_function_access.sql`
   Tidak perlu service role key atau Supabase CLI. Jalankan setiap file hanya sekali pada project kosong.
3. Di Supabase Authentication, buat dan konfirmasi tiga user:
   - `admin@farmtech.test` / `Admin123!`
   - `pemilik@farmtech.test` / `Pemilik123!`
   - `abk@farmtech.test` / `Abk123!`
4. Login pertama membuat profil dan subclass role masing-masing melalui `bootstrap_current_demo_user()`.
5. Jalankan `npm run dev`, lalu buka `/login`.
6. Masuk dengan tiap tab demo sekali agar profil dan tabel subclass role terisi. Administrator dapat mengubah nama, status, dan role pengguna yang sudah login melalui `/pengguna`.

Credential di atas hanya untuk demo. Jangan gunakan untuk sistem produksi.

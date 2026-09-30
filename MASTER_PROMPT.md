# FARM TECH — CODEX MASTER PROMPT
## Website Demonstrasi Tugas Basis Data

> Gunakan prompt ini sebagai **source of truth implementasi**. Fokus utama adalah fungsi, konsistensi basis data, relasi antardata, dan demonstrasi alur bisnis. UI redesign akan dilakukan pada tahap lain.

---

# 0. Peran Anda

Anda adalah **senior full-stack engineer** yang bekerja langsung pada repository Next.js yang SUDAH ADA.

Tugas Anda adalah mengimplementasikan website demonstrasi **Farm Tech**, yaitu sistem manajemen peternakan untuk tugas kuliah Basis Data. Sistem ini merupakan penerapan dari rancangan konseptual yang sudah dibuat pada Fase 1.

Kerjakan secara mandiri dan pragmatis. Jangan membuat scope baru yang tidak diminta.

## Aturan kerja mutlak

1. **JANGAN scaffold / initialize ulang project.**
2. Sebelum mengubah apa pun:
   - inspect struktur repository,
   - baca `package.json`,
   - baca konfigurasi TypeScript,
   - cek komponen shadcn yang sudah tersedia,
   - cek struktur `app/`,
   - cek `.env`/`.env.example` tanpa pernah mencetak secret ke log.
3. Gunakan dependency yang sudah ada sebisa mungkin.
4. Install dependency baru **hanya jika benar-benar diperlukan**.
5. Jangan menghapus dependency yang sudah ada hanya karena tidak digunakan.
6. Jangan melakukan `git push`.
7. Setelah setiap stage selesai dan kondisi repo sehat, lakukan **1 commit**.
8. Maksimal pengerjaan hanya **4 stage**.
9. Jangan deploy. Deployment akan dilakukan sendiri oleh pemilik project.
10. Jangan melakukan redesign besar. Gunakan tampilan **hitam-putih sederhana khas shadcn**.
11. Prioritaskan:
    - database correctness,
    - role/permission,
    - CRUD dan transaksi,
    - validasi,
    - keterhubungan antarentitas,
    - dashboard,
    - laporan.
12. Gunakan Server Components secara default dan Client Components hanya ketika interaktivitas memang membutuhkannya.
13. Jangan mengganti nama konsep domain tanpa alasan. Nama entitas di bagian data model di bawah adalah source of truth.
14. Jangan menambahkan modul Reseller, Kesehatan, atau Vaksin.
15. Jangan menambahkan fitur deployment, domain, payment gateway, CRM pelanggan, supplier management lengkap, pajak, atau akuntansi eksternal.
16. Setiap selesai stage:
    - jalankan pemeriksaan yang tersedia di repository (`build`, typecheck, lint jika script-nya ada),
    - perbaiki error yang berasal dari perubahan stage,
    - baru commit.
17. Jangan berhenti hanya untuk meminta konfirmasi pada detail kecil. Gunakan spesifikasi di prompt ini. Hanya berhenti jika benar-benar ada blocker yang tidak bisa diselesaikan dari repository atau env.

---

# 1. Kondisi Project Saat Ini

Project sudah dibuat secara manual. **Jangan membuat project Next.js baru.**

Dependency yang sudah tersedia:

```json
{
  "@shadcn/ui": "^0.0.4",
  "@supabase/ssr": "^0.12.7",
  "@supabase/supabase-js": "^2.117.2",
  "class-variance-authority": "^0.7.1",
  "cn": "^0.4.0",
  "lucide-react": "^1.49.0",
  "next": "16.3.7",
  "prisma": "^8.0.0-rc.19",
  "radix-ui": "^1.6.7",
  "react": "19.2.8",
  "react-dom": "19.2.8",
  "shadcn": "^4.21.0",
  "tw-animate-css": "^1.4.0"
}
```

Environment variable yang sudah disediakan:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Keputusan data layer

Gunakan **Supabase PostgreSQL + Supabase Auth** sebagai database dan authentication utama.

Prisma sudah terinstall tetapi pada env yang tersedia **belum ada `DATABASE_URL`**. Karena itu:

- jangan memaksa Prisma menjadi runtime data layer,
- jangan membuat dua data layer berbeda untuk CRUD yang sama,
- jangan meminta `DATABASE_URL` hanya untuk menyelesaikan MVP ini,
- pertahankan dependency Prisma, tetapi gunakan Supabase JS/SSR + SQL migration sebagai source of truth implementasi.

Jika repository ternyata SUDAH memiliki konfigurasi Prisma yang valid beserta `DATABASE_URL`, jangan otomatis mengubah arsitektur. Tetap prioritaskan satu data layer yang konsisten dan jangan mencampur Prisma/Supabase secara sembarangan.

Buat SQL migration yang dapat dijalankan melalui Supabase SQL Editor, misalnya:

```text
supabase/
  migrations/
    001_farm_tech_schema.sql
    002_farm_tech_rls.sql
    003_farm_tech_seed.sql
```

Jika Supabase CLI tidak tersedia, **jangan install CLI hanya untuk memaksa migration remote**. Buat migration SQL yang lengkap dan dokumentasikan urutan eksekusinya.

---

# 2. Scope Final Website Versi Tugas Kuliah

Website hanya fokus pada operasional **SATU peternakan**.

## Termasuk

- authentication,
- pengguna dan role,
- kandang,
- kategori ternak,
- populasi ternak,
- mutasi populasi,
- master pakan,
- pakan masuk,
- mix pakan,
- detail mix pakan,
- pengeluaran pakan,
- stok pakan terhitung,
- panen telur,
- kategori telur,
- sortir telur,
- stok telur per kategori,
- distribusi/penjualan telur,
- transaksi keuangan,
- pemasukan,
- pengeluaran,
- kategori keuangan,
- dashboard,
- tren indikator,
- pencarian/filter,
- laporan keuangan per periode,
- export PDF/print-ready PDF,
- responsive desktop/mobile.

## Tidak termasuk

- Reseller,
- pencatatan keuangan reseller,
- kesehatan ternak,
- catatan medis,
- vaksin,
- multi-farm,
- supplier management lengkap,
- CRM pelanggan,
- payment gateway,
- perpajakan,
- akuntansi eksternal,
- server/domain/deployment,
- redesign visual lanjutan.

---

# 3. PERUBAHAN PENTING DARI LAPORAN

Pada entitas **Pengguna**, field identitas login adalah:

```text
email
```

BUKAN:

```text
username/email
```

Jadi atribut konseptual Pengguna versi implementasi adalah:

- `id_pengguna`
- `nama`
- `email`
- `password_hash` secara konseptual
- `status_akun`

Namun karena menggunakan Supabase Auth:

- **JANGAN menyimpan `password_hash` di tabel public sendiri**.
- password dikelola oleh Supabase Auth pada schema auth.
- `public.pengguna.id_pengguna` harus mengacu pada `auth.users.id`.
- `public.pengguna.email` digunakan sebagai salinan email untuk kebutuhan aplikasi/query.
- login website hanya menggunakan **email + password**.

Ini adalah mapping implementasi terhadap atribut konseptual `password_hash`, bukan penghapusan konsep authentication.

---

# 4. Role dan Hak Akses

Ada tepat tiga subclass dari `Pengguna`:

1. `Administrator`
2. `Pemilik`
3. `ABK`

Spesialisasi `Pengguna` bersifat:

- **total**: setiap Pengguna wajib masuk tepat ke satu role,
- **disjoint**: satu Pengguna tidak boleh memiliki dua role sekaligus.

Jangan membuat role `Reseller`.

## 4.1 Administrator

Administrator dapat:

- melihat seluruh data,
- membuat data master,
- mengubah data master,
- menghapus data yang aman untuk dihapus,
- membuat transaksi operasional,
- mengoreksi transaksi,
- menghapus/membatalkan transaksi dengan tetap menjaga integritas relasi,
- mengelola Pengguna yang sudah terdaftar,
- mengakses seluruh buku keuangan,
- mengakses dashboard dan laporan,
- export laporan.

## 4.2 Pemilik

Pemilik bersifat **read-only** terhadap operasional.

Pemilik dapat:

- melihat seluruh data peternakan,
- melihat populasi,
- melihat pakan/stok,
- melihat produksi telur,
- melihat distribusi,
- melihat buku keuangan,
- melihat dashboard,
- menggunakan filter,
- melihat/export laporan.

Pemilik **tidak boleh**:

- create data operasional,
- edit data operasional,
- delete data operasional,
- mengubah master data,
- mengelola Pengguna.

Di UI, jangan hanya mengandalkan hidden button. Permission harus tetap diamankan di database/RLS/server action.

## 4.3 ABK

ABK adalah pengguna operasional dengan akses terbatas.

ABK boleh melihat data yang diperlukan untuk pekerjaan operasional, misalnya:

- daftar kandang,
- kategori ternak,
- populasi aktif,
- master pakan,
- stok pakan,
- kategori telur,
- data operasional yang relevan.

ABK boleh **menambahkan pencatatan operasional** yang diizinkan, seperti:

- mutasi populasi,
- pakan masuk,
- mix pakan,
- pengeluaran pakan,
- panen,
- sortir,
- distribusi telur,
- pemasukan manual yang memang diizinkan.

ABK **tidak boleh**:

- mengubah/delete master data,
- mengubah/delete transaksi yang sudah tersimpan,
- melihat keseluruhan ledger/buku keuangan,
- melihat seluruh pengeluaran,
- melihat laporan keuangan penuh,
- mengelola pengguna.

Jika transaksi operasional ABK secara otomatis menghasilkan data keuangan, misalnya:

- PakanMasuk → Pengeluaran,
- DistribusiTelur → Pemasukan,

backend tetap membuat data keuangan tersebut, tetapi ABK tidak perlu mendapat akses untuk membaca seluruh ledger.

ABK boleh melihat konfirmasi transaksi yang baru dia buat jika diperlukan, tetapi bukan seluruh buku keuangan.

---

# 5. Demo Authentication

Website ini fokus untuk demonstrasi. Login page harus sangat mudah digunakan saat presentasi.

## Login Card

Gunakan satu card login dengan:

- judul Farm Tech,
- input email,
- input password,
- tombol Login,
- tiga Tabs:
  - Administrator
  - Pemilik
  - ABK

Setiap tab menampilkan contoh credential dan tombol **"Gunakan akun ini"** yang otomatis mengisi email dan password.

Gunakan credential demo berikut:

### Administrator

```text
Email: admin@farmtech.test
Password: Admin123!
```

### Pemilik

```text
Email: pemilik@farmtech.test
Password: Pemilik123!
```

### ABK

```text
Email: abk@farmtech.test
Password: Abk123!
```

Simpan credential demo dalam satu file yang jelas, misalnya:

```text
src/lib/demo-accounts.ts
```

Beri komentar bahwa credential tersebut **DEMO ONLY**.

## Setup user Supabase Auth

Karena hanya publishable key yang tersedia, jangan mencoba memakai Supabase Admin API tanpa service-role key.

Buat dokumentasi ringkas, misalnya `DEMO_SETUP.md`, yang menjelaskan:

1. Buat tiga user di Supabase Authentication dengan email/password di atas.
2. Pastikan akun sudah confirmed untuk keperluan demo.
3. Jalankan migration SQL.
4. Saat user login pertama kali, sistem harus memastikan `public.pengguna` dan subclass role terkait tersedia.

Boleh membuat RPC seperti:

```text
bootstrap_current_demo_user()
```

yang:

- membaca `auth.uid()` dan email session,
- mencocokkan tiga email demo,
- membuat `pengguna` jika belum ada,
- memasukkan user ke tepat satu tabel subclass:
  - `administrator`,
  - `pemilik`,
  - `abk`,
- tidak pernah menerima role bebas dari client,
- bersifat idempotent.

Untuk user non-demo, jangan otomatis memberi role Administrator.

## Status akun

Jika `status_akun = 'NONAKTIF'`, user yang sudah berhasil authenticate tetap harus ditolak dari area dashboard aplikasi.

---

# 6. DATA MODEL — SOURCE OF TRUTH

Implementasikan seluruh entitas berikut. Jangan menghilangkan entitas hanya untuk mempermudah coding.

---

## 6.1 Pengguna — Strong Entity / Superclass

Tabel implementasi: `pengguna`

Field:

```text
id_pengguna      UUID PK, FK -> auth.users.id
nama             TEXT NOT NULL
email            TEXT NOT NULL UNIQUE
status_akun      TEXT NOT NULL
created_at       TIMESTAMPTZ
updated_at       TIMESTAMPTZ
```

`password_hash` tidak dibuat di `public.pengguna`; dikelola Supabase Auth.

Status minimal:

```text
AKTIF
NONAKTIF
```

## 6.2 Administrator — Subclass

```text
administrator
id_pengguna UUID PK, FK -> pengguna.id_pengguna
```

## 6.3 Pemilik — Subclass

```text
pemilik
id_pengguna UUID PK, FK -> pengguna.id_pengguna
```

## 6.4 ABK — Subclass

```text
abk
id_pengguna UUID PK, FK -> pengguna.id_pengguna
```

Buat helper/function database untuk memperoleh role user berdasarkan subclass. Jangan membuat user masuk ke lebih dari satu subclass.

## 6.5 Kandang — Strong Entity

```text
kandang
id_kandang        UUID PK
nama_kandang      TEXT NOT NULL
keterangan        TEXT NULL
```

## 6.6 KategoriTernak — Strong Entity

```text
kategori_ternak
id_kategori_ternak UUID PK
nama_kategori      TEXT NOT NULL
```

## 6.7 PopulasiTernak — Strong Entity

```text
populasi_ternak
id_populasi          UUID PK
id_kandang           UUID FK -> kandang
id_kategori_ternak   UUID FK -> kategori_ternak
tanggal_masuk        DATE NOT NULL
jumlah_awal          INTEGER NOT NULL > 0
usia_masuk           INTEGER NULL
ras                   TEXT NULL
keterangan            TEXT NULL
created_by            UUID FK -> pengguna
created_at            TIMESTAMPTZ
```

Populasi aktif tidak disimpan sebagai angka duplikat jika bisa dihitung dari jumlah awal + riwayat mutasi.

## 6.8 MutasiPopulasi — Weak Entity

```text
mutasi_populasi
id_populasi   UUID FK -> populasi_ternak
no_mutasi     INTEGER
tanggal       DATE NOT NULL
jenis_mutasi  TEXT NOT NULL
jumlah        INTEGER NOT NULL > 0
keterangan    TEXT NULL
created_by    UUID FK -> pengguna
created_at    TIMESTAMPTZ
PRIMARY KEY (id_populasi, no_mutasi)
```

Minimal jenis mutasi:

```text
KEMATIAN
PENJUALAN
PEMINDAHAN
AFKIR
```

Aturan demo:

- KEMATIAN mengurangi populasi aktif.
- PENJUALAN mengurangi populasi aktif.
- AFKIR mengurangi populasi aktif.
- PEMINDAHAN adalah catatan perpindahan dan tidak otomatis mengubah jumlah total.
- populasi aktif tidak boleh negatif.
- jika seluruh kelompok berpindah kandang, Administrator dapat mencatat PEMINDAHAN lalu memperbarui `id_kandang`.
- jangan membuat split population kompleks yang tidak diminta.

## 6.9 Pakan — Strong Entity

```text
pakan
id_pakan       UUID PK
nama_pakan     TEXT NOT NULL
jenis_pakan    TEXT NOT NULL
satuan         TEXT NOT NULL
```

Jenis minimal:

```text
BAHAN_BAKU
PAKAN_JADI
HASIL_CAMPURAN
```

## 6.10 PakanMasuk — Strong Entity

```text
pakan_masuk
id_pakan_masuk UUID PK
id_pakan       UUID FK -> pakan
tanggal        DATE NOT NULL
berat_kg       NUMERIC > 0
harga_total    NUMERIC >= 0
keterangan     TEXT NULL
created_by     UUID FK -> pengguna
created_at     TIMESTAMPTZ
```

PakanMasuk menambah stock dan harus terhubung dengan tepat satu Pengeluaran keuangan sesuai relasi 1:1.

## 6.11 MixPakan — Strong Entity

```text
mix_pakan
id_mix           UUID PK
tanggal          DATE NOT NULL
nama_mix         TEXT NOT NULL
id_pakan_hasil   UUID FK -> pakan
total_berat      NUMERIC NOT NULL
total_biaya      NUMERIC NOT NULL
created_by       UUID FK -> pengguna
created_at       TIMESTAMPTZ
```

Setiap MixPakan:

- mempunyai satu atau lebih DetailMixPakan,
- mengurangi stock bahan,
- menghasilkan stock pada `id_pakan_hasil`,
- menghitung total berat otomatis,
- menghitung total biaya otomatis.

## 6.12 DetailMixPakan — Weak Entity

```text
detail_mix_pakan
id_mix          UUID FK -> mix_pakan
no_detail       INTEGER
id_pakan_bahan  UUID FK -> pakan
berat_bahan     NUMERIC > 0
biaya_bahan     NUMERIC >= 0
PRIMARY KEY (id_mix, no_detail)
```

Rules:

- tidak ada tanpa MixPakan,
- satu mix minimal satu detail,
- berat bahan tidak boleh melebihi stock,
- `total_berat = SUM(berat_bahan)`,
- `total_biaya = SUM(biaya_bahan)`.

Karena laporan tidak menentukan metode valuasi biaya secara eksplisit, gunakan helper costing sederhana dan terdokumentasi, misalnya average acquisition/production cost per kg berdasarkan histori PakanMasuk dan MixPakan yang menghasilkan pakan tersebut. Jangan hardcode costing di UI.

## 6.13 PengeluaranPakan — Strong Entity

```text
pengeluaran_pakan
id_pakan_keluar UUID PK
id_pakan        UUID FK -> pakan
id_kandang      UUID NULL FK -> kandang
tanggal         DATE NOT NULL
jumlah_kg       NUMERIC > 0
tujuan          TEXT NOT NULL
keterangan      TEXT NULL
created_by      UUID FK -> pengguna
created_at      TIMESTAMPTZ
```

Aturan:

- penggunaan kandang → isi `id_kandang`,
- penggunaan umum → `id_kandang` boleh NULL,
- stock tidak boleh negatif.

## 6.14 Panen — Strong Entity

```text
panen
id_panen        UUID PK
id_kandang      UUID FK -> kandang
tanggal         DATE NOT NULL
jumlah_utuh     INTEGER NOT NULL >= 0
jumlah_retak    INTEGER NOT NULL >= 0
berat_utuh_kg   NUMERIC NOT NULL >= 0
keterangan      TEXT NULL
created_by      UUID FK -> pengguna
created_at      TIMESTAMPTZ
```

## 6.15 KategoriTelur — Strong Entity

```text
kategori_telur
id_kategori_telur UUID PK
nama_kategori     TEXT NOT NULL
```

Seed contoh boleh:

```text
Telur Coklat
Telur Putih
Telur Cacat
```

Kategori tetap fleksibel dan dapat dikelola Administrator.

## 6.16 DetailSortir — Weak Entity

```text
detail_sortir
id_panen            UUID FK -> panen
no_detail           INTEGER
id_kategori_telur   UUID FK -> kategori_telur
jumlah_telur        INTEGER > 0
PRIMARY KEY (id_panen, no_detail)
```

Sortir opsional saat Panen dibuat.

Aturan:

- Panen boleh disimpan tanpa langsung disortir.
- Panen belum disortir belum menghasilkan stock kategori siap distribusi.
- Jika disortir penuh:
  `SUM(detail_sortir.jumlah_telur) = panen.jumlah_utuh + panen.jumlah_retak`.
- Distribusi hanya boleh menggunakan stock kategori yang sudah tersedia dari hasil sortir.

## 6.17 DistribusiTelur — Strong Entity

```text
distribusi_telur
id_distribusi    UUID PK
tanggal          DATE NOT NULL
tujuan_pembeli   TEXT NOT NULL
total_harga      NUMERIC NOT NULL
keterangan       TEXT NULL
created_by       UUID FK -> pengguna
created_at       TIMESTAMPTZ
```

`tujuan_pembeli` cukup TEXT. **Jangan membuat entitas Customer/Pelanggan baru.**

## 6.18 DetailDistribusi — Weak Entity

```text
detail_distribusi
id_distribusi      UUID FK -> distribusi_telur
no_detail          INTEGER
id_kategori_telur  UUID FK -> kategori_telur
jumlah_telur       INTEGER > 0
harga_satuan       NUMERIC >= 0
subtotal           NUMERIC >= 0
PRIMARY KEY (id_distribusi, no_detail)
```

Rules:

```text
subtotal = jumlah_telur * harga_satuan
distribusi_telur.total_harga = SUM(detail_distribusi.subtotal)
```

Stock kategori tidak boleh negatif. Satu DistribusiTelur menghasilkan tepat satu Pemasukan.

## 6.19 KategoriKeuangan — Strong Entity

```text
kategori_keuangan
id_kategori_keuangan UUID PK
nama_kategori        TEXT NOT NULL
tipe                  TEXT NOT NULL
```

Tipe:

```text
PEMASUKAN
PENGELUARAN
```

Seed contoh:

```text
Penjualan Telur       -> PEMASUKAN
Penjualan Ternak      -> PEMASUKAN
Pemasukan Lainnya     -> PEMASUKAN
Pembelian Pakan       -> PENGELUARAN
Operasional           -> PENGELUARAN
Pengeluaran Lainnya   -> PENGELUARAN
```

## 6.20 TransaksiKeuangan — Strong Entity / Superclass

```text
transaksi_keuangan
id_transaksi          UUID PK
id_kategori_keuangan  UUID FK -> kategori_keuangan
tanggal               DATE NOT NULL
nominal               NUMERIC NOT NULL >= 0
keterangan            TEXT NULL
created_by            UUID FK -> pengguna
created_at            TIMESTAMPTZ
```

Setiap TransaksiKeuangan wajib menjadi tepat satu Pemasukan atau Pengeluaran.

## 6.21 Pemasukan — Subclass

```text
pemasukan
id_transaksi       UUID PK, FK -> transaksi_keuangan
sumber_pemasukan   TEXT NULL
id_distribusi      UUID NULL UNIQUE FK -> distribusi_telur
```

`id_distribusi` merealisasikan:

```text
DistribusiTelur 1:1 Pemasukan
```

Pemasukan manual boleh `id_distribusi = NULL`.

## 6.22 Pengeluaran — Subclass

```text
pengeluaran
id_transaksi        UUID PK, FK -> transaksi_keuangan
sumber_pengeluaran  TEXT NULL
id_pakan_masuk      UUID NULL UNIQUE FK -> pakan_masuk
```

`id_pakan_masuk` merealisasikan:

```text
PakanMasuk 1:1 Pengeluaran
```

Pengeluaran manual oleh Administrator boleh `id_pakan_masuk = NULL`.

---

# 7. RELASI DAN KARDINALITAS WAJIB

| Relasi | Kardinalitas | Implementasi |
|---|---|---|
| Kandang → PopulasiTernak | 1:N | FK `id_kandang` |
| KategoriTernak → PopulasiTernak | 1:N | FK `id_kategori_ternak` |
| PopulasiTernak → MutasiPopulasi | 1:N composition | composite weak entity |
| Pakan → PakanMasuk | 1:N | FK `id_pakan` |
| MixPakan → DetailMixPakan | 1:N composition | composite weak entity |
| Pakan → DetailMixPakan | 1:N | FK `id_pakan_bahan` |
| Pakan → PengeluaranPakan | 1:N | FK `id_pakan` |
| Kandang → PengeluaranPakan | 1:N, optional on transaction | nullable FK `id_kandang` |
| Kandang → Panen | 1:N | FK `id_kandang` |
| Panen → DetailSortir | 1:0..N composition | optional weak details |
| KategoriTelur → DetailSortir | 1:N | FK category |
| DistribusiTelur → DetailDistribusi | 1:N composition | weak details |
| KategoriTelur → DetailDistribusi | 1:N | FK category |
| KategoriKeuangan → TransaksiKeuangan | 1:N | FK category |
| DistribusiTelur → Pemasukan | 1:1 | unique FK |
| PakanMasuk → Pengeluaran | 1:1 | unique FK |
| Pengguna → transaksi operasional | 1:N | `created_by` |
| Pakan hasil campuran → MixPakan | 1:N | `id_pakan_hasil` |

---

# 8. KONSEP BASIS DATA YANG HARUS TERLIHAT

## Strong entity

- Pengguna
- Kandang
- KategoriTernak
- PopulasiTernak
- Pakan
- PakanMasuk
- MixPakan
- PengeluaranPakan
- Panen
- KategoriTelur
- DistribusiTelur
- KategoriKeuangan
- TransaksiKeuangan

## Weak entity

Jangan diubah menjadi JSON atau standalone UUID-only entity:

- MutasiPopulasi
- DetailMixPakan
- DetailSortir
- DetailDistribusi

## Superclass/Subclass

- Pengguna → Administrator, Pemilik, ABK
- TransaksiKeuangan → Pemasukan, Pengeluaran

## Composition

- PopulasiTernak → MutasiPopulasi
- MixPakan → DetailMixPakan
- Panen → DetailSortir
- DistribusiTelur → DetailDistribusi

---

# 9. DERIVED DATA — JANGAN BUAT TABEL STOK TERPISAH

Stock adalah hasil transaksi.

## Populasi Aktif

```text
jumlah_aktif =
jumlah_awal
- KEMATIAN
- PENJUALAN
- AFKIR
```

PEMINDAHAN tidak mengurangi total.

Buat view/helper `v_populasi_aktif`.

## Stok Pakan

```text
stok =
  total PakanMasuk
+ total MixPakan sebagai hasil pakan tersebut
- total DetailMixPakan saat pakan dipakai sebagai bahan
- total PengeluaranPakan
```

Buat `v_stok_pakan`.

## Stok Telur

```text
stok kategori =
  total DetailSortir kategori
- total DetailDistribusi kategori
```

Buat `v_stok_telur`.

## Saldo

```text
saldo =
SUM(Pemasukan)
- SUM(Pengeluaran)
```

---

# 10. TRANSAKSI ATOMIC PENTING

Gunakan PostgreSQL function/RPC atau mekanisme server-side atomik.

## Create PakanMasuk

1. validasi role,
2. insert PakanMasuk,
3. insert TransaksiKeuangan,
4. insert Pengeluaran,
5. link 1:1,
6. rollback seluruhnya bila gagal.

## Create MixPakan

1. cek bahan,
2. cek stock,
3. hitung biaya,
4. insert parent,
5. insert detail,
6. hitung total,
7. hasil menambah stock,
8. rollback bila gagal.

## Create DistribusiTelur

1. cek stock kategori,
2. insert DistribusiTelur,
3. insert DetailDistribusi,
4. hitung subtotal dan total,
5. insert TransaksiKeuangan,
6. insert Pemasukan,
7. link 1:1,
8. rollback bila gagal.

## Delete/Correction

- deleting Distribusi harus menangani Pemasukan terkait,
- deleting PakanMasuk harus menangani Pengeluaran terkait,
- parent weak entity harus menjaga composition,
- jangan meninggalkan orphan,
- tolak hard delete bila dependency berbahaya.

---

# 11. RLS DAN SECURITY

Gunakan RLS. Jangan hanya hide button.

Buat helper role dari `auth.uid()`.

## Admin

Full SELECT/INSERT/UPDATE/DELETE sesuai business rule.

## Pemilik

SELECT data dan laporan. Tidak write.

## ABK

- SELECT master/operational yang perlu,
- INSERT transaksi operasional yang diizinkan,
- tidak UPDATE/DELETE transaksi,
- tidak maintain master,
- tidak SELECT ledger penuh/pengeluaran penuh,
- boleh create pemasukan terbatas.

Semua server action memvalidasi session + status akun.

---

# 12. ROUTE DAN NAVIGASI

Minimal:

```text
/login
/dashboard

/peternakan/kandang
/peternakan/kategori-ternak
/peternakan/populasi
/peternakan/populasi/[id]

/pakan/master
/pakan/masuk
/pakan/mix
/pakan/keluar
/pakan/stok

/telur/panen
/telur/kategori
/telur/sortir
/telur/distribusi
/telur/stok

/keuangan/transaksi
/keuangan/kategori
/keuangan/laporan

/pengguna
```

Desktop gunakan sidebar.

Mobile gunakan bottom navigation maksimal:

1. Dashboard
2. Peternakan
3. Pakan
4. Telur
5. Lainnya

Menu Lainnya:

- Keuangan,
- Laporan,
- Pengguna (Admin only),
- Logout.

ABK jangan diberi full financial menu.

---

# 13. UI TAHAP INI

Gunakan shadcn hitam-putih.

Boleh gunakan:

- Card,
- Button,
- Input,
- Select,
- Dialog,
- AlertDialog,
- Tabs,
- Table,
- Badge,
- Sheet/Drawer,
- DropdownMenu.

Jangan:

- gradient,
- glassmorphism,
- decorative backgrounds,
- parallax,
- complex animation,
- redesign fancy.

Table mobile boleh horizontal scroll atau card fallback.

---

# 14. FORM DAN VALIDASI

Semua form:

- required validation,
- positive/nonnegative check,
- loading,
- error,
- success,
- role-aware disabled actions,
- destructive confirmation.

Server/database wajib menghitung ulang:

- Mix total weight,
- Mix total cost,
- Distribution subtotal,
- Distribution total,
- stock validation,
- nominal auto-finance.

---

# 15. DASHBOARD

Cards:

- HDP hari ini,
- HHP hari ini,
- FCR hari ini,
- total populasi aktif,
- total panen hari ini,
- total stok pakan,
- saldo/kas.

Trend:

- produksi telur,
- penggunaan pakan,
- populasi,
- pemasukan vs pengeluaran,
- HDP/HHP/FCR.

Filter:

- 7 hari,
- 30 hari,
- custom date range bila ringan.

## Formula demo

Laporan konseptual tidak menetapkan formula eksplisit. Gunakan asumsi DEMO terpusat:

```text
total_telur_harian = jumlah_utuh + jumlah_retak

HDP =
total_telur_harian
/ populasi_aktif_pada_hari_tersebut
* 100

HHP =
total_telur_harian
/ total_jumlah_awal_populasi_yang_relevan
* 100

FCR =
total_pakan_keluar_kg_harian
/ total_berat_utuh_kg_harian
```

Jika denominator 0 → tampilkan `-` / `N/A`.

Taruh formula di satu helper, misalnya:

```text
src/lib/business/metrics.ts
```

Komentari sebagai **DEMO BUSINESS FORMULA** agar mudah diubah.

Jika chart butuh `recharts` dan belum ada, install hanya pada Stage 4.

---

# 16. SEARCH, FILTER, HISTORY

Dukung filter relevan:

- tanggal,
- periode,
- kandang,
- kategori ternak,
- jenis transaksi,
- kategori pakan,
- kategori telur,
- tipe keuangan.

Gunakan URL search params jika sesuai.

---

# 17. LAPORAN KEUANGAN

Minimal:

- periode,
- total pemasukan,
- total pengeluaran,
- saldo,
- daftar transaksi,
- ringkasan per kategori.

Admin + Pemilik dapat melihat.

ABK tidak dapat melihat full report.

## Export PDF

Sediakan tombol **Export PDF**.

Prioritaskan:

- print-friendly page + `window.print()` + print CSS,

atau bila perlu:

- library PDF ringan hanya di Stage 4.

---

# 18. USER MANAGEMENT

Dengan publishable key yang tersedia:

Administrator wajib bisa:

- melihat Pengguna,
- melihat email,
- melihat nama,
- melihat role,
- mengubah nama,
- mengubah status,
- mengubah role secara aman.

Perubahan role harus memastikan total + disjoint.

Untuk create/delete identity Supabase Auth:

- jangan pakai service role di client,
- jika service key tidak tersedia, jangan membuat fake password system,
- dokumentasikan bahwa demo identity dibuat di Supabase Dashboard.

---

# 19. SEED DATA

Minimal:

Kandang:
```text
Kandang Layer A
```

KategoriTernak:
```text
Ayam Petelur
```

Pakan:
```text
Jagung        BAHAN_BAKU
Dedak         BAHAN_BAKU
Konsentrat    BAHAN_BAKU
Pakan Layer   PAKAN_JADI
Mix Layer     HASIL_CAMPURAN
```

KategoriTelur:
```text
Telur Coklat
Telur Putih
Telur Cacat
```

KategoriKeuangan:
```text
Penjualan Telur       PEMASUKAN
Penjualan Ternak      PEMASUKAN
Pemasukan Lainnya     PEMASUKAN
Pembelian Pakan       PENGELUARAN
Operasional           PENGELUARAN
Pengeluaran Lainnya   PENGELUARAN
```

Boleh seed transaksi sedikit agar dashboard terlihat.

Jangan seed `pengguna` dengan UUID palsu. Profile dibuat setelah Auth user benar-benar ada.

---

# 20. ERROR HANDLING

Pesan manusiawi untuk:

- login gagal,
- akun nonaktif,
- role invalid,
- stock pakan kurang,
- stock telur kurang,
- sortir tidak konsisten,
- populasi negatif,
- kategori keuangan salah tipe,
- delete dependency,
- auto-finance gagal,
- env Supabase belum terisi.

Jangan expose SQL/stack trace.

---

# 21. STRUKTUR FILE

Ikuti repo yang ada. Contoh:

```text
src/
  app/
  components/
  lib/
    supabase/
    auth/
    permissions/
    business/
      metrics.ts
      stock.ts
    demo-accounts.ts
  actions/

supabase/
  migrations/
```

Jangan memindahkan project hanya demi contoh ini.

---

# 22. 4 STAGE IMPLEMENTATION PLAN

## STAGE 1 — Foundation, Database, Auth, Roles

Kerjakan:

- inspect repo,
- Supabase browser/server client,
- session handling Next 16,
- seluruh 22 konsep entitas,
- PK/FK/composite key/check constraint,
- RLS,
- role helper,
- bootstrap demo user,
- derived views dasar,
- login,
- 3 demo tabs,
- route protection,
- app shell,
- desktop sidebar,
- mobile bottom navigation,
- `DEMO_SETUP.md`.

Acceptance:

- schema lengkap,
- semua entitas ada,
- login code siap,
- role-aware shell,
- no Reseller/Kesehatan/Vaksin,
- build/typecheck sehat.

Commit:

```bash
git add .
git commit -m "feat: setup farm tech database auth and roles"
```

**JANGAN PUSH.**

---

## STAGE 2 — Peternakan, Populasi, Pakan

Kerjakan:

- CRUD Kandang,
- CRUD KategoriTernak,
- CRUD Pakan,
- PopulasiTernak,
- detail populasi,
- MutasiPopulasi,
- active population,
- PakanMasuk,
- auto Pengeluaran,
- MixPakan dynamic detail,
- DetailMixPakan,
- PengeluaranPakan,
- stock pakan,
- role restrictions.

Test flow:

```text
PakanMasuk
→ stock bertambah
→ Pengeluaran otomatis

MixPakan
→ bahan berkurang
→ pakan hasil bertambah

PengeluaranPakan
→ stock berkurang

MutasiPopulasi
→ jumlah aktif berubah
```

Commit:

```bash
git add .
git commit -m "feat: implement livestock and feed management"
```

**JANGAN PUSH.**

---

## STAGE 3 — Produksi Telur dan Keuangan

Kerjakan:

- KategoriTelur,
- Panen,
- DetailSortir,
- stock telur,
- DistribusiTelur,
- DetailDistribusi,
- auto Pemasukan,
- KategoriKeuangan,
- TransaksiKeuangan,
- Pemasukan,
- Pengeluaran,
- manual finance sesuai role,
- correction flow.

Test:

```text
Panen
→ Sortir
→ stock kategori bertambah
→ Distribusi
→ stock berkurang
→ Pemasukan otomatis
→ saldo berubah
```

Dan:

```text
PakanMasuk
→ Pengeluaran otomatis
→ saldo berubah
```

Commit:

```bash
git add .
git commit -m "feat: implement egg production and finance workflows"
```

**JANGAN PUSH.**

---

## STAGE 4 — Dashboard, Reports, Filters, QA

Kerjakan:

- dashboard cards,
- HDP/HHP/FCR demo formula,
- trends,
- 7/30/custom period,
- filters,
- financial report,
- export PDF/print,
- responsive QA,
- permission QA,
- loading/empty/error states,
- README,
- build/lint/typecheck yang tersedia.

Role QA:

Admin:
- full.

Pemilik:
- read-only.

ABK:
- operational input,
- no master CRUD,
- no update/delete transaction,
- no full finance.

Commit:

```bash
git add .
git commit -m "feat: add dashboard reports and demo polish"
```

**JANGAN PUSH.**

---

# 23. FINAL ACCEPTANCE CHECKLIST

## Scope

- [ ] Tidak ada Reseller.
- [ ] Tidak ada kesehatan.
- [ ] Tidak ada vaksin.
- [ ] Satu peternakan.

## Pengguna

- [ ] Field login adalah `email`.
- [ ] Tidak ada field username.
- [ ] Password ditangani Supabase Auth.
- [ ] Administrator subclass.
- [ ] Pemilik subclass.
- [ ] ABK subclass.
- [ ] Total + disjoint terjaga.

## Peternakan

- [ ] Kandang.
- [ ] KategoriTernak.
- [ ] PopulasiTernak.
- [ ] MutasiPopulasi weak entity.
- [ ] Active population.

## Pakan

- [ ] Pakan.
- [ ] PakanMasuk.
- [ ] MixPakan.
- [ ] DetailMixPakan weak entity.
- [ ] PengeluaranPakan.
- [ ] Derived stock.
- [ ] PakanMasuk 1:1 Pengeluaran.

## Telur

- [ ] Panen.
- [ ] KategoriTelur.
- [ ] DetailSortir weak entity.
- [ ] DistribusiTelur.
- [ ] DetailDistribusi weak entity.
- [ ] Derived category stock.
- [ ] Distribusi 1:1 Pemasukan.

## Keuangan

- [ ] KategoriKeuangan.
- [ ] TransaksiKeuangan superclass.
- [ ] Pemasukan subclass.
- [ ] Pengeluaran subclass.
- [ ] Derived saldo.
- [ ] Report.
- [ ] PDF.

## Dashboard

- [ ] HDP.
- [ ] HHP.
- [ ] FCR.
- [ ] populasi.
- [ ] panen.
- [ ] stock pakan.
- [ ] saldo.
- [ ] trend.

## Demo

- [ ] 3 login role tabs.
- [ ] autofill credentials.
- [ ] mobile bottom nav.
- [ ] menu Lainnya.
- [ ] role-aware menu.

## Engineering

- [ ] no reinitialize.
- [ ] no deployment.
- [ ] no git push.
- [ ] max 4 stage.
- [ ] commit setiap stage.
- [ ] RLS.
- [ ] atomic workflows.
- [ ] build sukses.
- [ ] no negative stock.
- [ ] no negative population.
- [ ] no plaintext password.

---

# 24. DILARANG MEMPERMUDAH DENGAN MENGUBAH MODEL

Jangan:

- mengganti subclass role menjadi sekadar enum dan menghilangkan tabel subclass,
- menghilangkan weak entity,
- menyimpan weak detail sebagai JSON blob,
- menggabungkan Pemasukan/Pengeluaran menjadi satu enum tanpa subclass,
- membuat tabel stock manual sebagai source of truth,
- membuat Reseller,
- membuat Vaksin,
- membuat Kesehatan,
- membuat Customer entity baru,
- membuat Supplier entity baru,
- membuat multi-farm,
- memberi Pemilik write access,
- memberi ABK full finance,
- mengandalkan hidden button untuk security,
- menyimpan plaintext password,
- melakukan multi-table critical write tanpa transaction safety,
- push,
- deploy.

Tujuan utama adalah menunjukkan bahwa implementasi website benar-benar mencerminkan rancangan konseptual basis data.

---

# 25. FINAL RESPONSE SETELAH CODING

Setelah Stage 4 selesai, jawaban akhir cukup berisi:

1. status Stage 1–4,
2. commit hash + message,
3. migration yang harus dijalankan,
4. langkah manual membuat tiga Supabase Auth demo users,
5. env yang diperlukan,
6. perintah menjalankan lokal,
7. hasil build/typecheck/lint,
8. catatan asumsi demo HDP/HHP/FCR,
9. daftar out-of-scope yang memang tidak dikerjakan,
10. konfirmasi bahwa tidak ada push dan deployment.

Jangan mengklaim berhasil bila belum benar-benar diuji.

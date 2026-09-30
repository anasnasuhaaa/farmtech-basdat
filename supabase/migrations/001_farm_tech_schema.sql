create extension if not exists pgcrypto;

create table public.pengguna (
  id_pengguna uuid primary key references auth.users(id) on delete cascade,
  nama text not null check (length(trim(nama)) > 0),
  email text not null unique,
  status_akun text not null default 'AKTIF' check (status_akun in ('AKTIF','NONAKTIF')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.administrator (id_pengguna uuid primary key references public.pengguna on delete cascade);
create table public.pemilik (id_pengguna uuid primary key references public.pengguna on delete cascade);
create table public.abk (id_pengguna uuid primary key references public.pengguna on delete cascade);

create table public.kandang (
  id_kandang uuid primary key default gen_random_uuid(), nama_kandang text not null unique,
  keterangan text
);
create table public.kategori_ternak (
  id_kategori_ternak uuid primary key default gen_random_uuid(), nama_kategori text not null unique
);
create table public.populasi_ternak (
  id_populasi uuid primary key default gen_random_uuid(),
  id_kandang uuid not null references public.kandang,
  id_kategori_ternak uuid not null references public.kategori_ternak,
  tanggal_masuk date not null, jumlah_awal integer not null check (jumlah_awal > 0),
  usia_masuk integer check (usia_masuk >= 0), ras text, keterangan text,
  created_by uuid not null references public.pengguna, created_at timestamptz not null default now()
);
create table public.mutasi_populasi (
  id_populasi uuid not null references public.populasi_ternak on delete cascade,
  no_mutasi integer not null check (no_mutasi > 0), tanggal date not null,
  jenis_mutasi text not null check (jenis_mutasi in ('KEMATIAN','PENJUALAN','PEMINDAHAN','AFKIR')),
  jumlah integer not null check (jumlah > 0), keterangan text,
  created_by uuid not null references public.pengguna, created_at timestamptz not null default now(),
  primary key (id_populasi,no_mutasi)
);
create table public.pakan (
  id_pakan uuid primary key default gen_random_uuid(), nama_pakan text not null unique,
  jenis_pakan text not null check (jenis_pakan in ('BAHAN_BAKU','PAKAN_JADI','HASIL_CAMPURAN')),
  satuan text not null default 'kg' check (satuan = 'kg')
);
create table public.pakan_masuk (
  id_pakan_masuk uuid primary key default gen_random_uuid(), id_pakan uuid not null references public.pakan,
  tanggal date not null, berat_kg numeric(14,3) not null check (berat_kg > 0),
  harga_total numeric(16,2) not null check (harga_total >= 0), keterangan text,
  created_by uuid not null references public.pengguna, created_at timestamptz not null default now()
);
create table public.mix_pakan (
  id_mix uuid primary key default gen_random_uuid(), tanggal date not null, nama_mix text not null,
  id_pakan_hasil uuid not null references public.pakan,
  total_berat numeric(14,3) not null check (total_berat > 0),
  total_biaya numeric(16,2) not null check (total_biaya >= 0),
  created_by uuid not null references public.pengguna, created_at timestamptz not null default now()
);
create table public.detail_mix_pakan (
  id_mix uuid not null references public.mix_pakan on delete cascade,
  no_detail integer not null check (no_detail > 0), id_pakan_bahan uuid not null references public.pakan,
  berat_bahan numeric(14,3) not null check (berat_bahan > 0), biaya_bahan numeric(16,2) not null check (biaya_bahan >= 0),
  primary key (id_mix,no_detail)
);
create table public.pengeluaran_pakan (
  id_pakan_keluar uuid primary key default gen_random_uuid(), id_pakan uuid not null references public.pakan,
  id_kandang uuid references public.kandang, tanggal date not null,
  jumlah_kg numeric(14,3) not null check (jumlah_kg > 0), tujuan text not null,
  keterangan text, created_by uuid not null references public.pengguna,
  created_at timestamptz not null default now()
);
create table public.panen (
  id_panen uuid primary key default gen_random_uuid(), id_kandang uuid not null references public.kandang,
  tanggal date not null, jumlah_utuh integer not null check (jumlah_utuh >= 0),
  jumlah_retak integer not null check (jumlah_retak >= 0),
  berat_utuh_kg numeric(14,3) not null check (berat_utuh_kg >= 0), keterangan text,
  created_by uuid not null references public.pengguna, created_at timestamptz not null default now()
);
create table public.kategori_telur (
  id_kategori_telur uuid primary key default gen_random_uuid(), nama_kategori text not null unique
);
create table public.detail_sortir (
  id_panen uuid not null references public.panen on delete cascade,
  no_detail integer not null check (no_detail > 0),
  id_kategori_telur uuid not null references public.kategori_telur,
  jumlah_telur integer not null check (jumlah_telur > 0), primary key (id_panen,no_detail)
);
create table public.distribusi_telur (
  id_distribusi uuid primary key default gen_random_uuid(), tanggal date not null,
  tujuan_pembeli text not null, total_harga numeric(16,2) not null check (total_harga >= 0),
  keterangan text, created_by uuid not null references public.pengguna,
  created_at timestamptz not null default now()
);
create table public.detail_distribusi (
  id_distribusi uuid not null references public.distribusi_telur on delete cascade,
  no_detail integer not null check (no_detail > 0),
  id_kategori_telur uuid not null references public.kategori_telur,
  jumlah_telur integer not null check (jumlah_telur > 0),
  harga_satuan numeric(16,2) not null check (harga_satuan >= 0),
  subtotal numeric(16,2) not null check (subtotal >= 0), primary key (id_distribusi,no_detail),
  check (subtotal = jumlah_telur * harga_satuan)
);
create table public.kategori_keuangan (
  id_kategori_keuangan uuid primary key default gen_random_uuid(), nama_kategori text not null unique,
  tipe text not null check (tipe in ('PEMASUKAN','PENGELUARAN'))
);
create table public.transaksi_keuangan (
  id_transaksi uuid primary key default gen_random_uuid(),
  id_kategori_keuangan uuid not null references public.kategori_keuangan,
  tanggal date not null, nominal numeric(16,2) not null check (nominal >= 0),
  keterangan text, created_by uuid not null references public.pengguna,
  created_at timestamptz not null default now()
);
create table public.pemasukan (
  id_transaksi uuid primary key references public.transaksi_keuangan on delete cascade,
  sumber_pemasukan text, id_distribusi uuid unique references public.distribusi_telur
);
create table public.pengeluaran (
  id_transaksi uuid primary key references public.transaksi_keuangan on delete cascade,
  sumber_pengeluaran text, id_pakan_masuk uuid unique references public.pakan_masuk
);

create view public.v_populasi_aktif with (security_invoker = true) as
select p.*, p.jumlah_awal - coalesce(sum(m.jumlah) filter (where m.jenis_mutasi <> 'PEMINDAHAN'),0)::integer as jumlah_aktif
from public.populasi_ternak p left join public.mutasi_populasi m using (id_populasi)
group by p.id_populasi;
create view public.v_stok_pakan with (security_invoker = true) as
select p.*, coalesce((select sum(berat_kg) from public.pakan_masuk x where x.id_pakan=p.id_pakan),0)
 + coalesce((select sum(total_berat) from public.mix_pakan x where x.id_pakan_hasil=p.id_pakan),0)
 - coalesce((select sum(berat_bahan) from public.detail_mix_pakan x where x.id_pakan_bahan=p.id_pakan),0)
 - coalesce((select sum(jumlah_kg) from public.pengeluaran_pakan x where x.id_pakan=p.id_pakan),0) as stok_kg
from public.pakan p;
create view public.v_stok_telur with (security_invoker = true) as
select k.*, coalesce((select sum(jumlah_telur) from public.detail_sortir s where s.id_kategori_telur=k.id_kategori_telur),0)
 - coalesce((select sum(jumlah_telur) from public.detail_distribusi d where d.id_kategori_telur=k.id_kategori_telur),0) as stok_telur
from public.kategori_telur k;

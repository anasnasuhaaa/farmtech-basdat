insert into public.kandang(nama_kandang) values ('Kandang Layer A') on conflict (nama_kandang) do nothing;
insert into public.kategori_ternak(nama_kategori) values ('Ayam Petelur') on conflict (nama_kategori) do nothing;
insert into public.pakan(nama_pakan,jenis_pakan,satuan) values
  ('Jagung','BAHAN_BAKU','kg'),('Dedak','BAHAN_BAKU','kg'),('Konsentrat','BAHAN_BAKU','kg'),
  ('Pakan Layer','PAKAN_JADI','kg'),('Mix Layer','HASIL_CAMPURAN','kg')
on conflict (nama_pakan) do nothing;
insert into public.kategori_telur(nama_kategori) values
  ('Telur Coklat'),('Telur Putih'),('Telur Cacat') on conflict (nama_kategori) do nothing;
insert into public.kategori_keuangan(nama_kategori,tipe) values
  ('Penjualan Telur','PEMASUKAN'),('Penjualan Ternak','PEMASUKAN'),
  ('Pemasukan Lainnya','PEMASUKAN'),('Pembelian Pakan','PENGELUARAN'),
  ('Operasional','PENGELUARAN'),('Pengeluaran Lainnya','PENGELUARAN')
on conflict (nama_kategori) do nothing;

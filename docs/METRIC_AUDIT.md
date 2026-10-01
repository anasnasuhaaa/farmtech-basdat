# Audit metrik produksi

## Definisi yang dipakai

- **HDP harian (proksi):** butir utuh + retak dari kandang petelur / ayam petelur hidup pada tanggal tersebut × 100%. Populasi dihitung per kohort sejak `tanggal_masuk`, dikurangi kematian, penjualan, dan afkir sampai tanggal itu. Mutasi `PEMINDAHAN` tidak mengubah total. Jumlah negatif ditandai sebagai data tidak konsisten dan persentase disembunyikan.
- **HHP harian versi demo:** butir dari kandang petelur pada hari itu / jumlah awal kohort petelur yang telah masuk pada hari itu × 100%. Ini **bukan** HHP kumulatif standar untuk satu siklus bertelur. Hari masuk kohort menjadi awal keterlibatannya dalam penyebut.
- **FCR estimasi harian:** kg pakan *keluar* ke kandang petelur / kg telur **utuh** yang ditimbang pada hari yang sama. Ini proksi, bukan FCR konsumsi pakan terhadap seluruh massa telur. Penyebut nol menghasilkan N/A.
- **Periode:** grafik menampilkan metrik harian. Bila kelak ditambahkan satu angka periode, gunakan jumlah pembilang / jumlah penyebut untuk jendela yang sama; jangan rata-ratakan rasio harian.

## Cakupan dan keterbatasan data

Skema `kategori_ternak` tidak menyimpan flag petelur. Dashboard hanya mengenali kategori seed bernama persis **Ayam Petelur**. Kategori lain tidak diasumsikan bertelur. Kandang yang memiliki kohort kategori campuran dikeluarkan dari produksi terpilih agar tidak mengatribusikan panen spesies lain ke ayam petelur. Perubahan kandang historis belum direkam per tanggal, sehingga perpindahan kohort lama dapat memengaruhi atribusi masa lalu. Pakan keluar tanpa `id_kandang` dikeluarkan; pakan keluar bukan bukti pakan dikonsumsi. Berat telur retak belum ada di skema, jadi tidak diestimasi dengan berat rata-rata. Hari dengan data di luar cakupan atau telur retak ditandai **data parsial**.

Jumlah ternak pada kartu populasi tetap seluruh kategori. HDP dan HHP hanya memakai petelur. Jika kategori petelur lain diperlukan, tambahkan penanda petelur eksplisit melalui perubahan skema yang direncanakan bersama pemilik data. Tidak ada migrasi produksi dalam redesign ini.

## Pemeriksaan

`tests/metrics.test.mjs` menguji 1000/900 = 90% HDP; 1000 awal, 900 hidup, 810 telur = 90% HDP dan 81% HHP harian demo; 120/60 = 2 FCR estimasi; penyebut nol; telur retak dan pakan tanpa kandang; pengecualian broiler; kohort masuk terlambat dan mutasi dalam 30 hari; populasi negatif; tanggal inklusif, masa depan, dan rentang terbalik. Hasil run dicatat dalam laporan akhir pekerjaan.

RPC `create_manual_finance` pada migration 005 telah membandingkan `kategori_keuangan.tipe` dengan `finance_type` dan menolak pasangan yang berbeda. RLS dan hak fungsi tetap dipertahankan.

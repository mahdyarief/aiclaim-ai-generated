# Naskah PDF peraturan

Tujuh berkas di folder ini naskah resmi yang dilayani aplikasi ketika pengguna
menekan "Lihat dokumen" atau mengklik nomor halaman pada sebuah butir. Nomor
halaman di pustaka sama dengan nomor halaman PDF-nya, jadi rujukan dibuka tepat
pada halaman yang dimaksud lewat `#page=N`.

Berkas PDF-nya sendiri tidak ikut ke dalam repositori: ukurannya 70 MB,
dokumennya publik, dan repositori ini hanya untuk kode. Salin dari korpus
regulasi proyek sebelum menjalankan di komputer sendiri atau menerapkan ke
Vercel.

| Berkas di sini             | Asal di korpus regulasi                                  | Halaman |
| -------------------------- | -------------------------------------------------------- | ------- |
| perbpjs-07-2018.pdf        | bpjs/perbpjs-07-2018-pengelolaan-administrasi-klaim.pdf   | 28      |
| permenkes-26-2021.pdf      | permenkes/pmk-26-2021-pedoman-ina-cbg.pdf                 | 56      |
| permenkes-16-2019.pdf      | permenkes/pmk-16-2019-pencegahan-fraud-jkn.pdf            | 48      |
| permenkes-24-2022.pdf      | permenkes/pmk-24-2022-rekam-medis.pdf                     | 19      |
| permenkes-03-2023.pdf      | permenkes/pmk-03-2023-standar-tarif-jkn.pdf               | 720     |
| perpres-82-2018.pdf        | perpres-pp/perpres-82-2018-jaminan-kesehatan.pdf          | 74      |
| permenkes-28-2014.pdf      | permenkes/pmk-28-2014-pedoman-pelaksanaan-jkn.pdf         | 44      |

Permenkes 3/2023 berukuran 55 MB karena 720 halaman lampiran tarif berupa
pindaian. Belum dipadatkan: mesin ini tidak punya ghostscript atau qpdf.

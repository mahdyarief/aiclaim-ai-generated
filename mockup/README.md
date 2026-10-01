# Mockup ValidAI Klaim: cara menjalankan

Berkas utamanya `mockup-validai-klaim.html`. Ia tetap bisa dibuka langsung dengan
klik ganda seperti sebelumnya. Yang baru: kalau dijalankan lewat peladen kecil di
folder ini, layar **Pra-Periksa Saat Input** dan **Cari padanan kode** benar-benar
memanggil DeepSeek, bukan menampilkan teks yang sudah ditulis di dalam berkas.

```bash
cd ~/bpjs-claim-ai-proposal/mockup && node server.mjs
```

Lalu buka <http://localhost:5280>.

Saat peladen menyala, barisnya akan berbunyi:

```
DeepSeek    : siap · model deepseek-chat · kunci dari frontend/.env
```

## Kunci API

Kunci dibaca di sisi peladen, berurutan:

1. peubah lingkungan `DEEPSEEK_API_KEY`
2. `mockup/.env`
3. `frontend/.env`, yang sudah ada sekarang, jadi biasanya tidak perlu apa-apa lagi

Kunci **tidak pernah masuk ke berkas HTML**. Ini disengaja: berkas mockup sering
dikirim lewat surel atau WhatsApp, dan kunci yang tertanam di dalamnya ikut pindah
tangan ke setiap orang yang menerimanya. `server.mjs` juga menolak menyajikan
`.env`, `server.mjs`, dan `api/_pemeriksa.mjs` lewat HTTP.

Untuk memakai kunci sendiri:

```bash
cp mockup/.env.example mockup/.env    # lalu isi DEEPSEEK_API_KEY
```

## Kalau peladen tidak dijalankan

Mockup tetap jalan. Pra-periksa memakai aturan yang tertulis di dalam sistem, dan
pill di kepala kartu temuan menyebutkan hal itu apa adanya, “DeepSeek tidak
terhubung”, beserta cara menyalakannya. Tidak ada layar yang rusak, tidak ada
pesan galat peramban. Ini perilaku yang sama dengan yang dijanjikan proposal
untuk keadaan sebenarnya: kalau pra-periksa mati, SIMRS tetap jalan.

## Apa yang dikirim ke DeepSeek

| Layar | Yang dikirim | Yang diminta kembali |
| --- | --- | --- |
| Pra-Periksa Saat Input | isi kotak yang sedang diketik dokter, ditambah daftar bahan rekam medis milik kasus itu | paling banyak 4 **pertanyaan** untuk dokter |
| Cari padanan kode | kalimat diagnosis yang diketik dokter | daftar kode ICD-10 dan hal yang mungkin masih ditanyakan koder |

Tidak ada data pasien sungguhan di mockup ini, semuanya kasus contoh.

## Pagar yang dijaga di peladen, bukan hanya di petunjuk model

Petunjuk sistem bisa dilanggar model. Karena itu `api/_pemeriksa.mjs` membuang
jawaban yang melanggar, setelah model menjawab:

1. **Sistem hanya bertanya.** Temuan yang berisi kalimat siap sisip atau contoh
   isian dibuang. Yang menulis rekam medis tetap dokter, kalimat yang dikarang
   model akan masuk ke rekam medis pasien atas nama dokter, dan itu tidak boleh
   terjadi (FR-L-03).
2. **Tidak ada uang di layar dokter.** Temuan yang menyebut rupiah, tarif,
   INA-CBG, nilai klaim, atau skor risiko dibuang. Menulis diagnosis karena
   melihat angka termasuk kecurangan menurut Permenkes 16/2019.
3. **Kutipan tidak mungkin dikarang.** Model tidak pernah diminta menuliskan
   kutipan rekam medis. Ia hanya menunjuk id dokumen, dan peladen yang
   menempelkan teks aslinya.
4. **Temuan hanya untuk kolom yang ada.** Temuan yang menunjuk kolom di luar
   formulir dibuang.

## Yang masih model bahasa, dan seharusnya tidak

Daftar kode pada **Cari padanan kode** disusun model. Untuk mockup ini cukup,
untuk sistem sungguhan tidak: model bisa menyebut kode yang tidak ada di ICD-10
Versi Tahun 2010. Pada sistem yang berjalan, daftar itu dibaca dari tabel induk
resmi, dan model hanya dipakai untuk mencocokkan kalimat dokter dengan tabelnya.
Catatan ini juga ditulis terang-terangan di layarnya, supaya tidak ada yang salah
paham saat peragaan.

## Data berkas klaim

Seluruh layar yang menyebut sebuah berkas, Antrean Klaim, Detail Klaim,
Pending & Dispute, Batch Pengajuan, dan daftar indikasi kecurangan, membaca dari
satu objek `KLAIM` di dalam berkas HTML. Klik baris mana pun, dan yang terbuka
memang berkas itu: nama, nomor RM, SEP, episode rawat, temuan, usulan kode,
indikasi kecurangan, dan syarat persetujuannya masing-masing.

Lima belas berkas terisi penuh. Nilai, status, dan sisa hari tidak ditulis dua
kali: tabel antrean dan tabel pending menurunkannya dari `KLAIM`, sehingga tidak
bisa berbeda. Sisa hari pada tiap berkas cocok dengan tanggal pulangnya ditambah
enam bulan (PerBPJS 7/2018 Pasal 24), dengan hari ini dianggap 21 September 2026.

## Yang terpasang di Vercel

Proyek `validai-klaim-mockup` → <https://validai-klaim-mockup.vercel.app>

Dijaga **Basic Auth** lewat `middleware.js`, bukan gerbang login Vercel, supaya
tautannya bisa dibagikan ke klien tanpa mereka perlu punya akun Vercel. Pengguna
dan sandinya ada di Project Settings → Environment Variables (`BASIC_AUTH_USER`,
`BASIC_AUTH_PASS`). Penjagaan ini berlaku untuk halaman **dan** `/api/periksa`.

Middleware-nya sengaja **gagal-tertutup**: kalau kedua peubah itu belum disetel,
semua permintaan ditolak dengan 503. Lebih baik halaman tidak bisa dibuka daripada
terbuka untuk semua orang tanpa disadari.

Untuk mengganti sandi:

```bash
cd mockup
vercel env rm BASIC_AUTH_PASS production --yes
vercel env add BASIC_AUTH_PASS production      # lalu ketik sandi barunya
vercel --prod --yes                            # sandi baru berlaku setelah pasang ulang
```

Memasang ulang setelah mengubah mockup:

```bash
cd mockup && vercel --prod --yes
```

Beberapa hal yang sudah ditemukan dan jangan diulang:

- **Jangan taruh `package.json` di folder ini.** Vercel akan menebaknya sebagai
  aplikasi peladen Node dan mencari berkas entry yang memang tidak ada, lalu
  deploy-nya gagal. Karena itu fungsinya bernama `api/periksa.mjs` (`.mjs` selalu
  modul, jadi `import` tetap jalan tanpa `"type":"module"`), dan `vercel.json`
  menegaskan `"framework": null`.
- **Nilai header HTTP hanya boleh ASCII.** Realm Basic Auth sempat memakai tanda
  pisah panjang; `new Response(...)` melemparkan TypeError, dan seluruh jalur
  penolakan berubah menjadi galat 500.
- **Gerbang bawaan Vercel (`ssoProtection`) harus dimatikan** di setelan proyek,
  kalau tidak ia menjawab lebih dulu dengan 302 ke halaman login Vercel dan
  middleware ini tidak pernah dijalankan.
- `.vercelignore` menahan `server.mjs`, `build/`, dan mockup versi lama supaya
  tidak bisa dibuka orang lewat URL. Modul AI ditaruh di `api/_pemeriksa.mjs`
  karena isi `api/` tidak pernah disajikan sebagai berkas statis.
- Halaman menyusun alamat `/api/periksa` sendiri **tanpa kredensial**. Tautan yang
  dibagikan sering berbentuk `https://pengguna:sandi@alamat/`, dan dalam keadaan
  itu `fetch()` menolak alamat relatif.

## Mode peragaan: penanda mesin disembunyikan

Mockup ini ditunjukkan langsung kepada klien, jadi layarnya tidak menyebut mesin
mana yang memeriksa. Yang disembunyikan (bukan dihapus, semuanya kembali hanya
dengan membuang `style="display:none"`):

| Di mana | Apa |
| --- | --- |
| Kepala kartu temuan pra-periksa | penanda "Diperiksa" dan tombol "Periksa sekarang" |
| Kepala Pra-Periksa Saat Input | saklar "Periksa sambil mengetik" (tetap menyala) |
| Kepala kartu Cari padanan kode | penanda mesin pencarinya |
| Sidebar | menu **Kepatuhan Regulasi**, layar `s-kepatuhan` sendiri masih utuh |

Catatan mesin di dalam kartu temuan juga tidak lagi digambar: tidak ada "Dibaca
DeepSeek", tidak ada pesan galat, tidak ada petunjuk menjalankan `node server.mjs`.
Kalau panggilan AI-nya gagal, layar diam-diam memakai aturan di dalam sistem dan
alasannya hanya ditulis ke konsol peramban (`console.warn`). Keadaan mesin tetap
bisa dibaca dari konsol lewat `ppMesin` dan `dokCariMesin`.

Menu yang disembunyikan didaftar di satu tempat, `MENU_DISEMBUNYIKAN`, dan daftar
hak akses per peran ikut disaring dari situ, supaya pembatasan peran tidak pernah
melemparkan pengguna ke layar yang menunya tidak kelihatan.

Yang **masih** menyebut nama model: komentar di dalam kode sumber, dan badan
jawaban `/api/periksa` (`mesin`, `model`, `token`) yang terlihat di tab Network
peramban. Tidak tampak saat peragaan biasa; sebutkan kalau mau ikut ditutup.

## Gaya tulis: tanpa tanda pisah panjang

Tanda pisah panjang dan elipsis satu karakter dibuang dari seluruh berkas, karena
keduanya dibaca sebagai ciri tulisan mesin. Penggantinya mengikuti perannya:
nilai kosong pada tabel jadi tanda hubung biasa, pemisah label jadi titik tengah,
dan tanda pisah di tengah kalimat jadi koma.

Yang lebih penting: **jawaban DeepSeek juga dibersihkan di peladen**, bukan hanya
diminta lewat petunjuk. Model gemar memakai tanda pisah panjang, dan tanpa
pembersihan itu ia muncul di layar lewat teks temuan. Fungsinya `rapikan()` di
`api/_pemeriksa.mjs`, dipasang pada setiap teks yang keluar ke peramban. Sebutan
peraturan seperti "Permenkes 26/2021, kaidah koding" tetap terbaca wajar karena
pemisah di depan nama peraturan diganti titik dua, bukan koma.

Kalau menambahkan teks baru ke mockup, jangan memakai tanda pisah panjang lagi.
Pemeriksaannya satu perintah:

```bash
grep -c $'\u2014' mockup-validai-klaim.html api/*.mjs server.mjs middleware.js
```

## Siap diperagakan

Yang sudah diperiksa pada berkas yang tayang:

- 12 layar dibuka, 106 tombol diklik, 10 panel formulir dibuka: tidak ada galat.
- Tidak ada kata "mockup", "belum diisi", "prototipe", "DeepSeek", "undefined",
  atau "NaN" yang tampil di layar mana pun, termasuk sesudah AI menjawab.
- Sembilan peran dengan pembatasan menyala: tidak ada yang mendarat di layar
  yang menunya disembunyikan.
- Lima belas berkas klaim dibuka satu per satu; nama dan nomor selalu cocok.
- Pemeriksaan AI memakan 4 detik rata-rata, dengan tombol **Periksa Catatan**
  berubah jadi "Memeriksa catatan..." dan nonaktif selama menunggu.

Tiga tab Laporan (Pola Kesalahan, Arus Klaim, Kedaluwarsa) **disembunyikan**,
bukan diisi: isinya belum pernah dibuat, dan halaman kosong lebih merusak
peragaan daripada tab yang tidak ada. Dua tab yang tersisa lengkap.

Dua keadaan kosong **sengaja dipertahankan** karena memang menggambarkan keadaan
sebenarnya, dan justru jadi bahan pembicaraan: kartu biaya per kasus menunggu
sambungan ke sistem keuangan, dan profil pengelompokan iDRG belum aktif sampai
aturannya resmi. Keduanya berbunyi seperti keputusan, bukan seperti pekerjaan
yang belum selesai.

## Berkas di folder ini

| Berkas | Isi |
| --- | --- |
| `mockup-validai-klaim.html` | mockup itu sendiri; tetap bisa dibuka langsung |
| `server.mjs` | peladen kecil tanpa kebergantungan untuk menjalankan di komputer sendiri |
| `api/_pemeriksa.mjs` | petunjuk untuk DeepSeek, pagar jawaban, dan pemeriksaan cadangan tanpa AI |
| `api/periksa.mjs` | fungsi tanpa peladen di Vercel; memakai penangan yang sama dengan `server.mjs` |
| `middleware.js` | Basic Auth untuk seluruh jalur yang terpasang di Vercel |
| `vercel.json` | rewrite `/` ke berkas mockup, plus header noindex |
| `.env.example` | contoh isian kunci API |

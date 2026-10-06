# ValidAI Klaim

Modul klaim BPJS di dalam ekosistem NusaMedis. Repositori ini berisi kodenya saja.

## Di mana kode, di mana dokumen

Keduanya sengaja dipisah tempat, dan pemisahan itu berlaku seterusnya.

| | Tempat | Isi |
| --- | --- | --- |
| Kode | `~/bpjs-claim-ai-proposal/` di komputer | `mockup/` dan `frontend/`, masing-masing dengan repositorinya sendiri |
| Dokumen | Google Drive, `My Drive/Bisnis/Nusantech Nico/project/Bu Luluk/bpjs-claim-ai-proposal/` | korpus regulasi, `ekosistem/`, `srs/`, `arsitektur/`, `deck/`, proposal klien, notulen rapat, `README-PROYEK.md` |

**Pembaruan dokumen selalu dikerjakan di Drive, bukan di folder komputer.** Alasannya
dua. Dokumen perlu cadangan dan perlu bisa dibagikan, dan itu yang diberikan Drive.
Kode tidak perlu Drive karena cadangannya sudah dipegang git, sementara `node_modules`
dan `.git` justru menyusahkan sinkronisasi Drive: puluhan ribu berkas kecil yang
berubah setiap kali dibangun.

Karena itu `node_modules` tidak ikut disalin ke Drive. Kalau `deck/` perlu dibangun
ulang, jalankan `npm install` di salinan lokal, bukan di dalam folder Drive.

## Isi

| Folder | Apa |
| --- | --- |
| `mockup/` | Mockup ValidAI Klaim: satu berkas HTML mandiri, peladen kecil, dan sambungan ke DeepSeek |

Penjelasan rinci ada di `mockup/README.md`.

Prototipe frontend NusaMedis (Vite, React, TypeScript) **tidak ada di sini**. Ia punya
repositori sendiri supaya tidak ada dua salinan yang bisa saling menyimpang:
<https://code.nusantech.com/nusamedis/nusamedis-ai-generated>

## Menjalankan mockup

```bash
cd mockup && node server.mjs
```

Buka <http://localhost:5280>. Tanpa Node pun berkas `mockup/mockup-validai-klaim.html`
tetap bisa dibuka langsung; yang tidak jalan hanya pemeriksaan dengan AI.

## Kunci API

Tidak ada kunci di dalam repositori ini, dan `.gitignore` menahan setiap berkas
`.env`. Untuk menjalankan pemeriksaan AI, salin contohnya lalu isi sendiri:

```bash
cp mockup/.env.example mockup/.env        # isi DEEPSEEK_API_KEY
```

Kunci dibaca hanya di sisi peladen dan tidak pernah ikut ke peramban.

## Yang terpasang

| Alamat | Isi |
| --- | --- |
| <https://validai.nusantech.com> | mockup, dijaga Basic Auth |
| <https://validai.ujiaplikasi.com> | alamat kedua untuk mockup yang sama |

Keduanya memakai proyek Vercel `validai-klaim-mockup`. Cara memasang ulang dan
daftar jebakan yang sudah pernah kena ada di `mockup/README.md`.

## Catatan gaya tulis

Tidak memakai tanda pisah panjang maupun elipsis satu karakter, termasuk pada
teks yang dihasilkan model. Pemeriksaannya:

```bash
grep -rc $'\u2014' mockup/mockup-validai-klaim.html mockup/api/*.mjs
```

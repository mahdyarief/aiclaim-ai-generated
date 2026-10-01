# ValidAI Klaim

Modul klaim BPJS di dalam ekosistem NusaMedis. Repositori ini berisi kodenya saja.
Korpus regulasi, deck, proposal klien, dan notulen rapat tidak dikirim ke sini;
semuanya tetap di folder proyek dan diuraikan pada `README-PROYEK.md` di komputer
masing-masing.

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

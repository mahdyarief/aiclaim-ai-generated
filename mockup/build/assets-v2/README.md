# ValidAI Klaim: paket aset web v2

Paket lengkap untuk implementasi web, diperbarui 6 Oktober 2026. Memuat aset dasar ValidAI dan tambahan untuk tiga halaman Pustaka Aturan.

## Isi

- branding/: logo SVG dan PNG transparan, app mark, favicon, app icon.
- icons/: 79 ikon SVG Lucide untuk navigasi, aksi, dan status.
- icons-png/24/ dan icons-png/48/: seluruh ikon PNG transparan berwarna navy.
- icons-png/sidebar-24/ dan icons-png/sidebar-48/: ikon navigasi berwarna biru muda.
- avatars/: avatar SVG dan PNG transparan. Avatar Dina mengikuti bilah atas terbaru.
- references/mockups/: 10 mockup PNG, termasuk 3 halaman Pustaka Aturan terbaru.
- tokens/: palet terbaru dan CSS variables.
- menu-icon-mapping.json: pemetaan lengkap 14 menu sidebar.
- icon-manifest.json: nama ikon dan komponen sumber Lucide.
- LUCIDE-LICENSE.txt: lisensi ikon.

## Penggunaan

SVG ikon memakai stroke="currentColor". Inline SVG mengikuti warna CSS komponen. Jika menggunakan tag img, warna CSS induk tidak diteruskan ke isi SVG; gunakan PNG berwarna yang disediakan atau inline SVG.

PNG tersedia pada 24 px dan 48 px untuk penggunaan 1x dan 2x. Semua gambar ikon dan logo memiliki latar transparan.

Font yang disarankan Inter, dengan fallback Arial/sans-serif. File font tidak disertakan.

Logo direkonstruksi sebagai vektor dari konsep mockup, bukan hasil ekstraksi piksel persis. Ikon Lucide dipetakan sebagai padanan implementasi dari ikon pada mockup.

Tabel, kartu, badge, tombol, sakelar, grafik, dan watermark CONTOH dibuat sebagai komponen HTML/CSS agar responsif; tidak diekspor sebagai gambar terpisah. Tidak ada ilustrasi dekoratif lain pada tiga halaman Pustaka Aturan.

Tujuh mockup awal disertakan sebagai referensi historis. Tiga mockup bernomor 08 sampai 10 memakai sidebar dan palet terbaru; gunakan tokens/ sebagai acuan implementasi terbaru.

Semua dokumen dan pasien pada mockup merupakan data contoh. Isi dokumen rekaan bukan kebijakan resmi.

/** Penjaga akses untuk seluruh isi yang terpasang di Vercel, halaman mockup
 *  maupun /api/periksa. Dipasang karena dua hal:
 *
 *  1. /api/periksa memakai kunci DeepSeek milik kami. Kalau tautannya terbuka,
 *     siapa pun yang mendapatkannya ikut memakai kunci itu.
 *  2. Isinya materi penawaran untuk satu rumah sakit, bukan bahan umum.
 *
 *  Sengaja gagal-tertutup: bila BASIC_AUTH_USER atau BASIC_AUTH_PASS belum
 *  disetel di Vercel, semua permintaan ditolak. Lebih baik halaman tidak bisa
 *  dibuka daripada terbuka untuk semua orang tanpa disadari.
 */

export const config = {
  /* Semua jalur, kecuali berkas internal Vercel. */
  matcher: "/((?!_vercel|_next/static).*)",
};

/** Membandingkan tanpa membocorkan panjang kecocokan lewat waktu jawab. */
function samaAman(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  let beda = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    beda |= a.charCodeAt(i % a.length || 0) ^ b.charCodeAt(i % b.length || 0);
  }
  return beda === 0;
}

const TOLAK = (pesan, status = 401) =>
  new Response(pesan, {
    status,
    headers: {
      /* Nilai header HTTP hanya boleh ASCII. Tanda pisah panjang di sini membuat
         Response gagal dibuat dan seluruh jalur penolakan berubah jadi galat 500,
         jadi realm-nya sengaja ditulis polos. */
      ...(status === 401
        ? { "WWW-Authenticate": 'Basic realm="ValidAI Klaim mockup", charset="UTF-8"' }
        : {}),
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });

export default function middleware(req) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  if (!user || !pass) {
    return TOLAK(
      "Halaman ini belum dibuka.\n\n" +
        "BASIC_AUTH_USER dan BASIC_AUTH_PASS belum disetel di Vercel, jadi tidak ada\n" +
        "yang bisa masuk. Setel keduanya di Project Settings → Environment Variables,\n" +
        "lalu pasang ulang.",
      503
    );
  }

  const kepala = req.headers.get("authorization") || "";
  const [skema, nilai] = kepala.split(" ");
  if (skema === "Basic" && nilai) {
    let isi = "";
    try {
      isi = atob(nilai);
    } catch {
      /* bukan base64 yang sah, diperlakukan sebagai gagal */
    }
    const pemisah = isi.indexOf(":");
    if (pemisah > 0) {
      const u = isi.slice(0, pemisah);
      const p = isi.slice(pemisah + 1);
      /* Keduanya selalu dihitung, supaya waktu jawabnya tidak memberi tahu
         mana yang salah. */
      const okU = samaAman(u, user);
      const okP = samaAman(p, pass);
      if (okU && okP) return;
    }
  }

  return TOLAK("Perlu masuk untuk membuka mockup ValidAI Klaim.");
}

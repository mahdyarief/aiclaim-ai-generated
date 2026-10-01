/** Pemeriksa untuk mockup ValidAI Klaim, dipanggil server.mjs.
 *  Kunci API hanya dibaca di sini dan di server.mjs; tidak pernah dikirim ke peramban.
 *
 *  Beda penting dengan frontend/api/_pemeriksa.js: di layar pra-periksa mockup,
 *  sistem HANYA BOLEH BERTANYA. Tidak ada kalimat siap sisip, tidak ada teks
 *  diagnosis, tidak ada angka klinis karangan (FR-L-03). Kutipan rekam medis
 *  tidak diminta dari model, model hanya menunjuk id dokumen, dan peladen yang
 *  menempelkan teks aslinya. Dengan begitu kutipan tidak mungkin dikarang.
 */

const DEEPSEEK = "https://api.deepseek.com/chat/completions";

/* ═══════════════════ pra-periksa saat input ═══════════════════ */

const SISTEM_PRA = `Anda membantu dokter melengkapi catatan medis SAAT SEDANG DITULIS, di dalam formulir resume medis rumah sakit di Indonesia.

Tujuan Anda: catatan yang lengkap dan jelas, supaya pasien terlayani dengan baik dan berkasnya tidak perlu dikembalikan ke dokter berminggu-minggu kemudian.

Dasar yang dipakai:
- Permenkes 24/2022: rekam medis elektronik; resume medis wajib memuat indikasi rawat, perjalanan penyakit, hasil penting, dan kondisi saat pulang.
- Permenkes 26/2021: kaidah koding; diagnosis ditulis sespesifik yang didukung catatan klinis. Koding memakai ICD-10 dan ICD-9-CM Versi Tahun 2010.
- Permenkes 16/2019: pencegahan kecurangan.

ATURAN YANG TIDAK BOLEH DILANGGAR:
1. ANDA HANYA BERTANYA. Jangan pernah menuliskan kalimat siap pakai, usulan teks, contoh isian, atau teks diagnosis untuk disisipkan ke kolom. Dokter yang menulis, dengan kata-katanya sendiri. Kalimat yang Anda karang akan masuk ke rekam medis pasien atas nama dokter, itu tidak boleh terjadi.
2. Jangan pernah menyebut rupiah, tarif, nilai klaim, kelompok INA-CBG, skor risiko, atau dampak keuangan apa pun. Pembacanya dokter. Menyebut uang mengubah bantuan dokumentasi menjadi dorongan menaikkan kode, dan itu dilarang Permenkes 16/2019.
3. Jangan mengarang angka, hasil pemeriksaan, tanda vital, atau temuan klinis. Bila datanya tidak ada di bahan yang diberikan, katakan datanya belum ada.
4. Jangan menyarankan menambah diagnosis yang tidak punya dasar di catatan.
5. Kalau sebuah kolom sudah cukup, jangan dipersoalkan. Dokter sedang sibuk; peringatan berlebihan membuat semuanya diabaikan.
6. Paling banyak 4 temuan. Pilih yang paling berarti.
7. Nada bicara: sejawat yang membantu, bukan pemeriksa. Singkat, bahasa Indonesia yang wajar.

Jawab HANYA dalam JSON:
{
  "ringkas": "satu kalimat kesimpulan",
  "temuan": [
    {
      "bidang": "kunci kolom yang dipersoalkan, HARUS salah satu kunci yang diberikan",
      "berat": "dang" | "warn",
      "judul": "judul singkat, maksimal 9 kata, tanpa titik di akhir",
      "isi": "kenapa ini perlu dilengkapi dan apa akibatnya bila tidak, maksimal 2 kalimat",
      "tanya": "pertanyaan terbuka kepada dokter. Wajib berbentuk pertanyaan. Boleh menutup dengan menyebut bahwa membiarkan apa adanya juga jawaban yang sah, bila memang begitu.",
      "aturan": "dasar aturannya, sebut nomor peraturan atau kode aturan rumah sakit",
      "dokumen": ["id dokumen dari daftar BAHAN yang relevan sebagai bukti, boleh kosong"]
    }
  ]
}

"dang" untuk kolom wajib yang kosong atau yang pasti membuat berkas tertahan. "warn" untuk yang sebaiknya diperjelas.
Bidang "dokumen" hanya berisi id, jangan menuliskan isi dokumennya, peladen yang menempelkan kutipannya.`;

function ringkasInput(m) {
  const k = m.konteks ?? {};
  const bahan = m.dokumen ?? [];
  return [
    `Pasien: ${k.pasien ?? ", "}, ${k.umur ?? ", "} tahun, ${k.jk === "L" ? "laki-laki" : "perempuan"}`,
    `Jenis pelayanan: ${k.layanan ?? ", "}`,
    `Masuk: ${k.masuk ?? ", "}${k.rencana ? ` · ${k.rencana}` : ""}`,
    "",
    "BAHAN YANG SUDAH ADA DI REKAM MEDIS (id → sumber → isi). Pakai ini untuk menilai, dan sebut id-nya bila relevan:",
    ...(bahan.length
      ? bahan.map((d) => `- ${d.id} → ${d.sumber} → ${d.teks}`)
      : ["- tidak ada bahan penunjang yang terbaca"]),
    "",
    "KOLOM YANG SEDANG DIISI DOKTER (kunci → label → wajib? → isi sekarang):",
    ...(m.isian ?? []).map(
      (i) => `- ${i.k} → ${i.label} → ${i.wajib ? "wajib" : "tidak wajib"} → ${i.nilai?.trim() ? i.nilai : "(MASIH KOSONG)"}`
    ),
  ].join("\n");
}

/** Pemeriksaan cadangan tanpa AI, dipakai bila kunci belum disetel atau DeepSeek gagal.
 *  Aturannya sedikit dan sederhana; memang begitu, supaya tidak berpura-pura pintar. */
export function praPeriksaLokal(m) {
  const isian = m.isian ?? [];
  const temuan = [];

  for (const i of isian) {
    if (i.wajib && !i.nilai?.trim()) {
      temuan.push({
        bidang: i.k,
        berat: "dang",
        judul: `${i.label} belum tertulis`,
        isi: `Kolom "${i.label}" masih kosong, padahal termasuk isi wajib resume medis.`,
        tanya: `Apa yang perlu dicatat pada bagian ${i.label.toLowerCase()} untuk pasien ini? Tuliskan dengan kata-kata Anda sendiri.`,
        aturan: "Permenkes 24/2022: kelengkapan resume medis",
        kutip: [],
      });
    }
  }

  if (temuan.length === 0) {
    temuan.push({
      bidang: isian[0]?.k ?? "utama",
      berat: "warn",
      judul: "Tidak ada kolom wajib yang kosong",
      isi: "Pemeriksaan cadangan hanya memeriksa kolom wajib yang masih kosong. Ketepatan isinya belum ditelaah.",
      tanya: "Apakah masih ada hal penting pada pasien ini yang belum tertulis di catatan?",
      aturan: "Pemeriksaan kelengkapan dasar",
      kutip: [],
    });
  }

  return {
    mesin: "lokal",
    ringkas: "",
    temuan: temuan.slice(0, 4),
  };
}

/* ═══════════════════ padanan kode untuk layar dokter ═══════════════════ */

const SISTEM_KODE = `Anda membantu dokter di Indonesia memeriksa sendiri padanan kode diagnosis dari kalimat yang ia tulis. Ini fasilitas MELIHAT saja, penetapan kode tetap dikerjakan koder bersertifikat.

Dasar: Permenkes 26/2021 mewajibkan ICD-10 dan ICD-9-CM Versi Tahun 2010. Kode dari edisi yang lebih baru ditolak aplikasi E-Klaim.

ATURAN YANG TIDAK BOLEH DILANGGAR:
1. Jangan pernah menyebut rupiah, tarif, nilai klaim, kelompok INA-CBG, atau dampak keuangan. Kode yang lebih khusus tidak berarti nilainya lebih besar, dan dokter tidak boleh memilih diagnosis karena angka.
2. Cantumkan hanya kode yang Anda benar-benar yakini ada di ICD-10 Versi 2010. Bila ragu pada sebuah kode, jangan dicantumkan. Lebih baik sedikit dan benar.
3. Jangan mengarang temuan klinis dan jangan menyarankan diagnosis yang tidak ada dasarnya pada kalimat dokter.
4. Paling banyak 5 kode.

Jawab HANYA dalam JSON:
{
  "tingkat": 1 | 2 | 3,
  "ket": "satu kalimat: seberapa khusus kalimat dokter tadi, dan apa yang masih bisa ditanyakan koder",
  "pertanyaan": ["hal yang belum jelas dari kalimat itu, berbentuk pertanyaan, paling banyak 3"],
  "kode": [
    { "kode": "kode ICD-10", "nama": "nama kode dalam bahasa Indonesia atau Inggris sesuai ICD", "khusus": "umum" | "sedang" | "khusus", "catatan": "kapan kode ini dipakai, maksimal 12 kata" }
  ]
}

"tingkat" 1 = masih umum, koder hampir pasti bertanya. 2 = sudah lebih jelas, satu hal mungkin ditanyakan. 3 = sudah khusus, koder bisa langsung mengodekan.`;

/** Cadangan tanpa AI untuk pencarian padanan kode. */
export function kodeLokal(m) {
  return {
    mesin: "lokal",
    tingkat: 1,
    ket: "Pencarian dengan AI tidak tersedia, jadi daftar ini tidak disaring menurut kalimat Anda.",
    pertanyaan: [],
    kode: [],
  };
}

/* ═══════════════════ pemanggilan DeepSeek ═══════════════════ */

/** Mengambil JSON dari jawaban yang mungkin dibungkus prosa atau pagar kode.
 *  Diperlukan untuk model penalaran, yang tidak menerima response_format. */
function ambilJson(teks) {
  try {
    return JSON.parse(teks);
  } catch {
    /* lanjut mencari */
  }
  const pagar = teks.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (pagar) {
    try {
      return JSON.parse(pagar[1]);
    } catch {
      /* lanjut mencari */
    }
  }
  const awal = teks.indexOf("{");
  const akhir = teks.lastIndexOf("}");
  if (awal !== -1 && akhir > awal) {
    try {
      return JSON.parse(teks.slice(awal, akhir + 1));
    } catch {
      /* menyerah */
    }
  }
  return null;
}

async function panggil({ sistem, pengguna, kunci, model, maxTokens, suhu, signal }) {
  /* Model penalaran tidak menerima response_format maupun temperature, dan memakai
     sebagian anggaran token untuk berpikir sebelum menjawab. */
  const penalaran = /reason/i.test(model);

  const r = await fetch(DEEPSEEK, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${kunci}` },
    body: JSON.stringify({
      model,
      max_tokens: penalaran ? maxTokens * 5 : maxTokens,
      ...(penalaran ? {} : { temperature: suhu, response_format: { type: "json_object" } }),
      messages: [
        { role: "system", content: sistem },
        { role: "user", content: pengguna + (penalaran ? "\n\nJawab hanya dengan objek JSON, tanpa kalimat pembuka atau penutup." : "") },
      ],
    }),
    signal,
  });

  if (!r.ok) {
    const teks = await r.text().catch(() => "");
    throw new Error(`DeepSeek menjawab ${r.status}${teks ? `: ${teks.slice(0, 300)}` : ""}`);
  }

  const data = await r.json();
  const pilihan = data?.choices?.[0];
  const isi = pilihan?.message?.content;
  if (pilihan?.finish_reason === "length" && !isi) {
    throw new Error("Jawaban terpotong sebelum keluar, anggaran token habis dipakai berpikir. Naikkan max_tokens atau pakai model tanpa penalaran.");
  }
  if (!isi) throw new Error("DeepSeek tidak mengembalikan isi jawaban");

  const hasil = ambilJson(isi);
  if (!hasil) throw new Error("Jawaban DeepSeek bukan JSON yang sah");
  return { hasil, model: data?.model ?? model, token: data?.usage?.total_tokens ?? null };
}

/* Model gemar memakai tanda pisah panjang dan elipsis satu karakter. Keduanya
   menandakan tulisan mesin, dan layar ini ditunjukkan kepada orang, jadi gaya itu
   dirapikan di peladen. Dilakukan di sini, bukan lewat petunjuk sistem, karena
   petunjuk soal gaya tulis paling sering diabaikan model.

   Tanda pisah panjang punya dua peran, dan keduanya diganti berbeda:
   pemisah label (“Permenkes 26/2021: kaidah koding”) jadi titik dua, dan
   tanda pisah di tengah kalimat jadi koma. */
function rapikan(teks) {
  if (typeof teks !== "string") return teks;
  return teks
    /* "Permenkes 26/2021: kaidah koding" menjadi "Permenkes 26/2021: kaidah koding" */
    .replace(/((?:Permenkes|PerBPJS|Perpres|Permenpan|KMK|UU|PP|BR)[^\u2014]{0,40}?)\s*\u2014\s*/g, "$1: ")
    /* sisanya: tanda pisah di tengah kalimat menjadi koma */
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/\u2026/g, "...")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/:\s*,/g, ":")
    .trim();
}

/* Penjagaan terakhir di sisi peladen. Tidak cukup mengandalkan petunjuk sistem:
   temuan yang menyebut uang atau yang berisi kalimat siap sisip dibuang di sini. */
const MENYEBUT_UANG = /\brp\b|rupiah|tarif|ina-?cbg|nilai klaim|biaya|skor risiko/i;
const KALIMAT_SISIP = /tulis(kan)? (saja )?(begini|berikut|kalimat)|contoh (kalimat|isian|penulisan)|isikan[:,]|usulan kalimat|salin kalimat|kalimat berikut|misalnya[:,] ["“]/i;

export async function periksaPraInput(m, kunci, { model = "deepseek-chat", signal } = {}) {
  const kunciBidang = new Set((m.isian ?? []).map((i) => i.k));
  const petaDok = new Map((m.dokumen ?? []).map((d) => [String(d.id), d]));

  const { hasil, model: dipakai, token } = await panggil({
    sistem: SISTEM_PRA,
    pengguna: ringkasInput(m),
    kunci,
    model,
    maxTokens: 1800,
    suhu: 0.3,
    signal,
  });

  const temuan = (Array.isArray(hasil.temuan) ? hasil.temuan : [])
    .filter((t) => t && typeof t.judul === "string" && kunciBidang.has(t.bidang))
    .filter((t) => !MENYEBUT_UANG.test(`${t.judul} ${t.isi} ${t.tanya}`))
    .filter((t) => !KALIMAT_SISIP.test(`${t.isi} ${t.tanya}`))
    .slice(0, 4)
    .map((t) => ({
      bidang: String(t.bidang),
      berat: t.berat === "dang" ? "dang" : "warn",
      judul: rapikan(String(t.judul)).replace(/\.$/, ""),
      isi: rapikan(String(t.isi ?? "")),
      tanya: rapikan(String(t.tanya ?? "")),
      aturan: rapikan(String(t.aturan ?? "-")),
      /* Kutipan diambil dari bahan yang dikirim peramban, bukan dari jawaban model.
         Model hanya menunjuk id; teksnya tetap teks asli rekam medis. */
      kutip: (Array.isArray(t.dokumen) ? t.dokumen : [])
        .map((id) => petaDok.get(String(id)))
        .filter(Boolean)
        .map((d) => [d.sumber, d.teks]),
    }));

  return {
    mesin: "deepseek",
    model: dipakai,
    token,
    ringkas: typeof hasil.ringkas === "string" ? rapikan(hasil.ringkas) : "",
    temuan,
  };
}

export async function cariKode(m, kunci, { model = "deepseek-chat", signal } = {}) {
  const teks = String(m.teks ?? "").trim();
  const k = m.konteks ?? {};
  const { hasil, model: dipakai, token } = await panggil({
    sistem: SISTEM_KODE,
    pengguna: [
      `Kalimat diagnosis yang ditulis dokter: "${teks}"`,
      k.layanan ? `Jenis pelayanan: ${k.layanan}` : "",
      k.umur ? `Pasien ${k.umur} tahun, ${k.jk === "L" ? "laki-laki" : "perempuan"}` : "",
      m.penunjang?.length ? `Hasil penunjang yang sudah ada:\n${m.penunjang.map((x) => `- ${x}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    kunci,
    model,
    maxTokens: 1200,
    suhu: 0.2,
    signal,
  });

  const bersih = (s) => rapikan(String(s ?? "").replace(/\s+/g, " "));
  return {
    mesin: "deepseek",
    model: dipakai,
    token,
    tingkat: [1, 2, 3].includes(hasil.tingkat) ? hasil.tingkat : 1,
    ket: MENYEBUT_UANG.test(String(hasil.ket ?? "")) ? "" : bersih(hasil.ket),
    pertanyaan: (Array.isArray(hasil.pertanyaan) ? hasil.pertanyaan : [])
      .filter((q) => typeof q === "string" && !MENYEBUT_UANG.test(q))
      .slice(0, 3)
      .map(bersih),
    kode: (Array.isArray(hasil.kode) ? hasil.kode : [])
      .filter((c) => c && typeof c.kode === "string")
      .filter((c) => !MENYEBUT_UANG.test(`${c.nama} ${c.catatan}`))
      .slice(0, 5)
      .map((c) => ({
        kode: bersih(c.kode).toUpperCase(),
        nama: bersih(c.nama),
        khusus: ["umum", "sedang", "khusus"].includes(c.khusus) ? c.khusus : "sedang",
        catatan: bersih(c.catatan),
      })),
  };
}

/* ═══════════════════ penangan bersama ═══════════════════ */

export async function tangani(kiriman, env) {
  const model = env.DEEPSEEK_MODEL || "deepseek-chat";
  const kunci = env.DEEPSEEK_API_KEY;
  const jenis = kiriman?.jenis;

  if (jenis === "pra-periksa") {
    if (!Array.isArray(kiriman.isian) || kiriman.isian.length === 0) {
      return { status: 400, body: { galat: "Isian formulir tidak dikirim." } };
    }
    if (!kunci) {
      return {
        status: 200,
        body: {
          ...praPeriksaLokal(kiriman),
          catatanMesin: "DEEPSEEK_API_KEY belum disetel, jadi catatan diperiksa dengan aturan sederhana di dalam sistem.",
        },
      };
    }
    try {
      return { status: 200, body: await periksaPraInput(kiriman, kunci, { model }) };
    } catch (e) {
      return {
        status: 200,
        body: {
          ...praPeriksaLokal(kiriman),
          catatanMesin: `Pemeriksaan dengan DeepSeek gagal, dialihkan ke aturan sederhana. ${e.message}`,
        },
      };
    }
  }

  if (jenis === "padanan-kode") {
    if (!String(kiriman.teks ?? "").trim()) {
      return { status: 400, body: { galat: "Kalimat diagnosis tidak dikirim." } };
    }
    if (!kunci) {
      return {
        status: 200,
        body: { ...kodeLokal(kiriman), catatanMesin: "DEEPSEEK_API_KEY belum disetel." },
      };
    }
    try {
      return { status: 200, body: await cariKode(kiriman, kunci, { model }) };
    } catch (e) {
      return {
        status: 200,
        body: { ...kodeLokal(kiriman), catatanMesin: `Pencarian dengan DeepSeek gagal. ${e.message}` },
      };
    }
  }

  return { status: 400, body: { galat: `Jenis permintaan tidak dikenal: ${jenis ?? "(kosong)"}` } };
}

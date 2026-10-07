#!/usr/bin/env node
/** Peladen kecil untuk mockup ValidAI Klaim. Tanpa kebergantungan, cukup Node 18+.
 *
 *  Gunanya satu: menyimpan kunci API DeepSeek di sisi peladen. Berkas HTML mockup
 *  sering dikirim ke orang lain; kalau kunci ditaruh di dalamnya, siapa pun yang
 *  menerima berkas itu ikut memegang kunci Anda. Jadi peramban memanggil
 *  /api/periksa di sini, dan hanya proses ini yang membaca kuncinya.
 *
 *  Jalankan:  node server.mjs        →  http://localhost:5280
 *  Kunci dibaca dari, berurutan: peubah lingkungan, mockup/.env, frontend/.env
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { tangani } from "./api/_pemeriksa.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5280);
const HALAMAN = "mockup-validai-klaim.html";

/* ---------- membaca .env sederhana (tanpa paket tambahan) ---------- */
function muatEnv() {
  const env = { ...process.env };
  const calon = [path.join(DIR, ".env"), path.join(DIR, "..", "frontend", ".env")];
  for (const berkas of calon) {
    if (!existsSync(berkas)) continue;
    for (const baris of readFileSync(berkas, "utf8").split("\n")) {
      const b = baris.trim();
      if (!b || b.startsWith("#")) continue;
      const i = b.indexOf("=");
      if (i < 1) continue;
      const k = b.slice(0, i).trim();
      const v = b.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      /* peubah lingkungan menang atas isi berkas; berkas pertama menang atas berkas kedua */
      if (!env[k]) env[k] = v;
    }
    if (env.DEEPSEEK_API_KEY) {
      env.__sumberKunci = path.relative(path.join(DIR, ".."), berkas);
      break;
    }
  }
  if (process.env.DEEPSEEK_API_KEY) env.__sumberKunci = "peubah lingkungan";
  return env;
}
const ENV = muatEnv();

const JENIS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function kirimJson(res, status, isi) {
  const b = Buffer.from(JSON.stringify(isi));
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": b.length });
  res.end(b);
}

async function bacaBadan(req, batas = 512 * 1024) {
  const potongan = [];
  let n = 0;
  for await (const p of req) {
    n += p.length;
    if (n > batas) throw new Error("Kiriman terlalu besar.");
    potongan.push(p);
  }
  return Buffer.concat(potongan).toString("utf8");
}

const peladen = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  /* ---------- API ---------- */
  if (url.pathname === "/api/periksa") {
    if (req.method !== "POST") return kirimJson(res, 405, { galat: "Hanya menerima POST." });
    let kiriman = {};
    try {
      kiriman = JSON.parse((await bacaBadan(req)) || "{}");
    } catch (e) {
      return kirimJson(res, 400, { galat: `Kiriman bukan JSON yang sah. ${e.message}` });
    }
    try {
      const { status, body } = await tangani(kiriman, ENV);
      return kirimJson(res, status, body);
    } catch (e) {
      console.error("[api/periksa]", e);
      return kirimJson(res, 500, { galat: e.message });
    }
  }

  if (url.pathname === "/api/status") {
    return kirimJson(res, 200, {
      siap: Boolean(ENV.DEEPSEEK_API_KEY),
      model: ENV.DEEPSEEK_MODEL || "deepseek-chat",
      sumberKunci: ENV.DEEPSEEK_API_KEY ? ENV.__sumberKunci || "tidak diketahui" : null,
    });
  }

  /* ---------- berkas statis ---------- */
  let nama = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (nama === "" || nama === "index.html") nama = HALAMAN;
  /* Jangan pernah menyajikan kunci maupun kode peladen. Isi folder api/ ikut
     ditutup: di Vercel folder itu memang tidak pernah disajikan sebagai berkas,
     dan di sini disamakan supaya tidak ada beda perilaku. */
  if (/(^|\/)\.env|^api\/|server\.mjs$|\.mjs$/.test(nama)) {
    res.writeHead(403).end("403");
    return;
  }
  const berkas = path.join(DIR, nama);
  if (!berkas.startsWith(DIR + path.sep)) {
    res.writeHead(403).end("403");
    return;
  }
  try {
    const isi = await readFile(berkas);
    res.writeHead(200, {
      "content-type": JENIS[path.extname(berkas).toLowerCase()] || "application/octet-stream",
      "content-length": isi.length,
      "cache-control": "no-store",
    });
    res.end(isi);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("404, berkas tidak ditemukan");
  }
});

peladen.listen(PORT, () => {
  console.log(`\n  ValidAI Klaim, mockup\n  ${"─".repeat(46)}`);
  console.log(`  Buka        : http://localhost:${PORT}`);
  console.log(
    ENV.DEEPSEEK_API_KEY
      ? `  DeepSeek    : siap · model ${ENV.DEEPSEEK_MODEL || "deepseek-chat"} · kunci dari ${ENV.__sumberKunci}`
      : `  DeepSeek    : BELUM SIAP, setel DEEPSEEK_API_KEY di mockup/.env,\n                atau jalankan: DEEPSEEK_API_KEY=sk-... node server.mjs\n                (sementara ini pra-periksa memakai aturan sederhana di dalam sistem)`
  );
  console.log(`  Berhenti    : Ctrl+C\n`);
});

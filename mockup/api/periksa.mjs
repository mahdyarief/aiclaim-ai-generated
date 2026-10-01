import { tangani } from "./_pemeriksa.mjs";

/** Fungsi tanpa peladen (Vercel). Penangannya sama persis dengan yang dipakai
 *  server.mjs saat dijalankan di komputer sendiri, jadi perilakunya tidak
 *  berbeda antara peragaan lokal dan yang terpasang.
 *
 *  Kunci API dibaca dari peubah lingkungan di sisi peladen dan tidak pernah
 *  dikirim ke peramban. Akses ke berkas ini dijaga middleware.js. */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ galat: "Hanya menerima POST." });
    return;
  }
  const kiriman = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  try {
    const { status, body } = await tangani(kiriman, process.env);
    res.status(status).json(body);
  } catch (e) {
    console.error("[api/periksa]", e);
    res.status(500).json({ galat: e.message });
  }
}

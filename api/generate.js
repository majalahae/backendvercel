import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Access-Control-Allow-Origin", "*"); // penting untuk POST

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!resp.ok) return res.status(400).json({ error: "Gagal mengambil halaman berita." });

    const html = await resp.text();
    const document = new JSDOM(html).window.document;

    const titleTag = document.querySelector("h1");
    const title = titleTag ? titleTag.textContent.trim() : "Judul Tidak Ditemukan";

    const ogImage = document.querySelector('meta[property="og:image"]');
    let image_base64 = null;

    if (ogImage) {
      const imageResp = await fetch(ogImage.getAttribute("content"));
      const buffer = Buffer.from(await imageResp.arrayBuffer());
      image_base64 = buffer.toString("base64");
    }

    res.status(200).json({ title, image_base64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
  }
}

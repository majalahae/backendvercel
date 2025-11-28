import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  // Header CORS untuk semua request
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

    // Ambil HTML halaman
    let html = "";
    try {
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    html = resp.ok ? await resp.text() : "";
    } catch(e) {
    console.error("Gagal fetch halaman:", e);
  }

    const document = new JSDOM(html).window.document;

    // Ambil title dengan fallback
    let title = "Judul Tidak Ditemukan";
    try {
      const titleTag = document.querySelector("h1") || document.querySelector("h2") || document.querySelector("title");
      if (titleTag) title = titleTag.textContent.trim();
    } catch (e) {
      console.error("Gagal ambil title:", e);
    }

    // Ambil og:image jika ada
    let image_base64 = null;
    try {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const imageUrl = ogImage.getAttribute("content");
        if (imageUrl) {
          const imageResp = await fetch(imageUrl);
          const buffer = Buffer.from(await imageResp.arrayBuffer());
          image_base64 = buffer.toString("base64");
        }
      }
    } catch (e) {
      console.error("Gagal ambil image:", e);
    }

    return res.status(200).json({ title, image_base64 });
  } catch (err) {
    console.error("Error generate poster:", err);
    return res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
  }
}

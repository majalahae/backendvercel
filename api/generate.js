import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  // Header CORS untuk semua request
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body;
    if (!url || !url.startsWith("http")) {
      return res.status(200).json({ title: "Tidak ditemukan", image_base64: null });
    }

    // Ambil HTML halaman target
    let html = "";
    try {
      const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      html = resp.ok ? await resp.text() : "";
    } catch (e) {
      console.error("Gagal fetch halaman:", e);
    }

    // Debug: cek URL dan partial HTML
    console.log("URL request:", url);
    console.log("Partial HTML:", html.slice(0, 500));

    const document = new JSDOM(html).window.document;

    // Ambil judul dengan fallback
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

    // Return JSON
    return res.status(200).json({ title, image_base64 });
  } catch (err) {
    console.error("Error generate poster:", err);
    return res.status(200).json({ title: "Tidak ditemukan", image_base64: null });
  }
}

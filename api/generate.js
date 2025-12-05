import cheerio from "cheerio";

const cheerio = require("cheerio");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => { ... }

export default async function handler(req, res) {
  // CORS agar rrinfg.xyz bisa akses API
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    // -------- FETCH HTML --------
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // -------- TITLE --------
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1.entry-title").text().trim() ||
      $("title").text().trim() ||
      "Tanpa Judul";

    // -------- CAPTION --------
    let paragraphs = [];

    $("div.single-body-text p").each((i, el) => {
      const tx = $(el).text().trim();
      if (tx.length > 40) paragraphs.push(tx);
    });

    // fallback
    if (paragraphs.length === 0) {
      $("p").each((i, el) => {
        const tx = $(el).text().trim();
        if (tx.length > 40) paragraphs.push(tx);
      });
    }

    const caption =
      paragraphs.slice(0, 2).join("\n\n") ||
      $('meta[property="og:description"]').attr("content") ||
      "Tidak ada ringkasan.";

    // -------- IMAGE / OG IMAGE --------
    let imageUrl = $('meta[property="og:image"]').attr("content");

    if (!imageUrl) {
      const img = $("div.single-body-text img").attr("src");
      if (img) imageUrl = img;
    }

    // normalisasi URL
    if (imageUrl?.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    } else if (imageUrl?.startsWith("/")) {
      const base = new URL(url).origin;
      imageUrl = base + imageUrl;
    }

    // jika tidak ada gambar
    if (!imageUrl) {
      return res.status(200).json({
        title,
        summary: caption,
        image_base64: null,
        warning: "Tidak ada gambar.",
      });
    }

    // -------- FETCH IMAGE BASE64 --------
    const imgResp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
    });

    const buffer = await imgResp.arrayBuffer();
    const imageBase64 =
      "data:image/jpeg;base64," + Buffer.from(buffer).toString("base64");

    // -------- RETURN KE FRONTEND --------
    return res.status(200).json({
      title,
      summary: caption,
      image_base64: imageBase64,
    });

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}

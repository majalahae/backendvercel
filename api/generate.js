import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    // --- FETCH HTML ---
    const page = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 Chrome/120",
      },
      redirect: "follow",
    });

    const html = await page.text();
    const $ = cheerio.load(html);

    // ======================================================
    // TITLE
    // ======================================================
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1.entry-title").text().trim() ||
      $("title").text().trim() ||
      "Tanpa Judul";

    // ======================================================
    // CAPTION khusus RRI.co.id
    // Ambil p dari .single-body-text
    // ======================================================
    let paragraphs = [];

    $("div.single-body-text p").each((i, el) => {
      const tx = $(el).text().trim();
      if (tx.length > 40) paragraphs.push(tx); // skip paragraf pendek/iklan
    });

    // fallback jika selector tidak ketemu
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

    // ======================================================
    // IMAGE (OG Image adalah yang paling stabil di RRI)
    // ======================================================
    let imageUrl = $('meta[property="og:image"]').attr("content");

    // fallback: cari img artikel
    if (!imageUrl) {
      const firstImg = $("div.single-body-text img").attr("src");
      if (firstImg) imageUrl = firstImg;
    }

    // normalize url
    if (imageUrl && imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    } else if (imageUrl && imageUrl.startsWith("/")) {
      const base = new URL(url).origin;
      imageUrl = base + imageUrl;
    }

    // jika tetap tidak ada gambar
    if (!imageUrl) {
      return res.status(200).json({
        title,
        summary: caption,
        image_base64: null,
        warning: "Tidak ditemukan gambar di halaman.",
      });
    }

    // ======================================================
    // FETCH IMAGE + CONVERT TO BASE64
    // ======================================================
    const imgResp = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
    });

    const imgBuffer = await imgResp.arrayBuffer();
    const imageBase64 =
      "data:image/jpeg;base64," + Buffer.from(imgBuffer).toString("base64");

    // ======================================================
    // RETURN RESULT
    // ======================================================
    return res.status(200).json({
      title,
      summary: caption,
      image_base64: imageBase64,
    });

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}

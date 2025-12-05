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

    // Fetch HTML
    const page = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
      redirect: "follow",
    });

    const html = await page.text();
    const $ = cheerio.load(html);

    // --- TITLE ---
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "Tanpa Judul";

    // --- SUMMARY fallback lama ---
    const fallbackSummary =
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().slice(0, 150) ||
      "Tidak ada ringkasan.";

    // ======================================================
    // 🔥 CAPTION BARU (2 PARAGRAF PERTAMA)
    // ======================================================
    const paragraphs = [];
    $("p").each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 40) paragraphs.push(text); // skip paragraf pendek/iklan
    });

    const caption =
      paragraphs.slice(0, 2).join("\n\n") || fallbackSummary;

    // ======================================================

    // --- IMAGE ---
    let imageUrl = $('meta[property="og:image"]').attr("content");

    if (!imageUrl) {
      let maxArea = 0;
      $("img").each((i, el) => {
        const src = $(el).attr("src");
        const w = parseInt($(el).attr("width")) || 0;
        const h = parseInt($(el).attr("height")) || 0;
        const area = w * h;

        if (src && area > maxArea) {
          maxArea = area;
          imageUrl = src;
        }
      });
    }

    if (imageUrl && imageUrl.startsWith("//")) {
      imageUrl = `https:${imageUrl}`;
    } else if (imageUrl && imageUrl.startsWith("/")) {
      const base = new URL(url).origin;
      imageUrl = base + imageUrl;
    }

    if (!imageUrl) {
      return res.status(200).json({
        title,
        summary: caption, // <── ini caption 2 paragraf
        image_base64: null,
        warning: "Tidak ditemukan gambar apapun di halaman.",
      });
    }

    // Fetch gambar
    const imgResp = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    const imgBuffer = await imgResp.arrayBuffer();
    const imageBase64 =
      "data:image/jpeg;base64," +
      Buffer.from(imgBuffer).toString("base64");

    return res.status(200).json({
      title,
      summary: caption, // <── frontend ambil ini
      image_base64: imageBase64,
    });

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}

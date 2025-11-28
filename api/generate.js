import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // =============== CORS FIX (PENTING) ===============
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // ==================================================

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL tidak diberikan." });
    }

    // Fetch halaman
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
    });

    const $ = cheerio.load(response.data);

    // ========================
    // 1. JUDUL
    // ========================
    const title =
      $("h1.single-title").text().trim() ||
      $("meta[property='og:title']").attr("content") ||
      "Judul tidak ditemukan";

    // ========================
    // 2. GAMBAR UTAMA
    // ========================
    let image =
      $(".single-img img").attr("src") ||
      $("meta[property='og:image']").attr("content") ||
      null;

    if (image && image.startsWith("//")) image = "https:" + image;

    // ========================
    // 3. CAPTION
    // ========================
    const caption =
      $(".single-img figcaption").text().trim() ||
      $(".single-img .caption").text().trim() ||
      null;

    // ========================
    // 4. EMPAT PARAGRAF
    // ========================
    const paragraphs = $(".single-body-text p")
      .toArray()
      .slice(0, 4)
      .map((el) => $(el).text().trim())
      .filter((t) => t !== "");

    // ========================
    // 5. META TAMBAHAN
    // ========================
    const category =
      $(".breadcrumb li a").last().text().trim() ||
      null;

    const date =
      $(".single-date").text().trim() ||
      null;

    return res.status(200).json({
      success: true,
      title,
      image,
      caption,
      category,
      date,
      paragraphs,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Gagal mengambil halaman berita.",
      detail: err.message,
    });
  }
}

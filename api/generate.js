// === IMPORT ===
import axios from "axios";
import * as cheerio from "cheerio";

// === HANDLER ===
export default async function handler(req, res) {

  // --- CORS ALWAYS ---
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // --- Preflight ---
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak diberikan" });

    const html = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html.data);

    // === TITLE ===
    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Judul tidak ditemukan";

    // === SUMMARY ===
    const summary =
      $(".single-body-text").text().trim().replace(/\s+/g, " ") ||
      $('meta[name="description"]').attr("content") ||
      "Summary tidak ditemukan";

    // === IMAGE ===
    let imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $("img").first().attr("src");

    if (imageUrl && !imageUrl.startsWith("http")) {
      const origin = new URL(url).origin;
      imageUrl = origin + imageUrl;
    }

    let image_base64 = null;

    if (imageUrl) {
      const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const mime = img.headers["content-type"] || "image/jpeg";
      image_base64 = `data:${mime};base64,${Buffer.from(img.data).toString("base64")}`;
    }

    res.status(200).json({
      title,
      summary,
      image_base64,
    });

  } catch (err) {
    console.error("ERR BACKEND:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

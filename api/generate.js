import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  // ======== FIX CORS ========
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // ==========================

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL tidak diberikan" });
    }

    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    const title =
      $("h1").text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Judul tidak ditemukan";

    const summary =
      $(".single-body-text").text().replace(/\s+/g, " ").trim() ||
      $('meta[name="description"]').attr("content") ||
      "Summary tidak ditemukan.";

    let image =
      $('meta[property="og:image"]').attr("content") ||
      $("img").first().attr("src");

    if (image && !image.startsWith("http")) {
      const base = new URL(url).origin;
      image = base + image;
    }

    let image_base64 = null;

    if (image) {
      try {
        const imgResp = await axios.get(image, { responseType: "arraybuffer" });
        const mime = imgResp.headers["content-type"] || "image/jpeg";
        const b64 = Buffer.from(imgResp.data).toString("base64");
        image_base64 = `data:${mime};base64,${b64}`;
      } catch (e) {
        image_base64 = null;
      }
    }

    return res.status(200).json({
      title,
      summary,
      image_base64,
    });

  } catch (err) {
    console.error("Backend error:", err);
    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
}

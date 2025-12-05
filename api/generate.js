const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

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
      try {
        const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const mime =

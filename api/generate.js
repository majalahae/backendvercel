const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {
  // CORS FIX
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak diberikan" });

    const result = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(result.data);

    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Judul tidak ditemukan";

    const summary =
      $(".single-body-text").text().trim().replace(/\s+/g, " ") ||
      $('meta[name="description"]').attr("content") ||
      "Summary tidak ditemukan.";

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
      image_base64 = `data:${mime};base64,${Buffer.from(img.data).toString(
        "base64"
      )}`;
    }

    return res.status(200).json({ title, summary, image_base64 });
  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};

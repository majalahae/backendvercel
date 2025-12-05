const axios = require("axios");
const cheerio = require("cheerio");

// Fungsi delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak diberikan" });

    // Delay acak 1-2 detik sebelum scraping
    await delay(1000 + Math.random() * 1000);

    // Ambil HTML
    const html = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html.data);

    // Ambil TITLE
    const title =
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "Judul tidak ditemukan";

    // Ambil SUMMARY
    const summary =
      $(".single-body-text").text().trim().replace(/\s+/g, " ") ||
      $('meta[name="description"]').attr("content") ||
      "Summary tidak ditemukan";

    // Ambil IMAGE
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
        const mime = img.headers["content-type"];
        const base64 = Buffer.from(img.data, "binary").toString("base64");
        image_base64 = `data:${mime};base64,${base64}`;
      } catch (err) {
        console.error("Gagal ambil gambar:", err.message);
      }
    }

    res.status(200).json({ title, summary, image_base64 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

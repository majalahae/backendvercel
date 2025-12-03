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

    // Fetch HTML berita
    const page = await fetch(url);
    const html = await page.text();

    const $ = cheerio.load(html);

    // Ambil title
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "Tanpa Judul";

    // Ambil summary
    const summary =
      $('meta[property="og:description"]').attr("content") ||
      $("p").first().text().slice(0, 150) ||
      "Tidak ada ringkasan.";

    // Ambil gambar utama
    let imageUrl = $('meta[property="og:image"]').attr("content");

    if (!imageUrl) {
      return res.status(200).json({
        title,
        summary,
        image_base64: null,
        warning: "Berita ini tidak memiliki og:image",
      });
    }

    // Fetch gambar → convert ke base64
    const imgResp = await fetch(imageUrl);
    const imgBuffer = await imgResp.arrayBuffer();

    const imageBase64 =
      "data:image/jpeg;base64," +
      Buffer.from(imgBuffer).toString("base64");

    return res.status(200).json({
      title,
      summary,
      image_base64: imageBase64,
    });
  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}

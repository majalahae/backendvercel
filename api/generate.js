import fetch from "node-fetch";
import * as cheerio from "cheerio";

const bufferToBase64 = (buffer) => Buffer.from(buffer).toString("base64");

// Daftar origin yang diizinkan
const ALLOWED_ORIGINS = [
  "http://localhost:3000",  // untuk testing lokal
  "https://rrinfg.xyz"      // domain live
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // --- SET CORS HEADER DINAMIS ---
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // --- TANGANI PRE-FLIGHT OPTIONS ---
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    // --- Fetch halaman berita ---
    const newsResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
    });

    if (!newsResponse.ok) return res.status(newsResponse.status).json({ error: `Gagal fetch URL: Status ${newsResponse.status}` });

    const html = await newsResponse.text();
    const $ = cheerio.load(html);

    // Ambil judul
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1.entry-title").text().trim() ||
      $("h1.title").text().trim() ||
      $("title").text().trim() ||
      "Tanpa Judul";

    // Ambil ringkasan
    let paragraphs = [];
    const contentArea = $("div.single-body-text, div.entry-content");
    contentArea.find("p").each((i, el) => {
      const tx = $(el).text().trim();
      if (tx.length > 50 && !tx.includes("Baca Juga:")) paragraphs.push(tx);
    });
    const summary = paragraphs.slice(0, 2).join("\n\n") ||
                    $('meta[property="og:description"]').attr("content") ||
                    "Tidak ada ringkasan.";

    // Ambil gambar
    let imageUrl = $('meta[property="og:image"]').attr("content") ||
                   contentArea.find("img").attr("src") ||
                   null;
    if (imageUrl) {
      if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
      else if (imageUrl.startsWith("/")) imageUrl = new URL(url).origin + imageUrl;
    }

    let image_base64 = null;
    if (imageUrl) {
      try {
        const imgResp = await fetch(imageUrl);
        if (imgResp.ok) {
          const buffer = await imgResp.arrayBuffer();
          image_base64 = "data:image/jpeg;base64," + bufferToBase64(buffer);
        }
      } catch (err) {
        console.error("Gagal ambil gambar:", err.message);
      }
    }

    return res.status(200).json({ title, summary, image_base64 });

  } catch (err) {
    console.error("Kesalahan umum:", err);
    return res.status(500).json({ error: "Gagal memproses permintaan", details: err.message });
  }
}

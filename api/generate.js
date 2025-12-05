import * as cheerio from "cheerio";

// Fungsi untuk mengkonversi ArrayBuffer menjadi Base64 (penting untuk Vercel)
const bufferToBase64 = (buffer) => {
  return Buffer.from(buffer).toString("base64");
};

export default async function handler(req, res) {
  // 1. Pengaturan CORS (sudah benar, tapi bisa disederhanakan)
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    // --- Langkah 1: Scraping Halaman Berita ---
    const newsResponse = await fetch(url, {
      // Gunakan User-Agent lengkap agar tidak mudah diblokir
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
      },
    });

    if (!newsResponse.ok) {
      return res.status(newsResponse.status).json({ error: `Gagal mengakses URL: Status ${newsResponse.status}` });
    }

    const html = await newsResponse.text();
    const $ = cheerio.load(html);

    // 1. Ambil Judul
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("h1.entry-title").text().trim() ||
      $("h1.title").text().trim() || // Selector tambahan untuk RRI
      $("title").text().trim() ||
      "Tanpa Judul";

    // 2. Ambil Ringkasan/Konten (diperbaiki selektornya)
    let paragraphs = [];
    // Coba selektor yang lebih spesifik ke area konten artikel
    const contentArea = $("div.single-body-text, div.entry-content"); 
    
    contentArea.find("p").each((i, el) => {
      const tx = $(el).text().trim();
      // Hanya ambil paragraf yang cukup panjang
      if (tx.length > 50 && !tx.includes("Baca Juga:")) paragraphs.push(tx); 
    });

    const caption =
      paragraphs.slice(0, 2).join("\n\n") ||
      $('meta[property="og:description"]').attr("content") ||
      "Tidak ada ringkasan.";

    // 3. Ambil URL Gambar
    let imageUrl = $('meta[property="og:image"]').attr("content") ||
      contentArea.find("img").attr("src") ||
      null;

    // Perbaiki URL relatif
    if (imageUrl) {
      if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
      else if (imageUrl.startsWith("/")) imageUrl = new URL(url).origin + imageUrl;
    }

    // --- Langkah 2: Ambil Gambar dan Konversi ke Base64 ---
    let imageBase64 = null;
    if (imageUrl) {
      try {
        const imgResp = await fetch(imageUrl, {
          headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
          // Tambahkan timeout untuk mencegah error pada gambar yang lambat/rusak
          signal: AbortSignal.timeout(5000) 
        });

        if (imgResp.ok) {
          const buffer = await imgResp.arrayBuffer();
          // Gunakan fungsi bufferToBase64
          imageBase64 = "data:image/jpeg;base64," + bufferToBase64(buffer);
        } else {
          console.error(`Gagal ambil gambar: Status ${imgResp.status}, URL: ${imageUrl}`);
        }
      } catch (imgError) {
        console.error(`Error saat mengambil gambar: ${imgError.message}`);
        // Biarkan imageBase64 tetap null
      }
    }

    return res.status(200).json({
      title,
      summary: caption,
      image_base64: imageBase64
    });

  } catch (err) {
    // Tangani error umum (misal: timeout atau URL tidak valid)
    console.error("Kesalahan umum saat scraping:", err);
    return res.status(500).json({ error: "Gagal memproses permintaan berita.", details: err.message });
  }
}

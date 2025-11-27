import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// POST /generate
app.post("/generate", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL tidak ditemukan." });
  }

  try {
    const headers = { "User-Agent": "Mozilla/5.0" };

    // Ambil HTML berita
    const resp = await axios.get(url, { headers });

    const $ = cheerio.load(resp.data);

    // Ambil judul h1
    let title = $("h1").first().text().trim();
    if (!title) title = "Judul Tidak Ditemukan";

    // Ambil meta og:image
    const imageUrl = $('meta[property="og:image"]').attr("content");

    let imageBase64 = null;

    if (imageUrl) {
      try {
        const imgResp = await axios.get(imageUrl, {
          headers,
          responseType: "arraybuffer"
        });
        imageBase64 = Buffer.from(imgResp.data).toString("base64");
      } catch (err) {
        console.log("Gagal mengambil gambar:", err);
      }
    }

    return res.json({
      title,
      image_base64: imageBase64
    });

  } catch (err) {
    console.log("Error:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan saat generate poster."
    });
  }
});

// Default port untuk Vercel (ignored by Vercel but needed locally)
app.listen(3000, () => console.log("Server berjalan di port 3000"));
export default app;

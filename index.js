import express from "express"; 
import cors from "cors";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

    try {
        // Ambil halaman berita langsung
        const resp = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/html,application/xhtml+xml"
            }
        });

        if (!resp.ok) {
            return res.status(400).json({ error: "Gagal mengambil halaman berita." });
        }

        const html = await resp.text();

        // Parsing HTML
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Ambil judul
        const titleTag = document.querySelector("h1");
        const title = titleTag ? titleTag.textContent.trim() : "Judul Tidak Ditemukan";

        // Ambil OG image
        const ogImage = document.querySelector('meta[property="og:image"]');
        let image_base64 = null;

        if (ogImage) {
            const imageUrl = ogImage.getAttribute("content");
            try {
                const imageResp = await fetch(imageUrl);
                const buffer = Buffer.from(await imageResp.arrayBuffer());
                image_base64 = buffer.toString("base64");
            } catch (imgErr) {
                console.log("Gagal ambil gambar:", imgErr.message);
            }
        }

        return res.json({ title, image_base64 });

   } catch (err) {
        console.error("ERROR BACKEND:", err);
        return res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
   }
});

export default app;

import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

    try {
        // Ambil HTML berita
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!response.ok) {
            return res.status(400).json({ error: "Gagal mengambil halaman berita." });
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Ambil judul (lebih aman dengan fallback)
        const title =
            document.querySelector("h1")?.textContent?.trim() ||
            document.querySelector("meta[property='og:title']")?.content ||
            document.title ||
            "Judul Tidak Ditemukan";

        // Ambil OG Image
        let image_base64 = null;
        const ogImage = document.querySelector('meta[property="og:image"]');

        if (ogImage) {
            try {
                const imgUrl = ogImage.getAttribute("content");
                const imgResp = await fetch(imgUrl, {
                    headers: { "User-Agent": "Mozilla/5.0" }
                });

                const buffer = Buffer.from(await imgResp.arrayBuffer());
                image_base64 = buffer.toString("base64");
            } catch (e) {
                console.log("Gagal ambil gambar:", e.message);
            }
        }

        return res.status(200).json({
            title,
            image_base64
        });

    } catch (err) {
        console.error("SERVER ERROR:", err);
        return res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
    }
}

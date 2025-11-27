import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight CORS
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!response.ok) {
            return res.status(400).json({ error: "Gagal mengambil halaman berita." });
        }

        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const title =
            document.querySelector("h1")?.textContent?.trim() ||
            document.querySelector("meta[property='og:title']")?.content ||
            document.title ||
            "Judul Tidak Ditemukan";

        let image_base64 = null;
        const ogImage = document.querySelector('meta[property="og:image"]');

        if (ogImage) {
            try {
                const imgUrl = ogImage.getAttribute("content");
                const imgResp = await fetch(imgUrl);

                const buffer = Buffer.from(await imgResp.arrayBuffer());
                image_base64 = buffer.toString("base64");
            } catch (err) {
                console.log("Gagal ambil gambar:", err.message);
            }
        }

        return res.status(200).json({
            title,
            image_base64
        });

    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
    }
}

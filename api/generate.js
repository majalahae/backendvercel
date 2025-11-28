import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL tidak ditemukan" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const titleTag = dom.window.document.querySelector("h1");

    const title = titleTag
      ? titleTag.textContent.trim()
      : "Judul Tidak Ditemukan";

    const ogImage = dom.window.document.querySelector(
      'meta[property="og:image"]'
    );
    let image_base64 = null;

    if (ogImage) {
      const imageUrl = ogImage.content;
      const imgResp = await fetch(imageUrl);
      const buf = Buffer.from(await imgResp.arrayBuffer());
      image_base64 = buf.toString("base64");
    }

    return res.json({ title, image_base64 });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Gagal generate poster" });
  }
}

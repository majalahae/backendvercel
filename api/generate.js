import fetch from "node-fetch";
import { JSDOM } from "jsdom";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "URL tidak ditemukan." });

  try {
    const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await resp.text();

    const dom = new JSDOM(html);
    const document = dom.window.document;

    const titleTag = document.querySelector("h1");
    const title = titleTag ? titleTag.textContent.trim() : null;

    const ogImage = document.querySelector('meta[property="og:image"]');
    let image_base64 = null;

    if (ogImage) {
      const imageResp = await fetch(ogImage.content);
      const buffer = Buffer.from(await imageResp.arrayBuffer());
      image_base64 = buffer.toString("base64");
    }

    return res.status(200).json({ title, image_base64 });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Terjadi kesalahan saat generate poster." });
  }
}

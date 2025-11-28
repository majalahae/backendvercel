export default async function handler(req, res) {
  // CORS Wajib
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Jika OPTIONS → balas langsung
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL kosong" });

    // === SCRAPER DI SINI (Puppeteer version) ===
    // misal return data dummy dulu
    return res.status(200).json({
      title: "Berhasil",
      image_base64: null,
      summary: "Test sukses dari backend"
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}

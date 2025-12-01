export default async function handler(req, res) {
  // ==== CORS FIX ============================================================
  res.setHeader("Access-Control-Allow-Origin", "https://rrinfg.xyz");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  
  // Preflight request (wajib)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // ==========================================================================

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL kosong" });
    }

    // ================
    // SCRAPER-KU DISINI
    // ================
    // Contoh dummy result (masukkan puppeteer dari kamu)
    const result = {
      title: "Judul Berita Contoh",
      image_base64: null,
      summary: "Ini summary contoh.",
    };

    // Kirim hasil ke frontend
    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({ error: err.toString() });
  }
}

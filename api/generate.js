import puppeteer from "puppeteer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { url } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-userns-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // === SCRAPE JUDUL ===
    const title = await page.$eval("h1.single-title", el => el.innerText.trim());

    // === SCRAPE GAMBAR ===
    const imageUrl = await page.$eval("div.single-img img", img => img.src);

    // Download & convert to base64
    const imageResponse = await page.goto(imageUrl);
    const buf = await imageResponse.buffer();
    const image_base64 = `data:image/jpeg;base64,${buf.toString("base64")}`;

    // === SCRAPE MAKS 4 PARAGRAF ===
    const paragraphs = await page.$$eval(
      "div.single-body-text p",
      els => els.slice(0, 4).map(e => e.innerText.trim())
    );

    const summary = paragraphs.join("\n\n");

    await browser.close();

    return res.status(200).json({
      title,
      image_base64,
      summary
    });

  } catch (e) {
    return res.status(500).json({
      error: e.message
    });
  }
}

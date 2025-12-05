import base64
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NewsURL(BaseModel):
    url: str

@app.post("/generate")
def generate(news: NewsURL):
    url = news.url.strip()

    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL tidak valid.")

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept-Language": "en-US,en;q=0.9"
        }

        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Gagal mengambil halaman berita.")

        soup = BeautifulSoup(resp.text, "html.parser")

        # Ambil judul (fallback)
        title_tag = (
            soup.find("h1")
            or soup.find("meta", property="og:title")
            or soup.find("title")
        )

        if title_tag:
            title = (
                title_tag.text.strip()
                if hasattr(title_tag, "text")
                else title_tag.get("content", "").strip()
            )
        else:
            title = "Judul Tidak Ditemukan"

        # Ambil gambar (fallback)
        og_image = soup.find("meta", property="og:image")
        image_url = og_image.get("content") if og_image else None

        image_base64 = None
        if image_url:
            try:
                img_resp = requests.get(image_url, headers=headers, timeout=10)
                if img_resp.status_code == 200:
                    image_base64 = base64.b64encode(img_resp.content).decode("utf-8")
            except Exception as e:
                print("Gagal mengambil gambar:", e)

        return {
            "title": title,
            "image_base64": image_base64
        }

    except Exception as e:
        print("ERROR SERVER:", e)
        raise HTTPException(status_code=500, detail="Terjadi kesalahan saat generate poster.")

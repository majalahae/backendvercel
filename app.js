const canvas = new fabric.Canvas("newsCanvas", {
  preserveObjectStacking: true,
  selection: false,
});

let img, overlay, titleText;
const CANVAS_W = 1080;
const CANVAS_H = 1350;

document.getElementById("generateBtn").onclick = async () => {
  const url = document.getElementById("urlInput").value.trim();
  if (!url) return alert("Masukkan link berita RRI terlebih dahulu.");

  console.log("🔍 Memulai scrape URL:", url);

  try {
    const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
    const data = await res.json();

    console.log("✅ Hasil dari API:", data);

    if (data.error || !data.image) {
      alert("Gagal mengambil data dari link. Coba link lain.");
      return;
    }

    canvas.clear();
    addImage(data.image, data.title);
  } catch (err) {
    console.error("❌ Gagal fetch /api/scrape:", err);
    alert("Terjadi kesalahan saat mengambil data.");
  }
};

function addImage(url, title) {
    console.log("🖼️ Memuat gambar:", url);

    const proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;

    // Load gambar berita
    fabric.Image.fromURL(proxied, function(oImg) {
        if (!oImg || oImg.width === 0) {
            alert("Gagal memuat gambar berita (CORS atau proxy error).");
            console.error("❌ Tidak bisa memuat gambar dari:", proxied);
            return;
        }
    // kalau berhasil, tambahkan ke canvas
    canvas.add(oImg);
});

// Overlay
fabric.Image.fromURL("https://rrinfg.xyz/images/overlay1.png", "https://rrinfg.xyz/images/overlay2.png", "https://rrinfg.xyz/images/overlay3.png", "https://rrinfg.xyz/images/overlay4.png", "https://rrinfg.xyz/images/overlay5.png" 
    function(overlayImg) {
    if (overlayImg) {
        canvas.add(overlayImg);
    }
});

      console.log("✅ Gambar berhasil dimuat:", oImg.width, "x", oImg.height);

      const imgAspect = oImg.width / oImg.height;
      const frameAspect = CANVAS_W / CANVAS_H;
      let scaleFactor;

      // Pastikan tinggi pas, bisa geser kiri-kanan
      if (imgAspect > frameAspect) {
        scaleFactor = CANVAS_H / oImg.height;
      } else {
        scaleFactor = CANVAS_W / oImg.width;
      }

      oImg.scale(scaleFactor);
      oImg.set({
        originX: "center",
        originY: "center",
        left: CANVAS_W / 2,
        top: CANVAS_H / 2,
        selectable: true,
        hasControls: false,
      });

      oImg.lockMovementY = true; // hanya geser kiri-kanan
      oImg.lockScalingX = true;
      oImg.lockScalingY = true;

      canvas.add(oImg);
      canvas.sendToBack(oImg);
      img = oImg;

      addOverlay();
      addTitle(title);
    }
    { crossOrigin: "anonymous" }
  ;

function addOverlay() {
  console.log("🧩 Menambahkan overlay...");

  fabric.Image.fromURL("https://rrinfg.xyz/images/overlay1.png",
    "https://rrinfg.xyz/images/overlay2.png",
    "https://rrinfg.xyz/images/overlay3.png",
    "https://rrinfg.xyz/images/overlay4.png",
    "https://rrinfg.xyz/images/overlay5.png",
    (oImg) => {
      if (!oImg) {
        console.error("❌ Overlay tidak ditemukan.");
        return;
      }

      oImg.scaleToWidth(CANVAS_W);
      oImg.scaleToHeight(CANVAS_H);
      oImg.set({ selectable: false, evented: false });
      canvas.add(oImg);
      overlay = oImg;
      canvas.bringToFront(oImg);

      console.log("✅ Overlay berhasil ditambahkan.");
    },
    { crossOrigin: "anonymous" }
  );
}

function addTitle(text) {
  console.log("📝 Menambahkan judul:", text);

  titleText = new fabric.Textbox(text, {
    left: 50,
    top: 1100,
    width: 980,
    fontSize: 50,
    fill: "#ffffff",
    fontWeight: "bold",
    fontFamily: "AlbertSans_700Bold",
    textAlign: "center",
    selectable: false,
  });
  canvas.add(titleText);
  canvas.bringToFront(titleText);
  console.log("✅ Judul berhasil ditambahkan.");
}

document.getElementById("downloadBtn").onclick = () => {
  console.log("💾 Mengunduh PNG...");
  try {
    const link = document.createElement("a");
    link.download = "feed-rri.png";
    link.href = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1.0,
    });
    link.click();
    console.log("✅ PNG berhasil diunduh.");
  } catch (err) {
    console.error("❌ Gagal membuat PNG:", err);
  }
};

document.getElementById("resetBtn").onclick = () => {
  console.log("🔄 Reset posisi gambar.");
  if (img) {
    img.set({ left: CANVAS_W / 2, top: CANVAS_H / 2 });
    canvas.renderAll();
  }
};

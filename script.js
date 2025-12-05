// Load font
document.fonts.load("700 40px 'Albert Sans'").then(() => console.log("Albert Sans loaded"));

// Canvas
const canvas = new fabric.Canvas("posterCanvas", { width:1080, height:1350, preserveObjectStacking:true });
canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

let mainImage = null, templateOverlay = null, titleText = null;

const overlayList = [
  "https://rrinfg.xyz/images/overlay1.png",
  "https://rrinfg.xyz/images/overlay2.png",
  "https://rrinfg.xyz/images/overlay3.png",
  "https://rrinfg.xyz/images/overlay4.png",
  "https://rrinfg.xyz/images/overlay5.png"
];

function getRandomOverlay(){ return overlayList[Math.floor(Math.random()*overlayList.length)]; }

function loadTemplateOverlay(url){
  if(templateOverlay) canvas.remove(templateOverlay);
  fabric.Image.fromURL(url, img=>{
    const scale = Math.max(canvas.width/img.width, canvas.height/img.height);
    img.set({ left:0, top:0, scaleX:scale, scaleY:scale, selectable:false });
    templateOverlay = img;
    canvas.add(img); canvas.bringToFront(img);
    if(titleText) canvas.bringToFront(titleText);
    canvas.renderAll();
  });
}

function addTitleText(title){
  if(titleText) canvas.remove(titleText);
  titleText = new fabric.Textbox(title,{
    left:70, top:930, width:960, fontSize:100, fill:"#fff",
    fontWeight:"bold", fontFamily:"Albert Sans", textAlign:"left", selectable:false
  });
  canvas.add(titleText); canvas.bringToFront(titleText); canvas.renderAll();
}

async function generatePoster(){
  const inputUrl = document.getElementById("input-url").value.trim();
  if(!inputUrl) return alert("Masukkan link berita!");

  const spinner = document.getElementById("spinner");
  spinner.style.display = "block";

  try {
    const response = await fetch("https://backendvercel-fawn.vercel.app/api/generate", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ url: inputUrl })
    });

    if(!response.ok) throw new Error("Gagal memanggil backend");

    const data = await response.json();
    console.log(data);

    // Caption
    document.getElementById("captionBox").value = data.summary || "Caption tidak tersedia.";

    // Image
    if(mainImage) canvas.remove(mainImage);
    if(data.image_base64){
      const imgSrc = data.image_base64.startsWith("data:") ? data.image_base64 : "data:image/jpeg;base64,"+data.image_base64;
      fabric.Image.fromURL(imgSrc, img=>{
        const scale = Math.min(canvas.width/img.width, canvas.height/img.height);
        img.set({ left:(canvas.width-img.width*scale)/2, top:(canvas.height-img.height*scale)/2, scaleX:scale, scaleY:scale, selectable:true });
        mainImage = img; canvas.add(img); canvas.sendToBack(img);
        loadTemplateOverlay(getRandomOverlay());
        addTitleText(data.title);
      });
    } else {
      addTitleText(data.title);
      loadTemplateOverlay(getRandomOverlay());
    }

  } catch(err){
    console.error(err);
    alert("Terjadi kesalahan saat generate poster!");
  } finally {
    spinner.style.display = "none";
  }
}

// Download, Reset, Copy Caption
document.getElementById("downloadBtn").onclick = function(){
  if(!mainImage) return alert("Generate poster dulu!");
  const dataURL = canvas.toDataURL({ format:"png", multiplier:2 });
  const link = document.createElement("a"); link.href = dataURL; link.download="poster.png"; link.click();
};
document.getElementById("resetBtn").onclick = function(){
  if(!mainImage) return;
  const scale = Math.min(canvas.width/mainImage.width, canvas.height/mainImage.height);
  mainImage.set({ left:(canvas.width-mainImage.width*scale)/2, top:(canvas.height-mainImage.height*scale)/2, scaleX:scale, scaleY:scale, angle:0 });
  mainImage.center(); mainImage.setCoords(); canvas.renderAll();
};
document.getElementById("copyCaptionBtn").onclick = function(){
  const caption = document.getElementById("captionBox");
  caption.select(); caption.setSelectionRange(0,99999);
  navigator.clipboard.writeText(caption.value);
  alert("Caption copied!");
};

// === Iridescence Background (OGL) ===
const vertexShader = `...`;   // pakai shader sama seperti sebelumnya
const fragmentShader = `...`;

function initIridescence(options={}){ /* sama seperti versi sebelumnya */ }

window.addEventListener("DOMContentLoaded", ()=>{
  initIridescence({ selector:"#iridescence-container", color:[1,1,1], speed:1.0, amplitude:0.14, mouseReact:true });
});

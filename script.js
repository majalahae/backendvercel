document.fonts.load("700 40px 'Albert Sans'").then(() => {
  console.log("Albert Sans loaded");
});
const canvas = new fabric.Canvas("posterCanvas", {
  width: 1080,
  height: 1350,
  preserveObjectStacking: true,
});

canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

let mainImage = null;
let templateOverlay = null;
let titleText = null;

const overlayList = [
  "https://rrinfg.xyz/images/overlay1.png",
  "https://rrinfg.xyz/images/overlay2.png",
  "https://rrinfg.xyz/images/overlay3.png",
  "https://rrinfg.xyz/images/overlay4.png",
  "https://rrinfg.xyz/images/overlay5.png",
];

function getRandomOverlay() {
  return overlayList[Math.floor(Math.random() * overlayList.length)];
}

function loadTemplateOverlay(url) {
  if (templateOverlay) canvas.remove(templateOverlay);

  fabric.Image.fromURL(url, img => {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    img.set({
      left: 0,
      top: 0,
      scaleX: scale,
      scaleY: scale,
      selectable: false
    });

    templateOverlay = img;
    canvas.add(img);
    canvas.bringToFront(img);
    if (titleText) canvas.bringToFront(titleText);

    canvas.renderAll();
  });
}

function addTitleText(title) {
  if (titleText) canvas.remove(titleText);

  titleText = new fabric.Textbox(title, {
    left: 70,
    top: 930,
    width: 960,
    fontSize: 100,
    fill: "#ffffff",
    fontWeight: "bold",
    fontFamily: "Albert Sans",
    textAlign: "left",
    selectable: false,
  });

  canvas.add(titleText);
  canvas.bringToFront(titleText);
  canvas.renderAll();
}

async function generatePoster() {
  const inputUrl = document.getElementById("input-url").value.trim();
  if (!inputUrl) return alert("Masukkan link berita!");

  try {
    const response = await fetch("https://backendvercel-fawn.vercel.app/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: inputUrl })
    });

    if (!response.ok) throw new Error("Gagal memanggil backend");

    const data = await response.json();
    console.log(data);

    // === SET CAPTION (2 paragraf pertama) ===
    const captionBox = document.getElementById("captionBox");
    captionBox.value = data.summary || "Caption tidak tersedia.";

    // === IMAGE HANDLING ===
    if (mainImage) canvas.remove(mainImage);

    if (data.image_base64) {
      const imgSrc = data.image_base64.startsWith("data:")
        ? data.image_base64
        : "data:image/jpeg;base64," + data.image_base64;

      fabric.Image.fromURL(imgSrc, img => {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        img.set({
          left: (canvas.width - img.width * scale) / 2,
          top: (canvas.height - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: true
        });

        mainImage = img;
        canvas.add(img);
        canvas.sendToBack(img);

        loadTemplateOverlay(getRandomOverlay());
        addTitleText(data.title);
      });

    } else {
      addTitleText(data.title);
      loadTemplateOverlay(getRandomOverlay());
    }

  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat generate poster!");
  }
}

document.getElementById("downloadBtn").onclick = function () {
  if (!mainImage) return alert("Generate poster dulu!");

  const dataURL = canvas.toDataURL({ format: "png", multiplier: 2 });
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "poster.png";
  link.click();
};

document.getElementById("resetBtn").onclick = function () {
  if (!mainImage) return;

  const scale = Math.min(canvas.width / mainImage.width, canvas.height / mainImage.height);
  mainImage.set({
    left: (canvas.width - mainImage.width * scale) / 2,
    top: (canvas.height - mainImage.height * scale) / 2,
    scaleX: scale,
    scaleY: scale,
    angle: 0,
  });

  mainImage.center();
  mainImage.setCoords();
  canvas.renderAll();
};

// === COPY CAPTION BUTTON ===
document.getElementById("copyCaptionBtn").onclick = function () {
  const caption = document.getElementById("captionBox");
  caption.select();
  caption.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(caption.value);
  alert("Caption copied!");
};
// === IRIDESCENCE BACKGROUND (NON-REACT VERSION) =========================

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

function initIridescence(options = {}) {
  const { selector = "#iridescence-container", color = [1,1,1], speed=1.0, amplitude=0.1, mouseReact=true } = options;

  const container = document.querySelector(selector);
  if(!container) return console.error("Container not found:", selector);

  const renderer = new OGL.Renderer();
  const gl = renderer.gl;
  gl.clearColor(1,1,1,1);
  container.appendChild(gl.canvas);

  const mouse = {x:0.5, y:0.5};

  const geometry = new OGL.Triangle(gl);
  const program = new OGL.Program(gl, {
    vertex: vertexShader,
    fragment: fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Float32Array(color) },
      uResolution: { value: new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height]) },
      uMouse: { value: new Float32Array([mouse.x, mouse.y]) },
      uAmplitude: { value: amplitude },
      uSpeed: { value: speed }
    }
  });

  const mesh = new OGL.Mesh(gl, { geometry, program });

  function resize() {
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    renderer.setSize(w,h);
    program.uniforms.uResolution.value = new Float32Array([gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height]);
  }

  window.addEventListener("resize", resize);
  resize();

  function animate(t) {
    program.uniforms.uTime.value = t*0.001;
    renderer.render({ scene: mesh, camera: null });
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  if(mouseReact) {
    container.addEventListener("mousemove", e=>{
      const rect = container.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left)/rect.width;
      mouse.y = 1 - (e.clientY - rect.top)/rect.height;
      program.uniforms.uMouse.value[0] = mouse.x;
      program.uniforms.uMouse.value[1] = mouse.y;
    });
  }
}

// ====== CALL THE FUNCTION ON PAGE LOAD ==================================

window.addEventListener("DOMContentLoaded", () => {
  initIridescence({
    selector: "#iridescence-container",
    color: [1.0, 1.0, 1.0],
    speed: 1.0,
    amplitude: 0.14,
    mouseReact: true,
  });
});

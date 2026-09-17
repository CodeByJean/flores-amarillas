/**
 * ============================================================================
 * FLORES AMARILLAS - ÁRBOL EN FORMA DE CORAZÓN & EXPERIENCIA INTERACTIVA
 * Para Guisselle 💛
 * ============================================================================
 */

// 1. CONFIGURACIÓN
// Fecha exacta: 07 de Julio de 2026
const LOVE_START_DATE = new Date(2026, 6, 7, 0, 0, 0);

// Elementos del DOM
const introScreen = document.getElementById("intro-screen");
const flowerBtn = document.getElementById("flower-btn");
const mainScene = document.getElementById("main-scene");
const letterPanel = document.getElementById("letter-panel");
const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const canvas = document.getElementById("treeCanvas");
const ctx = canvas.getContext("2d");
const musicToggle = document.getElementById("music-toggle");
const musicIcon = document.getElementById("music-icon");

const bgMusic = document.getElementById("bg-music");
const volumeSlider = document.getElementById("volume-slider");
const volumePercent = document.getElementById("volume-percent");

// ============================================================================
// 2. SISTEMA DE AUDIO (Con GainNode de Web Audio para control universal en móviles)
// ============================================================================
let isMusicPlaying = false;
let audioContext = null;
let gainNode = null;
let trackSource = null;

function setupWebAudio() {
  if (audioContext) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();

    // Conectar el elemento <audio> al GainNode y a la salida de los altavoces
    trackSource = audioContext.createMediaElementSource(bgMusic);
    trackSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configurar volumen inicial
    const initVol = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;
    setVolumeLevel(initVol);
  } catch (err) {
    console.warn("Web Audio setup:", err);
  }
}

function setVolumeLevel(val) {
  // 1. Control directo en elemento de audio (PC / Android)
  if (bgMusic) {
    try { bgMusic.volume = val; } catch(e) {}
  }

  // 2. Control universal vía GainNode (funciona en iOS Safari y todos los móviles)
  if (gainNode && audioContext) {
    try {
      gainNode.gain.setValueAtTime(val, audioContext.currentTime);
    } catch(e) {}
  }

  // 3. Indicadores de UI
  if (volumePercent) {
    volumePercent.textContent = Math.round(val * 100) + "%";
  }
  if (val === 0) {
    musicIcon.textContent = "🔇";
  } else if (isMusicPlaying) {
    musicIcon.textContent = "🔊";
  }
}

function playAudioTrack() {
  if (!bgMusic) return;

  setupWebAudio();
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  bgMusic.currentTime = 0;
  const initVol = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;
  setVolumeLevel(initVol);

  const playPromise = bgMusic.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      isMusicPlaying = true;
      musicIcon.textContent = "🔊";
    }).catch((err) => {
      console.warn("Reproducción bloqueada por política del navegador:", err);
    });
  }
}

const musicController = document.getElementById("music-controller");

function toggleMusic(e) {
  if (e) {
    e.stopPropagation();
  }
  if (!bgMusic) return;

  setupWebAudio();
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }

  // Al presionar el botón, alternamos el despliegue del control de volumen
  if (musicController) {
    musicController.classList.toggle("open");
  }

  // Si la música estaba pausada, la reanudamos
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      isMusicPlaying = true;
      musicIcon.textContent = "🔊";
    }).catch(() => {});
  }
}

// Cerrar el control de volumen si se hace clic/toque afuera para no interferir con la lectura
function handleOutsideClick(e) {
  if (musicController && !musicController.contains(e.target)) {
    musicController.classList.remove("open");
  }
}
document.addEventListener("click", handleOutsideClick);
document.addEventListener("touchstart", handleOutsideClick, { passive: true });

// Controlador interactivo de volumen
if (volumeSlider) {
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolumeLevel(val);
  };

  volumeSlider.addEventListener("input", handleVolumeChange);
  volumeSlider.addEventListener("change", handleVolumeChange);

  // Prevenir que el toque en el slider cierre el panel en móviles
  const stopPropagation = (e) => e.stopPropagation();
  volumeSlider.addEventListener("click", stopPropagation);
  volumeSlider.addEventListener("touchstart", stopPropagation, { passive: true });
  volumeSlider.addEventListener("touchmove", stopPropagation, { passive: true });
  volumeSlider.addEventListener("pointerdown", stopPropagation);
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleMusic);
  musicToggle.addEventListener("touchend", (e) => {
    e.preventDefault();
    toggleMusic(e);
  });
}

// ============================================================================
// 3. CONTADOR DE TIEMPO
// ============================================================================
function updateCounter() {
  const now = new Date();
  let diff = now - LOVE_START_DATE;

  if (diff < 0) {
    diff = 0;
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  daysEl.textContent = days;
  hoursEl.textContent = String(hours).padStart(2, "0");
  minutesEl.textContent = String(minutes).padStart(2, "0");
  secondsEl.textContent = String(seconds).padStart(2, "0");
}

setInterval(updateCounter, 1000);
updateCounter();

// ============================================================================
// 4. SISTEMA PROCEDURAL DE ÁRBOL & FLORES (CANVAS)
// ============================================================================
let width, height;
let treeBranches = [];
let heartFlowers = [];
let floatingPetals = [];
let animationStage = "idle";

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  if (animationStage === "completed") {
    drawStaticScene();
  }
});

function getHeartPoint(t, scale, centerX, centerY) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
  return {
    x: centerX + x * scale,
    y: centerY + y * scale,
  };
}

class Branch {
  constructor(x, y, angle, length, width, depth, maxDepth) {
    this.startX = x;
    this.startY = y;
    this.angle = angle;
    this.length = length;
    this.currentLength = 0;
    this.width = width;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.finished = false;
    this.children = [];
    this.growthSpeed = Math.max(1.8, 5 - depth * 0.5);
  }

  update() {
    if (this.currentLength < this.length) {
      this.currentLength += this.growthSpeed;
      if (this.currentLength >= this.length) {
        this.currentLength = this.length;
        this.finished = true;
        this.spawnChildren();
      }
    }
  }

  getEnd() {
    const endX = this.startX + Math.cos(this.angle) * this.currentLength;
    const endY = this.startY + Math.sin(this.angle) * this.currentLength;
    return { x: endX, y: endY };
  }

  spawnChildren() {
    if (this.depth >= this.maxDepth) return;

    const numChildren = this.depth === 0 ? 3 : 2;
    for (let i = 0; i < numChildren; i++) {
      const spread = (Math.PI / 4) * (Math.random() * 0.8 + 0.6);
      const angleOffset = (i === 0 ? -1 : 1) * spread * 0.7 + (Math.random() - 0.5) * 0.3;
      const childAngle = this.angle + angleOffset;
      const childLength = this.length * (0.65 + Math.random() * 0.2);
      const childWidth = this.width * 0.68;
      const end = this.getEnd();

      const child = new Branch(end.x, end.y, childAngle, childLength, childWidth, this.depth + 1, this.maxDepth);
      this.children.push(child);
      treeBranches.push(child);
    }
  }

  draw() {
    const end = this.getEnd();
    ctx.save();
    ctx.strokeStyle = "#5a3a22";
    ctx.lineWidth = Math.max(1.5, this.width * (1 - (this.currentLength / this.length) * 0.2));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.restore();
  }
}

class HeartFlower {
  constructor(x, y, targetSize, delay) {
    this.x = x;
    this.y = y;
    this.size = 0;
    this.targetSize = targetSize;
    this.delay = delay;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    const hues = ["#ffe082", "#ffd54f", "#ffca28", "#ffc107", "#ffb300", "#fff176"];
    this.petalColor = hues[Math.floor(Math.random() * hues.length)];
    this.centerColor = Math.random() > 0.4 ? "#e65100" : "#bf360c";
    this.petals = Math.floor(Math.random() * 3) + 7;
  }

  update() {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    if (this.size < this.targetSize) {
      this.size += (this.targetSize - this.size) * 0.08 + 0.15;
      if (this.size > this.targetSize) this.size = this.targetSize;
    }
    this.rotation += this.rotationSpeed;
  }

  draw() {
    if (this.size <= 0.2) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.fillStyle = this.petalColor;
    const r = this.size;
    const petalCount = this.petals;

    for (let i = 0; i < petalCount; i++) {
      const ang = (i * 2 * Math.PI) / petalCount;
      ctx.save();
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.65, r * 0.38, r * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fillStyle = this.centerColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = "#fff59d";
    ctx.fill();

    ctx.restore();
  }
}

class FallingPetal {
  constructor(initial = false) {
    this.reset(initial);
  }

  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : -20;
    this.size = Math.random() * 6 + 4;
    this.speedY = Math.random() * 1.2 + 0.8;
    this.speedX = Math.random() * 1.5 - 0.5;
    this.angle = Math.random() * Math.PI * 2;
    this.angularSpeed = (Math.random() - 0.5) * 0.04;
    this.opacity = Math.random() * 0.6 + 0.35;
    const hues = ["#ffd54f", "#ffca28", "#ffe082", "#fff59d"];
    this.color = hues[Math.floor(Math.random() * hues.length)];
  }

  update() {
    this.y += this.speedY;
    this.x += Math.sin(this.y * 0.02) * 1.1 + this.speedX * 0.5;
    this.angle += this.angularSpeed;

    if (this.y > height + 20 || this.x < -30 || this.x > width + 30) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function setupTree() {
  treeBranches = [];
  heartFlowers = [];
  floatingPetals = [];

  const trunkBaseX = width * 0.5;
  const trunkBaseY = height * 0.88;
  const trunkLength = height * 0.26;
  const trunkWidth = Math.min(26, width * 0.04);

  const trunk = new Branch(
    trunkBaseX,
    trunkBaseY,
    -Math.PI / 2,
    trunkLength,
    trunkWidth,
    0,
    4
  );
  treeBranches.push(trunk);

  const heartCenterX = trunkBaseX;
  const heartCenterY = height * 0.36;
  const heartScale = Math.min(width, height) * 0.024;

  const TOTAL_FLOWERS = 620;
  for (let i = 0; i < TOTAL_FLOWERS; i++) {
    const t = Math.random() * Math.PI * 2;
    const rScale = Math.sqrt(Math.random()) * 0.96 + 0.04;
    
    const pt = getHeartPoint(t, heartScale * rScale, heartCenterX, heartCenterY);
    const scatterX = (Math.random() - 0.5) * 16;
    const scatterY = (Math.random() - 0.5) * 16;
    
    const targetSize = Math.random() * 6 + 5.5;
    const delay = Math.floor(Math.random() * 180);

    heartFlowers.push(new HeartFlower(pt.x + scatterX, pt.y + scatterY, targetSize, delay));
  }

  for (let i = 0; i < 40; i++) {
    floatingPetals.push(new FallingPetal(true));
  }
}

function drawTreeBase() {
  const trunkBaseX = width * 0.5;
  const trunkBaseY = height * 0.88;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(trunkBaseX, trunkBaseY + 6, 75, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(100, 70, 40, 0.12)";
  ctx.fill();

  ctx.fillStyle = "#fbc02d";
  for (let i = -5; i <= 5; i++) {
    const ox = trunkBaseX + i * 11 + Math.sin(i * 4) * 5;
    const oy = trunkBaseY + 2 + Math.cos(i * 3) * 6;
    ctx.beginPath();
    ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStaticScene() {
  ctx.clearRect(0, 0, width, height);
  drawTreeBase();
  treeBranches.forEach(b => b.draw());
  heartFlowers.forEach(f => f.draw());
}

function animateTree() {
  ctx.clearRect(0, 0, width, height);

  drawTreeBase();

  let allBranchesFinished = true;
  for (let i = 0; i < treeBranches.length; i++) {
    const branch = treeBranches[i];
    branch.update();
    branch.draw();
    if (!branch.finished) {
      allBranchesFinished = false;
    }
  }

  if (treeBranches.length > 5) {
    if (animationStage === "growing_trunk") {
      animationStage = "blooming";
      setTimeout(() => {
        letterPanel.classList.add("show-content");
      }, 700);
    }
  }

  if (animationStage === "blooming" || animationStage === "completed") {
    let allBloomed = true;
    for (let flower of heartFlowers) {
      flower.update();
      flower.draw();
      if (flower.size < flower.targetSize) {
        allBloomed = false;
      }
    }

    if (allBloomed && animationStage !== "completed") {
      animationStage = "completed";
    }

    for (let petal of floatingPetals) {
      petal.update();
      petal.draw();
    }
  }

  requestAnimationFrame(animateTree);
}

// ============================================================================
// 5. EVENTO DE INICIO AL TOCAR LA FLOR INICIAL
// ============================================================================
function startExperience(e) {
  // Asegurar inicio del audio con máxima prioridad sincrónica dentro del evento del usuario
  try {
    playAudioTrack();
  } catch (err) {
    console.warn("Audio start error:", err);
  }

  introScreen.classList.add("fade-out");
  mainScene.classList.remove("hidden");

  setTimeout(() => {
    document.body.classList.remove("lock-scroll");
    resizeCanvas();
    setupTree();
    animationStage = "growing_trunk";
    animateTree();
    introScreen.style.display = "none";
  }, 400);
}

// Hacer que todo el contenedor de la pantalla de bienvenida o la flor inicie la experiencia
if (flowerBtn) {
  flowerBtn.addEventListener("click", startExperience);
  flowerBtn.addEventListener("pointerdown", (e) => {
    // Pointerdown se dispara antes de click/touchstart y desbloquea el audio de inmediato
    if (!isMusicPlaying && bgMusic) {
      bgMusic.volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;
      bgMusic.play().then(() => {
        isMusicPlaying = true;
        musicIcon.textContent = "🔊";
      }).catch(() => {});
    }
  });
}

// Respaldo: si el usuario hace clic en cualquier parte de la pantalla de bienvenida
if (introScreen) {
  introScreen.addEventListener("click", (e) => {
    if (animationStage === "idle") {
      startExperience(e);
    }
  });
}

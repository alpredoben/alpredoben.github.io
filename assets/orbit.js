'use strict';

// Background MP3 Audio Setup
const bgAudio = new Audio('./assets/background.mp3');
bgAudio.loop = true;
bgAudio.volume = 0.4;

let isAudioPlaying = false;

function startBackgroundAudio() {
  if (!isAudioPlaying) {
    bgAudio
      .play()
      .then(() => {
        isAudioPlaying = true;
        soundEnabled = true;
        const soundIcon = document.getElementById('sound-icon');
        if (soundIcon) {
          soundIcon.className = 'fa-solid fa-volume-high text-amber-400';
        }
      })
      .catch((err) => {
        console.log(
          'Autoplay dicegah oleh browser, menunggu interaksi pengguna:',
          err
        );
      });
  }
}

window.addEventListener('load', () => {
  startBackgroundAudio();
});

const handleFirstInteraction = () => {
  startBackgroundAudio();
  window.removeEventListener('click', handleFirstInteraction);
  window.removeEventListener('keydown', handleFirstInteraction);
  window.removeEventListener('touchstart', handleFirstInteraction);
};

window.addEventListener('click', handleFirstInteraction);
window.addEventListener('keydown', handleFirstInteraction);
window.addEventListener('touchstart', handleFirstInteraction);

// Web Audio Synthesizer State
let audioCtx = null;
let soundEnabled = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSpaceTone(freq, duration = 0.15, type = 'sine') {
  if (!soundEnabled) return;
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration
    );
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Sound Toggle Button
const soundBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      initAudio();
      bgAudio.play();
      isAudioPlaying = true;
      soundIcon.className = 'fa-solid fa-volume-high text-amber-400';
      playSpaceTone(523.25, 0.2);
    } else {
      bgAudio.pause();
      isAudioPlaying = false;
      soundIcon.className = 'fa-solid fa-volume-xmark text-gray-300';
    }
  });
}

// Custom Mouse Cursor
const cursorDot = document.getElementById('space-cursor-dot');
window.addEventListener('mousemove', (e) => {
  if (cursorDot) {
    cursorDot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }
});

// THREE.JS SCENE SETUP
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
const defaultCamPos = new THREE.Vector3(0, 120, 260);
camera.position.copy(defaultCamPos);

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
if (container) {
  container.appendChild(renderer.domElement);
}

// OrbitControls with Safe Fallback
let controls;
try {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 600;
  controls.minDistance = 15;
  controls.maxPolarAngle = Math.PI / 2 + 0.1;
} catch (e) {
  console.error('Gagal memuat OrbitControls:', e);
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x222233, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffaa00, 3.5, 800);
scene.add(sunLight);

// STARFIELD PARTICLES
function createStarfield() {
  const starGeo = new THREE.BufferGeometry();
  const count = 4000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 1200;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.2,
    transparent: true,
    opacity: 0.8,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);
}
createStarfield();

// PLANET DATA DEFINITION
let speedMultiplier = 1;
const planetData = [
  {
    name: 'MATAHARI',
    radius: 14,
    distance: 0,
    speed: 0,
    color: 0xffaa00,
    emissive: true,
  },
  {
    name: 'MERKURIUS',
    radius: 2.2,
    distance: 32,
    speed: 0.03,
    color: 0xb5b5b5,
  },
  { name: 'VENUS', radius: 3.5, distance: 50, speed: 0.022, color: 0xe3bb76 },
  { name: 'BUMI', radius: 4.0, distance: 72, speed: 0.016, color: 0x3b82f6 },
  { name: 'MARS', radius: 2.8, distance: 94, speed: 0.012, color: 0xef4444 },
  {
    name: 'YUPITER',
    radius: 8.5,
    distance: 125,
    speed: 0.008,
    color: 0xf97316,
  },
  {
    name: 'SATURNUS',
    radius: 7.0,
    distance: 160,
    speed: 0.005,
    color: 0xeab308,
    ring: true,
  },
  {
    name: 'NEPTUNUS',
    radius: 5.5,
    distance: 195,
    speed: 0.003,
    color: 0x06b6d4,
  },
];

const planets = [];

planetData.forEach((data) => {
  const geo = new THREE.SphereGeometry(data.radius, 32, 32);
  let mat;

  if (data.emissive) {
    mat = new THREE.MeshBasicMaterial({ color: data.color });
  } else {
    mat = new THREE.MeshStandardMaterial({
      color: data.color,
      roughness: 0.7,
      metalness: 0.2,
    });
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = {
    name: data.name,
    distance: data.distance,
    speed: data.speed,
    angle: Math.random() * Math.PI * 2,
    radius: data.radius,
  };

  if (data.ring) {
    const ringGeo = new THREE.RingGeometry(
      data.radius * 1.4,
      data.radius * 2.3,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    mesh.add(ring);
  }

  scene.add(mesh);
  planets.push(mesh);

  if (data.distance > 0) {
    const orbitGeo = new THREE.BufferGeometry();
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(theta) * data.distance,
          0,
          Math.sin(theta) * data.distance
        )
      );
    }
    orbitGeo.setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);
  }
});

// RAYCASTING
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredPlanet = null;
const reticle = document.getElementById('hud-reticle');
const reticleLabel = document.getElementById('reticle-label');
const activeHoverInfo = document.getElementById('active-hover-info');

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

window.addEventListener('click', (e) => {
  if (e.target.closest('header, button, .modal-overlay, #contact-form')) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const targetPlanet = intersects[0].object;
    openPlanetModal(targetPlanet.userData.name, targetPlanet);
  }
});

function openPlanetModal(planetName, planetMesh = null) {
  playSpaceTone(880, 0.3, 'sawtooth');

  const warpOverlay = document.getElementById('warp-overlay');
  if (warpOverlay) {
    warpOverlay.classList.add('active');
    setTimeout(() => warpOverlay.classList.remove('active'), 500);
  }

  const p =
    planetMesh || planets.find((item) => item.userData.name === planetName);
  if (p) {
    const targetPos = new THREE.Vector3();
    p.getWorldPosition(targetPos);

    const offset = p.userData.distance === 0 ? 40 : p.userData.radius * 5;
    const camTarget = new THREE.Vector3(
      targetPos.x + offset,
      targetPos.y + offset * 0.5,
      targetPos.z + offset
    );

    let progress = 0;
    const startPos = camera.position.clone();
    const startLook = controls ? controls.target.clone() : new THREE.Vector3();

    function fly() {
      progress += 0.05;
      camera.position.lerpVectors(startPos, camTarget, progress);
      if (controls) {
        controls.target.lerpVectors(startLook, targetPos, progress);
        controls.update();
      }

      if (progress < 1) {
        requestAnimationFrame(fly);
      } else {
        const modal = document.getElementById(`modal-${planetName}`);
        if (modal) modal.classList.add('active');
      }
    }
    fly();
  }
}

document.querySelectorAll('.planet-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const planet = btn.getAttribute('data-planet');
    openPlanetModal(planet);
    const mobileMenu = document.getElementById('mobile-planet-menu');
    if (mobileMenu) mobileMenu.classList.add('hidden');
  });
});

document.querySelectorAll('.close-modal-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.modal-overlay')
      .forEach((m) => m.classList.remove('active'));
    resetCameraView();
  });
});

function resetCameraView() {
  playSpaceTone(440, 0.2);
  let progress = 0;
  const startPos = camera.position.clone();
  const startLook = controls ? controls.target.clone() : new THREE.Vector3();
  const targetLook = new THREE.Vector3(0, 0, 0);

  function resetFly() {
    progress += 0.04;
    camera.position.lerpVectors(startPos, defaultCamPos, progress);
    if (controls) {
      controls.target.lerpVectors(startLook, targetLook, progress);
      controls.update();
    }

    if (progress < 1) {
      requestAnimationFrame(resetFly);
    }
  }
  resetFly();
}

document
  .getElementById('reset-camera-btn')
  ?.addEventListener('click', resetCameraView);
document
  .getElementById('reset-cam-logo')
  ?.addEventListener('click', resetCameraView);

const speedBtn = document.getElementById('speed-toggle-btn');
const speedLabel = document.getElementById('speed-label');
let speedState = 1;

if (speedBtn) {
  speedBtn.addEventListener('click', () => {
    speedState = (speedState % 3) + 1;
    if (speedState === 1) {
      speedMultiplier = 1;
      if (speedLabel) speedLabel.innerText = 'ORBIT 1X';
    } else if (speedState === 2) {
      speedMultiplier = 3;
      if (speedLabel) speedLabel.innerText = 'ORBIT 3X';
    } else {
      speedMultiplier = 0;
      if (speedLabel) speedLabel.innerText = 'PAUSE ORBIT';
    }
    playSpaceTone(659.25, 0.15);
  });
}

const viewAngleBtn = document.getElementById('view-angle-btn');
const viewModeLabel = document.getElementById('view-mode-label');
let viewMode = 0;

if (viewAngleBtn) {
  viewAngleBtn.addEventListener('click', () => {
    viewMode = (viewMode + 1) % 3;
    if (viewMode === 0) {
      camera.position.set(0, 120, 260);
      if (viewModeLabel) viewModeLabel.innerText = 'PERSPEKTIF 3D';
    } else if (viewMode === 1) {
      camera.position.set(0, 280, 0.1);
      if (viewModeLabel) viewModeLabel.innerText = 'TOP-DOWN VIEW';
    } else {
      camera.position.set(220, 150, 220);
      if (viewModeLabel) viewModeLabel.innerText = 'ISOMETRIK DEEP';
    }
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
    playSpaceTone(587.33, 0.15);
  });
}

document
  .getElementById('mobile-planet-trigger')
  ?.addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobile-planet-menu');
    if (mobileMenu) mobileMenu.classList.toggle('hidden');
  });

document.getElementById('contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = document.getElementById('contact-submit');
  if (!btn) return;
  btn.innerText = 'MEMPROSES TRANSMISI SINYAL...';

  setTimeout(() => {
    btn.innerText = 'TRANSMISI RDM TERKIRIM!';
    if (typeof confetti === 'function') {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
    playSpaceTone(1046.5, 0.4);
    e.target.reset();

    setTimeout(() => {
      btn.innerText = 'KIRIM TRANSMISI SINYAL RDM';
    }, 3000);
  }, 1000);
});

// ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  planets.forEach((p) => {
    if (p.userData.distance > 0) {
      p.userData.angle += p.userData.speed * 0.2 * speedMultiplier;
      p.position.x = Math.cos(p.userData.angle) * p.userData.distance;
      p.position.z = Math.sin(p.userData.angle) * p.userData.distance;
    }
    p.rotation.y += 0.01;
  });

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const target = intersects[0].object;
    if (hoveredPlanet !== target) {
      hoveredPlanet = target;
      playSpaceTone(783.99, 0.08);
    }

    const screenPos = target.position.clone().project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    if (reticle) {
      reticle.style.left = `${x}px`;
      reticle.style.top = `${y}px`;
      reticle.style.opacity = '1';
    }
    if (reticleLabel)
      reticleLabel.innerText = `TARGET: ${target.userData.name}`;
    if (activeHoverInfo)
      activeHoverInfo.innerText = `TARGET PLANET: ${target.userData.name} (KLIK UNTUK MEMBUKA)`;
  } else {
    hoveredPlanet = null;
    if (reticle) reticle.style.opacity = '0';
    if (activeHoverInfo)
      activeHoverInfo.innerText = `EKSPLORASI MODUL ARSITEKTUR RDM`;
  }

  if (controls) controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

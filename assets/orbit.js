'use strict';
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

// Sound Switch Button
const soundBtn = document.getElementById('sound-toggle-btn');
const soundIcon = document.getElementById('sound-icon');
soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  if (soundEnabled) {
    initAudio();
    soundIcon.className = 'fa-solid fa-volume-high text-amber-400';
    playSpaceTone(523.25, 0.2);
  } else {
    soundIcon.className = 'fa-solid fa-volume-xmark text-gray-300';
  }
});

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
container.appendChild(renderer.domElement);

// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 600;
controls.minDistance = 15;
controls.maxPolarAngle = Math.PI / 2 + 0.1;

// Lighting
const ambientLight = new THREE.AmbientLight(0x222233, 1.2);
scene.add(ambientLight);

// Sun Glow Point Light
const sunLight = new THREE.PointLight(0xffaa00, 3.5, 800);
scene.add(sunLight);

// STARFIELD PARTICLES CANVAS PROCEDURAL
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

// PLANET DATA DEFINITION & PROCEDURAL GENERATION
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
  {
    name: 'VENUS',
    radius: 3.5,
    distance: 50,
    speed: 0.022,
    color: 0xe3bb76,
  },
  {
    name: 'BUMI',
    radius: 4.0,
    distance: 72,
    speed: 0.016,
    color: 0x3b82f6,
  },
  {
    name: 'MARS',
    radius: 2.8,
    distance: 94,
    speed: 0.012,
    color: 0xef4444,
  },
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
const orbitLines = [];

planetData.forEach((data) => {
  // Planet Mesh
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

  // Saturn Rings
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

  // Orbit Path Elliptical Line (Lintasan Orbit)
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
    orbitLines.push({ mesh: orbitLine, defaultOpacity: 0.18 });
  }
});

// RAYCASTING FOR INTERACTION
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

// PLANET HOVER & CLICK HANDLERS
window.addEventListener('click', (e) => {
  // Ignore click if UI element clicked
  if (e.target.closest('header, button, .modal-overlay, #contact-form')) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const targetPlanet = intersects[0].object;
    openPlanetModal(targetPlanet.userData.name, targetPlanet);
  }
});

// Quick-Jump Selector & Modal Trigger
function openPlanetModal(planetName, planetMesh = null) {
  playSpaceTone(880, 0.3, 'sawtooth');

  // Warp Overlay Animation
  const warpOverlay = document.getElementById('warp-overlay');
  warpOverlay.classList.add('active');
  setTimeout(() => warpOverlay.classList.remove('active'), 500);

  // Zoom Camera to Planet
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

    // Smooth Camera Tween
    let progress = 0;
    const startPos = camera.position.clone();
    const startLook = controls.target.clone();

    function fly() {
      progress += 0.05;
      camera.position.lerpVectors(startPos, camTarget, progress);
      controls.target.lerpVectors(startLook, targetPos, progress);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(fly);
      } else {
        // Open Overlay Modal
        const modal = document.getElementById(`modal-${planetName}`);
        if (modal) modal.classList.add('active');
      }
    }
    fly();
  }
}

// Attach buttons
document.querySelectorAll('.planet-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const planet = btn.getAttribute('data-planet');
    openPlanetModal(planet);
    document.getElementById('mobile-planet-menu').classList.add('hidden');
  });
});

// Close Modal & Back to Solar Orbit View Button
document.querySelectorAll('.close-modal-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document
      .querySelectorAll('.modal-overlay')
      .forEach((m) => m.classList.remove('active'));
    resetCameraView();
  });
});

// Reset Camera
function resetCameraView() {
  playSpaceTone(440, 0.2);
  let progress = 0;
  const startPos = camera.position.clone();
  const startLook = controls.target.clone();
  const targetLook = new THREE.Vector3(0, 0, 0);

  function resetFly() {
    progress += 0.04;
    camera.position.lerpVectors(startPos, defaultCamPos, progress);
    controls.target.lerpVectors(startLook, targetLook, progress);
    controls.update();

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

// Speed Toggle Controls
const speedBtn = document.getElementById('speed-toggle-btn');
const speedLabel = document.getElementById('speed-label');
let speedState = 1;

speedBtn.addEventListener('click', () => {
  speedState = (speedState % 3) + 1;
  if (speedState === 1) {
    speedMultiplier = 1;
    speedLabel.innerText = 'ORBIT 1X';
  } else if (speedState === 2) {
    speedMultiplier = 3;
    speedLabel.innerText = 'ORBIT 3X';
  } else {
    speedMultiplier = 0;
    speedLabel.innerText = 'PAUSE ORBIT';
  }
  playSpaceTone(659.25, 0.15);
});

// Camera View Mode Switcher
const viewAngleBtn = document.getElementById('view-angle-btn');
const viewModeLabel = document.getElementById('view-mode-label');
let viewMode = 0;

viewAngleBtn.addEventListener('click', () => {
  viewMode = (viewMode + 1) % 3;
  if (viewMode === 0) {
    camera.position.set(0, 120, 260);
    viewModeLabel.innerText = 'PERSPEKTIF 3D';
  } else if (viewMode === 1) {
    camera.position.set(0, 280, 0.1);
    viewModeLabel.innerText = 'TOP-DOWN VIEW';
  } else {
    camera.position.set(220, 150, 220);
    viewModeLabel.innerText = 'ISOMETRIK DEEP';
  }
  controls.target.set(0, 0, 0);
  controls.update();
  playSpaceTone(587.33, 0.15);
});

// Mobile Dropdown Toggle
document
  .getElementById('mobile-planet-trigger')
  ?.addEventListener('click', () => {
    document.getElementById('mobile-planet-menu').classList.toggle('hidden');
  });

// Contact Form Submit Handler
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = document.getElementById('contact-submit');
  btn.innerText = 'MEMPROSES TRANSMISI SINYAL...';

  setTimeout(() => {
    btn.innerText = 'TRANSMISI NEPTUNUS TERKIRIM!';
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    playSpaceTone(1046.5, 0.4);
    e.target.reset();

    setTimeout(() => {
      btn.innerText = 'KIRIM TRANSMISI SINYAL NEPTUNUS';
    }, 3000);
  }, 1000);
});

// RENDER / ANIMATION LOOP
function animate() {
  requestAnimationFrame(animate);

  // Orbit Rotation Motion
  planets.forEach((p) => {
    if (p.userData.distance > 0) {
      p.userData.angle += p.userData.speed * 0.2 * speedMultiplier;
      p.position.x = Math.cos(p.userData.angle) * p.userData.distance;
      p.position.z = Math.sin(p.userData.angle) * p.userData.distance;
    }
    p.rotation.y += 0.01;
  });

  // Raycasting Target Highlight
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets);

  if (intersects.length > 0) {
    const target = intersects[0].object;
    if (hoveredPlanet !== target) {
      hoveredPlanet = target;
      playSpaceTone(783.99, 0.08);
    }

    // Project 3D vector to 2D Screen
    const screenPos = target.position.clone().project(camera);
    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;

    reticle.style.left = `${x}px`;
    reticle.style.top = `${y}px`;
    reticle.style.opacity = '1';
    reticleLabel.innerText = `TARGET: ${target.userData.name}`;
    activeHoverInfo.innerText = `TARGET PLANET: ${target.userData.name} (KLIK UNTUK MEMBUKA)`;
  } else {
    hoveredPlanet = null;
    reticle.style.opacity = '0';
    activeHoverInfo.innerText = `MENGORBIT REVOLUSI REAL-TIME`;
  }

  controls.update();
  renderer.render(scene, camera);
}

// RESIZE WINDOW HANDLER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// START SYSTEM
animate();

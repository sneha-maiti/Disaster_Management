/* ==========================================================================
   CRISISSYNC - EXACT MILITARY COMMAND CENTER LOGIN JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 1. Render Photorealistic Command Room & World Map Canvas
  initCommandCenterCanvas();

  // 2. Real-time UTC Clock Ticker
  initUTCTicker();

  // 3. Telemetry Pulser
  initTelemetryPulser();
});

/* --------------------------------------------------------------------------
   1. HIGH-FIDELITY COMMAND ROOM & WORLD MAP CANVAS
   -------------------------------------------------------------------------- */
function initCommandCenterCanvas() {
  const canvas = document.getElementById('world-map-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;

  function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Low-res continent dot matrix paths (Normalized coordinates 0..1 scale)
  const continentDots = generateWorldMapDots();

  // Target Crisis Nodes (Exact locations from reference image)
  const targetNodes = [
    { x: 0.24, y: 0.36, label: 'NORTH AMERICA' },
    { x: 0.32, y: 0.65, label: 'SOUTH AMERICA' },
    { x: 0.48, y: 0.32, label: 'EUROPE' },
    { x: 0.54, y: 0.58, label: 'AFRICA' },
    { x: 0.72, y: 0.38, label: 'SOUTH ASIA' },
    { x: 0.81, y: 0.40, label: 'EAST ASIA' },
    { x: 0.85, y: 0.72, label: 'AUSTRALIA' }
  ];

  let pulseAngle = 0;

  function drawCommandRoom() {
    ctx.clearRect(0, 0, width, height);

    // A. Draw Curved Overhead Command Ceiling & Wall Arches
    drawCeilingStructure(ctx, width, height);

    // B. Draw Hexagonal / Quadrilateral Floor Grid
    drawFloorGrid(ctx, width, height);

    // C. Draw World Map Dot Matrix Continents
    ctx.fillStyle = 'rgba(0, 210, 255, 0.45)';
    continentDots.forEach(dot => {
      const px = dot.x * width;
      const py = dot.y * height * 0.75 + height * 0.08;
      ctx.beginPath();
      ctx.arc(px, py, 1.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // D. Draw Connecting Cyber Lines between continents
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let i = 0; i < targetNodes.length - 1; i++) {
      const p1 = targetNodes[i];
      const p2 = targetNodes[i + 1];
      const x1 = p1.x * width;
      const y1 = p1.y * height * 0.75 + height * 0.08;
      const x2 = p2.x * width;
      const y2 = p2.y * height * 0.75 + height * 0.08;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // E. Draw Pulsing Red Crisis Target Reticles with Concentric Rings
    pulseAngle += 0.04;
    targetNodes.forEach((node, idx) => {
      const cx = node.x * width;
      const cy = node.y * height * 0.75 + height * 0.08;

      const offset = idx * 0.8;
      const radius = 12 + Math.sin(pulseAngle + offset) * 5;

      // Outer Red Pulsing Aura
      const auraGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius * 2.5);
      auraGrad.addColorStop(0, 'rgba(255, 42, 75, 0.7)');
      auraGrad.addColorStop(0.5, 'rgba(255, 42, 75, 0.2)');
      auraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Concentric Target Rings
      ctx.strokeStyle = 'rgba(255, 42, 75, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.6, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = 'rgba(255, 42, 75, 0.8)';
      ctx.beginPath();
      ctx.moveTo(cx - radius * 2, cy);
      ctx.lineTo(cx + radius * 2, cy);
      ctx.moveTo(cx, cy - radius * 2);
      ctx.lineTo(cx, cy + radius * 2);
      ctx.stroke();

      // Bright Core Red Dot
      ctx.fillStyle = '#ff2a4b';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(drawCommandRoom);
  }

  requestAnimationFrame(drawCommandRoom);
}

// Generate Dotted World Map Coordinates Matrix
function generateWorldMapDots() {
  const dots = [];
  // North America
  for (let x = 0.15; x <= 0.32; x += 0.012) {
    for (let y = 0.22; y <= 0.48; y += 0.018) {
      if (Math.random() > 0.35) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  // South America
  for (let x = 0.28; x <= 0.38; x += 0.012) {
    for (let y = 0.52; y <= 0.82; y += 0.018) {
      if (Math.random() > 0.4) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  // Europe
  for (let x = 0.44; x <= 0.56; x += 0.012) {
    for (let y = 0.20; y <= 0.40; y += 0.018) {
      if (Math.random() > 0.3) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  // Africa
  for (let x = 0.46; x <= 0.58; x += 0.012) {
    for (let y = 0.44; y <= 0.74; y += 0.018) {
      if (Math.random() > 0.35) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  // Asia
  for (let x = 0.58; x <= 0.88; x += 0.012) {
    for (let y = 0.18; y <= 0.52; y += 0.018) {
      if (Math.random() > 0.3) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  // Australia
  for (let x = 0.78; x <= 0.90; x += 0.012) {
    for (let y = 0.62; y <= 0.84; y += 0.018) {
      if (Math.random() > 0.35) dots.push({ x: x + Math.random() * 0.005, y: y + Math.random() * 0.005 });
    }
  }
  return dots;
}

// Draw Ceiling Structure of Command Center
function drawCeilingStructure(ctx, w, h) {
  // Top Arch Ceiling Frame
  const gradCeiling = ctx.createLinearGradient(0, 0, 0, h * 0.25);
  gradCeiling.addColorStop(0, '#040914');
  gradCeiling.addColorStop(1, 'transparent');

  ctx.fillStyle = gradCeiling;
  ctx.fillRect(0, 0, w, h * 0.25);

  // Ceiling Curved Metal Beams
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.ellipse(w / 2, 0, w * 0.6, h * 0.18, 0, 0, Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(w / 2, 0, w * 0.75, h * 0.24, 0, 0, Math.PI);
  ctx.stroke();

  // Side Monitor Console Lights
  ctx.fillStyle = 'rgba(255, 42, 75, 0.4)';
  ctx.beginPath();
  ctx.arc(w * 0.05, h * 0.85, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(w * 0.95, h * 0.85, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Draw Hexagonal / Perspective Floor Lines
function drawFloorGrid(ctx, w, h) {
  const floorY = h * 0.78;
  const gradFloor = ctx.createLinearGradient(0, floorY, 0, h);
  gradFloor.addColorStop(0, 'rgba(0, 240, 255, 0.02)');
  gradFloor.addColorStop(1, 'rgba(0, 240, 255, 0.15)');

  ctx.fillStyle = gradFloor;
  ctx.fillRect(0, floorY, w, h - floorY);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
  ctx.lineWidth = 1;

  // Perspective Vanishing Lines to Center Bottom
  const vanishX = w / 2;
  const vanishY = floorY;

  for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
    ctx.beginPath();
    ctx.moveTo(vanishX, vanishY);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Horizontal Grid Ring Lines
  for (let y = floorY; y < h; y += (h - floorY) / 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

/* --------------------------------------------------------------------------
   2. REAL-TIME UTC CLOCK TICKER
   -------------------------------------------------------------------------- */
function initUTCTicker() {
  const clockEl = document.getElementById('utc-clock-value');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const isoStr = now.toISOString().replace('T', ' ').substring(0, 19);
    clockEl.innerText = `UTC ${isoStr}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
}

/* --------------------------------------------------------------------------
   3. PASSWORD VISIBILITY TOGGLE
   -------------------------------------------------------------------------- */
function togglePasswordVisibility() {
  const pinInput = document.getElementById('access-pin-input');
  const eyeIcon = document.getElementById('toggle-eye-icon');

  if (!pinInput || !eyeIcon) return;

  if (pinInput.type === 'password') {
    pinInput.type = 'text';
    eyeIcon.setAttribute('data-lucide', 'eye-off');
  } else {
    pinInput.type = 'password';
    eyeIcon.setAttribute('data-lucide', 'eye');
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* --------------------------------------------------------------------------
   4. BIOMETRIC FINGERPRINT SCANNER SIMULATION
   -------------------------------------------------------------------------- */
function triggerBiometricScan() {
  const titleEl = document.getElementById('bio-scan-title');
  const subEl = document.getElementById('bio-scan-sub');
  const scannerBox = document.getElementById('bio-scanner-box');

  if (!titleEl || !subEl) return;

  titleEl.innerText = 'SCANNING FINGERPRINT...';
  subEl.innerText = 'VERIFYING HARDWARE BIOMETRICS';
  if (scannerBox) scannerBox.style.borderColor = 'var(--cyan-bright)';

  let count = 0;
  const interval = setInterval(() => {
    count += 25;
    if (count >= 100) {
      clearInterval(interval);
      titleEl.innerText = 'BIOMETRIC VERIFIED';
      titleEl.style.color = 'var(--emerald)';
      subEl.innerText = 'CLEARANCE GRANTED // ACCESSED';

      const idInput = document.getElementById('emergency-id-input');
      const pinInput = document.getElementById('access-pin-input');
      if (idInput) idInput.value = 'DM-7842-ALPHA';
      if (pinInput) pinInput.value = 'TacticalPIN2026';

      setTimeout(() => {
        titleEl.innerText = 'PLACE FINGER ON SCAN';
        titleEl.style.color = 'var(--cyan)';
        subEl.innerText = 'OR TAP TO INITIATE';
        if (scannerBox) scannerBox.style.borderColor = 'var(--border-cyan)';
      }, 3500);
    }
  }, 250);
}

/* --------------------------------------------------------------------------
   5. FORM SUBMISSION HANDLER
   -------------------------------------------------------------------------- */
function handleLoginSubmit(event) {
  event.preventDefault();

  const submitBtn = document.getElementById('btn-login-main');
  if (submitBtn) {
    submitBtn.innerHTML = `
      <i data-lucide="loader" class="spin" style="width: 20px; height: 20px;"></i>
      <span>AUTHENTICATING...</span>
    `;
    if (window.lucide) lucide.createIcons();
    submitBtn.disabled = true;
  }

  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1200);
}

/* --------------------------------------------------------------------------
   6. DYNAMIC TELEMETRY PULSER
   -------------------------------------------------------------------------- */
function initTelemetryPulser() {
  setInterval(() => {
    const rescueEl = document.getElementById('val-rescue-ops-num');
    if (rescueEl) {
      const count = 143 + Math.floor(Math.random() * 5);
      rescueEl.innerText = count;
    }
  }, 4000);
}

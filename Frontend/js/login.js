/* ==========================================================================
   AETHERX - HIGH-FIDELITY COMMAND CENTER LOGIN JAVASCRIPT
   Realistic Flat 2D World Map with Vector Continent Outlines,
   Dense Dot Matrix Fill, Crisis Reticles, and Data Connections
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  initCommandCenterCanvas();
  initUTCTicker();
  initTelemetryPulser();
});

/* --------------------------------------------------------------------------
   1. REALISTIC FLAT 2D WORLD MAP ENGINE
   -------------------------------------------------------------------------- */
function initCommandCenterCanvas() {
  const canvas = document.getElementById('world-map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  // Map projection bounds (Mercator-like, normalized 0..1)
  const MAP_LEFT = 0.04;
  const MAP_RIGHT = 0.96;
  const MAP_TOP = 0.06;
  const MAP_BOT = 0.76;

  function lonToX(lon) { return MAP_LEFT + ((lon + 180) / 360) * (MAP_RIGHT - MAP_LEFT); }
  function latToY(lat) { return MAP_TOP + ((90 - lat) / 180) * (MAP_BOT - MAP_TOP); }

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // --- CONTINENT OUTLINE COORDINATES (Simplified Real-World Polygons) ---
  // Each continent is an array of {lat, lon} forming a closed polygon outline.

  const northAmerica = [
    {lat:49,lon:-125},{lat:54,lon:-130},{lat:58,lon:-137},{lat:60,lon:-141},
    {lat:64,lon:-142},{lat:68,lon:-162},{lat:71,lon:-157},{lat:71,lon:-153},
    {lat:70,lon:-142},{lat:69,lon:-131},{lat:67,lon:-137},{lat:65,lon:-127},
    {lat:62,lon:-115},{lat:60,lon:-112},{lat:60,lon:-95},{lat:63,lon:-92},
    {lat:64,lon:-88},{lat:63,lon:-82},{lat:60,lon:-78},{lat:58,lon:-68},
    {lat:55,lon:-60},{lat:52,lon:-56},{lat:47,lon:-53},{lat:44,lon:-59},
    {lat:43,lon:-66},{lat:41,lon:-70},{lat:38,lon:-75},{lat:35,lon:-76},
    {lat:31,lon:-81},{lat:25,lon:-80},{lat:24,lon:-82},{lat:26,lon:-82},
    {lat:30,lon:-84},{lat:29,lon:-89},{lat:26,lon:-90},{lat:26,lon:-97},
    {lat:22,lon:-97},{lat:19,lon:-96},{lat:16,lon:-96},{lat:15,lon:-92},
    {lat:14,lon:-87},{lat:10,lon:-84},{lat:8,lon:-77},{lat:8,lon:-77},
    {lat:10,lon:-75},{lat:12,lon:-72},{lat:12,lon:-68},{lat:11,lon:-62},
    {lat:13,lon:-60},{lat:18,lon:-63},{lat:18,lon:-72},{lat:20,lon:-74},
    {lat:23,lon:-84},{lat:22,lon:-87},{lat:21,lon:-90},{lat:19,lon:-91},
    {lat:31,lon:-106},{lat:32,lon:-117},{lat:35,lon:-119},{lat:38,lon:-123},
    {lat:42,lon:-124},{lat:46,lon:-124},{lat:49,lon:-125}
  ];

  const southAmerica = [
    {lat:12,lon:-72},{lat:10,lon:-76},{lat:8,lon:-77},{lat:4,lon:-78},
    {lat:1,lon:-80},{lat:-2,lon:-80},{lat:-5,lon:-81},{lat:-7,lon:-79},
    {lat:-14,lon:-76},{lat:-18,lon:-70},{lat:-23,lon:-70},{lat:-27,lon:-71},
    {lat:-33,lon:-72},{lat:-40,lon:-73},{lat:-46,lon:-76},{lat:-52,lon:-74},
    {lat:-55,lon:-68},{lat:-54,lon:-66},{lat:-52,lon:-69},{lat:-48,lon:-66},
    {lat:-42,lon:-63},{lat:-38,lon:-57},{lat:-35,lon:-57},{lat:-33,lon:-53},
    {lat:-28,lon:-49},{lat:-23,lon:-44},{lat:-18,lon:-39},{lat:-13,lon:-38},
    {lat:-8,lon:-35},{lat:-5,lon:-35},{lat:-2,lon:-42},{lat:0,lon:-48},
    {lat:2,lon:-51},{lat:5,lon:-52},{lat:7,lon:-60},{lat:10,lon:-62},
    {lat:11,lon:-62},{lat:12,lon:-68},{lat:12,lon:-72}
  ];

  const europe = [
    {lat:36,lon:-9},{lat:38,lon:-9},{lat:43,lon:-9},{lat:44,lon:-1},
    {lat:46,lon:-1},{lat:48,lon:-5},{lat:48,lon:-1},{lat:51,lon:2},
    {lat:53,lon:5},{lat:54,lon:9},{lat:56,lon:8},{lat:58,lon:6},
    {lat:63,lon:5},{lat:65,lon:12},{lat:69,lon:16},{lat:71,lon:26},
    {lat:70,lon:30},{lat:68,lon:28},{lat:65,lon:25},{lat:62,lon:25},
    {lat:60,lon:28},{lat:60,lon:24},{lat:56,lon:21},{lat:55,lon:14},
    {lat:53,lon:14},{lat:51,lon:12},{lat:49,lon:17},{lat:47,lon:18},
    {lat:45,lon:14},{lat:41,lon:16},{lat:40,lon:18},{lat:38,lon:24},
    {lat:36,lon:28},{lat:35,lon:25},{lat:37,lon:22},{lat:38,lon:20},
    {lat:40,lon:20},{lat:39,lon:16},{lat:38,lon:13},{lat:37,lon:15},
    {lat:36,lon:15},{lat:39,lon:9},{lat:41,lon:9},{lat:44,lon:9},
    {lat:43,lon:3},{lat:42,lon:3},{lat:37,lon:-2},{lat:36,lon:-6},
    {lat:36,lon:-9}
  ];

  const africa = [
    {lat:37,lon:-1},{lat:36,lon:0},{lat:35,lon:10},{lat:33,lon:11},
    {lat:32,lon:13},{lat:31,lon:32},{lat:27,lon:34},{lat:22,lon:37},
    {lat:15,lon:42},{lat:12,lon:43},{lat:11,lon:51},{lat:5,lon:48},
    {lat:2,lon:42},{lat:-1,lon:42},{lat:-4,lon:40},{lat:-10,lon:40},
    {lat:-15,lon:41},{lat:-25,lon:35},{lat:-27,lon:33},{lat:-31,lon:30},
    {lat:-34,lon:26},{lat:-34,lon:18},{lat:-32,lon:18},{lat:-28,lon:16},
    {lat:-22,lon:14},{lat:-18,lon:12},{lat:-12,lon:13},{lat:-6,lon:12},
    {lat:-1,lon:9},{lat:4,lon:9},{lat:4,lon:7},{lat:7,lon:3},
    {lat:6,lon:1},{lat:5,lon:-4},{lat:5,lon:-8},{lat:8,lon:-13},
    {lat:11,lon:-16},{lat:15,lon:-17},{lat:19,lon:-17},{lat:21,lon:-17},
    {lat:27,lon:-13},{lat:32,lon:-9},{lat:35,lon:-6},{lat:36,lon:-2},
    {lat:37,lon:-1}
  ];

  const asia = [
    {lat:42,lon:28},{lat:41,lon:29},{lat:40,lon:36},{lat:37,lon:36},
    {lat:33,lon:36},{lat:30,lon:34},{lat:26,lon:34},{lat:21,lon:39},
    {lat:16,lon:43},{lat:13,lon:45},{lat:12,lon:50},{lat:15,lon:55},
    {lat:22,lon:59},{lat:25,lon:56},{lat:26,lon:51},{lat:30,lon:48},
    {lat:30,lon:52},{lat:27,lon:57},{lat:25,lon:61},{lat:25,lon:66},
    {lat:23,lon:68},{lat:20,lon:73},{lat:15,lon:74},{lat:8,lon:77},
    {lat:6,lon:80},{lat:8,lon:80},{lat:16,lon:81},{lat:21,lon:88},
    {lat:22,lon:91},{lat:26,lon:90},{lat:28,lon:97},{lat:22,lon:98},
    {lat:15,lon:98},{lat:10,lon:99},{lat:7,lon:100},{lat:2,lon:103},
    {lat:1,lon:104},{lat:-2,lon:106},{lat:-6,lon:106},{lat:-7,lon:110},
    {lat:-8,lon:114},{lat:-8,lon:116},{lat:-6,lon:120},{lat:-5,lon:120},
    {lat:-2,lon:118},{lat:1,lon:118},{lat:2,lon:111},{lat:5,lon:118},
    {lat:7,lon:117},{lat:10,lon:119},{lat:14,lon:121},{lat:18,lon:121},
    {lat:22,lon:121},{lat:25,lon:120},{lat:30,lon:122},{lat:35,lon:120},
    {lat:38,lon:118},{lat:40,lon:122},{lat:42,lon:130},{lat:44,lon:132},
    {lat:46,lon:136},{lat:48,lon:135},{lat:52,lon:141},{lat:55,lon:137},
    {lat:58,lon:140},{lat:60,lon:150},{lat:62,lon:160},{lat:64,lon:170},
    {lat:66,lon:180},{lat:68,lon:180},{lat:70,lon:178},{lat:68,lon:170},
    {lat:65,lon:168},{lat:63,lon:170},{lat:60,lon:166},{lat:58,lon:162},
    {lat:56,lon:155},{lat:52,lon:142},{lat:55,lon:135},{lat:56,lon:125},
    {lat:54,lon:120},{lat:50,lon:117},{lat:48,lon:108},{lat:48,lon:87},
    {lat:50,lon:80},{lat:55,lon:73},{lat:60,lon:70},{lat:65,lon:68},
    {lat:68,lon:55},{lat:70,lon:50},{lat:70,lon:40},{lat:68,lon:35},
    {lat:65,lon:30},{lat:60,lon:30},{lat:58,lon:28},{lat:55,lon:28},
    {lat:52,lon:30},{lat:50,lon:30},{lat:46,lon:30},{lat:44,lon:28},
    {lat:42,lon:28}
  ];

  const australia = [
    {lat:-12,lon:131},{lat:-12,lon:136},{lat:-14,lon:136},{lat:-14,lon:141},
    {lat:-18,lon:146},{lat:-20,lon:149},{lat:-23,lon:150},{lat:-27,lon:153},
    {lat:-33,lon:152},{lat:-35,lon:151},{lat:-38,lon:146},{lat:-39,lon:144},
    {lat:-38,lon:141},{lat:-35,lon:137},{lat:-35,lon:136},{lat:-32,lon:133},
    {lat:-32,lon:131},{lat:-34,lon:123},{lat:-34,lon:119},{lat:-32,lon:116},
    {lat:-28,lon:114},{lat:-24,lon:113},{lat:-22,lon:114},{lat:-18,lon:122},
    {lat:-14,lon:127},{lat:-12,lon:131}
  ];

  const japan = [
    {lat:31,lon:131},{lat:33,lon:130},{lat:34,lon:132},{lat:35,lon:133},
    {lat:36,lon:136},{lat:38,lon:140},{lat:40,lon:140},{lat:41,lon:141},
    {lat:43,lon:145},{lat:44,lon:145},{lat:44,lon:143},{lat:42,lon:140},
    {lat:40,lon:139},{lat:38,lon:139},{lat:35,lon:140},{lat:34,lon:137},
    {lat:33,lon:133},{lat:31,lon:131}
  ];

  const uk = [
    {lat:50,lon:-5},{lat:51,lon:1},{lat:53,lon:0},{lat:54,lon:-1},
    {lat:56,lon:-3},{lat:58,lon:-5},{lat:57,lon:-6},{lat:55,lon:-6},
    {lat:54,lon:-5},{lat:52,lon:-4},{lat:50,lon:-5}
  ];

  const allContinents = [northAmerica, southAmerica, europe, africa, asia, australia, japan, uk];

  // --- CRISIS TARGET NODES ---
  const crisisNodes = [
    { lat: 34.05, lon: -118.24, id: 'INC_401', label: 'LOS ANGELES', status: 'CRITICAL' },
    { lat: -14.24, lon: -51.93, id: 'INC_233', label: 'BRAZIL', status: 'SEVERE' },
    { lat: 51.51, lon: -0.13,   id: 'INC_502', label: 'LONDON', status: 'MONITORING' },
    { lat: 9.08,  lon: 8.68,    id: 'INC_614', label: 'NIGERIA', status: 'CRITICAL' },
    { lat: 35.69, lon: 139.69,  id: 'INC_708', label: 'TOKYO', status: 'HIGH' },
    { lat: 19.08, lon: 72.88,   id: 'INC_402', label: 'MUMBAI', status: 'SEVERE' },
    { lat:-33.87, lon: 151.21,  id: 'INC_890', label: 'SYDNEY', status: 'ACTIVE' }
  ];

  // Pre-generate dense dot fill points for each continent
  const continentDots = [];
  allContinents.forEach(poly => {
    const pts = poly.map(p => ({ x: lonToX(p.lon), y: latToY(p.lat) }));
    const minX = Math.min(...pts.map(p => p.x));
    const maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y));
    const maxY = Math.max(...pts.map(p => p.y));
    const step = 0.0035;
    for (let x = minX; x <= maxX; x += step) {
      for (let y = minY; y <= maxY; y += step) {
        if (pointInPolygon(x, y, pts)) {
          continentDots.push({ x, y });
        }
      }
    }
  });

  // Point-in-polygon ray casting
  function pointInPolygon(px, py, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  let tick = 0;

  // --- MAIN DRAW LOOP ---
  function draw() {
    ctx.clearRect(0, 0, W, H);
    tick += 0.03;

    // A. Command Center Ceiling Arch
    drawCeiling(ctx, W, H);

    // B. Coordinate Grid Overlay (Hex/Square)
    drawCoordinateGrid(ctx, W, H);

    // C. LAT/LONG Edge Markers
    drawLatLonMarkers(ctx, W, H);

    // D. Dense Dot-Matrix Continent Fill
    ctx.fillStyle = 'rgba(0, 200, 240, 0.55)';
    continentDots.forEach(d => {
      ctx.fillRect(d.x * W, d.y * H, 1.5, 1.5);
    });

    // E. Vector Continent Outlines
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    allContinents.forEach(poly => {
      ctx.beginPath();
      poly.forEach((p, i) => {
        const px = lonToX(p.lon) * W;
        const py = latToY(p.lat) * H;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // F. Curved Data Connection Lines between Crisis Nodes
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    for (let i = 0; i < crisisNodes.length - 1; i++) {
      const a = crisisNodes[i];
      const b = crisisNodes[i + 1];
      const ax = lonToX(a.lon) * W, ay = latToY(a.lat) * H;
      const bx = lonToX(b.lon) * W, by = latToY(b.lat) * H;
      const cpx = (ax + bx) / 2;
      const cpy = Math.min(ay, by) - 40;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(cpx, cpy, bx, by);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // G. Crisis Target Reticles with Labels
    crisisNodes.forEach((node, idx) => {
      const cx = lonToX(node.lon) * W;
      const cy = latToY(node.lat) * H;
      const r = 14 + Math.sin(tick * 2.5 + idx * 1.2) * 6;

      // Outer pulsing aura
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 3);
      grad.addColorStop(0, 'rgba(255, 59, 59, 0.85)');
      grad.addColorStop(0.4, 'rgba(255, 59, 59, 0.25)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 3, 0, Math.PI * 2);
      ctx.fill();

      // Concentric rings
      ctx.strokeStyle = 'rgba(255, 59, 59, 0.65)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2); ctx.stroke();

      // Crosshair
      const ch = r * 2.2;
      ctx.strokeStyle = 'rgba(255, 59, 59, 0.8)';
      ctx.beginPath();
      ctx.moveTo(cx - ch, cy); ctx.lineTo(cx + ch, cy);
      ctx.moveTo(cx, cy - ch); ctx.lineTo(cx, cy + ch);
      ctx.stroke();

      // Core dot
      ctx.fillStyle = '#ff3b3b';
      ctx.shadowColor = '#ff3b3b';
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Telemetry Labels
      ctx.font = '600 9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 59, 59, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(`${node.id} // ${node.status}`, cx + ch + 6, cy - 4);
      ctx.fillStyle = 'rgba(0, 220, 255, 0.7)';
      ctx.fillText(`${node.label}`, cx + ch + 6, cy + 8);
    });

    // H. Perspective Floor Grid
    drawFloorGrid(ctx, W, H);

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}

/* COORDINATE GRID OVERLAY */
function drawCoordinateGrid(ctx, W, H) {
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
  ctx.lineWidth = 0.5;
  const stepX = W / 28;
  const stepY = H / 18;

  for (let x = 0; x <= W; x += stepX) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.78); ctx.stroke();
  }
  for (let y = 0; y <= H * 0.78; y += stepY) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

/* LAT/LONG EDGE MARKERS */
function drawLatLonMarkers(ctx, W, H) {
  ctx.font = '500 8px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(0, 200, 240, 0.35)';
  ctx.textAlign = 'center';

  // Top longitude markers
  for (let lon = -150; lon <= 180; lon += 30) {
    const x = (0.04 + ((lon + 180) / 360) * 0.92) * W;
    ctx.fillText(`${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`, x, H * 0.05);
  }

  // Left latitude markers
  ctx.textAlign = 'right';
  for (let lat = 80; lat >= -60; lat -= 20) {
    const y = (0.06 + ((90 - lat) / 180) * 0.70) * H;
    ctx.fillText(`${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`, W * 0.035, y);
  }
}

/* CEILING STRUCTURE */
function drawCeiling(ctx, W, H) {
  const gradCeil = ctx.createLinearGradient(0, 0, 0, H * 0.18);
  gradCeil.addColorStop(0, '#030610');
  gradCeil.addColorStop(1, 'transparent');
  ctx.fillStyle = gradCeil;
  ctx.fillRect(0, 0, W, H * 0.18);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(W / 2, 0, W * 0.6, H * 0.16, 0, 0, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(W / 2, 0, W * 0.78, H * 0.22, 0, 0, Math.PI); ctx.stroke();

  // Thin horizontal accent line (red)
  ctx.strokeStyle = 'rgba(255, 59, 59, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(W, 3); ctx.stroke();
}

/* PERSPECTIVE FLOOR GRID */
function drawFloorGrid(ctx, W, H) {
  const floorY = H * 0.78;
  const gradFloor = ctx.createLinearGradient(0, floorY, 0, H);
  gradFloor.addColorStop(0, 'rgba(0, 240, 255, 0.02)');
  gradFloor.addColorStop(1, 'rgba(0, 240, 255, 0.18)');
  ctx.fillStyle = gradFloor;
  ctx.fillRect(0, floorY, W, H - floorY);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1;
  const vanishX = W / 2;

  for (let x = -W * 0.5; x <= W * 1.5; x += W * 0.07) {
    ctx.beginPath(); ctx.moveTo(vanishX, floorY); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = floorY; y < H; y += (H - floorY) / 6) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

/* --------------------------------------------------------------------------
   2. REAL-TIME UTC CLOCK
   -------------------------------------------------------------------------- */
function initUTCTicker() {
  const el = document.getElementById('utc-clock-value');
  if (!el) return;
  function update() {
    el.innerText = `UTC ${new Date().toISOString().replace('T', ' ').substring(0, 19)}`;
  }
  update();
  setInterval(update, 1000);
}

/* --------------------------------------------------------------------------
   3. PASSWORD VISIBILITY TOGGLE
   -------------------------------------------------------------------------- */
function togglePasswordVisibility() {
  const pin = document.getElementById('access-pin-input');
  const icon = document.getElementById('toggle-eye-icon');
  if (!pin || !icon) return;
  pin.type = pin.type === 'password' ? 'text' : 'password';
  icon.setAttribute('data-lucide', pin.type === 'password' ? 'eye' : 'eye-off');
  if (window.lucide) lucide.createIcons();
}

/* --------------------------------------------------------------------------
   4. OAUTH SOCIAL LOGIN HANDLER
   -------------------------------------------------------------------------- */
function handleOAuthLogin(provider) {
  const btn = document.getElementById('btn-login-main');
  if (btn) {
    btn.innerHTML = `<span>AUTHENTICATING VIA ${provider.toUpperCase()}...</span>`;
    btn.disabled = true;
  }
  sessionStorage.setItem('aetherx_member_login', JSON.stringify({
    memberId: `${provider.toUpperCase()}-OP-7842`,
    name: `${provider} Operator`,
    provider: provider,
    timestamp: Date.now()
  }));
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

/* --------------------------------------------------------------------------
   5. FORM SUBMISSION HANDLER
   -------------------------------------------------------------------------- */
function handleLoginSubmit(event) {
  event.preventDefault();
  const emergencyIdInput = document.getElementById('emergency-id-input');
  const memberId = emergencyIdInput ? emergencyIdInput.value.trim() : 'DM-7842-ALPHA';
  const btn = document.getElementById('btn-login-main');
  if (btn) {
    btn.innerHTML = `<span>VERIFYING MEMBER ID: ${memberId}...</span>`;
    btn.disabled = true;
  }
  sessionStorage.setItem('aetherx_member_login', JSON.stringify({
    memberId: memberId || 'DM-7842-ALPHA',
    timestamp: Date.now()
  }));
  setTimeout(() => { window.location.href = 'index.html'; }, 900);
}

/* --------------------------------------------------------------------------
   6. DYNAMIC TELEMETRY PULSER
   -------------------------------------------------------------------------- */
function initTelemetryPulser() {
  setInterval(() => {
    const el = document.getElementById('val-rescue-ops-num');
    if (el) el.innerText = 143 + Math.floor(Math.random() * 5);
  }, 4000);
}

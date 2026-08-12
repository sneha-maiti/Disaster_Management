/* ==========================================================================
   COMMAND CENTER DASHBOARD — Charts, Console Feed, Secondary Globe
   ========================================================================== */

(function () {
  let commandGlobeInitialized = false;

  function initCommandCenter() {
    initConsoleFeed();
    initCommandCharts();
    setupTabObserver();
  }

  function setupTabObserver() {
    document.querySelectorAll('.screenshot-nav-link[data-tab="tab-view-command"], .nav-switch-btn[data-target-tab="tab-view-command"]').forEach(el => {
      el.addEventListener('click', () => {
        setTimeout(() => {
          initCommandGlobe();
          window.dispatchEvent(new Event('resize'));
        }, 150);
      });
    });
  }

  function initCommandGlobe() {
    if (commandGlobeInitialized || typeof THREE === 'undefined') return;
    const container = document.getElementById('command-globe-container');
    if (!container || container.querySelector('canvas')) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#030814';
    ctx.fillRect(0, 0, 1024, 512);
    for (let y = 0; y < 512; y += 14) {
      for (let x = 0; x < 1024; x += 14) {
        const nx = (x / 1024) * 5;
        const ny = (y / 512) * 2.5;
        const n = Math.sin(nx * 3) * Math.cos(ny * 4) + Math.sin(nx * 6 + ny * 5) * 0.4;
        if (n > 0.15) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = n > 0.45 ? '#00A3FF' : '#0a3060';
          ctx.fill();
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(65, 48, 48),
      new THREE.MeshPhongMaterial({ map: texture, specular: new THREE.Color('#00A3FF'), shininess: 12, transparent: true, opacity: 0.95 })
    );
    globeGroup.add(globe);

    const atmosGeo = new THREE.SphereGeometry(70, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({ color: 0x00A3FF, transparent: true, opacity: 0.08, side: THREE.BackSide });
    globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

    scene.add(new THREE.AmbientLight(0x0a192f, 1.5));
    const dl = new THREE.DirectionalLight(0x00A3FF, 1.2);
    dl.position.set(150, 80, 100);
    scene.add(dl);

    function animate() {
      requestAnimationFrame(animate);
      globeGroup.rotation.y += 0.003;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      if (!container.clientWidth) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    commandGlobeInitialized = true;
  }

  function initConsoleFeed() {
    const terminal = document.getElementById('admin-activity-terminal');
    if (!terminal) return;

    const logs = [
      { type: 'ai', text: 'Neural model confidence threshold exceeded: 94.2%' },
      { type: 'sat', text: 'GEO-SAT-09 uplink established — Pacific sector' },
      { type: 'sys', text: 'Resource allocation matrix updated — Air 72%' },
      { type: 'alert', text: 'MEGA QUAKE detected Mw 8.4 — Pacific Rim' },
      { type: 'ai', text: 'Evacuation corridor Alpha optimized — ETA reduced 18%' },
      { type: 'sat', text: 'LEO constellation sync complete — 512/512 online' },
      { type: 'sys', text: 'SOS dispatch #SOS-056 cryptographic signature verified' },
      { type: 'alert', text: 'Tsunami wave model updated — Japan coast CRITICAL' }
    ];

    let idx = 0;
    function appendLog() {
      const log = logs[idx % logs.length];
      const time = new Date().toISOString().substring(11, 19);
      const prefix = log.type === 'ai' ? '[AI]' : log.type === 'sat' ? '[SAT]' : log.type === 'alert' ? '[ALERT]' : '[SYS]';
      const line = document.createElement('div');
      line.className = `log-${log.type}`;
      line.textContent = `${time} ${prefix} ${log.text}`;
      terminal.appendChild(line);
      if (terminal.children.length > 8) terminal.removeChild(terminal.firstChild);
      terminal.scrollTop = terminal.scrollHeight;
      idx++;
    }

    for (let i = 0; i < 5; i++) appendLog();
    setInterval(appendLog, 3200);
  }

  function initCommandCharts() {
    if (typeof Chart === 'undefined') return;

    const confCtx = document.getElementById('chart-threat-confidence');
    if (confCtx) {
      const grad = confCtx.getContext('2d').createLinearGradient(0, 0, 0, 80);
      grad.addColorStop(0, 'rgba(0, 163, 255, 0.4)');
      grad.addColorStop(1, 'rgba(0, 163, 255, 0)');
      new Chart(confCtx, {
        type: 'line',
        data: {
          labels: ['', '', '', '', '', ''],
          datasets: [{ data: [72, 78, 75, 82, 88, 92], borderColor: '#00A3FF', borderWidth: 1.5, backgroundColor: grad, fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
      });
    }

    const predCtx = document.getElementById('chart-prediction');
    if (predCtx) {
      new Chart(predCtx, {
        type: 'scatter',
        data: {
          datasets: [
            { label: 'Stable', data: Array.from({ length: 30 }, () => ({ x: Math.random() * 48, y: Math.random() * 40 + 30 })), backgroundColor: 'rgba(0, 163, 255, 0.6)', pointRadius: 3 },
            { label: 'Risk', data: Array.from({ length: 15 }, () => ({ x: Math.random() * 48, y: Math.random() * 30 })), backgroundColor: 'rgba(255, 59, 48, 0.7)', pointRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'HOURS', color: '#64748B', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 8 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 8 } } }
          }
        }
      });
    }
  }

  window.addEventListener('DOMContentLoaded', initCommandCenter);
})();

(function () {
  'use strict';

  const CONTAINER_ID = 'command-globe-container';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let stylesInjected = false;
  let observer;
  let globeRoot;

  function injectStyles() {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.id = 'aetherx-command-globe-premium-styles';
    style.textContent = `
      #command-globe-container { --globe-cyan:#4edbff; --globe-blue:#176cff; --globe-mint:#5dffd4; position:relative; isolation:isolate; overflow:hidden; background:radial-gradient(circle at 50% 48%,rgba(11,85,181,.18),transparent 28%),linear-gradient(145deg,#020914,#030d1b 58%,#020611); border:1px solid rgba(78,219,255,.28); box-shadow:0 0 0 1px rgba(255,255,255,.035) inset,0 0 65px rgba(20,121,255,.13),inset 0 0 70px rgba(12,88,179,.08); }
      #command-globe-container::before { content:''; position:absolute; z-index:8; inset:0; pointer-events:none; background:radial-gradient(circle at var(--globe-mouse-x,50%) var(--globe-mouse-y,50%),rgba(95,228,255,.11),transparent 29%),linear-gradient(115deg,rgba(76,194,255,.06),transparent 26%,transparent 72%,rgba(63,109,255,.08)); mix-blend-mode:screen; }
      #command-globe-container::after { content:''; position:absolute; z-index:9; inset:0; pointer-events:none; border:1px solid rgba(78,219,255,.12); background:linear-gradient(rgba(78,219,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(78,219,255,.02) 1px,transparent 1px); background-size:35px 35px; mask-image:linear-gradient(180deg,black,transparent 70%); }
      #command-globe-container > canvas:first-child { position:relative; z-index:3; display:block; filter:saturate(1.32) contrast(1.15) brightness(1.04) drop-shadow(0 0 24px rgba(0,94,255,.32)); transition:filter .45s ease; }
      #command-globe-container.globe-premium-engaged > canvas:first-child { filter:saturate(1.55) contrast(1.18) brightness(1.1) drop-shadow(0 0 35px rgba(0,123,255,.48)); }
      #command-globe-container .premium-globe-overlay { position:absolute; z-index:7; inset:0; pointer-events:none; overflow:hidden; }
      #command-globe-container .premium-globe-core { position:absolute; left:50%; top:50%; width:min(45%,260px); aspect-ratio:1; transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(circle at 34% 28%,rgba(169,238,255,.32),rgba(14,115,255,.12) 26%,transparent 59%); box-shadow:0 0 35px rgba(13,119,255,.28),inset -24px -18px 38px rgba(0,0,0,.45); opacity:.78; mix-blend-mode:screen; }
      #command-globe-container .premium-globe-core::after { content:''; position:absolute; inset:-6%; border:1px solid rgba(80,203,255,.38); border-radius:50%; box-shadow:0 0 25px rgba(38,154,255,.28),inset 0 0 25px rgba(38,154,255,.16); animation:globeAtmosphere 4.8s ease-in-out infinite; }
      #command-globe-container .premium-globe-ring { position:absolute; left:50%; top:50%; width:min(63%,365px); height:min(22%,118px); transform:translate(-50%,-50%) rotate(-18deg); border:1px solid rgba(89,213,255,.38); border-radius:50%; box-shadow:0 0 15px rgba(45,143,255,.18); animation:globeOrbit 9s linear infinite; }
      #command-globe-container .premium-globe-ring::before, #command-globe-container .premium-globe-ring::after { content:''; position:absolute; border-radius:50%; border:1px dashed rgba(66,147,255,.24); }
      #command-globe-container .premium-globe-ring::before { inset:-15% 8%; transform:rotate(30deg); } #command-globe-container .premium-globe-ring::after { inset:8% -13%; transform:rotate(-48deg); }
      #command-globe-container .premium-globe-ring--two { width:min(72%,420px); height:min(26%,145px); transform:translate(-50%,-50%) rotate(47deg); opacity:.42; animation-duration:13s; animation-direction:reverse; }
      #command-globe-container .premium-globe-orbit-dot { position:absolute; left:50%; top:50%; width:min(63%,365px); height:min(22%,118px); transform:translate(-50%,-50%) rotate(-18deg); border-radius:50%; animation:globeOrbit 5.2s linear infinite; }
      #command-globe-container .premium-globe-orbit-dot::after { content:''; position:absolute; top:-3px; left:50%; width:6px; height:6px; border-radius:50%; background:#d9fbff; box-shadow:0 0 8px #4edbff,0 0 23px #176cff; }
      #command-globe-container .premium-globe-pulse { position:absolute; left:50%; top:50%; width:min(45%,260px); aspect-ratio:1; transform:translate(-50%,-50%) scale(.32); border:1px solid rgba(80,210,255,.8); border-radius:50%; box-shadow:0 0 18px rgba(30,137,255,.32); opacity:0; animation:globePulse 4.4s ease-out infinite; }
      #command-globe-container .premium-globe-pulse:nth-child(5) { animation-delay:1.45s; } #command-globe-container .premium-globe-pulse:nth-child(6) { animation-delay:2.9s; }
      #command-globe-container .premium-globe-latitude { position:absolute; left:50%; top:50%; width:min(48%,278px); height:min(13%,72px); transform:translate(-50%,-50%) rotateX(68deg); border:1px solid rgba(74,177,255,.32); border-radius:50%; box-shadow:0 0 13px rgba(39,145,255,.14); animation:globeLatitude 5s ease-in-out infinite; }
      #command-globe-container .premium-globe-latitude--two { transform:translate(-50%,-50%) rotateX(68deg) rotateZ(60deg); opacity:.5; animation-delay:-2.2s; }
      #command-globe-container .premium-globe-scanline { position:absolute; left:24%; right:24%; top:18%; height:1px; background:linear-gradient(90deg,transparent,#a8f4ff,transparent); box-shadow:0 0 12px #4edbff; opacity:.44; animation:globeScan 6.5s linear infinite; }
      #command-globe-container .premium-globe-readout { position:absolute; right:14px; bottom:13px; display:grid; gap:5px; padding:8px 10px; border:1px solid rgba(78,219,255,.2); border-radius:8px; background:rgba(2,10,24,.62); color:rgba(184,235,255,.7); font:600 7px/1.2 var(--font-mono,monospace); letter-spacing:.1em; box-shadow:0 10px 26px rgba(0,0,0,.3),inset 0 1px rgba(255,255,255,.08); backdrop-filter:blur(10px); }
      #command-globe-container .premium-globe-readout strong { color:var(--globe-mint); }
      @keyframes globeOrbit { to { transform:translate(-50%,-50%) rotate(342deg); } }
      @keyframes globeAtmosphere { 50% { transform:scale(1.045); opacity:.6; } }
      @keyframes globePulse { 0% { transform:translate(-50%,-50%) scale(.3); opacity:0; } 13% { opacity:.78; } 100% { transform:translate(-50%,-50%) scale(1.58); opacity:0; } }
      @keyframes globeLatitude { 50% { transform:translate(-50%,-50%) rotateX(68deg) scaleX(1.08); opacity:.82; } }
      @keyframes globeScan { 0% { transform:translateY(-20%); opacity:0; } 12% { opacity:.72; } 80% { opacity:.38; } 100% { transform:translateY(470%); opacity:0; } }
      @media (max-width:720px) { #command-globe-container .premium-globe-readout { right:8px; bottom:8px; font-size:6px; } #command-globe-container .premium-globe-core { width:48%; } }
      @media (prefers-reduced-motion:reduce) { #command-globe-container .premium-globe-ring, #command-globe-container .premium-globe-orbit-dot, #command-globe-container .premium-globe-pulse, #command-globe-container .premium-globe-core::after, #command-globe-container .premium-globe-latitude, #command-globe-container .premium-globe-scanline { animation:none; } }
    `;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  function addOverlay(container) {
    if (container.querySelector('.premium-globe-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'premium-globe-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <span class="premium-globe-core"></span>
      <span class="premium-globe-ring"></span>
      <span class="premium-globe-ring premium-globe-ring--two"></span>
      <span class="premium-globe-orbit-dot"></span>
      <span class="premium-globe-pulse"></span>
      <span class="premium-globe-pulse"></span>
      <span class="premium-globe-pulse"></span>
      <span class="premium-globe-latitude"></span>
      <span class="premium-globe-latitude premium-globe-latitude--two"></span>
      <span class="premium-globe-scanline"></span>
      <span class="premium-globe-readout">GLOBE CORE <strong>ONLINE</strong><span>ATMOSPHERE LOCK 99.98%</span><span>PULSE RELAY <strong>STABLE</strong></span></span>
    `;
    container.appendChild(overlay);
  }

  function enhanceWhenReady() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || !container.querySelector('canvas')) return false;
    if (container.dataset.premiumGlobeReady === 'true') return true;
    container.dataset.premiumGlobeReady = 'true';
    globeRoot = container;
    injectStyles();
    addOverlay(container);
    container.addEventListener('pointermove', (event) => {
      const rect = container.getBoundingClientRect();
      container.style.setProperty('--globe-mouse-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      container.style.setProperty('--globe-mouse-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      container.classList.add('globe-premium-engaged');
    }, { passive: true });
    container.addEventListener('pointerleave', () => { container.classList.remove('globe-premium-engaged'); container.style.setProperty('--globe-mouse-x', '50%'); container.style.setProperty('--globe-mouse-y', '50%'); }, { passive: true });
    return true;
  }

  function init() {
    injectStyles();
    if (enhanceWhenReady()) return;
    observer = new MutationObserver(() => { if (enhanceWhenReady() && observer) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer?.disconnect(), { once: true });
  }

  window.addEventListener('DOMContentLoaded', init);
  window.AetherXCommandGlobePremium = { init };
})();

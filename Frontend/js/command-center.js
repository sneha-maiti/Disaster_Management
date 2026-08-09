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

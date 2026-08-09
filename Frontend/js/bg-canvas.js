/* ==========================================================================
   AETHER-X HYPER-ADVANCED GENERATIVE CYBER-TACTICAL BACKGROUND CANVAS
   Layers:
   1. Deep Void Matrix Radial Gradient & Lerped Mouse Spotlight Aura
   2. 3D Projected Seismic Wireframe Horizon Floor with Wave Distortion Physics
   3. Neural Particle Constellations (350+ Nodes) with Spring Mouse Physics
   4. Tactical Scanline & Telemetry Ping Overlay
   Targeted strictly inside Home Page Hero background stage.
   ========================================================================== */

(function () {
  let canvas, ctx;
  let particles = [];
  const maxParticles = 320;
  const connectionDistance = 120;
  
  // Mouse state with lerp properties
  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0, radius: 180 };
  
  // Seismic Horizon Grid parameters
  let waveTime = 0;
  let gridColor = 'rgba(0, 240, 255, 0.15)'; // Default Cyan
  
  // Telemetry emergency pings
  let radarPings = [];

  function initBgCanvas() {
    const heroStage = document.getElementById('tab-view-overview');
    canvas = document.getElementById('aether-bg-canvas');

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'aether-bg-canvas';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.opacity = '0.55';

      if (heroStage) {
        heroStage.style.position = 'relative';
        heroStage.insertBefore(canvas, heroStage.firstChild);
      } else {
        document.body.appendChild(canvas);
      }
    }

    ctx = canvas.getContext('2d');
    resizeCanvas();

    // Populate Neural Constellation particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new NeuralParticle());
    }

    const initialContainer = heroStage || document.body;
    mouse.x = initialContainer.clientWidth / 2;
    mouse.y = initialContainer.clientHeight / 2;
    mouse.targetX = mouse.x;
    mouse.targetY = mouse.y;

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    });

    // Listen to threat level slider to shift grid color
    setupAlertStateListener();

    animate();
  }

  function resizeCanvas() {
    const heroStage = document.getElementById('tab-view-overview');
    if (heroStage) {
      canvas.width = heroStage.clientWidth;
      canvas.height = heroStage.clientHeight;
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  // Dynamic alert color updates
  function setupAlertStateListener() {
    const slider = document.getElementById('nav-threat-slider');
    if (!slider) return;

    function updateColor(val) {
      if (val === '5') gridColor = 'rgba(0, 255, 157, 0.18)'; // Green
      else if (val === '4') gridColor = 'rgba(0, 240, 255, 0.18)'; // Cyan
      else if (val === '3') gridColor = 'rgba(255, 184, 0, 0.18)'; // Amber
      else if (val === '2') gridColor = 'rgba(255, 120, 0, 0.18)'; // Orange
      else if (val === '1') gridColor = 'rgba(255, 42, 95, 0.22)'; // Crimson
    }

    slider.addEventListener('input', (e) => updateColor(e.target.value));
    updateColor(slider.value);
  }

  // Neural Particle Node with Fluid Spring Physics
  class NeuralParticle {
    constructor() {
      this.reset();
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.35;
      this.speedY = (Math.random() - 0.5) * 0.35;
      this.baseAlpha = Math.random() * 0.45 + 0.15;
      this.alpha = this.baseAlpha;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap boundaries
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      // Proximity Spring Physics to Cursor
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= (dx / dist) * force * 1.8;
        this.y -= (dy / dist) * force * 1.8;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = gridColor.replace(/[\d.]+\)$/, `${this.alpha})`);
      ctx.fill();
    }
  }

  // Render Layer 1: Deep Void Matrix & Spotlight Aura
  function drawVoidMatrix() {
    const radialGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 20,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
    );
    radialGrad.addColorStop(0, '#0a1128');
    radialGrad.addColorStop(1, '#030508');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Mouse Spotlight Aura (Smooth Lerp)
    mouse.x += (mouse.targetX - mouse.x) * 0.08;
    mouse.y += (mouse.targetY - mouse.y) * 0.08;

    const auraGrad = ctx.createRadialGradient(
      mouse.x, mouse.y, 0,
      mouse.x, mouse.y, mouse.radius
    );
    auraGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    auraGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Render Layer 2: Perspective Seismic Horizon Grid
  function drawPerspectiveHorizonGrid() {
    ctx.save();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.65;

    const horizonY = canvas.height * 0.62;
    const floorHeight = canvas.height - horizonY;
    const gridLines = 26;
    waveTime += 0.02;

    const depthSteps = 15;

    for (let i = 0; i < depthSteps; i++) {
      const normY = Math.pow(i / depthSteps, 2); 
      const y = horizonY + normY * floorHeight;

      ctx.beginPath();
      const waveShift = Math.sin(normY * 4.5 - waveTime * 2.0) * 12 * normY;
      
      ctx.moveTo(0, y + waveShift);
      ctx.lineTo(canvas.width, y + waveShift);
      ctx.stroke();
    }

    const vanishingX = canvas.width / 2;
    for (let i = -gridLines; i <= gridLines; i++) {
      const startX = vanishingX + (i * (canvas.width / gridLines) * 0.2);
      const endX = vanishingX + (i * (canvas.width / gridLines) * 1.5);

      ctx.beginPath();
      ctx.moveTo(startX, horizonY);
      ctx.lineTo(endX, canvas.height);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Render Layer 3: Connection web filaments & Telemetry Pings
  function drawConstellationFilaments() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.09;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = gridColor.replace(/[\d.]+\)$/, `${alpha})`);
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  // Generate occasional emergency telemetry radar waves
  function processRadarPings() {
    if (Math.random() < 0.006 && radarPings.length < 3) {
      radarPings.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 5,
        maxRadius: 160,
        alpha: 0.8
      });
    }

    ctx.save();
    radarPings.forEach((ping, idx) => {
      ping.radius += 1.8;
      ping.alpha = 1 - (ping.radius / ping.maxRadius);

      ctx.beginPath();
      ctx.arc(ping.x, ping.y, ping.radius, 0, Math.PI * 2);
      ctx.strokeStyle = gridColor.replace(/[\d.]+\)$/, `${ping.alpha})`);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (ping.radius >= ping.maxRadius) {
        radarPings.splice(idx, 1);
      }
    });
    ctx.restore();
  }

  // Render Layer 4: Tactical Scanline
  function drawTacticalScanlines() {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    ctx.restore();
  }

  // Frame animation runner
  function animate() {
    drawVoidMatrix();
    drawPerspectiveHorizonGrid();

    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConstellationFilaments();
    processRadarPings();

    drawTacticalScanlines();

    requestAnimationFrame(animate);
  }

  window.addEventListener('DOMContentLoaded', initBgCanvas);
})();

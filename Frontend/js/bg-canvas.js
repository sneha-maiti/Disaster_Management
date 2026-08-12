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
  'use strict';

  let canvas, ctx, stage, frameId, resizeObserver;
  let width = 0, height = 0, dpr = 1, time = 0;
  let running = true, initialized = false;
  let particles = [], pulses = [], streams = [];
  let gridColor = 'rgba(60, 218, 255, 0.16)';
  let accent = { r: 60, g: 218, b: 255 };
  const maxPulses = 4;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const prefersLowPower = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || /Mobi|Android/i.test(navigator.userAgent);
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, radius: 220, active: false };

  function injectCanvasStyles() {
    if (document.getElementById('aether-bg-canvas-premium-styles')) return;
    const style = document.createElement('style');
    style.id = 'aether-bg-canvas-premium-styles';
    style.textContent = `
      #aether-bg-canvas { display:block; pointer-events:none; opacity:.72 !important; mix-blend-mode:screen; filter:saturate(1.16) contrast(1.06); }
      #tab-view-overview { isolation:isolate; }
      #tab-view-overview::before { content:''; position:absolute; z-index:-1; inset:0; pointer-events:none; background:radial-gradient(circle at 50% 10%, rgba(28,145,218,.08), transparent 42%), linear-gradient(180deg, rgba(2,8,19,.1), rgba(1,5,12,.32)); }
      @media (prefers-reduced-motion: reduce) { #aether-bg-canvas { opacity:.48 !important; } }
    `;
    document.head.appendChild(style);
  }

  function rgba(alpha) { return `rgba(${accent.r},${accent.g},${accent.b},${alpha})`; }
  function resizeCanvas() {
    if (!canvas) return;
    const rect = (stage || document.body).getBoundingClientRect();
    width = Math.max(1, rect.width || window.innerWidth);
    height = Math.max(1, rect.height || window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, prefersLowPower ? 1.25 : 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mouse.x = mouse.tx = width / 2;
    mouse.y = mouse.ty = height / 2;
    particles.forEach((particle) => particle.reseed(true));
  }

  class Node {
    constructor() { this.reseed(false); }
    reseed(initial) {
      this.x = initial ? Math.random() * width : Math.random() * width;
      this.y = initial ? Math.random() * height : Math.random() * height;
      this.vx = (Math.random() - .5) * (reducedMotion ? .12 : .32);
      this.vy = (Math.random() - .5) * (reducedMotion ? .12 : .32);
      this.size = Math.random() * 1.5 + .45;
      this.phase = Math.random() * Math.PI * 2;
      this.alpha = Math.random() * .45 + .2;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.phase += .018;
      if (this.x < -20) this.x = width + 20; if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20; if (this.y > height + 20) this.y = -20;
      const dx = mouse.x - this.x, dy = mouse.y - this.y, distance = Math.hypot(dx, dy) || 1;
      if (mouse.active && distance < mouse.radius) {
        const force = (1 - distance / mouse.radius) * .9;
        this.x -= dx / distance * force; this.y -= dy / distance * force;
      }
    }
    draw() {
      const pulse = .72 + Math.sin(this.phase + time * .05) * .28;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = rgba(this.alpha * pulse); ctx.fill();
      if (this.size > 1.35) { ctx.shadowBlur = 12; ctx.shadowColor = rgba(.72); ctx.fill(); ctx.shadowBlur = 0; }
    }
  }

  function drawBase() {
    const bg = ctx.createRadialGradient(width * .5, height * .22, 0, width * .5, height * .5, Math.max(width, height) * .9);
    bg.addColorStop(0, '#0b1b35'); bg.addColorStop(.38, '#061224'); bg.addColorStop(1, '#02050d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    const aura = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouse.radius * 1.5);
    aura.addColorStop(0, rgba(.16)); aura.addColorStop(.42, rgba(.055)); aura.addColorStop(1, rgba(0));
    ctx.fillStyle = aura; ctx.fillRect(0, 0, width, height);
  }

  function drawTopographicGrid() {
    ctx.save(); ctx.lineWidth = .55; ctx.strokeStyle = gridColor;
    const horizon = height * .57, floor = height - horizon, depth = prefersLowPower ? 11 : 17;
    for (let i = 0; i < depth; i++) {
      const n = i / depth, y = horizon + Math.pow(n, 1.85) * floor;
      const wave = reducedMotion ? 0 : Math.sin(time * .018 + n * 7) * n * 9;
      ctx.beginPath(); ctx.moveTo(0, y + wave); ctx.lineTo(width, y + wave); ctx.stroke();
    }
    const center = width * .5 + (mouse.x - width / 2) * .045;
    const lines = prefersLowPower ? 15 : 27;
    for (let i = -lines; i <= lines; i++) {
      ctx.beginPath(); ctx.moveTo(center + i * (width / lines) * .18, horizon); ctx.lineTo(center + i * (width / lines) * 1.7, height); ctx.stroke();
    }
    ctx.restore();
  }

  function drawNetwork() {
    const distanceLimit = prefersLowPower ? 105 : 135;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j], dx = a.x - b.x, dy = a.y - b.y, distance = Math.hypot(dx, dy);
        if (distance < distanceLimit) {
          const alpha = (1 - distance / distanceLimit) * .13;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = rgba(alpha); ctx.lineWidth = .55; ctx.stroke();
        }
      }
    }
  }

  function drawHudRings() {
    const x = width * .82, y = height * .27, base = Math.min(width, height) * .09;
    ctx.save(); ctx.translate(x, y); ctx.rotate(time * .002);
    [1, 1.4, 1.8].forEach((scale, index) => {
      ctx.beginPath(); ctx.arc(0, 0, base * scale, 0, Math.PI * 2);
      ctx.setLineDash(index === 1 ? [2, 8] : [26, 9]); ctx.lineWidth = index === 0 ? 1.2 : .6; ctx.strokeStyle = rgba(.2 - index * .04); ctx.stroke();
    });
    ctx.restore();
  }

  function maybeSpawnPulse() {
    if (!reducedMotion && Math.random() < .006 && pulses.length < maxPulses) pulses.push({ x: Math.random() * width, y: height * (.12 + Math.random() * .65), radius: 3, life: 1 });
  }
  function drawPulses() {
    pulses = pulses.filter((pulse) => {
      pulse.radius += reducedMotion ? 0 : 1.8; pulse.life -= .012;
      ctx.beginPath(); ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2); ctx.strokeStyle = rgba(Math.max(0, pulse.life * .45)); ctx.lineWidth = 1.25; ctx.stroke();
      ctx.beginPath(); ctx.arc(pulse.x, pulse.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = rgba(Math.max(0, pulse.life)); ctx.fill();
      return pulse.life > 0;
    });
  }

  function setupStreams() {
    const count = prefersLowPower ? 9 : 17;
    streams = Array.from({ length: count }, () => ({ x: Math.random() * width, y: Math.random() * height, speed: .25 + Math.random() * .75, length: 14 + Math.random() * 55, alpha: .08 + Math.random() * .16 }));
  }
  function drawStreams() {
    if (reducedMotion) return;
    ctx.save(); ctx.lineWidth = 1;
    streams.forEach((stream) => { stream.y += stream.speed; if (stream.y > height + stream.length) { stream.y = -stream.length; stream.x = Math.random() * width; } ctx.beginPath(); ctx.moveTo(stream.x, stream.y - stream.length); ctx.lineTo(stream.x, stream.y); ctx.strokeStyle = rgba(stream.alpha); ctx.stroke(); });
    ctx.restore();
  }

  function drawScanline() {
    ctx.save(); const y = ((time * (reducedMotion ? 0 : .42)) % (height + 100)) - 50; const gradient = ctx.createLinearGradient(0, y - 38, 0, y + 38); gradient.addColorStop(0, rgba(0)); gradient.addColorStop(.5, rgba(.07)); gradient.addColorStop(1, rgba(0)); ctx.fillStyle = gradient; ctx.fillRect(0, y - 38, width, 76); ctx.restore();
  }

  function drawNoiseOverlay() {
    ctx.save(); ctx.globalAlpha = .026; for (let i = 0; i < (prefersLowPower ? 35 : 70); i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#49dfff'; ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1); } ctx.restore();
  }

  function animate() {
    if (!running) { frameId = requestAnimationFrame(animate); return; }
    time += 1; mouse.x += (mouse.tx - mouse.x) * .075; mouse.y += (mouse.ty - mouse.y) * .075;
    drawBase(); drawTopographicGrid(); drawHudRings(); drawStreams();
    particles.forEach((particle) => { particle.update(); particle.draw(); });
    drawNetwork(); maybeSpawnPulse(); drawPulses(); drawScanline(); drawNoiseOverlay();
    frameId = requestAnimationFrame(animate);
  }

  function updateThreatColor(value) {
    const colors = { 5: ['rgba(69,245,190,.2)', { r: 69, g: 245, b: 190 }], 4: ['rgba(60,218,255,.18)', { r: 60, g: 218, b: 255 }], 3: ['rgba(255,190,70,.18)', { r: 255, g: 190, b: 70 }], 2: ['rgba(255,125,48,.2)', { r: 255, g: 125, b: 48 }], 1: ['rgba(255,56,92,.22)', { r: 255, g: 56, b: 92 }] };
    const selected = colors[value] || colors[4]; gridColor = selected[0]; accent = selected[1];
  }

  function setupThreatListener() {
    const slider = document.getElementById('nav-threat-slider'); if (!slider) return;
    slider.addEventListener('input', (event) => updateThreatColor(event.target.value)); updateThreatColor(slider.value);
  }

  function initBgCanvas() {
    if (initialized) return; initialized = true; injectCanvasStyles();
    stage = document.getElementById('tab-view-overview'); canvas = document.getElementById('aether-bg-canvas');
    if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'aether-bg-canvas'; (stage || document.body).insertBefore(canvas, (stage || document.body).firstChild); }
    canvas.setAttribute('aria-hidden', 'true'); canvas.style.position = 'absolute'; canvas.style.inset = '0'; canvas.style.zIndex = '0'; canvas.style.pointerEvents = 'none';
    if (stage) stage.style.position = 'relative';
    ctx = canvas.getContext('2d', { alpha: true, desynchronized: true }); if (!ctx) return;
    const count = prefersLowPower ? 150 : 280; particles = Array.from({ length: count }, () => new Node()); resizeCanvas(); setupStreams(); setupThreatListener();
    const target = stage || canvas;
    target.addEventListener('mousemove', (event) => { const rect = canvas.getBoundingClientRect(); mouse.tx = event.clientX - rect.left; mouse.ty = event.clientY - rect.top; mouse.active = true; }, { passive: true });
    target.addEventListener('mouseleave', () => { mouse.active = false; mouse.tx = width / 2; mouse.ty = height / 2; }, { passive: true });
    resizeObserver = new ResizeObserver(resizeCanvas); resizeObserver.observe(stage || canvas); document.addEventListener('visibilitychange', () => { running = !document.hidden; });
    animate();
  }

  window.addEventListener('DOMContentLoaded', initBgCanvas);
})();

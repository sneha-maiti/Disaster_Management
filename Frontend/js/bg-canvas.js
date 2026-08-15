/* ==========================================================================
   AETHER-X PHOTOREALISTIC DEEP-SPACE COSMOS ENGINE (V6.0 AAA EDITION)
   High-Fidelity Real-Space Environmental Simulation & Interactive Celestial Mechanics
   
   Architecture & Cosmological Layers:
   1. Deep Interstellar Vacuum & Dynamic Galactic Luminance Gradients
   2. Volumetric Deep-Space Nebulae (Carina Hydrogen-Alpha, Orion Cobalt, Veil Quartz)
   3. 3-Tier Multi-Spectral Starfield (800+ Realistic Stars across O/B/A/G/K/M Classes)
   4. High-Magnitude Primary Stars with JWST/Hubble Optical Diffraction Spikes & Halos
   5. Interactive Breakable & Auto-Regenerating Real Constellations (Orion, Cassiopeia, Cygnus, Ursa Major, Pegasus)
      - Magnetic spring restoration physics (Hooke's law with damping)
      - Filament break stardust sparks & luminous re-connection flares
      - Hover perturbation & elastic kinetic recoil
   6. Multi-Class Dynamic Meteor System (Micro-Streaks, Ion-Tail Meteors, & Exploding Fireball Bolides)
   7. Interactive Gravitational Lensing Shockwaves on Cursor Click & Motion
   8. 3D Multi-Layered Inertial Parallax with Ultra-Smooth Lerp Physics
   
   Zero backend reliance — 100% Client-Side GPU-Accelerated Canvas Engine.
   ========================================================================== */

(function () {
  'use strict';

  let canvas, ctx, stage, frameId, resizeObserver;
  let width = 0, height = 0, dpr = 1, time = 0;
  let running = true, initialized = false;

  // Reduced motion / Performance flags
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const prefersLowPower = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || /Mobi|Android/i.test(navigator.userAgent);

  // Mouse Parallax & Interaction Physics
  const mouse = {
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
    active: false,
    radius: 140
  };

  // Cosmic Data Containers
  let deepStars = [];
  let midStars = [];
  let brightStars = [];
  let nebulae = [];
  let meteors = [];
  let cosmicMotes = [];
  let constellations = [];
  let stardustSparks = [];
  let gravitationalRipples = [];

  // Realistic Stellar Spectral Colors (Planckian Blackbody Radiation)
  const SPECTRAL_CLASSES = [
    { color: '#aabfff', glow: 'rgba(170, 191, 255, 0.45)', weight: 0.15 }, // Class O/B (Blue-White Hypergiants)
    { color: '#cad8ff', glow: 'rgba(202, 216, 255, 0.40)', weight: 0.25 }, // Class A (Pure White / Diamond)
    { color: '#f8f9ff', glow: 'rgba(248, 249, 255, 0.35)', weight: 0.30 }, // Class F (Warm White)
    { color: '#fff2d6', glow: 'rgba(255, 242, 214, 0.35)', weight: 0.18 }, // Class G (Solar Yellow-White)
    { color: '#ffd0a1', glow: 'rgba(255, 208, 161, 0.30)', weight: 0.08 }, // Class K (Orange Giant)
    { color: '#ff9d85', glow: 'rgba(255, 157, 133, 0.25)', weight: 0.04 }  // Class M (Red Dwarf)
  ];

  function getRandomSpectralClass() {
    const r = Math.random();
    let cumulative = 0;
    for (const sc of SPECTRAL_CLASSES) {
      cumulative += sc.weight;
      if (r <= cumulative) return sc;
    }
    return SPECTRAL_CLASSES[2];
  }

  function injectCosmosStyles() {
    if (document.getElementById('aether-real-space-styles')) return;
    const style = document.createElement('style');
    style.id = 'aether-real-space-styles';
    style.textContent = `
      #aether-bg-canvas {
        display: block;
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        opacity: 1 !important;
        background: #010206;
      }
      #tab-view-overview {
        position: relative;
        isolation: isolate;
        background-color: #010206 !important;
      }
      #tab-view-overview::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(circle at 50% 30%, rgba(8, 22, 48, 0.25) 0%, rgba(2, 4, 10, 0.7) 70%, #010206 100%);
      }
    `;
    document.head.appendChild(style);
  }

  /* --------------------------------------------------------------------------
     COSMIC ENTITY GENERATORS: NEBULAE & BACKGROUND STARS
     -------------------------------------------------------------------------- */

  function initNebulae() {
    nebulae = [
      {
        cx: 0.28,
        cy: 0.32,
        rx: 0.45,
        ry: 0.38,
        colorInner: 'rgba(10, 48, 95, 0.22)',
        colorMid: 'rgba(6, 26, 62, 0.12)',
        colorOuter: 'rgba(1, 4, 12, 0)',
        driftSpeed: 0.00015,
        phase: 0.0
      },
      {
        cx: 0.72,
        cy: 0.45,
        rx: 0.48,
        ry: 0.42,
        colorInner: 'rgba(78, 18, 62, 0.18)',
        colorMid: 'rgba(42, 10, 45, 0.09)',
        colorOuter: 'rgba(2, 2, 8, 0)',
        driftSpeed: 0.00018,
        phase: 2.1
      },
      {
        cx: 0.50,
        cy: 0.65,
        rx: 0.60,
        ry: 0.30,
        colorInner: 'rgba(16, 38, 76, 0.16)',
        colorMid: 'rgba(12, 24, 52, 0.08)',
        colorOuter: 'rgba(0, 2, 6, 0)',
        driftSpeed: 0.00012,
        phase: 4.3
      },
      {
        cx: 0.85,
        cy: 0.18,
        rx: 0.35,
        ry: 0.28,
        colorInner: 'rgba(6, 52, 58, 0.14)',
        colorMid: 'rgba(3, 28, 36, 0.06)',
        colorOuter: 'rgba(0, 0, 0, 0)',
        driftSpeed: 0.00022,
        phase: 1.2
      }
    ];
  }

  // Tier 1: Micro Background Star Dust
  class DeepStar {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.random() * 0.75 + 0.25;
      this.baseAlpha = Math.random() * 0.55 + 0.25;
      this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      this.twinklePhase = Math.random() * Math.PI * 2;
      this.spectral = getRandomSpectralClass();
      this.parallaxMult = 0.008;
    }
    draw(offsetX, offsetY) {
      const twinkle = Math.sin(this.twinklePhase + time * this.twinkleSpeed);
      const alpha = Math.max(0.08, this.baseAlpha + twinkle * 0.25);
      const px = this.x + offsetX * this.parallaxMult;
      const py = this.y + offsetY * this.parallaxMult;

      ctx.fillStyle = this.spectral.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(px, py, this.radius, this.radius);
    }
  }

  // Tier 2: Mid-Field Main Sequence Stars with Scintillation
  class MidStar {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.random() * 1.1 + 0.65;
      this.baseAlpha = Math.random() * 0.65 + 0.35;
      this.twinkleSpeed = Math.random() * 0.035 + 0.01;
      this.twinklePhase = Math.random() * Math.PI * 2;
      this.spectral = getRandomSpectralClass();
      this.parallaxMult = 0.022;
      this.hasGlow = Math.random() < 0.35;
    }
    draw(offsetX, offsetY) {
      const twinkle = Math.sin(this.twinklePhase + time * this.twinkleSpeed);
      const currentRadius = Math.max(0.4, this.radius * (1 + twinkle * 0.18));
      const alpha = Math.max(0.15, Math.min(1.0, this.baseAlpha + twinkle * 0.35));
      const px = this.x + offsetX * this.parallaxMult;
      const py = this.y + offsetY * this.parallaxMult;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (this.hasGlow) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.spectral.glow;
      }

      ctx.beginPath();
      ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.spectral.color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Tier 3: Primary Anchor Stars with Optical Diffraction Spikes (JWST / Hubble 4-Point Flares)
  class BrightAnchorStar {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.coreRadius = Math.random() * 1.4 + 1.2;
      this.flareLength = Math.random() * 14 + 10;
      this.spectral = getRandomSpectralClass();
      this.baseAlpha = Math.random() * 0.4 + 0.6;
      this.pulseSpeed = Math.random() * 0.015 + 0.008;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.parallaxMult = 0.045;
      this.rotation = Math.random() * 0.2 - 0.1;
    }
    draw(offsetX, offsetY) {
      const pulse = Math.sin(this.pulsePhase + time * this.pulseSpeed);
      const alpha = Math.max(0.3, this.baseAlpha + pulse * 0.25);
      const currentRadius = this.coreRadius * (1 + pulse * 0.12);
      const currentFlare = this.flareLength * (1 + pulse * 0.2);
      const px = this.x + offsetX * this.parallaxMult;
      const py = this.y + offsetY * this.parallaxMult;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = alpha;

      // Outer Atmospheric Corona Glow
      const corona = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 7);
      corona.addColorStop(0, this.spectral.glow);
      corona.addColorStop(0.4, this.spectral.glow.replace(/[\d\.]+\)$/, '0.12)'));
      corona.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius * 7, 0, Math.PI * 2);
      ctx.fill();

      // Optical 4-Point Diffraction Spikes
      ctx.strokeStyle = this.spectral.glow;
      ctx.lineWidth = 0.75;

      ctx.beginPath();
      ctx.moveTo(-currentFlare, 0);
      ctx.lineTo(currentFlare, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -currentFlare);
      ctx.lineTo(0, currentFlare);
      ctx.stroke();

      // Dense Radiant Core
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  }

  /* --------------------------------------------------------------------------
     BREAKABLE & AUTO-REGENERATING REAL CONSTELLATIONS SYSTEM
     -------------------------------------------------------------------------- */

  // Constellation Blueprint Catalog (Normalized coordinates and astronomical connectivity)
  const CONSTELLATION_SCHEMATICS = [
    {
      name: 'CASSIOPEIA',
      label: '✦ CASSIOPEIA',
      relX: 0.18,
      relY: 0.22,
      scale: 140,
      nodes: [
        { x: -0.65, y: 0.25, name: 'Caph', mag: 1.8, spectral: '#cad8ff' },
        { x: -0.32, y: -0.28, name: 'Schedar', mag: 2.2, spectral: '#ffd0a1' },
        { x: 0.02, y: 0.18, name: 'Gamma Cas', mag: 2.0, spectral: '#aabfff' },
        { x: 0.35, y: -0.30, name: 'Ruchbah', mag: 1.7, spectral: '#f8f9ff' },
        { x: 0.68, y: 0.12, name: 'Segin', mag: 1.6, spectral: '#cad8ff' }
      ],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4]]
    },
    {
      name: 'CYGNUS',
      label: '✦ CYGNUS // NORTHERN CROSS',
      relX: 0.82,
      relY: 0.26,
      scale: 160,
      nodes: [
        { x: 0.0, y: -0.65, name: 'Deneb', mag: 2.5, spectral: '#f8f9ff' },
        { x: 0.0, y: -0.05, name: 'Sadr', mag: 2.1, spectral: '#ffd0a1' },
        { x: 0.0, y: 0.62, name: 'Albireo', mag: 2.0, spectral: '#ffd0a1' },
        { x: -0.58, y: -0.15, name: 'Delta Cyg', mag: 1.7, spectral: '#aabfff' },
        { x: 0.58, y: -0.12, name: 'Gienah', mag: 1.8, spectral: '#cad8ff' }
      ],
      edges: [[0, 1], [1, 2], [3, 1], [1, 4]]
    },
    {
      name: 'ORION',
      label: '✦ ORION // HUNTER',
      relX: 0.12,
      relY: 0.70,
      scale: 185,
      nodes: [
        { x: -0.45, y: -0.65, name: 'Betelgeuse', mag: 2.6, spectral: '#ff9d85' }, // Red Supergiant
        { x: 0.45, y: -0.55, name: 'Bellatrix', mag: 2.1, spectral: '#aabfff' },
        { x: -0.18, y: -0.02, name: 'Alnitak', mag: 1.8, spectral: '#cad8ff' }, // Belt 1
        { x: 0.0, y: 0.0, name: 'Alnilam', mag: 1.9, spectral: '#aabfff' },   // Belt 2
        { x: 0.18, y: 0.02, name: 'Mintaka', mag: 1.8, spectral: '#cad8ff' },  // Belt 3
        { x: -0.40, y: 0.65, name: 'Saiph', mag: 1.9, spectral: '#aabfff' },
        { x: 0.48, y: 0.60, name: 'Rigel', mag: 2.7, spectral: '#aabfff' }     // Blue Supergiant
      ],
      edges: [
        [0, 1], [0, 2], [1, 4], // Upper torso
        [2, 3], [3, 4],         // Belt
        [2, 5], [4, 6],         // Lower limbs
        [5, 6]
      ]
    },
    {
      name: 'URSA_MAJOR',
      label: '✦ URSA MAJOR // BIG DIPPER',
      relX: 0.86,
      relY: 0.72,
      scale: 175,
      nodes: [
        { x: -0.62, y: -0.35, name: 'Dubhe', mag: 2.2, spectral: '#fff2d6' },
        { x: -0.60, y: 0.18, name: 'Merak', mag: 2.0, spectral: '#f8f9ff' },
        { x: -0.15, y: 0.15, name: 'Phecda', mag: 1.8, spectral: '#cad8ff' },
        { x: -0.12, y: -0.32, name: 'Megrez', mag: 1.7, spectral: '#cad8ff' },
        { x: 0.15, y: -0.18, name: 'Alioth', mag: 2.1, spectral: '#f8f9ff' },
        { x: 0.42, y: -0.05, name: 'Mizar', mag: 2.0, spectral: '#aabfff' },
        { x: 0.72, y: 0.28, name: 'Alkaid', mag: 2.2, spectral: '#aabfff' }
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 0], // Bowl
        [3, 4], [4, 5], [5, 6]          // Handle
      ]
    },
    {
      name: 'PEGASUS',
      label: '✦ PEGASUS // ASTERISM',
      relX: 0.50,
      relY: 0.16,
      scale: 155,
      nodes: [
        { x: -0.45, y: -0.45, name: 'Scheat', mag: 2.1, spectral: '#ff9d85' },
        { x: 0.45, y: -0.42, name: 'Alpheratz', mag: 2.2, spectral: '#aabfff' },
        { x: 0.42, y: 0.42, name: 'Algenib', mag: 1.8, spectral: '#cad8ff' },
        { x: -0.42, y: 0.45, name: 'Markab', mag: 2.0, spectral: '#f8f9ff' },
        { x: -0.80, y: 0.15, name: 'Homam', mag: 1.6, spectral: '#fff2d6' }
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 0], // Great Square
        [3, 4]
      ]
    }
  ];

  class ConstellationNode {
    constructor(cfg, originX, originY, scale) {
      this.name = cfg.name;
      this.mag = cfg.mag;
      this.spectral = cfg.spectral;
      this.relX = cfg.x;
      this.relY = cfg.y;

      // Anchor Target Coordinate
      this.targetX = originX + cfg.x * scale;
      this.targetY = originY + cfg.y * scale;

      // Current Physical Position & Physics
      this.x = this.targetX;
      this.y = this.targetY;
      this.vx = 0;
      this.vy = 0;

      this.radius = cfg.mag;
      this.flare = cfg.mag * 4.5;
      this.phase = Math.random() * Math.PI * 2;
    }

    reposition(originX, originY, scale) {
      this.targetX = originX + this.relX * scale;
      this.targetY = originY + this.relY * scale;
    }

    update(mousePos) {
      // 1. Cursor Perturbation / Blast Force
      const dx = this.x - mousePos.x;
      const dy = this.y - mousePos.y;
      const dist = Math.hypot(dx, dy) || 1;
      const breakRadius = mouse.radius * 1.1;

      if (mousePos.active && dist < breakRadius) {
        const force = Math.pow(1 - dist / breakRadius, 1.8) * 14;
        const angle = Math.atan2(dy, dx);
        
        // Add dynamic kinetic blast velocity
        this.vx += Math.cos(angle) * force + mousePos.vx * 0.15;
        this.vy += Math.sin(angle) * force + mousePos.vy * 0.15;

        // Spawn Stardust Sparks when broken
        if (Math.random() < 0.28 && stardustSparks.length < 80) {
          stardustSparks.push(new StardustSpark(this.x, this.y, this.spectral));
        }
      }

      // 2. Magnetic Harmonic Spring Restoration (Hooke's Law with Damping)
      const springK = 0.038; // Spring stiffness
      const damping = 0.87;  // Velocity friction
      const targetDx = this.targetX - this.x;
      const targetDy = this.targetY - this.y;

      this.vx = (this.vx + targetDx * springK) * damping;
      this.vy = (this.vy + targetDy * springK) * damping;

      this.x += this.vx;
      this.y += this.vy;

      this.phase += 0.025;
    }

    draw(offsetX, offsetY) {
      const pulse = Math.sin(this.phase) * 0.15;
      const currentRadius = this.radius * (1 + pulse);
      const px = this.x + offsetX * 0.015;
      const py = this.y + offsetY * 0.015;

      ctx.save();
      ctx.translate(px, py);

      // Star Atmospheric Halo
      const corona = ctx.createRadialGradient(0, 0, 0, 0, 0, currentRadius * 5.5);
      corona.addColorStop(0, this.spectral);
      corona.addColorStop(0.5, 'rgba(120, 200, 255, 0.15)');
      corona.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius * 5.5, 0, Math.PI * 2);
      ctx.fill();

      // 4-Point Optical Diffraction Rays
      ctx.strokeStyle = 'rgba(200, 235, 255, 0.45)';
      ctx.lineWidth = 0.65;
      const fLen = this.flare * (1 + pulse);

      ctx.beginPath();
      ctx.moveTo(-fLen, 0);
      ctx.lineTo(fLen, 0);
      ctx.moveTo(0, -fLen);
      ctx.lineTo(0, fLen);
      ctx.stroke();

      // Brilliant Core
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class Constellation {
    constructor(schematic) {
      this.name = schematic.name;
      this.label = schematic.label;
      this.relX = schematic.relX;
      this.relY = schematic.relY;
      this.scale = schematic.scale;
      this.rawEdges = schematic.edges;
      this.pulseTime = Math.random() * 10;
      this.disrupted = false;

      this.originX = width * this.relX;
      this.originY = height * this.relY;

      this.nodes = schematic.nodes.map(n => new ConstellationNode(n, this.originX, this.originY, this.scale));
    }

    resize() {
      this.originX = width * this.relX;
      this.originY = height * this.relY;
      this.nodes.forEach(n => n.reposition(this.originX, this.originY, this.scale));
    }

    update(mousePos) {
      this.pulseTime += 0.02;
      let totalDisplacement = 0;

      this.nodes.forEach(n => {
        n.update(mousePos);
        totalDisplacement += Math.hypot(n.x - n.targetX, n.y - n.targetY);
      });

      // Track whether constellation is currently broken/recovering
      this.disrupted = totalDisplacement > 12;
    }

    draw(offsetX, offsetY) {
      // 1. Draw Interstellar Connection Filaments
      ctx.save();

      for (const [i, j] of this.rawEdges) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        if (!a || !b) continue;

        const currentDist = Math.hypot(a.x - b.x, a.y - b.y);
        const restDist = Math.hypot(a.targetX - b.targetX, a.targetY - b.targetY);
        const stretchRatio = currentDist / (restDist || 1);

        // Filament breaks / dims if stretched beyond elastic threshold
        if (stretchRatio > 1.75) continue;

        const alphaBase = Math.max(0, 0.42 - (stretchRatio - 1) * 0.45);
        const linePulse = Math.sin(this.pulseTime * 1.5 + i) * 0.12;
        const lineAlpha = Math.max(0.08, Math.min(0.65, alphaBase + linePulse));

        const ax = a.x + offsetX * 0.015;
        const ay = a.y + offsetY * 0.015;
        const bx = b.x + offsetX * 0.015;
        const by = b.y + offsetY * 0.015;

        // Glowing Core Line
        ctx.strokeStyle = `rgba(130, 210, 255, ${lineAlpha})`;
        ctx.lineWidth = stretchRatio > 1.2 ? 0.75 : 1.1;
        ctx.setLineDash(stretchRatio > 1.3 ? [4, 4] : []);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        // Subtle Filament Glow Outer
        ctx.strokeStyle = `rgba(0, 163, 255, ${lineAlpha * 0.35})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      ctx.restore();

      // 2. Draw Constellation Stars
      this.nodes.forEach(n => n.draw(offsetX, offsetY));

      // 3. Draw Celestial Typography Label
      ctx.save();
      const cx = this.originX + offsetX * 0.015;
      const cy = this.originY + this.scale * 0.85 + offsetY * 0.015;
      const labelAlpha = this.disrupted ? 0.22 : 0.48;

      ctx.font = '500 9px "JetBrains Mono", monospace';
      ctx.letterSpacing = '0.18em';
      ctx.fillStyle = `rgba(160, 220, 255, ${labelAlpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(this.label, cx, cy);
      ctx.restore();
    }
  }

  // Stardust Spark particles emitted upon constellation filament break
  class StardustSpark {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.8 + 0.8;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02;
      this.color = color || '#aabfff';
      this.size = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.95;
      this.vy *= 0.95;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Interactive Gravitational Lensing Shockwaves (Click Ripple)
  class GravitationalRipple {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 4;
      this.maxRadius = Math.max(width, height) * 0.45;
      this.speed = 4.5;
      this.life = 1.0;
      this.decay = 0.016;
    }
    update() {
      this.radius += this.speed;
      this.life -= this.decay;
    }
    draw() {
      if (this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life * 0.35);

      ctx.strokeStyle = 'rgba(100, 220, 255, 0.45)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Outer faint halo
      ctx.strokeStyle = 'rgba(170, 120, 255, 0.2)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0, this.radius - 2), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  /* --------------------------------------------------------------------------
     MULTI-CLASS DYNAMIC METEOR SYSTEM (ENHANCED SHOOTING STARS)
     -------------------------------------------------------------------------- */

  class Meteor {
    constructor() { this.spawn(); }
    spawn() {
      this.active = true;
      // Multi-class: 0 = Fast Micro-Streak, 1 = Radiant Ion Tail, 2 = Fireball Bolide
      const roll = Math.random();
      this.mType = roll < 0.55 ? 'micro' : roll < 0.88 ? 'ion' : 'bolide';

      this.angle = (Math.PI / 4.2) + (Math.random() * 0.35 - 0.17); // ~40-50 deg entry
      const baseSpeed = this.mType === 'bolide' ? (Math.random() * 8 + 14) : (Math.random() * 14 + 18);
      this.vx = Math.cos(this.angle) * baseSpeed;
      this.vy = Math.sin(this.angle) * baseSpeed;

      this.length = this.mType === 'bolide' ? (Math.random() * 180 + 140) : this.mType === 'ion' ? (Math.random() * 120 + 80) : (Math.random() * 60 + 40);
      this.thickness = this.mType === 'bolide' ? (Math.random() * 2.4 + 1.8) : this.mType === 'ion' ? (Math.random() * 1.5 + 0.9) : 0.85;
      this.life = 1.0;
      this.decay = this.mType === 'bolide' ? (Math.random() * 0.015 + 0.012) : (Math.random() * 0.026 + 0.018);

      // Start position
      this.x = Math.random() * width * 1.15;
      this.y = Math.random() * (height * 0.40) - 50;

      const hues = this.mType === 'bolide' 
        ? ['#ffeedd', '#ffd0a1', '#ff9d85', '#65eaff']
        : ['#ffffff', '#65eaff', '#c4b5fd', '#a5f3fc'];
      this.headColor = hues[Math.floor(Math.random() * hues.length)];
    }

    update() {
      if (!this.active) return;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;

      // Spawn bolide spark particles
      if (this.mType === 'bolide' && Math.random() < 0.4 && stardustSparks.length < 90) {
        stardustSparks.push(new StardustSpark(this.x, this.y, '#ffd0a1'));
      }

      if (this.life <= 0 || this.x > width + 120 || this.y > height + 120) {
        this.active = false;
      }
    }

    draw() {
      if (!this.active || this.life <= 0) return;

      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;

      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.55, 'rgba(100, 220, 255, 0.35)');
      grad.addColorStop(1, this.headColor);

      ctx.strokeStyle = grad;
      ctx.lineWidth = this.thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Glowing Meteor Ionized Head
      ctx.shadowBlur = this.mType === 'bolide' ? 18 : 10;
      ctx.shadowColor = this.headColor;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.thickness * 1.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Interstellar Cosmic Micro-Motes (Zero-G Space Dust)
  class CosmicMote {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.12;
      this.vy = (Math.random() - 0.5) * 0.12;
      this.radius = Math.random() * 0.9 + 0.3;
      this.baseAlpha = Math.random() * 0.25 + 0.08;
      this.phase = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;
      this.phase += 0.008;
    }
    draw(offsetX, offsetY) {
      const pulse = Math.sin(this.phase) * 0.15;
      const alpha = Math.max(0.04, this.baseAlpha + pulse);
      const px = this.x + offsetX * 0.035;
      const py = this.y + offsetY * 0.035;

      ctx.fillStyle = '#8bd3ff';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* --------------------------------------------------------------------------
     CANVAS SIZING & POPULATION
     -------------------------------------------------------------------------- */

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

    populateCosmos();
  }

  function populateCosmos() {
    initNebulae();

    const area = width * height;
    const deepCount = Math.floor((area / 3200) * (prefersLowPower ? 0.6 : 1.0));
    const midCount = Math.floor((area / 7800) * (prefersLowPower ? 0.6 : 1.0));
    const brightCount = prefersLowPower ? 8 : 16;
    const moteCount = prefersLowPower ? 20 : 45;

    deepStars = Array.from({ length: Math.max(220, deepCount) }, () => new DeepStar());
    midStars = Array.from({ length: Math.max(80, midCount) }, () => new MidStar());
    brightStars = Array.from({ length: brightCount }, () => new BrightAnchorStar());
    cosmicMotes = Array.from({ length: moteCount }, () => new CosmicMote());

    // Generate Real Astronomical Constellations
    const selectedSchematics = width < 768
      ? CONSTELLATION_SCHEMATICS.slice(0, 3)
      : CONSTELLATION_SCHEMATICS;

    constellations = selectedSchematics.map(s => new Constellation(s));
    meteors = [];
    stardustSparks = [];
    gravitationalRipples = [];
  }

  /* --------------------------------------------------------------------------
     RENDER PIPELINE
     -------------------------------------------------------------------------- */

  function drawDeepSpaceVacuum() {
    const vacuum = ctx.createLinearGradient(0, 0, width * 0.4, height);
    vacuum.addColorStop(0, '#010307');
    vacuum.addColorStop(0.35, '#020612');
    vacuum.addColorStop(0.7, '#040918');
    vacuum.addColorStop(1, '#010206');
    ctx.fillStyle = vacuum;
    ctx.fillRect(0, 0, width, height);

    // Milky Way tilted celestial luminance band
    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    ctx.rotate(-0.35);
    const milkyWay = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.7);
    milkyWay.addColorStop(0, 'rgba(24, 48, 92, 0.14)');
    milkyWay.addColorStop(0.25, 'rgba(14, 32, 68, 0.09)');
    milkyWay.addColorStop(0.55, 'rgba(6, 16, 38, 0.04)');
    milkyWay.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = milkyWay;
    ctx.scale(1.8, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawVolumetricNebulae(offsetX, offsetY) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (const neb of nebulae) {
      neb.phase += neb.driftSpeed;
      const driftX = Math.sin(neb.phase) * (width * 0.03);
      const driftY = Math.cos(neb.phase * 0.8) * (height * 0.025);

      const cx = width * neb.cx + driftX + offsetX * 0.012;
      const cy = height * neb.cy + driftY + offsetY * 0.012;
      const radiusX = width * neb.rx;
      const radiusY = height * neb.ry;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, radiusY / radiusX);

      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
      grad.addColorStop(0, neb.colorInner);
      grad.addColorStop(0.45, neb.colorMid);
      grad.addColorStop(1, neb.colorOuter);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function handleMeteors() {
    if (reducedMotion) return;

    // Slightly enhanced spawn rhythm (frequent & balanced)
    if (Math.random() < 0.016 && meteors.length < 4) {
      meteors.push(new Meteor());
    }

    meteors.forEach(m => {
      m.update();
      m.draw();
    });

    meteors = meteors.filter(m => m.active);
  }

  function handleSparksAndRipples() {
    // 1. Stardust sparks from constellation breaks & bolides
    stardustSparks.forEach(s => {
      s.update();
      s.draw();
    });
    stardustSparks = stardustSparks.filter(s => s.life > 0);

    // 2. Gravitational ripples
    gravitationalRipples.forEach(r => {
      r.update();
      r.draw();
    });
    gravitationalRipples = gravitationalRipples.filter(r => r.life > 0);
  }

  function animate() {
    if (!running) {
      frameId = requestAnimationFrame(animate);
      return;
    }

    time += 1;

    // Calculate mouse velocity for dynamic physical disruption
    mouse.vx = mouse.tx - mouse.lastX;
    mouse.vy = mouse.ty - mouse.lastY;
    mouse.lastX = mouse.tx;
    mouse.lastY = mouse.ty;

    // Smooth inertia interpolation for mouse parallax
    mouse.x += (mouse.tx - mouse.x) * 0.06;
    mouse.y += (mouse.ty - mouse.y) * 0.06;
    const offsetX = mouse.x - width / 2;
    const offsetY = mouse.y - height / 2;

    ctx.clearRect(0, 0, width, height);

    // Render Exact Depth Stack
    drawDeepSpaceVacuum();
    drawVolumetricNebulae(offsetX, offsetY);

    // Gravitational Lensing Rings
    handleSparksAndRipples();

    // Tier 1 Deep Star Dust
    ctx.save();
    deepStars.forEach(s => s.draw(offsetX, offsetY));
    ctx.restore();

    // Tier 2 Mid-Field Main Sequence
    midStars.forEach(s => s.draw(offsetX, offsetY));

    // Zero-G Cosmic Dust Motes
    cosmicMotes.forEach(m => {
      m.update();
      m.draw(offsetX, offsetY);
    });

    // Real Breakable & Regenerating Constellations
    constellations.forEach(c => {
      c.update(mouse);
      c.draw(offsetX, offsetY);
    });

    // Tier 3 Bright Optical Flares
    brightStars.forEach(s => s.draw(offsetX, offsetY));

    // Enhanced Multi-Class Meteor Showers
    handleMeteors();

    frameId = requestAnimationFrame(animate);
  }

  /* --------------------------------------------------------------------------
     INITIALIZATION & EVENT LISTENERS
     -------------------------------------------------------------------------- */

  function initBgCanvas() {
    if (initialized) return;
    initialized = true;

    injectCosmosStyles();

    stage = document.getElementById('tab-view-overview');
    canvas = document.getElementById('aether-bg-canvas');

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'aether-bg-canvas';
      const wrap = document.getElementById('aether-bg-canvas-wrap');
      if (wrap) {
        wrap.appendChild(canvas);
      } else if (stage) {
        stage.insertBefore(canvas, stage.firstChild);
      } else {
        document.body.insertBefore(canvas, document.body.firstChild);
      }
    }

    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    resizeCanvas();

    // Mouse Trackers
    const target = window;
    target.addEventListener('mousemove', (event) => {
      mouse.tx = event.clientX;
      mouse.ty = event.clientY;
      mouse.active = true;
    }, { passive: true });

    target.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.tx = width / 2;
      mouse.ty = height / 2;
    }, { passive: true });

    // Click trigger for Gravitational Ripple Lensing
    target.addEventListener('pointerdown', (event) => {
      if (gravitationalRipples.length < 5) {
        gravitationalRipples.push(new GravitationalRipple(event.clientX, event.clientY));
      }
    }, { passive: true });

    // Handle Resize & Visibility
    resizeObserver = new ResizeObserver(resizeCanvas);
    if (stage) resizeObserver.observe(stage);
    window.addEventListener('resize', resizeCanvas, { passive: true });

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
    });

    animate();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initBgCanvas);
  } else {
    initBgCanvas();
  }
})();


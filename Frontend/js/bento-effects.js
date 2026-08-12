/* ==========================================================================
   BENTO GRID MOUSEMOVE 3D SPATIAL TILT & PARALLAX EFFECT
   Adds luxury 3D perspective shifts, glowing specular highlights, and tilt.
   ========================================================================== */

(function () {
  'use strict';

  const SELECTOR = '.bento-card, .glass-panel';
  const state = new WeakMap();
  let stylesInjected = false;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)').matches : true;

  function injectPremiumStyles() {
    if (stylesInjected) return;
    const style = document.createElement('style');
    style.id = 'aetherx-bento-premium-styles';
    style.textContent = `
      .bento-card, .glass-panel { --bento-rx: 0deg; --bento-ry: 0deg; --bento-lift: 0px; --bento-glow-x: 50%; --bento-glow-y: 50%; --bento-intensity: 0; --bento-scale: 1; position: relative; transform: perspective(1200px) rotateX(var(--bento-rx)) rotateY(var(--bento-ry)) translate3d(0, var(--bento-lift), 0) scale(var(--bento-scale)); transform-style: preserve-3d; will-change: transform, box-shadow; transition: transform .42s cubic-bezier(.2,.75,.2,1), border-color .35s ease, box-shadow .35s ease; }
      .bento-card::before, .glass-panel::before { content: ''; position: absolute; z-index: 8; inset: 0; border-radius: inherit; pointer-events: none; opacity: var(--bento-intensity); background: radial-gradient(circle at var(--bento-glow-x) var(--bento-glow-y), rgba(175,247,255,.28), rgba(47,175,255,.08) 18%, transparent 52%); mix-blend-mode: screen; transition: opacity .3s ease; }
      .bento-card::after, .glass-panel::after { content: ''; position: absolute; z-index: 9; inset: 0; border-radius: inherit; pointer-events: none; opacity: calc(var(--bento-intensity) * .75); background: linear-gradient(115deg, transparent 18%, rgba(255,255,255,.2) 42%, transparent 58%); background-size: 220% 100%; background-position: calc(50% + (var(--bento-glow-x) - 50%) * 1.3) 0; mix-blend-mode: overlay; }
      .bento-card > *, .glass-panel > * { position: relative; z-index: 10; }
      .bento-card.bento-premium-active, .glass-panel.bento-premium-active { border-color: rgba(102,225,255,.54) !important; box-shadow: var(--bento-shadow, 0 22px 55px rgba(0,0,0,.48)), 0 0 30px rgba(45,197,255,.13), inset 0 1px rgba(255,255,255,.1) !important; }
      .bento-card.bento-premium-focus, .glass-panel.bento-premium-focus { outline: 1px solid rgba(110,231,255,.62); outline-offset: 3px; }
      @media (prefers-reduced-motion: reduce) { .bento-card, .glass-panel { transition: border-color .2s ease, box-shadow .2s ease; transform: none !important; } .bento-card::after, .glass-panel::after { display: none; } }
    `;
    document.head.appendChild(style);
    stylesInjected = true;
  }

  function getCards() { return document.querySelectorAll(SELECTOR); }

  function createState(card) {
    const existing = state.get(card);
    if (existing) return existing;
    const item = { raf: 0, x: 50, y: 50, active: false };
    state.set(card, item);
    return item;
  }

  function render(card, item) {
    item.raf = 0;
    const x = item.x;
    const y = item.y;
    const rx = reducedMotion ? 0 : ((y - 50) / 50) * -7.5;
    const ry = reducedMotion ? 0 : ((x - 50) / 50) * 7.5;
    const dx = (x - 50) / 50;
    const dy = (y - 50) / 50;
    const shadowX = Math.round(dx * -14);
    const shadowY = Math.round(18 + dy * 12);
    card.style.setProperty('--bento-rx', `${rx.toFixed(2)}deg`);
    card.style.setProperty('--bento-ry', `${ry.toFixed(2)}deg`);
    card.style.setProperty('--bento-lift', reducedMotion ? '0px' : '-4px');
    card.style.setProperty('--bento-glow-x', `${x.toFixed(2)}%`);
    card.style.setProperty('--bento-glow-y', `${y.toFixed(2)}%`);
    card.style.setProperty('--bento-intensity', reducedMotion ? '0' : '.92');
    card.style.setProperty('--bento-scale', reducedMotion ? '1' : '1.012');
    card.style.setProperty('--bento-shadow', `${shadowX}px ${shadowY}px 42px rgba(0,0,0,.58)`);
  }

  function handlePointerMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const item = createState(card);
    item.x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    item.y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    item.active = true;
    card.classList.add('bento-premium-active');
    if (!item.raf) item.raf = requestAnimationFrame(() => render(card, item));
  }

  function handlePointerLeave(event) {
    const card = event.currentTarget;
    const item = createState(card);
    item.active = false;
    item.x = 50;
    item.y = 50;
    card.classList.remove('bento-premium-active');
    card.style.setProperty('--bento-intensity', '0');
    card.style.setProperty('--bento-scale', '1');
    card.style.setProperty('--bento-lift', '0px');
    card.style.setProperty('--bento-rx', '0deg');
    card.style.setProperty('--bento-ry', '0deg');
    card.style.setProperty('--bento-shadow', '0 8px 32px rgba(0,0,0,.75)');
  }

  function handleFocus(event) { event.currentTarget.classList.add('bento-premium-focus'); }
  function handleBlur(event) { event.currentTarget.classList.remove('bento-premium-focus'); }

  function bindCard(card) {
    if (card.dataset.bentoPremiumBound === 'true') return;
    card.dataset.bentoPremiumBound = 'true';
    card.addEventListener('pointermove', handlePointerMove, { passive: true });
    card.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    card.addEventListener('focusin', handleFocus);
    card.addEventListener('focusout', handleBlur);
    if (!card.hasAttribute('tabindex') && !card.querySelector('a, button, input, select, textarea')) card.setAttribute('tabindex', '0');
  }

  function initBentoEffects() {
    injectPremiumStyles();
    getCards().forEach(bindCard);
    if (!finePointer) return;
    const observer = new MutationObserver(() => getCards().forEach(bindCard));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }

  // Compatibility with the original script's named behavior.
  window.AetherXBentoEffects = { init: initBentoEffects, refresh: () => getCards().forEach(bindCard) };
  window.addEventListener('DOMContentLoaded', initBentoEffects);
})();

(function () {
  'use strict';

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let rafId = null;
  const pulsePaths = [];

  function injectPulseStyles() {
    if (document.getElementById('premium-widget-pulse-styles')) return;
    const style = document.createElement('style');
    style.id = 'premium-widget-pulse-styles';
    style.textContent = `
      .widget-sparkline { overflow: visible; filter: drop-shadow(0 0 5px currentColor); }
      .widget-sparkline .pulse-trace { fill: none !important; stroke-linecap: round; stroke-linejoin: round; }
      .widget-sparkline .pulse-dot { fill: currentColor; filter: drop-shadow(0 0 5px currentColor); }
      .widget-sparkline .pulse-scan { fill: none; stroke: currentColor; stroke-width: 1; opacity: .18; stroke-linecap: round; }
      .ai-donut-ring { animation: premiumDonutBreath 2.4s ease-in-out infinite; }
      .ai-donut-ring::before { animation: premiumDonutSpin 2.8s linear infinite; }
      @keyframes premiumDonutBreath { 0%,100% { filter: drop-shadow(0 0 5px currentColor); } 50% { filter: drop-shadow(0 0 17px currentColor); } }
      @keyframes premiumDonutSpin { to { transform: rotate(315deg); } }
      @media (prefers-reduced-motion: reduce) { .widget-sparkline, .ai-donut-ring, .ai-donut-ring::before { animation: none !important; } }
    `;
    document.head.appendChild(style);
  }

  function decorateSparkline(svg) {
    if (svg.dataset.pulseAnimated === 'true') return;
    const paths = Array.from(svg.querySelectorAll('path'));
    const trace = paths.reverse().find((path) => !path.getAttribute('fill') || path.getAttribute('fill') === 'none') || paths[0];
    if (!trace) return;

    svg.dataset.pulseAnimated = 'true';
    trace.classList.add('pulse-trace');
    const length = typeof trace.getTotalLength === 'function' ? trace.getTotalLength() : 420;
    trace.style.strokeDasharray = `${length} ${length}`;
    trace.style.strokeDashoffset = '0';

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.classList.add('pulse-dot'); dot.setAttribute('r', '2.2'); dot.setAttribute('cx', '0'); dot.setAttribute('cy', '20');
    svg.appendChild(dot);

    const scan = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    scan.classList.add('pulse-scan'); scan.setAttribute('d', trace.getAttribute('d') || '');
    scan.style.strokeDasharray = `${length * .08} ${length * .92}`; scan.style.strokeDashoffset = `${length}`;
    svg.appendChild(scan);

    pulsePaths.push({ svg, trace, dot, scan, length, phase: Math.random() * Math.PI * 2 });
  }

  function animatePulses(timestamp) {
    if (!reducedMotion) {
      pulsePaths.forEach((item) => {
        const t = timestamp * .001 + item.phase;
        const scanOffset = (t * item.length * .22) % item.length;
        item.trace.style.strokeDashoffset = String(Math.sin(t * .9) * 8);
        item.scan.style.strokeDashoffset = String(item.length - scanOffset);

        try {
          const point = item.trace.getPointAtLength((t * item.length * .12) % item.length);
          item.dot.setAttribute('cx', point.x.toFixed(2));
          item.dot.setAttribute('cy', point.y.toFixed(2));
          item.dot.style.opacity = String(.58 + Math.sin(t * 3) * .32);
        } catch (_) {
          // Keep the original SVG line working if a browser cannot sample its path.
        }
      });
    }
    rafId = requestAnimationFrame(animatePulses);
  }

  function initWidgetPulses() {
    injectPulseStyles();
    document.querySelectorAll('.widget-sparkline').forEach(decorateSparkline);
    if (!rafId) rafId = requestAnimationFrame(animatePulses);
  }

  window.addEventListener('DOMContentLoaded', initWidgetPulses);
})();

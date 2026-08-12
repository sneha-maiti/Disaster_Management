/* ==========================================================================
   AI COMPUTER VISION DAMAGE ASSESSMENT MODULE
   Simulates scanning laser beam effect across disaster imagery and renders
   structured AI neural diagnostic readouts with Vanilla JS.
   ========================================================================== */

(function () {
  'use strict';

  const samples = {
    'sample-1': {
      title: 'EARTHQUAKE FAULT / STRUCTURAL SHEAR',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
      integrity: '34.2% (COMPROMISED)',
      hazard: 'Foundation Shear Fracture & Load Column Shear',
      action: 'Immediate structural evacuation & drone-assisted shoring.',
      confidence: '99.4%',
      targetBox: { top: '35%', left: '40%', width: '35%', height: '30%' },
      accent: 'critical'
    },
    'sample-2': {
      title: 'COASTAL FLASH FLOOD / INUNDATION BREACH',
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
      integrity: '58.7% (MODERATE RISK)',
      hazard: 'Sub-surface Erosion & Electrical Grid Submersion',
      action: 'Deploy amphibious rescue pods & isolate power substations.',
      confidence: '97.8%',
      targetBox: { top: '50%', left: '20%', width: '50%', height: '40%' },
      accent: 'warning'
    },
    'sample-3': {
      title: 'WILDFIRE THERMAL / CANOPY PERIMETER',
      image: 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?auto=format&fit=crop&w=1200&q=80',
      integrity: '18.4% (CRITICAL THREAT)',
      hazard: 'Radiant Heat Ignition & Oxygen Depletion',
      action: 'Trigger atmospheric fire-retardant drone drop.',
      confidence: '99.1%',
      targetBox: { top: '20%', left: '30%', width: '45%', height: '50%' },
      accent: 'critical'
    }
  };

  const fallbackImage = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
      <defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#061527"/><stop offset=".5" stop-color="#123b52"/><stop offset="1" stop-color="#080d1b"/></linearGradient><pattern id="p" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#6ee7ff" stroke-opacity=".14"/></pattern></defs>
      <rect width="1200" height="720" fill="url(#g)"/><rect width="1200" height="720" fill="url(#p)"/><circle cx="860" cy="240" r="150" fill="none" stroke="#6ee7ff" stroke-opacity=".18" stroke-width="3"/><path d="M150 570L380 340l130 90 180-220 330 360" fill="none" stroke="#63f5ca" stroke-opacity=".5" stroke-width="8"/><text x="60" y="90" fill="#b9f5ff" font-family="monospace" font-size="24" letter-spacing="5">OPTICAL FEED DEGRADED / LOCAL FALLBACK</text>
    </svg>`);

  let scanTimer = null;
  let scanSequence = 0;
  let currentKey = 'sample-1';

  const $ = (id) => document.getElementById(id);
  const panel = () => $('tab-view-ai-vision');

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setTarget(box) {
    const target = $('neural-target-box');
    if (!target) return;
    Object.assign(target.style, box);
  }

  function setActiveButton(key) {
    document.querySelectorAll('.disaster-sample-btn').forEach((button) => {
      const active = button.dataset.sample === key;
      button.classList.toggle('border-cyan-400', active);
      button.classList.toggle('bg-cyan-950/60', active);
      button.classList.toggle('border-slate-800', !active);
      button.classList.toggle('bg-slate-900', !active);
      button.classList.toggle('text-cyan-300', active);
      button.classList.toggle('text-slate-400', !active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setStatus(text, state) {
    const status = $('ai-scan-status-text');
    if (!status) return;
    status.textContent = text;
    status.dataset.state = state || 'ready';
  }

  function updateReadout(data) {
    const score = $('ai-integrity-score');
    if (score) {
      score.textContent = data.integrity;
      score.dataset.severity = data.accent;
      score.classList.remove('text-crimson', 'text-amber-400', 'text-rose-500');
      score.classList.add(data.accent === 'critical' ? 'text-rose-500' : 'text-amber-400');
    }
    setText('ai-primary-hazard', data.hazard);
    setText('ai-recommended-action', data.action);
    setText('ai-confidence-score', data.confidence);
    setText('ai-scan-title', data.title);
  }

  function safeImageLoad(image, source, sequence) {
    if (!image) return;
    image.classList.add('is-loading');
    image.dataset.requestSequence = String(sequence);
    image.onload = () => {
      if (image.dataset.requestSequence !== String(sequence)) return;
      image.classList.remove('is-loading', 'is-fallback');
      image.classList.add('is-loaded');
    };
    image.onerror = () => {
      if (image.dataset.requestSequence !== String(sequence)) return;
      image.onerror = null;
      image.src = fallbackImage;
      image.classList.remove('is-loading');
      image.classList.add('is-fallback', 'is-loaded');
    };
    image.src = source;
    if (image.complete) {
      if (image.naturalWidth > 0) image.onload();
      else image.onerror();
    }
  }

  function runScan(key) {
    const data = samples[key] || samples['sample-1'];
    currentKey = samples[key] ? key : 'sample-1';
    const sequence = ++scanSequence;
    const laser = $('scanner-laser-beam');
    const stage = panel() && panel().querySelector('.scanner-stage');
    const scanButton = $('trigger-laser-scan-btn');

    if (scanTimer) window.clearTimeout(scanTimer);
    if (laser) {
      laser.classList.remove('scanning');
      void laser.offsetWidth;
      laser.classList.add('scanning');
    }
    if (stage) stage.classList.add('is-scanning');
    if (scanButton) {
      scanButton.disabled = true;
      scanButton.setAttribute('aria-busy', 'true');
    }
    setStatus('AI COMPUTER VISION SCANNING IN PROGRESS...', 'scanning');

    scanTimer = window.setTimeout(() => {
      if (sequence !== scanSequence) return;
      if (laser) laser.classList.remove('scanning');
      if (stage) stage.classList.remove('is-scanning');
      if (scanButton) {
        scanButton.disabled = false;
        scanButton.setAttribute('aria-busy', 'false');
      }
      setStatus('NEURAL DIAGNOSTIC COMPLETE // HIGH CONFIDENCE', 'complete');
      updateReadout(data);
    }, 2500);
  }

  function loadSample(key, shouldScan) {
    const data = samples[key] || samples['sample-1'];
    const image = $('scanner-display-img');
    currentKey = samples[key] ? key : 'sample-1';
    setActiveButton(currentKey);
    setTarget(data.targetBox);
    safeImageLoad(image, data.image, ++scanSequence);
    updateReadout(data);
    if (shouldScan !== false) runScan(currentKey);
  }

  function injectScanControl() {
    if ($('trigger-laser-scan-btn')) return;
    const buttons = document.querySelector('.disaster-sample-btn')?.parentElement;
    if (!buttons) return;
    const button = document.createElement('button');
    button.id = 'trigger-laser-scan-btn';
    button.type = 'button';
    button.className = 'premium-scan-trigger';
    button.innerHTML = '<span class="premium-scan-trigger__dot"></span><span>RUN NEURAL SCAN</span><kbd>SPACE</kbd>';
    buttons.insertAdjacentElement('afterend', button);
    button.addEventListener('click', () => runScan(currentKey));
  }

  function init() {
    if (!panel() || panel().dataset.scannerPremiumReady === 'true') return;
    panel().dataset.scannerPremiumReady = 'true';
    const image = $('scanner-display-img');
    if (image) {
      image.decoding = 'async';
      image.loading = 'eager';
      image.referrerPolicy = 'no-referrer-when-downgrade';
      image.alt = 'AI computer vision disaster damage scan';
    }
    injectScanControl();
    document.querySelectorAll('.disaster-sample-btn').forEach((button) => {
      button.type = 'button';
      button.addEventListener('click', () => loadSample(button.dataset.sample));
    });
    document.addEventListener('keydown', (event) => {
      if (event.code !== 'Space' || event.target.matches('input, textarea, button')) return;
      if (!panel() || panel().classList.contains('hidden')) return;
      event.preventDefault();
      runScan(currentKey);
    });
    loadSample('sample-1');
  }

  window.addEventListener('DOMContentLoaded', init);
  window.AetherXDamageScanner = { loadSample, runScan, samples };
})();

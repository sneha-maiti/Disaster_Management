/* ==========================================================================
   URGENT SOS COMMAND MODAL — Tactical Full-Screen Dispatch
   ========================================================================== */

(function () {
  'use strict';

  let selectedLevel = 3;
  let gpsTimer = null;
  let dispatchTimer = null;
  let styleInjected = false;

  const premiumStyles = `
    #sos-modal-backdrop { opacity: 0; visibility: hidden; transition: opacity .38s ease, visibility .38s ease; background: radial-gradient(circle at 50% 48%, rgba(112,0,18,.18), rgba(0,0,0,.96) 58%); }
    #sos-modal-backdrop.active { opacity: 1; visibility: visible; }
    #sos-modal-backdrop .tactical-command-shell { position: relative; overflow: hidden; border: 1px solid rgba(255,64,92,.32); background: linear-gradient(135deg, rgba(18,4,14,.98), rgba(4,8,18,.98) 56%, rgba(14,4,8,.98)); box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 0 90px rgba(255,28,58,.16), 0 35px 100px rgba(0,0,0,.7); }
    #sos-modal-backdrop .tactical-command-shell::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(rgba(255,70,90,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,70,90,.025) 1px, transparent 1px); background-size: 38px 38px; mask-image: linear-gradient(135deg, black, transparent 78%); }
    #sos-modal-backdrop .tactical-topbar { position: relative; z-index: 2; border-bottom: 1px solid rgba(255,75,97,.2); background: rgba(16,3,12,.72); box-shadow: 0 8px 24px rgba(0,0,0,.26); }
    #sos-modal-backdrop .tactical-sidebar-left { position: relative; z-index: 2; width: 92px; min-width: 92px; padding: 18px 10px; border-right: 1px solid rgba(255,75,97,.18); background: linear-gradient(180deg, rgba(35,4,15,.8), rgba(6,8,18,.82)); }
    #sos-modal-backdrop .tactical-sidebar-left .tactical-nav-item:not(.active-sos), #sos-modal-backdrop .tactical-sidebar-left > .mt-auto { display: none !important; }
    #sos-modal-backdrop .tactical-sidebar-left .tactical-nav-item.active-sos { display: flex !important; min-height: 76px; flex-direction: column; justify-content: center; gap: 7px; margin: 0; border: 1px solid rgba(255,76,98,.62); border-radius: 14px; background: linear-gradient(145deg, rgba(255,38,66,.26), rgba(63,3,18,.6)); color: #fff; text-align: center; font-size: 9px; letter-spacing: .1em; box-shadow: 0 0 28px rgba(255,35,63,.22), inset 0 1px rgba(255,255,255,.12); animation: sosNavPulse 2.5s ease-in-out infinite; }
    #sos-modal-backdrop .tactical-sidebar-left .active-sos span { font-size: 24px; filter: drop-shadow(0 0 9px #ff3655); }
    #sos-modal-backdrop .tactical-center-stage { position: relative; z-index: 1; }
    #sos-modal-backdrop .sos-modal-red-frame { position: relative; border: 1px solid rgba(255,71,94,.42); border-radius: 22px; background: linear-gradient(145deg, rgba(42,6,19,.72), rgba(6,10,20,.84) 64%); box-shadow: 0 0 0 1px rgba(255,255,255,.035) inset, 0 0 45px rgba(255,28,58,.13), 0 25px 65px rgba(0,0,0,.35); }
    #sos-modal-backdrop .sos-modal-red-frame::before, #sos-modal-backdrop .sos-modal-red-frame::after { content: ''; position: absolute; width: 36px; height: 36px; pointer-events: none; border-color: #ff526d; border-style: solid; filter: drop-shadow(0 0 8px rgba(255,58,83,.8)); }
    #sos-modal-backdrop .sos-modal-red-frame::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; border-radius: 22px 0 0 0; }
    #sos-modal-backdrop .sos-modal-red-frame::after { right: -1px; bottom: -1px; border-width: 0 2px 2px 0; border-radius: 0 0 22px 0; }
    #sos-modal-backdrop .sos-radar-container { position: relative; width: min(100%, 210px); aspect-ratio: 1; margin: 8px auto; overflow: hidden; border: 1px solid rgba(255,68,91,.46); border-radius: 50%; background: radial-gradient(circle, rgba(255,60,82,.16) 0 2%, transparent 3%), repeating-radial-gradient(circle, transparent 0 27px, rgba(255,70,92,.2) 28px 29px), linear-gradient(90deg, transparent 49.5%, rgba(255,70,92,.25) 50%, transparent 50.5%), linear-gradient(transparent 49.5%, rgba(255,70,92,.25) 50%, transparent 50.5%); box-shadow: 0 0 0 8px rgba(255,45,68,.035), 0 0 34px rgba(255,31,59,.22), inset 0 0 32px rgba(255,25,50,.17); }
    #sos-modal-backdrop .sos-radar-container::after { content: ''; position: absolute; inset: 50%; width: 50%; height: 2px; transform-origin: 0 50%; background: linear-gradient(90deg, rgba(255,91,108,.9), transparent); box-shadow: 0 0 10px #ff3c57; animation: sosRadarSweep 2.8s linear infinite; }
    #sos-modal-backdrop .sos-radar-sweep { position: absolute; inset: 9%; border: 1px solid rgba(255,109,121,.16); border-radius: 50%; animation: sosRadarRipple 2.2s ease-out infinite; }
    #sos-modal-backdrop .sos-radar-container > .w-3 { position: relative; z-index: 3; width: 12px; height: 12px; background: #ff3554 !important; box-shadow: 0 0 8px #ff3554, 0 0 28px #ff1f46 !important; animation: sosCorePulse 1.25s ease-in-out infinite; }
    #sos-modal-backdrop .severity-level-card { border: 1px solid rgba(255,255,255,.08); border-radius: 12px; background: rgba(4,8,17,.58); transition: transform .22s ease, border-color .22s ease, background .22s ease, box-shadow .22s ease; }
    #sos-modal-backdrop .severity-level-card:hover { transform: translateX(3px); border-color: rgba(255,100,117,.46); background: rgba(71,8,23,.36); }
    #sos-modal-backdrop .severity-level-card.selected { border-color: rgba(255,77,100,.78); background: linear-gradient(90deg, rgba(118,11,34,.48), rgba(39,5,17,.48)); box-shadow: 0 0 22px rgba(255,34,65,.12), inset 3px 0 #ff3d5b; }
    #sos-modal-backdrop #evidence-dropzone { position: relative; border-color: rgba(255,82,105,.48); border-radius: 14px; background: linear-gradient(145deg, rgba(75,5,22,.27), rgba(10,10,20,.3)); box-shadow: inset 0 0 22px rgba(255,36,63,.05); transition: .25s ease; }
    #sos-modal-backdrop #evidence-dropzone:hover, #sos-modal-backdrop #evidence-dropzone.is-dragging { border-color: #ff6680; background: rgba(104,11,32,.38); box-shadow: 0 0 26px rgba(255,36,63,.18), inset 0 0 24px rgba(255,36,63,.08); transform: translateY(-2px); }
    #sos-modal-backdrop #evidence-preview img { width: 100%; max-height: 108px; object-fit: cover; border: 1px solid rgba(99,245,202,.45); border-radius: 10px; margin-top: 8px; filter: saturate(.86) contrast(1.08); }
    #sos-modal-backdrop .btn-execute-sos { position: relative; overflow: hidden; border: 1px solid rgba(255,152,161,.72); border-radius: 14px; background: linear-gradient(135deg, #8f0e2e, #e3284c 58%, #ff5265); box-shadow: 0 0 22px rgba(255,28,60,.32), inset 0 1px rgba(255,255,255,.22); transition: .25s ease; }
    #sos-modal-backdrop .btn-execute-sos::before { content: ''; position: absolute; inset: 0; transform: translateX(-110%); background: linear-gradient(105deg, transparent, rgba(255,255,255,.28), transparent); animation: sosButtonShine 3.4s ease-in-out infinite; }
    #sos-modal-backdrop .btn-execute-sos:hover { transform: translateY(-2px) scale(1.015); box-shadow: 0 0 42px rgba(255,28,60,.58), inset 0 1px rgba(255,255,255,.3); }
    #sos-modal-backdrop .tactical-sidebar-right { border-left-color: rgba(255,75,97,.17); background: rgba(18,4,14,.35); }
    #sos-modal-backdrop .threat-sonar { filter: drop-shadow(0 0 20px rgba(255,34,65,.28)); animation: sosThreatPulse 2.3s ease-in-out infinite; }
    @keyframes sosRadarSweep { to { transform: rotate(360deg); } }
    @keyframes sosRadarRipple { 0% { transform: scale(.45); opacity: .8; } 100% { transform: scale(1.4); opacity: 0; } }
    @keyframes sosCorePulse { 50% { transform: scale(1.42); opacity: .66; } }
    @keyframes sosThreatPulse { 50% { transform: scale(1.04); } }
    @keyframes sosNavPulse { 50% { box-shadow: 0 0 42px rgba(255,35,63,.35), inset 0 1px rgba(255,255,255,.16); } }
    @keyframes sosButtonShine { 0%, 55% { transform: translateX(-110%); } 78%, 100% { transform: translateX(110%); } }
    @media (max-width: 900px) { #sos-modal-backdrop .tactical-sidebar-left { display: none; } #sos-modal-backdrop .tactical-command-shell { width: 100%; min-height: 100%; } }
    @media (prefers-reduced-motion: reduce) { #sos-modal-backdrop *, #sos-modal-backdrop *::before, #sos-modal-backdrop *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; } }
  `;

  function injectStyles() {
    if (styleInjected) return;
    const style = document.createElement('style');
    style.id = 'aetherx-sos-premium-styles';
    style.textContent = premiumStyles;
    document.head.appendChild(style);
    styleInjected = true;
  }

  function initSosModal() {
    const backdrop = document.getElementById('sos-modal-backdrop');
    if (!backdrop || backdrop.dataset.premiumReady === 'true') return;
    backdrop.dataset.premiumReady = 'true';
    injectStyles();

    document.querySelectorAll('.tactical-sidebar-left .tactical-nav-item:not(.active-sos)').forEach((item) => item.remove());
    const activeNav = backdrop.querySelector('.tactical-sidebar-left .active-sos');
    if (activeNav) { activeNav.innerHTML = '<span>🆘</span><strong>SOS</strong><small>EMERGENCY</small>'; activeNav.setAttribute('aria-current', 'page'); }

    document.querySelectorAll('.trigger-sos-modal').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); openModal(); }));
    document.getElementById('close-sos-modal')?.addEventListener('click', closeModal);
    backdrop.addEventListener('click', (event) => { if (event.target === backdrop) closeModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
    document.getElementById('sos-dispatch-execute-btn')?.addEventListener('click', executeDispatch);
    setupSeverityCards();
    setupDragDrop();
  }

  function openModal() {
    const backdrop = document.getElementById('sos-modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    startGpsTriangulation();
  }

  function closeModal() {
    const backdrop = document.getElementById('sos-modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (gpsTimer) { clearInterval(gpsTimer); gpsTimer = null; }
    if (dispatchTimer) { clearTimeout(dispatchTimer); dispatchTimer = null; }
    const button = document.getElementById('sos-dispatch-execute-btn');
    if (button) { button.textContent = '((•)) EXECUTE SOS DISPATCH >>'; button.style.background = ''; button.style.boxShadow = ''; button.disabled = false; }
  }

  function startGpsTriangulation() {
    const coords = document.getElementById('gps-coords-display');
    const status = document.getElementById('gps-radar-status');
    if (!coords) return;
    if (gpsTimer) clearInterval(gpsTimer);
    coords.textContent = 'TRIANGULATING SATELLITE RELAY...';
    if (status) status.textContent = 'Scanning orbital sensors...';
    let count = 0;
    gpsTimer = setInterval(() => {
      count += 1;
      coords.textContent = `${(12.977 + (Math.random() - .5) * .02).toFixed(4)}°N ${(77.589 + (Math.random() - .5) * .02).toFixed(4)}°E`;
      if (count > 5) { clearInterval(gpsTimer); gpsTimer = null; coords.textContent = '12°58\'37.1"N 77°35\'21.5"E'; if (status) status.textContent = 'Geospatial lock confirmed (±4.2m)'; }
    }, 280);
  }

  function setupSeverityCards() {
    document.querySelectorAll('.severity-level-card').forEach((card) => card.addEventListener('click', () => {
      document.querySelectorAll('.severity-level-card').forEach((item) => { item.classList.remove('selected', 'level-3'); item.querySelector('.severity-check')?.remove(); });
      card.classList.add('selected');
      if (card.dataset.level === '3') card.classList.add('level-3');
      selectedLevel = Number.parseInt(card.dataset.level, 10) || 3;
      const check = document.createElement('span'); check.className = 'severity-check text-rose-400 font-bold'; check.textContent = '✓'; card.appendChild(check);
    }));
  }

  function setupDragDrop() {
    const dropzone = document.getElementById('evidence-dropzone');
    const preview = document.getElementById('evidence-preview');
    if (!dropzone || !preview) return;
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp,image/heic'; input.hidden = true; input.id = 'sos-evidence-file-input'; dropzone.appendChild(input);
    dropzone.addEventListener('click', () => input.click());
    ['dragenter', 'dragover'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); event.stopPropagation(); dropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach((eventName) => dropzone.addEventListener(eventName, (event) => { event.preventDefault(); event.stopPropagation(); dropzone.classList.remove('is-dragging'); }));
    dropzone.addEventListener('drop', (event) => processFile(event.dataTransfer.files?.[0]));
    input.addEventListener('change', () => processFile(input.files?.[0]));

    function processFile(file) {
      if (!file) return;
      if (!file.type.startsWith('image/')) { preview.innerHTML = '<div class="p-2 rounded border border-rose-500/40 bg-rose-950/20 font-mono text-[9px] text-rose-300">IMAGE FILE REQUIRED</div>'; return; }
      if (file.size > 10 * 1024 * 1024) { preview.innerHTML = '<div class="p-2 rounded border border-amber-500/40 bg-amber-950/20 font-mono text-[9px] text-amber-300">FILE EXCEEDS 10MB LIMIT</div>'; return; }
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<div class="p-2 rounded border border-emerald-500/40 bg-emerald-950/20 font-mono text-[9px] text-emerald-400">FILE LOADED: ${escapeHtml(file.name)} — Edge detection active</div><img src="${url}" alt="Uploaded incident evidence preview">`;
    }
  }

  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }

  function executeDispatch() {
    const button = document.getElementById('sos-dispatch-execute-btn');
    if (!button) return;
    button.disabled = true;
    button.textContent = `DISPATCH CONFIRMED • LEVEL ${selectedLevel} ✓`;
    button.style.background = 'linear-gradient(135deg, #006622, #34C759)';
    button.style.boxShadow = '0 0 40px rgba(52,199,89,.7)';
    dispatchTimer = setTimeout(closeModal, 1800);
  }

  window.triggerSosModal = openModal;
  window.addEventListener('DOMContentLoaded', initSosModal);
})();

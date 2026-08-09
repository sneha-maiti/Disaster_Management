/* ==========================================================================
   URGENT SOS COMMAND MODAL — Tactical Full-Screen Dispatch
   ========================================================================== */

(function () {
  let selectedLevel = 3;

  function initSosModal() {
    const modalBackdrop = document.getElementById('sos-modal-backdrop');
    const triggers = document.querySelectorAll('.trigger-sos-modal');
    const closeBtn = document.getElementById('close-sos-modal');
    const executeBtn = document.getElementById('sos-dispatch-execute-btn');

    triggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    if (executeBtn) {
      executeBtn.addEventListener('click', () => {
        executeBtn.textContent = 'DISPATCH CONFIRMED ✓';
        executeBtn.style.background = 'linear-gradient(135deg, #006622, #34C759)';
        executeBtn.style.boxShadow = '0 0 40px rgba(52, 199, 89, 0.7)';
        setTimeout(closeModal, 1800);
      });
    }

    setupSeverityCards();
    setupDragDrop();
  }

  function openModal() {
    const modalBackdrop = document.getElementById('sos-modal-backdrop');
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
    startGpsTriangulation();
  }

  function closeModal() {
    const modalBackdrop = document.getElementById('sos-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    const executeBtn = document.getElementById('sos-dispatch-execute-btn');
    if (executeBtn) {
      executeBtn.textContent = '((•)) EXECUTE SOS DISPATCH >>';
      executeBtn.style.background = '';
      executeBtn.style.boxShadow = '';
    }
  }

  function startGpsTriangulation() {
    const coordsDisplay = document.getElementById('gps-coords-display');
    const radarStatus = document.getElementById('gps-radar-status');
    if (!coordsDisplay) return;

    coordsDisplay.textContent = 'TRIANGULATING SATELLITE RELAY...';
    if (radarStatus) radarStatus.textContent = 'Scanning orbital sensors...';

    let count = 0;
    const interval = setInterval(() => {
      count++;
      const lat = (12.977 + (Math.random() - 0.5) * 0.02).toFixed(4);
      const lng = (77.589 + (Math.random() - 0.5) * 0.02).toFixed(4);
      coordsDisplay.textContent = `${lat}°N ${lng}°E`;

      if (count > 5) {
        clearInterval(interval);
        coordsDisplay.textContent = '12°58\'37.1"N 77°35\'21.5"E';
        if (radarStatus) radarStatus.textContent = 'Geospatial lock confirmed (±4.2m)';
      }
    }, 280);
  }

  function setupSeverityCards() {
    document.querySelectorAll('.severity-level-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.severity-level-card').forEach(c => {
          c.classList.remove('selected', 'level-3');
          const check = c.querySelector('.severity-check');
          if (check) check.remove();
        });
        card.classList.add('selected');
        if (card.dataset.level === '3') card.classList.add('level-3');
        selectedLevel = parseInt(card.dataset.level, 10);

        const check = document.createElement('span');
        check.className = 'severity-check text-rose-400 font-bold';
        check.textContent = '✓';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.appendChild(check);
      });
    });
  }

  function setupDragDrop() {
    const dropzone = document.getElementById('evidence-dropzone');
    const preview = document.getElementById('evidence-preview');
    if (!dropzone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(ev => {
      dropzone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && preview) {
        preview.innerHTML = `<div class="p-2 rounded border border-emerald-500/40 bg-emerald-950/20 font-mono text-[9px] text-emerald-400">FILE LOADED: ${files[0].name} — Edge detection active</div>`;
      }
    });
  }

  window.triggerSosModal = openModal;
  window.addEventListener('DOMContentLoaded', initSosModal);
})();

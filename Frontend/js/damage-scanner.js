/* ==========================================================================
   AI COMPUTER VISION DAMAGE ASSESSMENT MODULE
   Simulates scanning laser beam effect across disaster imagery and renders
   structured AI neural diagnostic readouts with Vanilla JS.
   ========================================================================== */

(function () {
  const sampleDisasters = {
    'sample-1': {
      title: 'Earthquake Fault Shear Fracture',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
      integrity: '34.2% (COMPROMISED)',
      hazard: 'Foundation Shear Fracture & Load Column Shear',
      action: 'Immediate structural evacuation & drone-assisted shoring.',
      confidence: '99.4%',
      targetBox: { top: '35%', left: '40%', width: '35%', height: '30%' }
    },
    'sample-2': {
      title: 'Coastal Flash Flood Inundation',
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
      integrity: '58.7% (MODERATE RISK)',
      hazard: 'Sub-surface Erosion & Electrical Grid Submersion',
      action: 'Deploy amphibious rescue pods & isolate power substations.',
      confidence: '97.8%',
      targetBox: { top: '50%', left: '20%', width: '50%', height: '40%' }
    },
    'sample-3': {
      title: 'Wildfire Thermal Canopy Perimeter',
      image: 'https://images.unsplash.com/photo-1574063413132-355dbfd83e0c?auto=format&fit=crop&w=1200&q=80',
      integrity: '18.4% (CRITICAL THREAT)',
      hazard: 'Radiant Heat Ignition & Oxygen Depletion',
      action: 'Trigger atmospheric fire-retardant drone drop.',
      confidence: '99.1%',
      targetBox: { top: '20%', left: '30%', width: '45%', height: '50%' }
    }
  };

  function initDamageScanner() {
    const sampleBtns = document.querySelectorAll('.disaster-sample-btn');
    const scanTrigger = document.getElementById('trigger-laser-scan-btn');
    const imageEl = document.getElementById('scanner-display-img');
    const laserEl = document.getElementById('scanner-laser-beam');
    const targetBox = document.getElementById('neural-target-box');

    sampleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sampleBtns.forEach(b => b.classList.remove('border-cyan-400', 'bg-cyan-950/60'));
        btn.classList.add('border-cyan-400', 'bg-cyan-950/60');
        const key = btn.dataset.sample;
        loadSampleData(key);
      });
    });

    if (scanTrigger) {
      scanTrigger.addEventListener('click', () => {
        const activeSample = document.querySelector('.disaster-sample-btn.border-cyan-400');
        const key = activeSample ? activeSample.dataset.sample : 'sample-1';
        runLaserScanAnimation(key);
      });
    }

    // Default Load Sample 1
    loadSampleData('sample-1');
  }

  function loadSampleData(key) {
    const data = sampleDisasters[key] || sampleDisasters['sample-1'];
    const imageEl = document.getElementById('scanner-display-img');
    const targetBox = document.getElementById('neural-target-box');

    if (imageEl) imageEl.src = data.image;

    if (targetBox) {
      targetBox.style.top = data.targetBox.top;
      targetBox.style.left = data.targetBox.left;
      targetBox.style.width = data.targetBox.width;
      targetBox.style.height = data.targetBox.height;
    }

    runLaserScanAnimation(key);
  }

  function runLaserScanAnimation(key) {
    const data = sampleDisasters[key] || sampleDisasters['sample-1'];
    const laserEl = document.getElementById('scanner-laser-beam');
    const statusText = document.getElementById('ai-scan-status-text');

    if (laserEl) {
      laserEl.classList.add('scanning');
      if (statusText) statusText.textContent = 'AI COMPUTER VISION SCANNING IN PROGRESS...';
    }

    setTimeout(() => {
      if (laserEl) laserEl.classList.remove('scanning');
      if (statusText) statusText.textContent = 'NEURAL DIAGNOSTIC COMPLETE // HIGH CONFIDENCE';

      // Update AI Diagnostics Readout
      const scoreEl = document.getElementById('ai-integrity-score');
      const hazardEl = document.getElementById('ai-primary-hazard');
      const actionEl = document.getElementById('ai-recommended-action');
      const confidenceEl = document.getElementById('ai-confidence-score');

      if (scoreEl) {
        scoreEl.textContent = data.integrity;
        scoreEl.className = `font-mono font-bold text-lg ${data.integrity.includes('COMPROMISED') || data.integrity.includes('CRITICAL') ? 'text-crimson' : 'text-amber-400'}`;
      }
      if (hazardEl) hazardEl.textContent = data.hazard;
      if (actionEl) actionEl.textContent = data.action;
      if (confidenceEl) confidenceEl.textContent = data.confidence;
    }, 2500);
  }

  window.addEventListener('DOMContentLoaded', initDamageScanner);
})();

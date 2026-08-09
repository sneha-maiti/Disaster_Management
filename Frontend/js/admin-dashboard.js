/* ==========================================================================
   ADMIN EXECUTIVE COMMAND DASHBOARD & SHELTER RESOURCE HUB
   Renders custom high-fidelity, glowing real-time neon area charts via Chart.js,
   binds allocation sliders, and drives typewriter monospace log terminals.
   ========================================================================== */

(function () {
  let severityChart, throughputChart;
  
  let terminalLogs = [
    "[SYSTEM_INIT] Satellite Uplink Relay Established: GEO-SATSAT-09",
    "[AI_NEXUS] Damage Diagnostic Neural Model v4.8 Loaded (Accuracy: 99.4%)",
    "[TACTICAL] Sector Alpha Drone Squad #4 Redeployed to Cascadia Fault Zone",
    "[TELEMETRY] Seismic Wave Energy Peak Detected: 6.4 Mw at Depth 12km",
    "[AUTONOMOUS_SOS] Emergency Dispatch #SOS-01 Cryptographic Signature Verified",
    "[BIO_DOME] Oxygen Reserves Rebalanced: Sanctuary Hub 1 at 92.4% Capacity",
    "[CORRIDOR_UPDATE] Evacuation Corridor Alpha Traffic Flow: 1,420 Convoy Units/hr"
  ];

  function initAdminDashboard() {
    renderBreathtakingCharts();
    initResourceSliders();
    initTypewriterTerminal();
    initShelterProgressBars();
  }

  // Render High-Tech Glowing Area Charts using Chart.js
  function renderBreathtakingCharts() {
    const ctxSeverity = document.getElementById('chart-severity');
    const ctxThroughput = document.getElementById('chart-throughput');

    if (ctxSeverity && typeof Chart !== 'undefined') {
      const gradient = ctxSeverity.getContext('2d').createLinearGradient(0, 0, 0, 120);
      gradient.addColorStop(0, 'rgba(255, 42, 95, 0.45)');
      gradient.addColorStop(1, 'rgba(255, 42, 95, 0.0)');

      severityChart = new Chart(ctxSeverity, {
        type: 'line',
        data: {
          labels: ['02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00'],
          datasets: [{
            label: 'Seismic Intensity',
            data: [2.1, 4.8, 3.2, 5.9, 6.4, 4.1, 5.2],
            borderColor: '#FF2A5F',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#FF2A5F',
            pointHoverRadius: 6,
            shadowColor: 'rgba(255, 42, 95, 0.5)',
            shadowBlur: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 } }
            }
          }
        }
      });
    }

    if (ctxThroughput && typeof Chart !== 'undefined') {
      const gradient = ctxThroughput.getContext('2d').createLinearGradient(0, 0, 0, 120);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

      throughputChart = new Chart(ctxThroughput, {
        type: 'line',
        data: {
          labels: ['10s', '8s', '6s', '4s', '2s', 'Now'],
          datasets: [{
            label: 'Bandwidth',
            data: [420, 580, 490, 720, 850, 920],
            borderColor: '#00F0FF',
            borderWidth: 2,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#00F0FF',
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748B', font: { family: 'JetBrains Mono', size: 9 } }
            }
          }
        }
      });

      // Simulate live chart throughput update
      setInterval(() => {
        if (throughputChart) {
          const data = throughputChart.data.datasets[0].data;
          data.shift();
          data.push(Math.floor(Math.random() * 300 + 650));
          throughputChart.update('none');
        }
      }, 3000);
    }
  }

  // Resource Sliders Re-allocation Listener
  function initResourceSliders() {
    const sliders = document.querySelectorAll('.resource-allocation-slider');
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const valId = slider.dataset.valueDisplay;
        const valEl = document.getElementById(valId);
        if (valEl) valEl.textContent = `${e.target.value}%`;
      });
    });
  }

  // Typewriter Terminal Log Feed
  function initTypewriterTerminal() {
    const terminal = document.getElementById('admin-activity-terminal');
    if (!terminal) return;

    let logIndex = 0;

    function appendNextLog() {
      if (logIndex >= terminalLogs.length) logIndex = 0;

      const logText = terminalLogs[logIndex];
      const timeStr = new Date().toISOString().substring(11, 19) + ' UTC';

      const lineEl = document.createElement('div');
      lineEl.className = 'terminal-line text-xs font-mono text-cyan-300 opacity-0 transition-opacity duration-300';
      lineEl.innerHTML = `<span class="terminal-time">[${timeStr}]</span> <span>${logText}</span>`;

      terminal.appendChild(lineEl);
      terminal.scrollTop = terminal.scrollHeight;

      // Fade in line
      setTimeout(() => lineEl.classList.remove('opacity-0'), 50);

      logIndex++;
    }

    // Append initial batch
    for (let i = 0; i < 4; i++) {
      appendNextLog();
    }

    // Stream line every 3 seconds
    setInterval(appendNextLog, 3200);
  }

  // Shelter Inventory Resource Progress Bars
  function initShelterProgressBars() {
    const bars = document.querySelectorAll('.resource-progress-fill');
    bars.forEach(bar => {
      const pct = bar.dataset.percentage;
      setTimeout(() => {
        bar.style.width = `${pct}%`;
      }, 300);
    });
  }

  window.addEventListener('DOMContentLoaded', initAdminDashboard);
})();

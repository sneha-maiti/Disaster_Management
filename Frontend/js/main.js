/* ==========================================================================
   AETHER-X MAIN APP CONTROLLER
   ========================================================================== */

(function () {
  function initMainController() {
    startUtcClock();
    startThreatCountdown();
    setupTabNavigation();
    setupLogoHome();
    setupMobileMenu();
  }

  function startUtcClock() {
    function update() {
      const now = new Date();
      const formatted = `UTC ${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')} ${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`;

      const overviewClock = document.getElementById('overview-utc-time');
      const commandClock = document.getElementById('command-utc-time');
      if (overviewClock) overviewClock.textContent = formatted;
      if (commandClock) commandClock.textContent = formatted;
    }
    update();
    setInterval(update, 1000);
  }

  function startThreatCountdown() {
    const etaEl = document.getElementById('threat-eta');
    if (!etaEl) return;
    let totalSeconds = 17 * 60 + 42;
    setInterval(() => {
      if (totalSeconds <= 0) return;
      totalSeconds--;
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      etaEl.textContent = `${m}m ${String(s).padStart(2, '0')}s`;
    }, 1000);
  }

  function setupLogoHome() {
    const logo = document.getElementById('header-logo-home');
    if (logo) logo.addEventListener('click', () => switchTab('tab-view-overview'));
  }

  function setupMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const nav = document.getElementById('top-nav-links');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('flex');
      nav.classList.toggle('flex-col');
      nav.classList.toggle('absolute');
      nav.classList.toggle('top-16');
      nav.classList.toggle('left-0');
      nav.classList.toggle('right-0');
      nav.classList.toggle('bg-black');
      nav.classList.toggle('p-4');
      nav.classList.toggle('border-b');
      nav.classList.toggle('border-cyan-500/20');
    });
  }

  function switchTab(targetTabId) {
    document.querySelectorAll('.screenshot-view-tab').forEach(tab => {
      tab.classList.toggle('active', tab.id === targetTabId);
    });

    document.querySelectorAll('.screenshot-nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.tab === targetTabId);
    });

    document.querySelectorAll('.dock-icon-item[data-tab]').forEach(dock => {
      dock.classList.toggle('active', dock.dataset.tab === targetTabId);
    });

    if (targetTabId === 'tab-view-map') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    }

    if (targetTabId === 'tab-view-command') {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupTabNavigation() {
    document.querySelectorAll('.screenshot-nav-link[data-tab]').forEach(link => {
      link.addEventListener('click', () => switchTab(link.dataset.tab));
    });

    document.querySelectorAll('.dock-icon-item[data-tab]').forEach(dock => {
      dock.addEventListener('click', () => switchTab(dock.dataset.tab));
    });

    document.querySelectorAll('.nav-switch-btn[data-target-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.targetTab));
    });
  }

  window.switchTab = switchTab;
  window.addEventListener('DOMContentLoaded', initMainController);
})();

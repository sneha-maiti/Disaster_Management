/* ==========================================================================
   AETHER-X MAIN APP CONTROLLER
   ========================================================================== */

(function () {
  function initMainController() {
    setupAuthHeader();
    setupStep2Modal();
    startUtcClock();
    startThreatCountdown();
    setupTabNavigation();
    setupLogoHome();
    setupMobileMenu();
  }

  function isStep1Auth() {
    try {
      const auth = sessionStorage.getItem('aetherx_auth');
      return !!auth && !!JSON.parse(auth)?.username;
    } catch (e) {
      return false;
    }
  }

  function isMemberLoggedIn() {
    try {
      const mem = sessionStorage.getItem('aetherx_member_login');
      return !!mem && !!JSON.parse(mem)?.memberId;
    } catch (e) {
      return false;
    }
  }

  function getMemberData() {
    try {
      return JSON.parse(sessionStorage.getItem('aetherx_member_login')) || {};
    } catch (e) {
      return {};
    }
  }

  function setupAuthHeader() {
    if (!isStep1Auth()) {
      window.location.replace('authentication.html');
      return;
    }

    const memberLoggedIn = isMemberLoggedIn();
    const memberData = getMemberData();

    const step2LoginBtn = document.getElementById('btn-step2-login');
    const authUserBadge = document.getElementById('auth-user-badge');
    const userDisplay = document.getElementById('auth-username-display');
    const roleDisplay = document.getElementById('auth-role-badge');
    const lockIndicators = document.querySelectorAll('.lock-indicator');

    const step2Card = document.getElementById('step2-status-card');
    const step2BadgeTitle = document.getElementById('step2-badge-title');
    const step2LevelTag = document.getElementById('step2-level-tag');
    const step2DescText = document.getElementById('step2-desc-text');
    const step2IndicatorTag = document.getElementById('step2-indicator-tag');
    const step2ActionLink = document.getElementById('step2-action-link');
    const step2PulseDot = document.getElementById('step2-pulse-dot');

    if (!memberLoggedIn) {
      // Step 2 Pending State
      if (step2LoginBtn) step2LoginBtn.classList.remove('hidden');
      if (authUserBadge) {
        authUserBadge.classList.remove('flex');
        authUserBadge.classList.add('hidden');
      }
      lockIndicators.forEach(el => el.classList.remove('hidden'));

      if (step2Card) {
        step2Card.className = "p-3.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-cyan-950/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono text-xs";
      }
      if (step2BadgeTitle) {
        step2BadgeTitle.className = "text-amber-400 font-bold flex items-center gap-1.5";
        step2BadgeTitle.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> TWO-STEP VERIFICATION: STEP 2 REQUIRED';
      }
      if (step2LevelTag) {
        step2LevelTag.className = "text-amber-300 text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40 font-bold";
        step2LevelTag.textContent = "CLEARANCE: 1/2";
      }
      if (step2IndicatorTag) {
        step2IndicatorTag.className = "text-amber-400 font-bold flex items-center gap-1";
        step2IndicatorTag.innerHTML = '<span>●</span> Step 2: Member Login Pending';
      }
      if (step2ActionLink) {
        step2ActionLink.style.display = "inline-flex";
      }
    } else {
      // Step 2 Completed State
      if (step2LoginBtn) step2LoginBtn.classList.add('hidden');
      if (authUserBadge) {
        authUserBadge.classList.remove('hidden');
        authUserBadge.classList.add('flex');
      }
      if (userDisplay && memberData.memberId) {
        userDisplay.textContent = memberData.memberId.toUpperCase();
      }
      if (roleDisplay) {
        roleDisplay.textContent = "2-STEP VERIFIED";
      }
      lockIndicators.forEach(el => el.classList.add('hidden'));

      if (step2Card) {
        step2Card.className = "p-3.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900/80 to-cyan-950/30 shadow-[0_0_20px_rgba(52,211,153,0.15)] font-mono text-xs";
      }
      if (step2BadgeTitle) {
        step2BadgeTitle.className = "text-emerald-400 font-bold flex items-center gap-1.5";
        step2BadgeTitle.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> TWO-STEP VERIFICATION: FULL ACCESS GRANTED';
      }
      if (step2LevelTag) {
        step2LevelTag.className = "text-emerald-300 text-[10px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40 font-bold";
        step2LevelTag.textContent = "CLEARANCE: 2/2 COMPLETE";
      }
      if (step2DescText) {
        step2DescText.innerHTML = `Welcome operator <strong>${memberData.memberId || 'VERIFIED'}</strong>. Full Planetary Command Dashboard authorization is active across all network modules.`;
      }
      if (step2IndicatorTag) {
        step2IndicatorTag.className = "text-emerald-400 font-bold flex items-center gap-1";
        step2IndicatorTag.innerHTML = `<span>✓</span> Step 2: Member Active (${memberData.memberId || 'VERIFIED'})`;
      }
      if (step2ActionLink) {
        step2ActionLink.className = "px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-400/50 text-emerald-300 font-mono text-[10px] font-bold";
        step2ActionLink.innerHTML = "<span>ACCESS UNLOCKED ✓</span>";
        step2ActionLink.href = "#";
        step2ActionLink.onclick = (e) => { e.preventDefault(); switchTab('tab-view-command'); };
      }
    }

    const logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('aetherx_auth');
        sessionStorage.removeItem('aetherx_member_login');
        window.location.href = 'authentication.html';
      });
    }
  }

  function showStep2RequiredModal(targetTabName) {
    const modal = document.getElementById('modal-step2-required');
    const tabNameEl = document.getElementById('modal-target-tab-name');
    if (tabNameEl) {
      const cleanName = (targetTabName || 'DASHBOARD')
        .replace('tab-view-', '')
        .replace('-', ' ')
        .toUpperCase();
      tabNameEl.textContent = cleanName;
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  function hideStep2RequiredModal() {
    const modal = document.getElementById('modal-step2-required');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  function setupStep2Modal() {
    const closeBtn = document.getElementById('close-step2-modal');
    const cancelBtn = document.getElementById('cancel-step2-modal');
    if (closeBtn) closeBtn.addEventListener('click', hideStep2RequiredModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideStep2RequiredModal);
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
    // Two-Step Verification Check for Dashboard Tabs
    if (targetTabId !== 'tab-view-overview' && !isMemberLoggedIn()) {
      showStep2RequiredModal(targetTabId);
      return;
    }

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

  function checkUrlTabParam() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const hash = window.location.hash.replace('#', '').toLowerCase();

      let targetTab = null;
      if (tabParam === 'matrix' || tabParam === 'tab-view-matrix' || hash === 'matrix' || hash === 'tab-view-matrix') {
        targetTab = 'tab-view-matrix';
      } else if (tabParam === 'command' || tabParam === 'tab-view-command' || hash === 'command' || hash === 'tab-view-command') {
        targetTab = 'tab-view-command';
      } else if (tabParam === 'map' || tabParam === 'tab-view-map' || hash === 'map' || hash === 'tab-view-map') {
        targetTab = 'tab-view-map';
      } else if (tabParam === 'ai-vision' || tabParam === 'vision' || tabParam === 'tab-view-ai-vision' || hash === 'vision' || hash === 'ai-vision' || hash === 'tab-view-ai-vision') {
        targetTab = 'tab-view-ai-vision';
      }

      if (targetTab) {
        setTimeout(() => switchTab(targetTab), 50);
      }
    } catch (e) {}
  }

  function initMainController() {
    setupAuthHeader();
    setupStep2Modal();
    startUtcClock();
    startThreatCountdown();
    setupTabNavigation();
    setupLogoHome();
    setupMobileMenu();
    checkUrlTabParam();
  }

  window.switchTab = switchTab;
  window.addEventListener('DOMContentLoaded', initMainController);
})();

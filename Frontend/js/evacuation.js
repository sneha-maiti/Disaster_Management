/* ==========================================================================
   ADAPTIVE EVACUATION ROUTE & NAVIGATION MATRIX (CONNECTED TO REAL MAP)
   Dynamic pathfinding simulation avoiding hazardous topological feedback loops,
   calculating risk index score, transit time, and plotting on the Leaflet Map.
   ========================================================================== */

(function () {
  const coordinatesLookup = {
    // Origins
    'west-alpha': [45.0, -125.0],
    'coastal-bravo': [22.57, 88.36],
    // Destinations
    'sanctuary-1': [45.52, -122.67],
    'sanctuary-2': [46.81, 8.22]
  };

  const routesPreset = {
    'air-sanctuary-1': {
      name: 'Route Alpha-9 (Aerial Vector)',
      safety: 94,
      transitTime: '14m 22s',
      distance: '38.4 km',
      riskLevel: 'LOW',
      waypoints: [
        { title: 'Origin Waypoint - West Sector Alpha', status: 'Clear Airspace' },
        { title: 'Sanctuary Bio-Dome 1 Uplink', status: 'LZ Secure' }
      ],
      pathSvg: 'M 40 180 Q 200 40 460 160'
    },
    'ground-sanctuary-1': {
      name: 'Route Bravo-4 (Ground Convoy)',
      safety: 82,
      transitTime: '28m 45s',
      distance: '45.1 km',
      riskLevel: 'MEDIUM',
      waypoints: [
        { title: 'Origin Convoy Checkpoint', status: 'Staging' },
        { title: 'Fault Line Bypass Viaduct', status: 'Structural Warning' },
        { title: 'Sanctuary Perimeter Gate 3', status: 'Open Corridor' }
      ],
      pathSvg: 'M 40 180 Q 180 260 460 160'
    },
    'walking-sanctuary-1': {
      name: 'Route Charlie-7 (Tactical Foot Path)',
      safety: 68,
      transitTime: '1h 12m',
      distance: '12.8 km',
      riskLevel: 'ELEVATED',
      waypoints: [
        { title: 'Sector Debris Clearance Zone', status: 'Debris Caution' },
        { title: 'Sub-surface Shelter Access B', status: 'Optimal Triage' }
      ],
      pathSvg: 'M 40 180 S 260 120 460 160'
    },
    'air-sanctuary-2': {
      name: 'Route Delta-8 (Alpine Airspace)',
      safety: 89,
      transitTime: '22m 10s',
      distance: '124.5 km',
      riskLevel: 'LOW',
      waypoints: [
        { title: 'Origin Staging - Sector Alpha', status: 'Clear Weather Path' },
        { title: 'Alpine Refuge Gate LZ', status: 'Wind Conditions Moderate' }
      ],
      pathSvg: 'M 40 180 Q 250 80 460 160'
    },
    'ground-sanctuary-2': {
      name: 'Route Echo-3 (Trans-Continental Rail)',
      safety: 76,
      transitTime: '48m 30s',
      distance: '142.1 km',
      riskLevel: 'ELEVATED',
      waypoints: [
        { title: 'Sub-surface Rail Terminal 1', status: 'Operational' },
        { title: 'Alpine Base Station Tunnel', status: 'Slight Vibration Alert' }
      ],
      pathSvg: 'M 40 180 S 200 240 460 160'
    },
    'walking-sanctuary-2': {
      name: 'Route Foxtrot-1 (High-Altitude Foot Pass)',
      safety: 52,
      transitTime: '4h 15m',
      distance: '24.2 km',
      riskLevel: 'HIGH',
      waypoints: [
        { title: 'Mountain Pass Checkpoint', status: 'Heavy Snow Warning' },
        { title: 'Alpine Refuge Station Entrance', status: 'Oxygen Depleted' }
      ],
      pathSvg: 'M 40 180 Q 220 200 460 160'
    }
  };

  let currentMode = 'air';

  function initEvacuationMatrix() {
    const originSelect = document.getElementById('route-origin-select');
    const sanctuarySelect = document.getElementById('route-sanctuary-select');
    const modeTabs = document.querySelectorAll('.transport-mode-tab');
    const calculateBtn = document.getElementById('calculate-route-btn');

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-400'));
        tab.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-cyan-400');
        currentMode = tab.dataset.mode;
        recalculateRoute(currentMode);
      });
    });

    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
        recalculateRoute(currentMode);
      });
    }

    if (originSelect) originSelect.addEventListener('change', () => recalculateRoute(currentMode));
    if (sanctuarySelect) sanctuarySelect.addEventListener('change', () => recalculateRoute(currentMode));

    // Connect external Map marker click events
    window.updateEvacuationDestinationCoordinates = function (lat, lon, title) {
      // Find matching sanctuary value
      if (title.includes('Refuge') || title.includes('Alpine')) {
        if (sanctuarySelect) {
          sanctuarySelect.value = 'sanctuary-2';
          sanctuarySelect.dispatchEvent(new Event('change'));
        }
      } else {
        if (sanctuarySelect) {
          sanctuarySelect.value = 'sanctuary-1';
          sanctuarySelect.dispatchEvent(new Event('change'));
        }
      }
    };

    // Initial Route Computation
    recalculateRoute('air');
  }

  function recalculateRoute(mode) {
    const originSelect = document.getElementById('route-origin-select');
    const sanctuarySelect = document.getElementById('route-sanctuary-select');
    
    const originVal = originSelect ? originSelect.value : 'west-alpha';
    const sanctuaryVal = sanctuarySelect ? sanctuarySelect.value : 'sanctuary-1';

    const key = `${mode}-${sanctuaryVal}`;
    const route = routesPreset[key] || routesPreset['air-sanctuary-1'];

    // Update Output Telemetry UI
    const titleEl = document.getElementById('route-name-title');
    const safetyEl = document.getElementById('route-safety-score');
    const timeEl = document.getElementById('route-transit-time');
    const distanceEl = document.getElementById('route-distance');
    const waypointsContainer = document.getElementById('route-waypoints-container');
    const pathSvg = document.getElementById('evacuation-path-svg-line');

    if (titleEl) titleEl.textContent = route.name;
    if (safetyEl) {
      safetyEl.textContent = `${route.safety}%`;
      safetyEl.className = `font-mono font-bold text-lg ${route.safety > 85 ? 'text-emerald-400' : 'text-amber-400'}`;
    }
    if (timeEl) timeEl.textContent = route.transitTime;
    if (distanceEl) distanceEl.textContent = route.distance;

    if (pathSvg) {
      pathSvg.setAttribute('d', route.pathSvg);
    }

    if (waypointsContainer) {
      waypointsContainer.innerHTML = route.waypoints.map((wp, idx) => `
        <div class="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div class="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 flex items-center justify-center text-xs font-mono text-cyan-400 flex-shrink-0 mt-0.5">
            ${idx + 1}
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-200">${wp.title}</div>
            <div class="text-[11px] font-mono text-cyan-400">${wp.status}</div>
          </div>
        </div>
      `).join('');
    }

    // Call Real Map Draw Route polyline
    const originCoords = coordinatesLookup[originVal];
    const destCoords = coordinatesLookup[sanctuaryVal];
    if (originCoords && destCoords && window.drawEvacuationPathOnRealMap) {
      window.drawEvacuationPathOnRealMap(originCoords, destCoords, route.name);
    }
  }

  window.addEventListener('DOMContentLoaded', initEvacuationMatrix);
})();

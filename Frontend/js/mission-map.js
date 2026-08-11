/* ==========================================================================
   INTERACTIVE GLOBAL MISSION CONTROL MAP (REAL MAP INTEGRATION)
   Uses Leaflet.js with CartoDB Dark Matter tiles, rendering custom glowing CSS
   divIcons for hazard zones, SOS beacons, and animated path conduits.
   ========================================================================== */

(function () {
  'use strict';

  let map;
  let markersGroup;
  let corridorsGroup;
  let activePathPolyline = null;
  let activePathGlow = null;
  let activeRouteEndpoints = null;
  let mapHudControl = null;

  const mapData = {
    hazards: [
      { id: 'H1', type: 'seismic', title: 'Cascadia Subduction Rift', lat: 45.0, lon: -125.0, severity: 'CRITICAL', status: 'Active Fault Stress' },
      { id: 'H2', type: 'flooding', title: 'Monsoon Basin Overflow', lat: 22.0, lon: 80.0, severity: 'HIGH', status: 'Rising Water Levels' },
      { id: 'H3', type: 'wildfire', title: 'Eucalyptus Belt Firestorm', lat: -33.86, lon: 151.20, severity: 'CRITICAL', status: 'Uncontained Perimeter' },
      { id: 'H4', type: 'civil', title: 'Metropolis Grid Outage', lat: 40.7128, lon: -74.0060, severity: 'MEDIUM', status: 'Infrastructure Failure' }
    ],
    beacons: [
      { id: 'SOS-01', priority: 1, title: 'Sector 4 Medical Triage', lat: 45.52, lon: -122.67, queue: '#01', survivors: 142 },
      { id: 'SOS-02', priority: 2, title: 'Coastal Defense Outpost', lat: 22.57, lon: 88.36, queue: '#02', survivors: 89 },
      { id: 'SOS-03', priority: 3, title: 'Alpine Refuge Station', lat: 46.81, lon: 8.22, queue: '#03', survivors: 34 }
    ]
  };

  const activeFilters = { seismic: true, flooding: true, wildfire: true, civil: true };

  function initRealMap() {
    const mapContainer = document.getElementById('mission-real-map');
    if (!mapContainer || typeof L === 'undefined' || map) return;

    injectPremiumMapStyles();

    map = L.map('mission-real-map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 10,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      worldCopyJump: true,
      preferCanvas: true
    }).setView([23, 12], 2.65);

    createMapPanes();

    // Retains the existing no-key Carto basemap, upgraded through scoped visual
    // layers, vignette, labels, and tactical overlays rather than backend calls.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
      crossOrigin: true,
      className: 'aether-premium-map-tiles'
    }).addTo(map);

    markersGroup = L.layerGroup([], { pane: 'aether-markers' }).addTo(map);
    corridorsGroup = L.layerGroup([], { pane: 'aether-corridors' }).addTo(map);

    addMapControls();
    addMapAtmosphere(mapContainer);
    drawDefaultGlobalCorridors();
    renderRealMapMarkers();
    setupFilterToggles();
    setupDrawerControls();

    map.whenReady(() => {
      window.setTimeout(() => map.invalidateSize({ animate: false }), 80);
    });

    map.on('zoomend moveend', updateMapHud);
  }

  function createMapPanes() {
    map.createPane('aether-corridor-glow');
    map.getPane('aether-corridor-glow').style.zIndex = 390;
    map.getPane('aether-corridor-glow').style.pointerEvents = 'none';

    map.createPane('aether-corridors');
    map.getPane('aether-corridors').style.zIndex = 410;
    map.getPane('aether-corridors').style.pointerEvents = 'none';

    map.createPane('aether-markers');
    map.getPane('aether-markers').style.zIndex = 620;
  }

  function addMapControls() {
    L.control.zoom({ position: 'bottomleft' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 120 }).addTo(map);

    mapHudControl = L.control({ position: 'topleft' });
    mapHudControl.onAdd = function () {
      const control = L.DomUtil.create('div', 'aether-map-hud-control');
      control.innerHTML = `
        <div class="aether-map-hud-title"><i></i><span>GLOBAL SITUATION MAP</span><b>LIVE</b></div>
        <div class="aether-map-hud-meta"><span id="aether-map-grid">GRID 23°N / 012°E</span><span>SYNC 99.98%</span></div>
      `;
      L.DomEvent.disableClickPropagation(control);
      L.DomEvent.disableScrollPropagation(control);
      return control;
    };
    mapHudControl.addTo(map);

    const resetControl = L.control({ position: 'bottomleft' });
    resetControl.onAdd = function () {
      const control = L.DomUtil.create('button', 'aether-map-reset-control');
      control.type = 'button';
      control.title = 'Recenter global view';
      control.setAttribute('aria-label', 'Recenter global view');
      control.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="7" stroke-width="1.6"/><circle cx="12" cy="12" r="2" stroke-width="1.6"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke-width="1.6" stroke-linecap="round"/></svg>';
      L.DomEvent.disableClickPropagation(control);
      L.DomEvent.on(control, 'click', () => map.flyTo([23, 12], 2.65, { duration: 0.7 }));
      return control;
    };
    resetControl.addTo(map);
  }

  function addMapAtmosphere(mapContainer) {
    const atmosphere = document.createElement('div');
    atmosphere.className = 'aether-map-atmosphere';
    atmosphere.setAttribute('aria-hidden', 'true');
    atmosphere.innerHTML = '<span class="aether-map-scanline"></span><span class="aether-map-vignette"></span><span class="aether-map-coordinates">AETHER-X / SECTOR NETWORK / GLOBAL ACTIVE</span>';
    mapContainer.appendChild(atmosphere);
  }

  function drawDefaultGlobalCorridors() {
    if (!map || !corridorsGroup) return;

    corridorsGroup.clearLayers();

    const corridors = [
      [[40.71, -74.0], [45.0, -40.0], [51.5, -0.12]],
      [[51.5, -0.12], [40.0, 45.0], [28.61, 77.2], [35.67, 139.65]],
      [[-1.29, 36.82], [-20.0, 80.0], [-33.86, 151.2]],
      [[-23.55, -46.63], [-10.0, -10.0], [6.52, 3.37]]
    ];

    corridors.forEach((latlngs, index) => addPremiumCorridor(latlngs, {
      color: index === 2 ? '#52e6c2' : '#2ed7ff',
      weight: 2.1,
      className: 'aether-map-corridor'
    }));
  }

  function addPremiumCorridor(latlngs, options) {
    const glow = L.polyline(latlngs, {
      pane: 'aether-corridor-glow',
      color: options.color,
      weight: options.weight + 5,
      opacity: 0.10,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(corridorsGroup);

    const line = L.polyline(latlngs, {
      pane: 'aether-corridors',
      color: options.color,
      weight: options.weight,
      opacity: 0.90,
      dashArray: '7 11',
      lineCap: 'round',
      lineJoin: 'round',
      className: `${options.className || ''} aether-map-flow-line`,
      interactive: false
    }).addTo(corridorsGroup);

    return { glow, line };
  }

  function renderRealMapMarkers() {
    if (!markersGroup) return;
    markersGroup.clearLayers();

    mapData.hazards.forEach((hazard) => {
      if (!activeFilters[hazard.type]) return;

      const marker = L.marker([hazard.lat, hazard.lon], {
        icon: createHazardIcon(hazard),
        keyboard: true,
        title: `${hazard.severity}: ${hazard.title}`,
        riseOnHover: true,
        pane: 'aether-markers'
      }).addTo(markersGroup);

      marker.on('click', () => selectMapMarker(hazard.id));
    });

    mapData.beacons.forEach((beacon) => {
      const marker = L.marker([beacon.lat, beacon.lon], {
        icon: createBeaconIcon(beacon),
        keyboard: true,
        title: `SOS ${beacon.queue}: ${beacon.title}`,
        riseOnHover: true,
        pane: 'aether-markers'
      }).addTo(markersGroup);

      marker.on('click', () => selectMapMarker(beacon.id));
    });
  }

  function createHazardIcon(hazard) {
    const severityClass = String(hazard.severity || '').toLowerCase();
    const iconGlyph = {
      seismic: '⌁',
      flooding: '≈',
      wildfire: '✦',
      civil: '◆'
    }[hazard.type] || '•';

    return L.divIcon({
      html: `
        <div class="aether-map-marker aether-hazard-marker ${severityClass}" aria-label="${escapeHtml(hazard.title)}">
          <span class="aether-marker-ring"></span>
          <span class="aether-marker-core">${iconGlyph}</span>
          <span class="aether-marker-label"><b>${escapeHtml(hazard.severity)}</b>${escapeHtml(hazard.id)}</span>
        </div>
      `,
      className: 'aether-map-div-icon',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
  }

  function createBeaconIcon(beacon) {
    return L.divIcon({
      html: `
        <div class="aether-map-marker aether-beacon-marker" aria-label="${escapeHtml(beacon.title)}">
          <span class="aether-marker-ring"></span>
          <span class="aether-marker-core">+</span>
          <span class="aether-marker-label"><b>SOS</b>${escapeHtml(beacon.queue)}</span>
        </div>
      `,
      className: 'aether-map-div-icon',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });
  }

  function setupFilterToggles() {
    const toggles = document.querySelectorAll('.map-filter-toggle');
    toggles.forEach((button) => {
      button.addEventListener('click', () => {
        const filterType = button.dataset.filter;
        if (!Object.prototype.hasOwnProperty.call(activeFilters, filterType)) return;

        activeFilters[filterType] = !activeFilters[filterType];
        button.classList.toggle('active', activeFilters[filterType]);
        button.setAttribute('aria-pressed', String(activeFilters[filterType]));
        renderRealMapMarkers();
      });
    });
  }

  function setupDrawerControls() {
    const toggleButton = document.getElementById('drawer-toggle-btn');
    const drawer = document.getElementById('mission-glass-drawer');

    if (toggleButton && drawer) {
      toggleButton.addEventListener('click', () => drawer.classList.toggle('collapsed'));
    }
  }

  function selectMapMarker(id) {
    const hazard = mapData.hazards.find((entry) => entry.id === id);
    const beacon = mapData.beacons.find((entry) => entry.id === id);
    const item = hazard || beacon;

    if (!item) return;

    if (map) {
      map.flyTo([item.lat, item.lon], Math.max(map.getZoom(), 4.1), {
        animate: true,
        duration: 0.7,
        easeLinearity: 0.3
      });
    }

    const drawerBody = document.getElementById('drawer-telemetry-body');
    if (drawerBody) {
      drawerBody.innerHTML = `
        <div class="aether-selected-map-item">
          <div class="aether-selected-map-topline">
            <span>ID: ${escapeHtml(item.id)}</span>
            <span class="status-badge ${item.severity === 'CRITICAL' ? 'critical' : 'warning'}">${escapeHtml(item.severity || 'PRIORITY QUEUE')}</span>
          </div>
          <h4>${escapeHtml(item.title)}</h4>
          <p>STATUS: ${escapeHtml(item.status || `${item.survivors} Survivors Confirmed`)}</p>
          <div class="aether-selected-map-footer">
            <span>COORDINATES LOCKED</span>
            <button type="button" data-dispatch-id="${escapeHtml(item.id)}">DISPATCH NEURAL SQUAD ›</button>
          </div>
        </div>
      `;

      const dispatchButton = drawerBody.querySelector('[data-dispatch-id]');
      if (dispatchButton) {
        dispatchButton.addEventListener('click', () => {
          // Preserve existing global SOS integration when it is present.
          if (typeof window.triggerSosModal === 'function') window.triggerSosModal(item.id);
        });
      }
    }

    // Preserve the existing evacuation-router bridge exactly.
    if (typeof window.updateEvacuationDestinationCoordinates === 'function') {
      window.updateEvacuationDestinationCoordinates(item.lat, item.lon, item.title);
    }
  }

  // Preserved public function: external evacuation code still calls this name.
  window.drawEvacuationPathOnRealMap = function (originLatlng, destLatlng, pathName) {
    if (!map || !originLatlng || !destLatlng) return;

    clearActiveEvacuationRoute();

    const latlngs = buildCurvedRoute(originLatlng, destLatlng);
    activePathGlow = L.polyline(latlngs, {
      pane: 'aether-corridor-glow',
      color: '#45f2c5',
      weight: 9,
      opacity: 0.18,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false
    }).addTo(map);

    activePathPolyline = L.polyline(latlngs, {
      pane: 'aether-corridors',
      color: '#64ffe0',
      weight: 3.3,
      opacity: 0.98,
      dashArray: '8 12',
      lineCap: 'round',
      lineJoin: 'round',
      className: 'aether-map-evacuation-line aether-map-flow-line',
      interactive: false
    }).addTo(map);

    activeRouteEndpoints = L.layerGroup([
      L.circleMarker(originLatlng, { pane: 'aether-markers', radius: 5, color: '#48dcff', weight: 1.6, fillColor: '#48dcff', fillOpacity: 0.85 }),
      L.circleMarker(destLatlng, { pane: 'aether-markers', radius: 6, color: '#5dffe0', weight: 1.8, fillColor: '#5dffe0', fillOpacity: 0.95 })
    ]).addTo(map);

    const bounds = L.latLngBounds([originLatlng, destLatlng]);
    map.fitBounds(bounds, { padding: [64, 64], maxZoom: 5, animate: true, duration: 0.75 });

    updateMapHud(pathName ? `ROUTE ${String(pathName).toUpperCase()} LOCKED` : 'EVACUATION ROUTE LOCKED');
  };

  function clearActiveEvacuationRoute() {
    if (!map) return;
    if (activePathPolyline) map.removeLayer(activePathPolyline);
    if (activePathGlow) map.removeLayer(activePathGlow);
    if (activeRouteEndpoints) map.removeLayer(activeRouteEndpoints);
    activePathPolyline = null;
    activePathGlow = null;
    activeRouteEndpoints = null;
  }

  function buildCurvedRoute(originLatlng, destinationLatlng) {
    const latlngs = [];
    const steps = 34;
    const latitudeCurve = Math.min(Math.max(Math.abs(destinationLatlng[0] - originLatlng[0]) * 0.16 + 3.5, 3.5), 8.5);

    for (let index = 0; index <= steps; index += 1) {
      const progress = index / steps;
      latlngs.push([
        originLatlng[0] + (destinationLatlng[0] - originLatlng[0]) * progress + Math.sin(progress * Math.PI) * latitudeCurve,
        originLatlng[1] + (destinationLatlng[1] - originLatlng[1]) * progress
      ]);
    }
    return latlngs;
  }

  function updateMapHud(overrideText) {
    const grid = document.getElementById('aether-map-grid');
    if (!grid || !map) return;

    if (overrideText) {
      grid.textContent = overrideText;
      window.setTimeout(() => updateMapHud(), 2200);
      return;
    }

    const center = map.getCenter();
    const latitude = `${Math.abs(center.lat).toFixed(1)}°${center.lat >= 0 ? 'N' : 'S'}`;
    const longitude = `${Math.abs(center.lng).toFixed(1)}°${center.lng >= 0 ? 'E' : 'W'}`;
    grid.textContent = `GRID ${latitude} / ${longitude}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectPremiumMapStyles() {
    if (document.getElementById('aether-premium-mission-map-style')) return;

    const style = document.createElement('style');
    style.id = 'aether-premium-mission-map-style';
    style.textContent = `
      #tab-view-map #mission-real-map { isolation: isolate; background: #020914; }
      #tab-view-map #mission-real-map .leaflet-pane { z-index: 1; }
      #tab-view-map #mission-real-map .leaflet-tile-pane { filter: brightness(1.28) contrast(1.12) saturate(.90) hue-rotate(165deg); }
      #tab-view-map #mission-real-map .leaflet-tile { opacity: .96 !important; }
      #tab-view-map #mission-real-map .leaflet-control-container { position: relative; z-index: 900; }
      #tab-view-map #mission-real-map .leaflet-control-zoom { margin: 0 0 18px 18px; overflow: hidden; border: 1px solid rgba(58, 210, 255, .34); border-radius: 5px; background: rgba(3, 16, 30, .92); box-shadow: 0 8px 22px rgba(0,0,0,.34), inset 0 0 15px rgba(24, 209, 255, .06); }
      #tab-view-map #mission-real-map .leaflet-control-zoom a { width: 30px; height: 29px; border-bottom: 1px solid rgba(62, 184, 236, .18); background: transparent; color: #72e8ff; font: 300 21px/28px monospace; transition: background .2s ease, color .2s ease; }
      #tab-view-map #mission-real-map .leaflet-control-zoom a:last-child { border-bottom: 0; }
      #tab-view-map #mission-real-map .leaflet-control-zoom a:hover { background: rgba(26, 187, 230, .16); color: #fff; }
      #tab-view-map #mission-real-map .leaflet-control-scale { margin: 0 0 22px 11px; color: #83c8d9; font: 600 8px/1.3 monospace; text-shadow: 0 1px 3px #000; }
      #tab-view-map #mission-real-map .leaflet-control-scale-line { border-color: #63dbf4; border-top: 0; background: rgba(1, 9, 18, .62); color: #92dff1; }
      #tab-view-map #mission-real-map .aether-map-hud-control { min-width: 198px; margin: 18px 0 0 18px; padding: 10px 12px; pointer-events: none; border: 1px solid rgba(59, 210, 255, .35); border-radius: 4px; background: linear-gradient(100deg, rgba(2, 18, 35, .92), rgba(6, 29, 48, .76)); box-shadow: 0 10px 24px rgba(0,0,0,.28), inset 0 0 15px rgba(23, 193, 255, .06); backdrop-filter: blur(10px); }
      #tab-view-map #mission-real-map .aether-map-hud-title { display: flex; align-items: center; gap: 7px; color: #dff9ff; font: 700 9px monospace; letter-spacing: .08em; }
      #tab-view-map #mission-real-map .aether-map-hud-title i { width: 7px; height: 7px; border-radius: 50%; background: #46e9cc; box-shadow: 0 0 9px #46e9cc; animation: aetherMapPulse 1.8s ease-in-out infinite; }
      #tab-view-map #mission-real-map .aether-map-hud-title b { margin-left: auto; color: #53e7c8; font-size: 7px; }
      #tab-view-map #mission-real-map .aether-map-hud-meta { display: flex; justify-content: space-between; gap: 8px; margin-top: 7px; padding-top: 6px; border-top: 1px solid rgba(91, 209, 255, .14); color: #76abc1; font: 600 7px monospace; letter-spacing: .025em; }
      #tab-view-map #mission-real-map .aether-map-reset-control { display: grid; place-items: center; width: 31px; height: 31px; margin: 0 0 18px 18px; padding: 0; border: 1px solid rgba(58, 210, 255, .34); border-radius: 5px; background: rgba(3, 16, 30, .92); color: #72e8ff; box-shadow: 0 8px 22px rgba(0,0,0,.34), inset 0 0 15px rgba(24,209,255,.06); cursor: pointer; }
      #tab-view-map #mission-real-map .aether-map-reset-control:hover { color: #fff; background: rgba(26,187,230,.16); }
      #tab-view-map #mission-real-map .aether-map-reset-control svg { width: 17px; height: 17px; }
      #tab-view-map #mission-real-map .aether-map-atmosphere { position: absolute; z-index: 680; inset: 0; pointer-events: none; overflow: hidden; }
      #tab-view-map #mission-real-map .aether-map-vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 36%, rgba(0,4,10,.12) 60%, rgba(0,3,10,.68) 100%); }
      #tab-view-map #mission-real-map .aether-map-scanline { position: absolute; right: 0; left: 0; height: 1px; opacity: .58; background: linear-gradient(90deg, transparent, #50e5ff, transparent); box-shadow: 0 0 12px #3edbff; animation: aetherMapSweep 7s linear infinite; }
      #tab-view-map #mission-real-map .aether-map-coordinates { position: absolute; right: 15px; bottom: 13px; color: rgba(143, 213, 233, .63); font: 700 7px monospace; letter-spacing: .06em; text-shadow: 0 1px 3px #000; }
      #tab-view-map #mission-real-map .aether-map-div-icon { border: 0 !important; background: transparent !important; }
      #tab-view-map #mission-real-map .aether-map-marker { position: relative; display: grid; place-items: center; width: 38px; height: 38px; color: #ff5a70; }
      #tab-view-map #mission-real-map .aether-marker-core { position: relative; z-index: 2; display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid currentColor; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff5f6, currentColor 18%, #671427 68%); color: #fff; box-shadow: 0 0 14px currentColor, inset 0 -2px 4px rgba(0,0,0,.5); font: 700 10px/1 monospace; }
      #tab-view-map #mission-real-map .aether-marker-ring { position: absolute; width: 28px; height: 28px; border: 1px solid currentColor; border-radius: 50%; box-shadow: 0 0 13px currentColor; animation: aetherMapRing 2.2s ease-out infinite; }
      #tab-view-map #mission-real-map .aether-marker-label { position: absolute; top: -17px; left: 50%; display: flex; gap: 4px; padding: 3px 5px; border: 1px solid color-mix(in srgb, currentColor 45%, transparent); border-radius: 2px; background: rgba(2, 9, 18, .84); color: #e9faff; box-shadow: 0 5px 12px rgba(0,0,0,.33); font: 700 7px monospace; white-space: nowrap; transform: translateX(-50%); }
      #tab-view-map #mission-real-map .aether-marker-label b { color: currentColor; font-size: 6px; }
      #tab-view-map #mission-real-map .aether-hazard-marker.high { color: #ffb84f; }
      #tab-view-map #mission-real-map .aether-hazard-marker.medium { color: #51c8ff; }
      #tab-view-map #mission-real-map .aether-beacon-marker { color: #ffca63; }
      #tab-view-map #mission-real-map .aether-beacon-marker .aether-marker-core { background: radial-gradient(circle at 35% 30%, #fff8e9, #ffca63 20%, #79561b 69%); }
      #tab-view-map #mission-real-map .aether-map-flow-line { animation: aetherMapFlow 1.5s linear infinite; }
      #tab-view-map #mission-real-map .aether-map-evacuation-line { stroke-width: 3.3px; filter: drop-shadow(0 0 4px rgba(94,255,219,.7)); }
      #tab-view-map .aether-selected-map-item { padding: 12px; border: 1px solid rgba(46, 214, 255, .26); border-radius: 7px; background: linear-gradient(145deg, rgba(9, 33, 53, .94), rgba(3, 13, 25, .94)); box-shadow: inset 0 0 14px rgba(30, 205, 255, .05); }
      #tab-view-map .aether-selected-map-topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #70e5ff; font: 700 8px monospace; }
      #tab-view-map .aether-selected-map-item h4 { margin: 8px 0 4px; color: #effbff; font: 700 12px/1.3 system-ui, sans-serif; }
      #tab-view-map .aether-selected-map-item p { margin: 0; color: #86a9bd; font: 600 8px/1.45 monospace; }
      #tab-view-map .aether-selected-map-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding-top: 9px; border-top: 1px solid rgba(75, 169, 220, .16); color: #6f91a6; font: 700 7px monospace; }
      #tab-view-map .aether-selected-map-footer button { padding: 0; border: 0; background: transparent; color: #50e5c7; font: 700 8px monospace; cursor: pointer; }
      #tab-view-map .aether-selected-map-footer button:hover { color: #fff; text-decoration: underline; }
      @keyframes aetherMapPulse { 50% { opacity: .4; transform: scale(.72); } }
      @keyframes aetherMapRing { 0% { opacity: .95; transform: scale(.6); } 100% { opacity: 0; transform: scale(1.65); } }
      @keyframes aetherMapFlow { to { stroke-dashoffset: -36; } }
      @keyframes aetherMapSweep { from { top: -2px; } to { top: 102%; } }
      @media (max-width: 760px) {
        #tab-view-map #mission-real-map .aether-map-hud-control { min-width: 158px; margin: 12px 0 0 12px; padding: 8px 9px; }
        #tab-view-map #mission-real-map .aether-map-hud-title { font-size: 7px; }
        #tab-view-map #mission-real-map .aether-map-hud-meta { font-size: 6px; }
        #tab-view-map #mission-real-map .aether-map-coordinates { font-size: 5.5px; }
        #tab-view-map #mission-real-map .leaflet-control-zoom { margin: 0 0 12px 12px; }
        #tab-view-map #mission-real-map .aether-map-reset-control { margin: 0 0 12px 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  window.selectMapMarker = selectMapMarker;

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initRealMap, { once: true });
  } else {
    initRealMap();
  }
})();

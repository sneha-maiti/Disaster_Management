/* ==========================================================================
   INTERACTIVE GLOBAL MISSION CONTROL MAP (REAL MAP INTEGRATION)
   Uses Leaflet.js with CartoDB Dark Matter tiles, rendering custom glowing CSS
   divIcons for hazard zones, SOS beacons, and animated path conduits.
   ========================================================================== */

(function () {
  let map;
  let markersGroup;
  let activePathPolyline = null;

  let mapData = {
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

  let activeFilters = { seismic: true, flooding: true, wildfire: true, civil: true };

  function initRealMap() {
    const mapContainer = document.getElementById('mission-real-map');
    if (!mapContainer || typeof L === 'undefined') return;

    // 1. Initialize Map Object (Dark Cyberpunk Style)
    map = L.map('mission-real-map', {
      zoomControl: false,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 10
    }).setView([25, 10], 3);

    // 2. CartoDB Dark Matter Tiles (No API key required, looks fantastic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    markersGroup = L.layerGroup().addTo(map);

    // 3. Render initial markers & global evacuation paths
    renderRealMapMarkers();
    drawDefaultGlobalCorridors();

    // 4. Setup filter button triggers
    setupFilterToggles();

    // 5. Setup drawer controls
    setupDrawerControls();
  }

  function drawDefaultGlobalCorridors() {
    if (!map) return;

    const corridors = [
      // North America to Europe
      [[40.71, -74.00], [45.0, -40.0], [51.50, -0.12]],
      // Europe to Asia
      [[51.50, -0.12], [40.0, 45.0], [28.61, 77.20], [35.67, 139.65]],
      // Africa to Australia
      [[-1.29, 36.82], [-20.0, 80.0], [-33.86, 151.20]],
      // South America to Africa
      [[-23.55, -46.63], [-10.0, -10.0], [6.52, 3.37]]
    ];

    corridors.forEach(latlngs => {
      L.polyline(latlngs, {
        color: '#00FF9D',
        weight: 2.5,
        opacity: 0.8,
        dashArray: '6, 8'
      }).addTo(map);
    });
  }

  function renderRealMapMarkers() {
    if (!markersGroup) return;
    markersGroup.clearLayers();

    // Add Hazards
    mapData.hazards.forEach(h => {
      if (!activeFilters[h.type]) return;

      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full border-2 border-[#FF2A5F] bg-[#FF2A5F]/20 animate-ping" style="animation-duration: 2s;"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-[#FF2A5F] shadow-[0_0_12px_#FF2A5F]"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([h.lat, h.lon], { icon: customIcon }).addTo(markersGroup);
      marker.on('click', () => selectMapMarker(h.id));
    });

    // Add SOS Beacons
    mapData.beacons.forEach(b => {
      const markerHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 rounded-full border-2 border-[#FFB800] bg-[#FFB800]/20 animate-pulse"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-[#FFB800] shadow-[0_0_12px_#FFB800]"></div>
          <span class="absolute -top-5 font-mono text-[9px] font-bold text-[#FFB800] bg-black/85 px-1.5 py-0.5 rounded border border-[#FFB800]/40">${b.queue}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([b.lat, b.lon], { icon: customIcon }).addTo(markersGroup);
      marker.on('click', () => selectMapMarker(b.id));
    });
  }

  function setupFilterToggles() {
    const toggles = document.querySelectorAll('.map-filter-toggle');
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterType = btn.dataset.filter;
        activeFilters[filterType] = !activeFilters[filterType];
        btn.classList.toggle('active', activeFilters[filterType]);
        
        // Add active classes for visual styling
        if (activeFilters[filterType]) {
          btn.style.borderColor = 'rgba(0, 240, 255, 0.4)';
          btn.style.color = '#00F0FF';
        } else {
          btn.style.borderColor = '';
          btn.style.color = '';
        }

        renderRealMapMarkers();
      });
    });
  }

  function setupDrawerControls() {
    const toggleBtn = document.getElementById('drawer-toggle-btn');
    const drawer = document.getElementById('mission-glass-drawer');

    if (toggleBtn && drawer) {
      toggleBtn.addEventListener('click', () => {
        drawer.classList.toggle('collapsed');
      });
    }
  }

  function selectMapMarker(id) {
    const hazard = mapData.hazards.find(h => h.id === id);
    const beacon = mapData.beacons.find(b => b.id === id);
    const item = hazard || beacon;

    if (!item) return;

    // Pan map to clicked marker
    if (map) {
      map.panTo([item.lat, item.lon]);
    }

    const drawerBody = document.getElementById('drawer-telemetry-body');
    if (drawerBody) {
      drawerBody.innerHTML = `
        <div class="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono text-cyan-400">ID: ${item.id}</span>
            <span class="status-badge ${item.severity === 'CRITICAL' ? 'critical' : 'warning'}">${item.severity || 'PRIORITY QUEUE'}</span>
          </div>
          <h4 class="text-sm font-bold text-slate-100">${item.title}</h4>
          <p class="text-xs text-slate-400 mt-1">Status: ${item.status || item.survivors + ' Survivors Confirmed'}</p>
          <div class="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
            <span class="text-xs font-mono text-slate-500">Coordinates Lock</span>
            <button onclick="window.triggerSosModal('${item.id}')" class="text-xs font-mono text-cyan-400 hover:text-white underline">Dispatch Neural Squad</button>
          </div>
        </div>
      `;
    }

    // Connect this click back to the evacuation path router
    if (window.updateEvacuationDestinationCoordinates) {
      window.updateEvacuationDestinationCoordinates(item.lat, item.lon, item.title);
    }
  }

  // Draw Dynamic Evacuation Path on Real Leaflet Map
  window.drawEvacuationPathOnRealMap = function (originLatlng, destLatlng, pathName) {
    if (!map) return;

    if (activePathPolyline) {
      map.removeLayer(activePathPolyline);
    }

    // Generate intermediate curved coordinates
    const latlngs = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = originLatlng[0] + (destLatlng[0] - originLatlng[0]) * t + Math.sin(t * Math.PI) * 4.0;
      const lng = originLatlng[1] + (destLatlng[1] - originLatlng[1]) * t;
      latlngs.push([lat, lng]);
    }

    activePathPolyline = L.polyline(latlngs, {
      color: '#00FF9D',
      weight: 3.5,
      dashArray: '8, 12',
      className: 'evacuation-polyline-real-map'
    }).addTo(map);

    // Zoom map bounds to fit the route
    const bounds = L.latLngBounds([originLatlng, destLatlng]);
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  window.selectMapMarker = selectMapMarker;

  window.addEventListener('DOMContentLoaded', initRealMap);
})();

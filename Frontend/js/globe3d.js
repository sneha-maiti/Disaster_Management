/* ==========================================================================
   THREE.JS 3D WEBGL GLOBE & SPATIAL ENVIRONMENT
   Interactive rotating procedural globe with night lights, atmospheric glow,
   orbiting nodes, and live seismic ping ring animations.
   ========================================================================== */

(function () {
  'use strict';

  const TEXTURES = {
    day: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    normal: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    specular: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    clouds: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png'
  };

  const EARTH_RADIUS = 66;
  const AUTO_REVOLUTION_SPEED = 0.075; // radians per second
  const CLOUD_DRIFT_SPEED = 0.018; // radians per second

  let scene;
  let camera;
  let renderer;
  let rootGroup;
  let earthSystem;
  let earthMesh;
  let cloudMesh;
  let starField;
  let resizeObserver;
  let animationFrameId;
  let lastFrameTime = 0;

  const telemetryPulses = [];
  const satelliteOrbits = [];
  const rotationTarget = { x: 0.16, y: 0.55 };
  const interaction = {
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  };

  function initGlobe() {
    const container = document.getElementById('globe-container');

    if (!container || typeof THREE === 'undefined') return;

    // Prevent duplicate canvases if the page ever reinitializes the Overview tab.
    if (window.aetherRealisticGlobe && typeof window.aetherRealisticGlobe.destroy === 'function') {
      window.aetherRealisticGlobe.destroy();
    }

    container.innerHTML = '';
    container.style.touchAction = 'none';

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, 1, 0.1, 2500);
    camera.position.set(0, 0, 245);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'grab';
    renderer.domElement.setAttribute('aria-label', 'Interactive revolving Earth globe');
    container.appendChild(renderer.domElement);

    rootGroup = new THREE.Group();
    rootGroup.rotation.set(rotationTarget.x, rotationTarget.y, 0);
    scene.add(rootGroup);

    // Earth’s axial tilt keeps the rotation natural rather than mechanically upright.
    earthSystem = new THREE.Group();
    earthSystem.rotation.z = THREE.MathUtils.degToRad(-23.4);
    rootGroup.add(earthSystem);

    addLighting();
    addRealisticEarth();
    addAtmosphere();
    addStarfield();
    addTelemetryMarkers();
    addSatelliteOrbits();
    attachInteraction(container);
    watchContainerSize(container);

    lastFrameTime = performance.now();
    animate(lastFrameTime);

    window.aetherRealisticGlobe = { destroy };
  }

  function addLighting() {
    const hemisphereLight = new THREE.HemisphereLight(0x9fdcff, 0x01040b, 1.35);
    scene.add(hemisphereLight);

    // Main sunlight. It creates a proper day/night terminator across the globe.
    const sunlight = new THREE.DirectionalLight(0xfff5df, 2.3);
    sunlight.position.set(-160, 90, 220);
    scene.add(sunlight);

    // Restrained blue rim fill connects the realistic Earth to the Aether-X HUD palette.
    const rimLight = new THREE.DirectionalLight(0x26d8ff, 0.7);
    rimLight.position.set(170, -50, -130);
    scene.add(rimLight);

    const lowFill = new THREE.DirectionalLight(0x183d72, 0.55);
    lowFill.position.set(-60, -140, 40);
    scene.add(lowFill);
  }

  function addRealisticEarth() {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    const dayTexture = loadTexture(textureLoader, TEXTURES.day, true);
    const normalTexture = loadTexture(textureLoader, TEXTURES.normal, false);
    const specularTexture = loadTexture(textureLoader, TEXTURES.specular, false);
    const cloudsTexture = loadTexture(textureLoader, TEXTURES.clouds, true);

    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      map: dayTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.9, 0.9),
      specularMap: specularTexture,
      specular: new THREE.Color(0x4e9dc4),
      shininess: 9
    });

    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthMesh.name = 'Realistic Earth';
    earthSystem.add(earthMesh);

    // Cloud layer is rendered on a slightly larger sphere and rotates independently.
    const cloudGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.85, 128, 128);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.56,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = 'Slowly moving cloud layer';
    earthSystem.add(cloudMesh);
  }

  function addAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 3.4, 128, 128);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        glowColor: { value: new THREE.Color(0x27dfff) },
        power: { value: 3.25 },
        intensity: { value: 0.82 }
      },
      vertexShader: `
        varying vec3 vViewNormal;
        void main() {
          vViewNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float power;
        uniform float intensity;
        varying vec3 vViewNormal;
        void main() {
          float rim = 1.0 - max(dot(vViewNormal, vec3(0.0, 0.0, 1.0)), 0.0);
          float glow = pow(rim, power) * intensity;
          gl_FragColor = vec4(glowColor, glow);
        }
      `
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.name = 'Cyan atmospheric halo';
    earthSystem.add(atmosphere);

    // A broader and very faint halo gives the edge a cinematic atmospheric bloom.
    const outerGlowGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 6.5, 96, 96);
    const outerGlowMaterial = atmosphereMaterial.clone();
    outerGlowMaterial.uniforms = {
      glowColor: { value: new THREE.Color(0x0a8cff) },
      power: { value: 5.0 },
      intensity: { value: 0.22 }
    };
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    outerGlow.name = 'Outer atmospheric bloom';
    earthSystem.add(outerGlow);
  }

  function addStarfield() {
    const starCount = 1800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index += 1) {
      const radius = 320 + Math.random() * 760;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const offset = index * 3;

      positions[offset] = radius * Math.sin(phi) * Math.cos(theta);
      positions[offset + 1] = radius * Math.cos(phi);
      positions[offset + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const warmth = Math.random();
      colors[offset] = 0.48 + warmth * 0.42;
      colors[offset + 1] = 0.72 + warmth * 0.24;
      colors[offset + 2] = 1.0;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      sizeAttenuation: true
    });

    starField = new THREE.Points(starGeometry, starMaterial);
    starField.name = 'Deep space starfield';
    scene.add(starField);
  }

  function addTelemetryMarkers() {
    const locations = [
      { lat: 37.7749, lon: -122.4194, color: 0xff4f64, size: 2.3, maxScale: 4.1 },
      { lat: 51.5074, lon: -0.1278, color: 0x2cddff, size: 1.85, maxScale: 3.6 },
      { lat: 28.6139, lon: 77.2090, color: 0x25e1b9, size: 2.1, maxScale: 3.9 },
      { lat: -33.8688, lon: 151.2093, color: 0x2cddff, size: 1.7, maxScale: 3.4 },
      { lat: -23.5505, lon: -46.6333, color: 0xff9a43, size: 2.0, maxScale: 3.8 },
      { lat: 35.6762, lon: 139.6503, color: 0xff4f64, size: 2.2, maxScale: 4.2 }
    ];

    locations.forEach((location, index) => {
      const position = latLonToVector3(location.lat, location.lon, EARTH_RADIUS + 1.6);
      const normal = position.clone().normalize();

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(location.size, 16, 16),
        new THREE.MeshBasicMaterial({ color: location.color })
      );
      marker.position.copy(position);
      earthSystem.add(marker);

      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(location.color),
          color: location.color,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      halo.position.copy(position.clone().add(normal.multiplyScalar(0.7)));
      halo.scale.set(11, 11, 1);
      earthSystem.add(halo);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(location.size * 1.25, location.size * 1.95, 48),
        new THREE.MeshBasicMaterial({
          color: location.color,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        })
      );
      ring.position.copy(position.clone().add(normal.multiplyScalar(0.65)));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      earthSystem.add(ring);

      telemetryPulses.push({
        ring,
        halo,
        offset: index * 0.67,
        maxScale: location.maxScale
      });
    });
  }

  /* --------------------------------------------------------------------------
     PHOTOREALISTIC 3D ORBITAL SATELLITE SPACECRAFT SYSTEM
     -------------------------------------------------------------------------- */

  function buildRealisticSatelliteMesh(options = {}) {
    const satellite = new THREE.Group();
    satellite.name = options.name || 'AETHER Sentinel Spacecraft';

    // Materials
    const goldFoilMat = new THREE.MeshPhongMaterial({
      color: 0xdeb841,
      emissive: 0x221703,
      specular: 0xfff5b8,
      shininess: 90
    });

    const titaniumMat = new THREE.MeshPhongMaterial({
      color: 0x475569,
      specular: 0x94a3b8,
      shininess: 60
    });

    const solarCellMat = new THREE.MeshPhongMaterial({
      color: 0x071e3d,
      emissive: 0x020d1c,
      specular: 0x00f0ff,
      shininess: 95
    });

    const dishMat = new THREE.MeshPhongMaterial({
      color: 0xf1f5f9,
      specular: 0xffffff,
      shininess: 80,
      side: THREE.DoubleSide
    });

    // 1. Central Avionics Bus (Gold MLI Thermal Foil Chassis)
    const busGeo = new THREE.BoxGeometry(2.8, 1.8, 1.8);
    const busMesh = new THREE.Mesh(busGeo, goldFoilMat);
    satellite.add(busMesh);

    // Radiator thermal plates (Top & Bottom caps)
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 1.9), titaniumMat);
    topCap.position.y = 0.95;
    const botCap = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.22, 1.9), titaniumMat);
    botCap.position.y = -0.95;
    satellite.add(topCap, botCap);

    // 2. Optical Earth Observation Sensor (Nadir Camera Tube - facing -Z towards Earth)
    const lensTubeGeo = new THREE.CylinderGeometry(0.45, 0.35, 0.75, 24);
    const lensMat = new THREE.MeshPhongMaterial({
      color: 0x00f0ff,
      emissive: 0x005577,
      specular: 0xffffff,
      shininess: 100
    });
    const lensTube = new THREE.Mesh(lensTubeGeo, lensMat);
    lensTube.rotation.x = Math.PI / 2;
    lensTube.position.set(0, 0, 1.05);
    satellite.add(lensTube);

    // Star Tracker navigation miniature telescopes (Zenith side)
    const starTracker1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), titaniumMat);
    starTracker1.rotation.x = -Math.PI / 3;
    starTracker1.position.set(0.55, 0.9, -0.5);
    const starTracker2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 12), titaniumMat);
    starTracker2.rotation.x = -Math.PI / 3;
    starTracker2.position.set(-0.55, 0.9, -0.5);
    satellite.add(starTracker1, starTracker2);

    // 3. High-Gain Parabolic Communications Dish
    const dishGroup = new THREE.Group();
    const dishGeo = new THREE.CylinderGeometry(1.3, 0.18, 0.45, 24, 1, true);
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 2;

    // Antenna feed horn mast & sub-reflector probe
    const feedMast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.95, 8), titaniumMat);
    feedMast.rotation.x = Math.PI / 2;
    feedMast.position.z = 0.4;

    const subReflector = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), titaniumMat);
    subReflector.position.z = 0.85;

    dishGroup.add(dishMesh, feedMast, subReflector);
    dishGroup.position.set(0, -0.95, 0.5);
    dishGroup.rotation.x = Math.PI / 5;
    satellite.add(dishGroup);

    // 4. Dual Articulated Photovoltaic Solar Array Wings
    const solarWingLeft = new THREE.Group();
    const solarWingRight = new THREE.Group();

    // Left Wing (3 segmented solar panels with gold truss boom)
    const boomLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), goldFoilMat);
    boomLeft.rotation.z = Math.PI / 2;
    boomLeft.position.x = -1.2;

    const panelLeftGeo = new THREE.BoxGeometry(4.8, 1.6, 0.08);
    const panelLeft = new THREE.Mesh(panelLeftGeo, solarCellMat);
    panelLeft.position.x = -4.2;

    // Left Wingtip Red Nav Strobe LED
    const navLedLeft = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff3b30 })
    );
    navLedLeft.position.set(-6.8, 0.7, 0);

    solarWingLeft.add(boomLeft, panelLeft, navLedLeft);

    // Right Wing (3 segmented solar panels with gold truss boom)
    const boomRight = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), goldFoilMat);
    boomRight.rotation.z = Math.PI / 2;
    boomRight.position.x = 1.2;

    const panelRightGeo = new THREE.BoxGeometry(4.8, 1.6, 0.08);
    const panelRight = new THREE.Mesh(panelRightGeo, solarCellMat);
    panelRight.position.x = 4.2;

    // Right Wingtip Cyan Nav Strobe LED
    const navLedRight = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    navLedRight.position.set(6.8, 0.7, 0);

    solarWingRight.add(boomRight, panelRight, navLedRight);

    satellite.add(solarWingLeft, solarWingRight);

    // 5. Xenon Ion Propulsion Engine (Rear Thruster Bell & Ion Glow)
    const thrusterBell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.6, 0.55, 16),
      titaniumMat
    );
    thrusterBell.rotation.x = Math.PI / 2;
    thrusterBell.position.set(0, 0, -1.05);

    const ionConeMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const ionPlume = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.4, 16), ionConeMat);
    ionPlume.rotation.x = -Math.PI / 2;
    ionPlume.position.set(0, 0, -1.9);
    satellite.add(thrusterBell, ionPlume);

    // 6. Ground-Scanning Conical Telemetry Radar Beam (Nadir pointing toward Earth)
    const radarBeamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    // Length extends cleanly to Earth's orbital altitude
    const radarBeamGeo = new THREE.ConeGeometry(4.6, 17, 32, 1, true);
    const radarBeam = new THREE.Mesh(radarBeamGeo, radarBeamMat);
    radarBeam.rotation.x = Math.PI / 2;
    radarBeam.position.set(0, 0, 9.5);
    satellite.add(radarBeam);

    // Atmospheric Ground-Track Footprint Spot Ring
    const footprintRing = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 4.4, 36),
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    footprintRing.position.set(0, 0, 17.5);
    satellite.add(footprintRing);

    return {
      group: satellite,
      solarWings: [solarWingLeft, solarWingRight],
      navLeds: [navLedLeft, navLedRight],
      ionPlume,
      radarBeam,
      footprintRing
    };
  }

  function createOrbitTrajectoryRibbon(radius, inclination, colorHex) {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * Math.sin(inclination) * radius;
      const z = Math.sin(theta) * Math.cos(inclination) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    const orbitMat = new THREE.LineBasicMaterial({
      color: colorHex || 0x00f0ff,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    orbitLine.name = 'Satellite Orbit Trajectory Path';
    return orbitLine;
  }

  function addSatelliteOrbits() {
    const orbitDefinitions = [
      {
        name: 'AETHER Sentinel-6 Flagship Recon Orbiter',
        radius: EARTH_RADIUS + 17,
        inclination: 0.46,
        speed: 0.13,
        color: 0x00f0ff,
        phase: 0.65,
        isFlagship: true
      },
      {
        name: 'AETHER Starlink Telemetry Relay-A',
        radius: EARTH_RADIUS + 23,
        inclination: -0.52,
        speed: 0.09,
        color: 0x38bdf8,
        phase: 3.4,
        isFlagship: false
      }
    ];

    orbitDefinitions.forEach((definition) => {
      // 1. Add 3D Glowing Orbit Trajectory Ribbon
      const orbitPath = createOrbitTrajectoryRibbon(definition.radius, definition.inclination, definition.color);
      rootGroup.add(orbitPath);

      // 2. Build 3D Realistic Spacecraft
      const spacecraft = buildRealisticSatelliteMesh({ name: definition.name });
      
      // Secondary satellites are slightly more compact
      if (!definition.isFlagship) {
        spacecraft.group.scale.setScalar(0.72);
        spacecraft.radarBeam.material.opacity = 0.08;
      }

      rootGroup.add(spacecraft.group);

      satelliteOrbits.push({
        spacecraft,
        radius: definition.radius,
        inclination: definition.inclination,
        speed: definition.speed,
        color: definition.color,
        phase: definition.phase,
        isFlagship: definition.isFlagship
      });
    });
  }

  function loadTexture(loader, url, isColorTexture) {
    const texture = loader.load(url);
    if (isColorTexture) texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  function makeGlowTexture(hexColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    const color = new THREE.Color(hexColor);
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
    gradient.addColorStop(0.22, `rgba(${r}, ${g}, ${b}, .76)`);
    gradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, .19)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function latLonToVector3(lat, lon, radius) {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);

    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  function attachInteraction(container) {
    const canvas = renderer.domElement;

    canvas.addEventListener('pointerdown', (event) => {
      interaction.dragging = true;
      interaction.pointerId = event.pointerId;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (event) => {
      if (!interaction.dragging || event.pointerId !== interaction.pointerId) return;

      const deltaX = event.clientX - interaction.lastX;
      const deltaY = event.clientY - interaction.lastY;

      rotationTarget.y += deltaX * 0.008;
      rotationTarget.x = THREE.MathUtils.clamp(rotationTarget.x + deltaY * 0.006, -0.72, 0.72);
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
    });

    const finishDrag = (event) => {
      if (!interaction.dragging || event.pointerId !== interaction.pointerId) return;
      interaction.dragging = false;
      interaction.pointerId = null;
      canvas.style.cursor = 'grab';
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener('pointerup', finishDrag);
    canvas.addEventListener('pointercancel', finishDrag);
    container.addEventListener('mouseleave', () => {
      if (!interaction.dragging) canvas.style.cursor = 'grab';
    });
  }

  function watchContainerSize(container) {
    const resize = () => {
      if (!renderer || !camera) return;
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      if (camera.aspect < 1.0) {
        camera.fov = 46 + (1.0 - camera.aspect) * 16;
      } else {
        camera.fov = 46;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
  }

  function animate(frameTime) {
    animationFrameId = requestAnimationFrame(animate);
    const deltaSeconds = Math.min((frameTime - lastFrameTime) / 1000, 0.05);
    const elapsedSeconds = frameTime / 1000;
    lastFrameTime = frameTime;

    // Smooth motion keeps the Earth revolving while preserving the user’s drag input.
    if (!interaction.dragging) rotationTarget.y += AUTO_REVOLUTION_SPEED * deltaSeconds;
    rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, rotationTarget.x, 9, deltaSeconds);
    rootGroup.rotation.y = THREE.MathUtils.damp(rootGroup.rotation.y, rotationTarget.y, 7, deltaSeconds);

    if (cloudMesh) cloudMesh.rotation.y += CLOUD_DRIFT_SPEED * deltaSeconds;
    if (starField) starField.rotation.y += 0.0018 * deltaSeconds;

    telemetryPulses.forEach((pulse) => {
      const cycle = (Math.sin(elapsedSeconds * 2.7 + pulse.offset) + 1) * 0.5;
      const scale = 1 + cycle * (pulse.maxScale - 1);
      pulse.ring.scale.setScalar(scale);
      pulse.ring.material.opacity = (1 - cycle) * 0.74;
      pulse.halo.material.opacity = 0.45 + cycle * 0.45;
      pulse.halo.scale.setScalar(8 + cycle * 6);
    });

    // Animate Realistic 3D Satellites & Spacecraft Telemetry
    satelliteOrbits.forEach((orbit) => {
      const angle = elapsedSeconds * orbit.speed + orbit.phase;
      const x = Math.cos(angle) * orbit.radius;
      const y = Math.sin(angle) * Math.sin(orbit.inclination) * orbit.radius;
      const z = Math.sin(angle) * Math.cos(orbit.inclination) * orbit.radius;

      const sc = orbit.spacecraft;
      if (!sc || !sc.group) return;

      // 1. Orbital position
      sc.group.position.set(x, y, z);

      // 2. True Nadir Alignment (Point satellite observation optics & dish directly at Earth)
      sc.group.lookAt(0, 0, 0);

      // 3. Solar Panel Articulation (Slowly pitch arrays to track sunlight)
      if (sc.solarWings) {
        const solarPitch = Math.sin(elapsedSeconds * 0.45 + orbit.phase) * 0.38;
        sc.solarWings.forEach((wing) => {
          wing.rotation.x = solarPitch;
        });
      }

      // 4. Ion Engine Plasma Propulsion Pulse
      if (sc.ionPlume) {
        const plumeFlicker = 1.0 + Math.sin(elapsedSeconds * 9.5 + orbit.phase) * 0.18;
        sc.ionPlume.scale.set(plumeFlicker, plumeFlicker * 1.15, 1);
        sc.ionPlume.material.opacity = 0.65 + Math.sin(elapsedSeconds * 8) * 0.25;
      }

      // 5. Wingtip Aviation Navigation Strobe Lights (0.8 Hz dual flash pattern)
      if (sc.navLeds) {
        const strobeTime = (elapsedSeconds * 1.4 + orbit.phase) % 1.0;
        const isStrobe = strobeTime < 0.12 || (strobeTime > 0.22 && strobeTime < 0.34);
        sc.navLeds.forEach((led) => {
          led.visible = isStrobe;
        });
      }

      // 6. Ground-Track Radar Scanner Footprint sweep
      if (sc.footprintRing) {
        const radarSweep = (Math.sin(elapsedSeconds * 2.8 + orbit.phase) + 1) * 0.5;
        sc.footprintRing.scale.setScalar(1.0 + radarSweep * 0.22);
        sc.footprintRing.material.opacity = 0.25 + (1 - radarSweep) * 0.45;
      }
    });

    renderer.render(scene, camera);
  }

  function destroy() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (resizeObserver) resizeObserver.disconnect();

    if (renderer) {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    }

    telemetryPulses.length = 0;
    satelliteOrbits.length = 0;
    scene = null;
    camera = null;
    renderer = null;
    rootGroup = null;
    earthSystem = null;
    earthMesh = null;
    cloudMesh = null;
    starField = null;
    resizeObserver = null;
    animationFrameId = null;
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initGlobe, { once: true });
  } else {
    initGlobe();
  }
})();

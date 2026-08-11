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
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    camera.position.set(0, 0, 205);

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

  function addSatelliteOrbits() {
    const orbitDefinitions = [
      { radius: EARTH_RADIUS + 20, inclination: 0.5, speed: 0.11, color: 0x29dfff, phase: 0.5 },
      { radius: EARTH_RADIUS + 26, inclination: -0.82, speed: 0.075, color: 0x63b9ff, phase: 3.4 }
    ];

    orbitDefinitions.forEach((definition) => {
      const satellite = new THREE.Group();
      const trail = new THREE.Mesh(
        new THREE.SphereGeometry(1.18, 12, 12),
        new THREE.MeshBasicMaterial({ color: definition.color })
      );
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeGlowTexture(definition.color),
          color: definition.color,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      glow.scale.set(8, 8, 1);
      satellite.add(trail, glow);
      rootGroup.add(satellite);

      satelliteOrbits.push({
        group: satellite,
        radius: definition.radius,
        inclination: definition.inclination,
        speed: definition.speed,
        color: definition.color,
        phase: definition.phase
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

    satelliteOrbits.forEach((orbit) => {
      const angle = elapsedSeconds * orbit.speed + orbit.phase;
      orbit.group.position.set(
        Math.cos(angle) * orbit.radius,
        Math.sin(angle) * Math.sin(orbit.inclination) * orbit.radius,
        Math.sin(angle) * Math.cos(orbit.inclination) * orbit.radius
      );
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

/* ==========================================================================
   THREE.JS 3D WEBGL GLOBE & SPATIAL ENVIRONMENT
   Interactive rotating procedural globe with night lights, atmospheric glow,
   orbiting nodes, and live seismic ping ring animations.
   ========================================================================== */

(function () {
  let scene, camera, renderer, globeGroup, atmosphereMesh;
  let pings = [];
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let targetRotation = { x: 0, y: 0 };

  function initGlobe() {
    const container = document.getElementById('globe-container');
    if (!container || typeof THREE === 'undefined') return;

    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 180;

    // 2. WebGL Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    
    // Clear container and append canvas
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Globe Parent Group
    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 4. Procedural Earth Texture Canvas
    const earthCanvas = createProceduralEarthTexture();
    const earthTexture = new THREE.CanvasTexture(earthCanvas);

    // 5. Earth Globe Mesh
    const globeGeometry = new THREE.SphereGeometry(70, 64, 64);
    const globeMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpScale: 1.5,
      specular: new THREE.Color('#00f0ff'),
      shininess: 15,
      transparent: true,
      opacity: 0.95
    });
    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeGroup.add(globeMesh);

    // 6. Glowing Wireframe / Grid Mesh Overlay
    const gridGeometry = new THREE.SphereGeometry(70.5, 36, 18);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    globeGroup.add(gridMesh);

    // 7. Outer Atmospheric Glow Shader
    const atmosphereGeometry = new THREE.SphereGeometry(76, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.5);
          gl_FragColor = vec4(0.0, 0.94, 1.0, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);

    // 8. Starfield Background Particles
    createStarfield();

    // 9. Orbiting Telemetry Nodes & Seismic Pings
    createTelemetryNodes();

    // 10. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a192f, 1.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight1.position.set(200, 100, 150);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xff2a5f, 0.8);
    dirLight2.position.set(-200, -100, -150);
    scene.add(dirLight2);

    // 11. Event Listeners for Interaction & Resize
    setupInteraction(container);
    window.addEventListener('resize', onWindowResize);

    // 12. Animation Loop
    animate();
  }

  // Procedural Canvas Generator for Futuristic Dark World Map
  function createProceduralEarthTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep obsidian base with city lights
    ctx.fillStyle = '#020508';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Continents procedural draw with night city lights
    const dotSpacing = 12;
    for (let y = 0; y < canvas.height; y += dotSpacing) {
      for (let x = 0; x < canvas.width; x += dotSpacing) {
        const nx = (x / canvas.width) * 4;
        const ny = (y / canvas.height) * 2;
        const noise = Math.sin(nx * 3) * Math.cos(ny * 4) + Math.sin(nx * 7 + ny * 5) * 0.5;

        if (noise > 0.1) {
          ctx.beginPath();
          ctx.arc(x, y, noise > 0.55 ? 1.8 : 2.2, 0, Math.PI * 2);
          if (noise > 0.55) {
            ctx.fillStyle = `rgba(255, 220, 140, ${0.4 + Math.random() * 0.5})`;
          } else if (noise > 0.4) {
            ctx.fillStyle = '#0a3060';
          } else {
            ctx.fillStyle = '#061428';
          }
          ctx.fill();
        }
      }
    }

    return canvas;
  }

  // Starfield Particles
  function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 800;
      starPositions[i + 1] = (Math.random() - 0.5) * 800;
      starPositions[i + 2] = (Math.random() - 0.5) * 800;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 1.2,
      transparent: true,
      opacity: 0.6
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
  }

  // Orbiting Telemetry Nodes & Seismic Rings
  function createTelemetryNodes() {
    const nodeCoords = [
      { lat: 37.7749, lon: -122.4194, color: 0xff2a5f, label: 'San Francisco Breach' },
      { lat: 35.6762, lon: 139.6503, color: 0x00f0ff, label: 'Tokyo Command' },
      { lat: 51.5074, lon: -0.1278, color: 0x00ff9d, label: 'London Relay' },
      { lat: -33.8688, lon: 151.2093, color: 0xffb800, label: 'Sydney Node' }
    ];

    nodeCoords.forEach(coord => {
      const pos = latLonToVector3(coord.lat, coord.lon, 71);
      
      // Node Point Mesh
      const nodeGeo = new THREE.SphereGeometry(1.8, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: coord.color });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      globeGroup.add(nodeMesh);

      // Expanding Seismic Ring
      const ringGeo = new THREE.RingGeometry(2, 3.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: coord.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(0, 0, 0);
      globeGroup.add(ringMesh);

      pings.push({ ring: ringMesh, scale: 1, maxScale: 4 });
    });

    // Caribbean threat zone (Screenshot 1 red pulse)
    const threatPos = latLonToVector3(18.0, -75.0, 71);
    const threatRingGeo = new THREE.RingGeometry(4, 8, 32);
    const threatRingMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const threatRing = new THREE.Mesh(threatRingGeo, threatRingMat);
    threatRing.position.copy(threatPos);
    threatRing.lookAt(0, 0, 0);
    globeGroup.add(threatRing);
    pings.push({ ring: threatRing, scale: 1, maxScale: 3.5 });
  }

  // Helper: Lat/Long to Vector3
  function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  // Drag / Orbital Mouse Interactions
  function setupInteraction(container) {
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (globeGroup) {
        globeGroup.rotation.y += deltaX * 0.003;
        globeGroup.rotation.x += deltaY * 0.003;
      }

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });
  }

  // Window Resize Listener
  function onWindowResize() {
    const container = document.getElementById('globe-container');
    if (!container || !camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);

    if (globeGroup && !isDragging) {
      globeGroup.rotation.y += 0.0025;
    }

    // Animate Seismic Pings
    pings.forEach(p => {
      p.scale += 0.03;
      if (p.scale > p.maxScale) p.scale = 1;
      p.ring.scale.set(p.scale, p.scale, 1);
      p.ring.material.opacity = 1 - (p.scale / p.maxScale);
    });

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Export Initialization Trigger
  window.addEventListener('DOMContentLoaded', initGlobe);
})();

// =============================================
// BERT RUNNER NYC - Three.js Renderer
// WebGL with shadows, fog, anti-aliasing
// =============================================
const Renderer = {
  renderer: null,
  scene: null,
  camera: null,

  init() {
    const canvas = document.getElementById('gameCanvas');

    // WebGL renderer with anti-aliasing
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050510);
    this.scene.fog = new THREE.FogExp2(0x080818, 0.018);

    // Camera — close behind, low angle (Subway Surfers style)
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 200);
    this.camera.position.set(0, 4.5, 9);
    this.camera.lookAt(0, 1.2, -20);

    // === LIGHTING ===

    // Ambient — soft city night glow
    const ambient = new THREE.AmbientLight(0x334466, 0.5);
    this.scene.add(ambient);

    // Hemisphere — sky/ground color bleed
    const hemi = new THREE.HemisphereLight(0x1a1a40, 0x222222, 0.4);
    this.scene.add(hemi);

    // Main directional — moonlight
    const moon = new THREE.DirectionalLight(0xaabbdd, 0.7);
    moon.position.set(10, 25, 15);
    moon.castShadow = true;
    moon.shadow.mapSize.width = 1024;
    moon.shadow.mapSize.height = 1024;
    moon.shadow.camera.left = -20;
    moon.shadow.camera.right = 20;
    moon.shadow.camera.top = 20;
    moon.shadow.camera.bottom = -20;
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 60;
    moon.shadow.bias = -0.002;
    this.scene.add(moon);

    // Street light warmth — from ahead
    const streetLight = new THREE.DirectionalLight(0xffdd88, 0.3);
    streetLight.position.set(0, 8, -15);
    this.scene.add(streetLight);

    // Point lights on road — warm pools
    for (let i = 0; i < 4; i++) {
      const pl = new THREE.PointLight(0xffcc66, 0.5, 20, 2);
      pl.position.set(i % 2 === 0 ? -5 : 5, 6, -i * 25 - 10);
      this.scene.add(pl);
    }

    // Resize
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  },

  render() {
    this.renderer.render(this.scene, this.camera);
  },

  // Shared materials (reuse for performance)
  mats: {},
  getMat(color, opts) {
    const key = color + JSON.stringify(opts || {});
    if (!this.mats[key]) {
      this.mats[key] = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: opts?.roughness ?? 0.7,
        metalness: opts?.metalness ?? 0.1,
        ...(opts?.emissive ? { emissive: new THREE.Color(opts.emissive), emissiveIntensity: opts.emissiveIntensity || 1 } : {}),
      });
    }
    return this.mats[key];
  },

  // Dispose helper
  disposeGroup(group) {
    if (!group) return;
    this.scene.remove(group);
    group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      // Don't dispose shared materials
    });
  },
};

// =============================================
// BERT RUNNER NYC - 3D Road & Environment
// =============================================
const Track = {
  group: null,
  roadMesh: null,
  markings: [],
  crosswalks: [],

  init() {
    // Clean up previous
    if (this.group) Renderer.disposeGroup(this.group);
    this.group = new THREE.Group();
    this.markings = [];
    this.crosswalks = [];

    const RL = CONFIG.ROAD_LENGTH;
    const RW = CONFIG.ROAD_WIDTH;
    const SW = CONFIG.SIDEWALK_WIDTH;

    // === GROUND PLANE (dark, extends far) ===
    const groundGeo = new THREE.PlaneGeometry(80, RL * 2);
    const groundMat = Renderer.getMat('#0a0a12', { roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.05, -RL / 2);
    ground.receiveShadow = true;
    this.group.add(ground);

    // === ROAD SURFACE ===
    const roadGeo = new THREE.PlaneGeometry(RW, RL, 1, 1);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2e,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.rotation.x = -Math.PI / 2;
    this.roadMesh.position.set(0, 0, -RL / 2 + RL / 2);
    this.roadMesh.receiveShadow = true;
    this.group.add(this.roadMesh);

    // === SIDEWALKS ===
    const swGeo = new THREE.BoxGeometry(SW, 0.2, RL);
    const swMat = Renderer.getMat('#3a3a38', { roughness: 0.9 });
    const swL = new THREE.Mesh(swGeo, swMat);
    swL.position.set(-RW / 2 - SW / 2, 0.1, -RL / 2 + RL / 2);
    swL.receiveShadow = true;
    this.group.add(swL);
    const swR = new THREE.Mesh(swGeo, swMat);
    swR.position.set(RW / 2 + SW / 2, 0.1, -RL / 2 + RL / 2);
    swR.receiveShadow = true;
    this.group.add(swR);

    // === CURBS ===
    const curbGeo = new THREE.BoxGeometry(0.15, 0.25, RL);
    const curbMat = Renderer.getMat('#6a6a65', { roughness: 0.8 });
    const curbL = new THREE.Mesh(curbGeo, curbMat);
    curbL.position.set(-RW / 2, 0.12, -RL / 2 + RL / 2);
    this.group.add(curbL);
    const curbR = new THREE.Mesh(curbGeo, curbMat);
    curbR.position.set(RW / 2, 0.12, -RL / 2 + RL / 2);
    this.group.add(curbR);

    // === LANE DIVIDER DASHES (yellow) ===
    const dashMat = Renderer.getMat('#ddaa00', { emissive: '#443300', emissiveIntensity: 0.3 });
    const dashGeo = new THREE.BoxGeometry(0.12, 0.02, 1.8);
    for (let z = 5; z < RL; z += 4) {
      for (const lx of [-CONFIG.LANE_WIDTH, CONFIG.LANE_WIDTH]) {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(lx / 1.02, 0.01, -z);
        dash.receiveShadow = true;
        this.group.add(dash);
        this.markings.push({ mesh: dash, baseZ: -z });
      }
    }

    // === CENTER DOUBLE YELLOW ===
    const centerMat = Renderer.getMat('#bb9900', { emissive: '#332200', emissiveIntensity: 0.2 });
    const centerGeo = new THREE.BoxGeometry(0.06, 0.015, RL);
    const cl = new THREE.Mesh(centerGeo, centerMat);
    cl.position.set(-0.1, 0.005, -RL / 2 + RL / 2);
    this.group.add(cl);
    const cr = new THREE.Mesh(centerGeo, centerMat);
    cr.position.set(0.1, 0.005, -RL / 2 + RL / 2);
    this.group.add(cr);

    // === CROSSWALKS ===
    const cwMat = Renderer.getMat('#ccccbb', { roughness: 0.9 });
    const cwStripeGeo = new THREE.BoxGeometry(RW * 0.75, 0.015, 0.35);
    for (let z = 20; z < RL; z += 40) {
      for (let s = 0; s < 5; s++) {
        const stripe = new THREE.Mesh(cwStripeGeo, cwMat);
        stripe.position.set(0, 0.005, -z - s * 0.7);
        this.group.add(stripe);
        this.crosswalks.push({ mesh: stripe, baseZ: -z - s * 0.7 });
      }
    }

    // === MANHOLES ===
    const mhGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 16);
    const mhMat = Renderer.getMat('#1a1a1a', { metalness: 0.4, roughness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const mh = new THREE.Mesh(mhGeo, mhMat);
      mh.position.set((Math.random() - 0.5) * RW * 0.6, 0.01, -10 - Math.random() * 100);
      this.group.add(mh);
    }

    Renderer.scene.add(this.group);
  },

  update(speed) {
    // Scroll markings and crosswalks to simulate movement
    for (const m of this.markings) {
      m.mesh.position.z += speed;
      if (m.mesh.position.z > CONFIG.DESPAWN_Z) {
        m.mesh.position.z -= CONFIG.ROAD_LENGTH;
      }
    }
    for (const c of this.crosswalks) {
      c.mesh.position.z += speed;
      if (c.mesh.position.z > CONFIG.DESPAWN_Z) {
        c.mesh.position.z -= CONFIG.ROAD_LENGTH;
      }
    }
  },
};

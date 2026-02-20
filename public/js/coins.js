// =============================================
// BERT RUNNER NYC - 3D Coins
// Metallic spinning cylinders with glow
// =============================================
const Coins = {
  list: [],
  nextGroupDist: 15,
  coinGeo: null,
  coinMat: null,

  init() {
    for (const c of this.list) if (c.mesh) Renderer.disposeGroup(c.mesh);
    this.list = [];
    this.nextGroupDist = 15;

    // Shared geometry and material
    this.coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0x664400,
      emissiveIntensity: 0.3,
    });
  },

  spawn(distance) {
    if (distance < this.nextGroupDist) return;
    const lane = Math.floor(Math.random() * 3) - 1;
    const floating = Math.random() > 0.6;
    const pattern = Math.floor(Math.random() * 3);

    for (let i = 0; i < CONFIG.COIN_GROUP_SIZE; i++) {
      let cl = lane;
      if (pattern === 1) cl = lane + Math.sin(i * 0.8) * 0.3;
      if (pattern === 2) cl = lane + (i % 2 === 0 ? 0.3 : -0.3);

      const mesh = new THREE.Mesh(this.coinGeo, this.coinMat);
      const x = cl * CONFIG.LANE_WIDTH;
      const y = floating ? 2.0 : 1.0;
      const z = CONFIG.SPAWN_Z - i * CONFIG.COIN_GAP;
      mesh.position.set(x, y, z);
      mesh.rotation.x = Math.PI / 2; // Lay flat then spin
      mesh.castShadow = true;
      Renderer.scene.add(mesh);

      // Add a point light for glow
      const glow = new THREE.PointLight(0xffaa00, 0.15, 3, 2);
      glow.position.copy(mesh.position);
      Renderer.scene.add(glow);

      this.list.push({
        mesh, glow, collected: false,
        baseY: y, bobOff: Math.random() * 6.28,
      });
    }

    this.nextGroupDist = distance + 12 + Math.random() * 20;
  },

  update(speed, frame) {
    for (const c of this.list) {
      if (c.collected) continue;
      c.mesh.position.z += speed;
      c.glow.position.z = c.mesh.position.z;

      // Spin and bob
      c.mesh.rotation.z += 0.04;
      c.mesh.position.y = c.baseY + Math.sin(frame * 0.04 + c.bobOff) * 0.2;
      c.glow.position.y = c.mesh.position.y;
    }

    // Remove despawned or collected
    this.list = this.list.filter(c => {
      if (c.collected || c.mesh.position.z > CONFIG.DESPAWN_Z) {
        Renderer.scene.remove(c.mesh);
        Renderer.scene.remove(c.glow);
        if (c.mesh.geometry !== this.coinGeo) c.mesh.geometry.dispose();
        return false;
      }
      return true;
    });
  },

  checkCollection(pi) {
    if (!pi) return 0;
    let got = 0;
    const magnetR = State.game.hasMagnet ? 4 : 0;

    for (const c of this.list) {
      if (c.collected) continue;
      const dx = c.mesh.position.x - pi.x;
      const dy = c.mesh.position.y - pi.y;
      const dz = c.mesh.position.z - pi.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 1.2 + magnetR) {
        c.collected = true;
        got++;
        // Spawn collect particles
        Particles.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0xffd700);
      }
    }
    return got;
  },
};

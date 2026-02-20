// =============================================
// BERT RUNNER NYC - 3D Obstacles
// Real meshes: taxis, buses, barriers, cones
// =============================================
const Obstacles = {
  list: [],
  nextSpawnDist: 30,

  init() {
    for (const o of this.list) Renderer.disposeGroup(o.group);
    this.list = [];
    this.nextSpawnDist = 30;
  },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;
    const lane = Math.floor(Math.random() * 3) - 1;
    const type = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];

    this.list.push(this.createObstacle(lane, type));

    // Occasional double obstacle at higher speed
    if (Math.random() < 0.18 && State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      let l2 = lane;
      while (l2 === lane) l2 = Math.floor(Math.random() * 3) - 1;
      const t2 = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];
      const o2 = this.createObstacle(l2, t2);
      o2.group.position.z -= Math.random() * 4;
      this.list.push(o2);
    }

    const sf = (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
    const gap = CONFIG.OBSTACLE_MAX_GAP - (CONFIG.OBSTACLE_MAX_GAP - CONFIG.OBSTACLE_MIN_GAP) * sf * 0.4;
    this.nextSpawnDist = distance + gap * (0.7 + Math.random() * 0.6);
  },

  createObstacle(lane, type) {
    let group;
    switch (type.type) {
      case 'taxi': group = this.buildTaxi(); break;
      case 'bus': group = this.buildBus(); break;
      case 'barrier': group = this.buildBarrier(); break;
      case 'cone': group = this.buildCone(); break;
      case 'hotdog': group = this.buildHotdogCart(); break;
      default: group = this.buildTaxi(); break;
    }

    group.position.set(lane * CONFIG.LANE_WIDTH, 0, CONFIG.SPAWN_Z);
    Renderer.scene.add(group);
    return { group, lane, type: type.type, w: type.w, h: type.h, d: type.d, jumpable: type.jumpable };
  },

  // ===== NYC YELLOW TAXI =====
  buildTaxi() {
    const g = new THREE.Group();

    // Body
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.35, metalness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 4.0), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    // Cabin
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xffdd33, roughness: 0.3, metalness: 0.25 });
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 2.0), cabinMat);
    cabin.position.set(0, 1.35, -0.2);
    cabin.castShadow = true;
    g.add(cabin);

    // Windshields (dark reflective)
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a4a, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.85,
    });
    // Front windshield
    const fwGeo = new THREE.PlaneGeometry(1.3, 0.55);
    const fw = new THREE.Mesh(fwGeo, glassMat);
    fw.position.set(0, 1.35, -1.21);
    fw.rotation.x = 0.15;
    g.add(fw);
    // Rear windshield
    const rw = new THREE.Mesh(fwGeo, glassMat);
    rw.position.set(0, 1.35, 0.81);
    rw.rotation.x = -0.15; rw.rotation.y = Math.PI;
    g.add(rw);
    // Side windows
    const swGeo = new THREE.PlaneGeometry(1.6, 0.5);
    for (const side of [-1, 1]) {
      const sw = new THREE.Mesh(swGeo, glassMat);
      sw.position.set(side * 0.76, 1.35, -0.2);
      sw.rotation.y = side * Math.PI / 2;
      g.add(sw);
    }

    // Headlights
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffcc, emissiveIntensity: 0.6, roughness: 0.2,
    });
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hlMat);
      hl.position.set(side * 0.7, 0.55, -2.02);
      g.add(hl);
    }

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8, roughness: 0.3,
    });
    for (const side of [-1, 1]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.05), tlMat);
      tl.position.set(side * 0.7, 0.55, 2.02);
      g.add(tl);
    }

    // TAXI sign on roof
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xffee88, emissive: 0xffdd44, emissiveIntensity: 0.5, roughness: 0.3,
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.25), signMat);
    sign.position.set(0, 1.8, -0.2);
    g.add(sign);

    // Bumpers (chrome)
    const chromeMat = Renderer.getMat('#cccccc', { metalness: 0.8, roughness: 0.2 });
    const fbump = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 0.12), chromeMat);
    fbump.position.set(0, 0.18, -2.05);
    g.add(fbump);
    const rbump = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.15, 0.12), chromeMat);
    rbump.position.set(0, 0.18, 2.05);
    g.add(rbump);

    // Wheels
    this.addWheels(g, 1.8, 4.0);

    return g;
  },

  // ===== CITY BUS =====
  buildBus() {
    const g = new THREE.Group();

    // Body
    const busMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5, metalness: 0.2 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 7.0), busMat);
    body.position.y = 1.3;
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);

    // Blue stripe
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.5 });
    for (const side of [-1, 1]) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 7.02), stripeMat);
      stripe.position.set(side * 1.11, 1.3, 0);
      g.add(stripe);
    }
    // Front/back stripe
    const fstripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.5, 0.02), stripeMat);
    fstripe.position.set(0, 1.3, -3.51);
    g.add(fstripe);
    const bstripe = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.5, 0.02), stripeMat);
    bstripe.position.set(0, 1.3, 3.51);
    g.add(bstripe);

    // Windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a2a4a, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.8,
    });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), glassMat);
        win.position.set(side * 1.11, 1.8, -2.5 + i * 1.3);
        win.rotation.y = side * Math.PI / 2;
        g.add(win);
      }
    }

    // Destination sign (orange, emissive)
    const destMat = new THREE.MeshStandardMaterial({
      color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 0.6, roughness: 0.3,
    });
    const dest = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.06), destMat);
    dest.position.set(0, 2.35, -3.52);
    g.add(dest);

    // Taillights
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.7, roughness: 0.3,
    });
    for (const side of [-1, 1]) {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.05), tlMat);
      tl.position.set(side * 0.8, 0.6, 3.53);
      g.add(tl);
    }

    this.addWheels(g, 2.2, 7.0);

    return g;
  },

  // ===== CONSTRUCTION BARRIER =====
  buildBarrier() {
    const g = new THREE.Group();

    // Posts
    const postMat = Renderer.getMat('#888888', { metalness: 0.4 });
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), postMat);
      post.position.set(side * 1.0, 0.4, 0);
      post.castShadow = true;
      g.add(post);
    }

    // Orange bar
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xff6600, emissive: 0x331100, emissiveIntensity: 0.2, roughness: 0.6,
    });
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 0.15), barMat);
    bar.position.y = 0.55;
    bar.castShadow = true;
    g.add(bar);

    // White stripes (alternating planes on the bar)
    const whiteMat = Renderer.getMat('#ffffff');
    for (let i = 0; i < 6; i += 2) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.36, 0.16), whiteMat);
      stripe.position.set(-1.0 + i * 0.4, 0.55, 0);
      g.add(stripe);
    }

    // Reflectors
    const refMat = new THREE.MeshStandardMaterial({
      color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6, roughness: 0.2,
    });
    for (const side of [-1, 1]) {
      const ref = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), refMat);
      ref.position.set(side * 0.8, 0.55, 0.1);
      g.add(ref);
    }

    return g;
  },

  // ===== TRAFFIC CONE =====
  buildCone() {
    const g = new THREE.Group();

    // Base
    const baseMat = Renderer.getMat('#222222', { roughness: 0.8 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), baseMat);
    base.position.y = 0.025;
    g.add(base);

    // Cone
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xff6600, roughness: 0.6,
    });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 12), coneMat);
    cone.position.y = 0.4;
    cone.castShadow = true;
    g.add(cone);

    // White reflective bands
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0x444444, emissiveIntensity: 0.3, roughness: 0.3,
    });
    const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12), bandMat);
    band1.position.y = 0.35;
    g.add(band1);
    const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 12), bandMat);
    band2.position.y = 0.55;
    g.add(band2);

    return g;
  },

  // ===== HOT DOG CART =====
  buildHotdogCart() {
    const g = new THREE.Group();

    // Cart body
    const cartMat = new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.5 });
    const cart = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.0), cartMat);
    cart.position.y = 0.7;
    cart.castShadow = true;
    g.add(cart);

    // Metal top
    const metalMat = Renderer.getMat('#888888', { metalness: 0.5 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 2.1), metalMat);
    top.position.y = 1.17;
    g.add(top);

    // Umbrella
    const umbMat = new THREE.MeshStandardMaterial({ color: 0x2244cc, roughness: 0.5 });
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.5, 8), umbMat);
    umb.position.y = 2.0;
    umb.castShadow = true;
    g.add(umb);
    // Umbrella pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), metalMat);
    pole.position.y = 1.55;
    g.add(pole);

    // Wheels
    const wheelMat = Renderer.getMat('#222222');
    for (const side of [-1, 1]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.75, 0.15, 0.7);
      g.add(wheel);
    }

    return g;
  },

  // Shared wheel builder
  addWheels(g, bodyW, bodyD) {
    const wheelMat = Renderer.getMat('#111111', { roughness: 0.8 });
    const hubMat = Renderer.getMat('#555555', { metalness: 0.5, roughness: 0.3 });
    const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.15, 16);
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12);

    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(sx * bodyW / 2, 0.28, sz * bodyD * 0.32);
        g.add(wheel);

        const hub = new THREE.Mesh(hubGeo, hubMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.copy(wheel.position);
        g.add(hub);
      }
    }
  },

  update(speed) {
    for (let o of this.list) {
      o.group.position.z += speed;
    }
    // Remove passed obstacles
    this.list = this.list.filter(o => {
      if (o.group.position.z > CONFIG.DESPAWN_Z) {
        Renderer.disposeGroup(o.group);
        return false;
      }
      return true;
    });
  },

  checkCollision(pi) {
    if (!pi) return null;
    for (const o of this.list) {
      const oz = o.group.position.z;
      const ox = o.group.position.x;
      // Check Z proximity
      if (Math.abs(oz - pi.z) > o.d / 2 + pi.r) continue;
      // Check X proximity
      if (Math.abs(ox - pi.x) > o.w / 2 + pi.r * 0.6) continue;
      // Check if jumped over
      if (o.jumpable && pi.jumpH > 0.12) continue;
      if (!o.jumpable && pi.jumpH > o.h * 0.7 / 6) continue; // scale to world
      return o;
    }
    return null;
  },

  remove(o) {
    const i = this.list.indexOf(o);
    if (i >= 0) {
      Renderer.disposeGroup(o.group);
      this.list.splice(i, 1);
    }
  },
};

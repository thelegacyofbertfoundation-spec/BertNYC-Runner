// =============================================
// BERT RUNNER NYC - 3D Buildings
// =============================================
const Buildings = {
  list: [],

  init() {
    // Clean previous
    for (const b of this.list) Renderer.disposeGroup(b.group);
    this.list = [];

    const RW = CONFIG.ROAD_WIDTH / 2 + CONFIG.SIDEWALK_WIDTH;
    // Spawn buildings along both sides
    for (let z = 0; z < CONFIG.ROAD_LENGTH; z += 3 + Math.random() * 3) {
      this.list.push(this.createBuilding(-1, RW + Math.random() * 2, -z));
      this.list.push(this.createBuilding(1, RW + Math.random() * 2, -z));
    }
  },

  createBuilding(side, offset, z) {
    const group = new THREE.Group();

    const w = 2 + Math.random() * 4;
    const h = 3 + Math.random() * 18;
    const d = 2 + Math.random() * 4;
    const x = side * offset + side * w / 2;

    // Building colors
    const palettes = [
      { body: '#2a1a12', trim: '#4a3020', win: '#ffcc44' },
      { body: '#1a2530', trim: '#2a4560', win: '#88bbff' },
      { body: '#301a10', trim: '#5a3820', win: '#ffaa33' },
      { body: '#141418', trim: '#242430', win: '#ccddff' },
      { body: '#1e1610', trim: '#3e3020', win: '#ffbb55' },
    ];
    const pal = palettes[Math.floor(Math.random() * palettes.length)];

    // Main structure
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const bodyMat = Renderer.getMat(pal.body, { roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, h / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Trim at top
    const trimGeo = new THREE.BoxGeometry(w + 0.1, 0.2, d + 0.1);
    const trimMat = Renderer.getMat(pal.trim, { roughness: 0.8 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, h, 0);
    group.add(trim);

    // Windows — rows of emissive cubes
    const winRows = Math.floor(h / 1.5);
    const winCols = Math.floor(w / 1.2);
    if (winCols > 0 && winRows > 0) {
      const winGeo = new THREE.BoxGeometry(0.5, 0.6, 0.05);
      for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
          if (Math.random() > 0.5) continue; // some dark
          const lit = Math.random() > 0.25;
          const warmth = 0.5 + Math.random() * 0.5;
          const winMat = lit ?
            Renderer.getMat(pal.win, {
              emissive: pal.win,
              emissiveIntensity: warmth * 0.6,
              roughness: 0.3,
            }) :
            Renderer.getMat('#0a0a15', { roughness: 0.9 });

          // Front face windows
          const win = new THREE.Mesh(winGeo, winMat);
          const wx = -w / 2 + 0.6 + c * (w - 1) / Math.max(1, winCols - 1);
          const wy = 1 + r * 1.4;
          if (wy > h - 0.5) continue;
          win.position.set(wx, wy, d / 2 + 0.01);
          group.add(win);

          // Side face windows (facing road)
          if (Math.random() > 0.4) {
            const sideWin = new THREE.Mesh(winGeo, winMat);
            sideWin.rotation.y = Math.PI / 2;
            sideWin.position.set(side > 0 ? -w / 2 - 0.01 : w / 2 + 0.01, wy, -d / 2 + 0.6 + c * 0.9);
            if (sideWin.position.z < d / 2 - 0.3) group.add(sideWin);
          }
        }
      }
    }

    // Neon sign (on shops)
    if (h < 8 && Math.random() > 0.4) {
      const signColors = [0xff0044, 0x00ccff, 0xffaa00, 0xff00cc, 0x00ff88];
      const sc = signColors[Math.floor(Math.random() * signColors.length)];
      const signGeo = new THREE.BoxGeometry(w * 0.7, 0.5, 0.08);
      const signMat = new THREE.MeshStandardMaterial({
        color: sc,
        emissive: sc,
        emissiveIntensity: 0.8,
        roughness: 0.3,
      });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, h * 0.5, side > 0 ? -w / 2 - 0.05 : d / 2 + 0.05);
      if (side > 0) sign.rotation.y = Math.PI / 2;
      group.add(sign);

      // Neon glow light
      const neonLight = new THREE.PointLight(sc, 0.3, 6, 2);
      neonLight.position.copy(sign.position);
      neonLight.position.z += side > 0 ? -0.5 : 0.5;
      group.add(neonLight);
    }

    // Awning (on short buildings)
    if (h < 7 && Math.random() > 0.5) {
      const awnColors = [0xcc2222, 0x2244aa, 0x228844, 0xaa7722];
      const awnGeo = new THREE.BoxGeometry(w * 0.9, 0.08, 1.2);
      const awnMat = Renderer.getMat('#' + awnColors[Math.floor(Math.random() * 4)].toString(16).padStart(6, '0'));
      const awn = new THREE.Mesh(awnGeo, awnMat);
      awn.position.set(0, 2.2, side > 0 ? -w / 2 - 0.6 : d / 2 + 0.6);
      awn.castShadow = true;
      group.add(awn);
    }

    group.position.set(x, 0, z);
    Renderer.scene.add(group);
    return { group, z: z, baseZ: z };
  },

  update(speed) {
    for (const b of this.list) {
      b.group.position.z += speed;
      if (b.group.position.z > CONFIG.DESPAWN_Z + 20) {
        b.group.position.z -= CONFIG.ROAD_LENGTH;
      }
    }
  },
};

// =============================================
// BERT RUNNER NYC - 3D Player (Bert)
// =============================================
const Player = {
  group: null,
  body: null,
  legs: [],
  eyes: [],
  shield: null,
  lane: 1,
  targetLane: 1,
  laneSmooth: 0,
  jumpH: 0,
  vy: 0,
  isJumping: false,
  animFrame: 0,
  colors: ['#F4A460', '#D2691E', '#8B4513'],

  init() {
    if (this.group) Renderer.disposeGroup(this.group);
    this.lane = 1; this.targetLane = 1; this.laneSmooth = 0;
    this.jumpH = 0; this.vy = 0; this.isJumping = false;
    this.animFrame = 0;
    this.colors = State.getSkin().colors;
    this.legs = [];
    this.eyes = [];

    this.group = new THREE.Group();

    const c = this.colors;

    // Body — main sphere
    const bodyGeo = new THREE.SphereGeometry(0.65, 24, 18);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[0]),
      roughness: 0.6,
      metalness: 0.05,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.9;
    this.body.castShadow = true;
    this.group.add(this.body);

    // Fluffy outer ring (smaller spheres around body)
    const fluffMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(c[1]),
      roughness: 0.8,
      transparent: true,
      opacity: 0.5,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const fluff = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), fluffMat);
      fluff.position.set(Math.cos(a) * 0.55, 0.9 + Math.sin(a * 2) * 0.15, Math.sin(a) * 0.55);
      this.group.add(fluff);
    }

    // Ears
    const earMat = Renderer.getMat(c[1]);
    const earInnerMat = Renderer.getMat('#ffaaaa');
    for (const side of [-1, 1]) {
      const earGeo = new THREE.ConeGeometry(0.18, 0.4, 8);
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.3, 1.7, 0);
      ear.rotation.z = side * -0.3;
      this.group.add(ear);
      // Inner ear
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 8), earInnerMat);
      inner.position.set(side * 0.3, 1.68, 0.02);
      inner.rotation.z = side * -0.3;
      this.group.add(inner);
    }

    // Eyes
    const eyeWhiteMat = Renderer.getMat('#ffffff', { roughness: 0.3 });
    const pupilMat = Renderer.getMat('#111111', { roughness: 0.2 });
    const shineMat = Renderer.getMat('#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.5 });
    for (const side of [-1, 1]) {
      // Eye white
      const eyeGeo = new THREE.SphereGeometry(0.14, 12, 8);
      const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      eye.position.set(side * 0.22, 1.1, 0.55);
      this.group.add(eye);
      // Pupil
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), pupilMat);
      pupil.position.set(side * 0.22, 1.08, 0.63);
      this.group.add(pupil);
      // Shine
      const shine = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), shineMat);
      shine.position.set(side * 0.19, 1.13, 0.65);
      this.group.add(shine);
    }

    // Nose
    const noseMat = Renderer.getMat('#222222', { roughness: 0.3, metalness: 0.2 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), noseMat);
    nose.position.set(0, 0.98, 0.62);
    this.group.add(nose);

    // Legs
    const legMat = Renderer.getMat(c[2]);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), legMat);
      leg.position.set(side * 0.22, 0.15, 0);
      leg.castShadow = true;
      this.group.add(leg);
      this.legs.push(leg);
    }

    // Shield (invisible until activated)
    const shieldGeo = new THREE.SphereGeometry(1.1, 24, 16);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.5,
    });
    this.shield = new THREE.Mesh(shieldGeo, shieldMat);
    this.shield.position.y = 0.9;
    this.group.add(this.shield);

    this.group.position.set(0, 0, CONFIG.PLAYER_Z);
    Renderer.scene.add(this.group);
  },

  switchLane(dir) {
    if (dir > 0 && this.targetLane < 2) this.targetLane++;
    else if (dir < 0 && this.targetLane > 0) this.targetLane--;
  },

  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.vy = CONFIG.JUMP_FORCE;
    }
  },

  update() {
    const ts = this.targetLane - 1;
    this.laneSmooth += (ts - this.laneSmooth) * 0.14;
    if (Math.abs(this.laneSmooth - ts) < 0.03) {
      this.laneSmooth = ts;
      this.lane = this.targetLane;
    }

    if (this.isJumping) {
      // Float at apex — reduced gravity when near peak
      const grav = Math.abs(this.vy) < 0.025 ? CONFIG.FLOAT_GRAVITY : CONFIG.GRAVITY;
      this.jumpH += this.vy;
      this.vy -= grav;
      if (this.jumpH <= 0) {
        this.jumpH = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    this.animFrame++;

    // Position
    this.group.position.x = this.laneSmooth * CONFIG.LANE_WIDTH;
    this.group.position.y = this.jumpH * 6; // Scale jump height to world

    // Body bob
    if (!this.isJumping) {
      this.body.position.y = 0.9 + Math.sin(this.animFrame * 0.12) * 0.05;
    }

    // Leg animation
    if (!this.isJumping) {
      const lp = this.animFrame * 0.18;
      this.legs[0].position.z = Math.sin(lp) * 0.25;
      this.legs[0].position.y = 0.15 + Math.abs(Math.sin(lp)) * 0.1;
      this.legs[1].position.z = Math.sin(lp + Math.PI) * 0.25;
      this.legs[1].position.y = 0.15 + Math.abs(Math.sin(lp + Math.PI)) * 0.1;
    } else {
      // Tuck legs during jump
      this.legs[0].position.y = 0.4;
      this.legs[1].position.y = 0.4;
    }

    // Slight lean forward when running fast
    const sf = (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
    this.body.rotation.x = sf * 0.15;

    // Shield visibility
    this.shield.material.opacity = State.game.hasShield ? 0.15 + Math.sin(this.animFrame * 0.05) * 0.05 : 0;
    if (State.game.hasShield) this.shield.rotation.y += 0.02;
  },

  getCollisionInfo() {
    return {
      x: this.group.position.x,
      y: this.group.position.y + 0.9,
      z: CONFIG.PLAYER_Z,
      r: 0.6,
      jumpH: this.jumpH,
    };
  },
};

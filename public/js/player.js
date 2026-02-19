// =============================================
// BERT RUNNER NYC - Player
// Uses Renderer.project() for positioning
// =============================================
const Player = {
  lane: 1, targetLane: 1,
  laneSmooth: 0, // -1, 0, +1 smoothed
  jumpH: 0,      // world height above ground
  vy: 0,
  isJumping: false,
  bobPhase: 0,
  animFrame: 0,
  colors: ['#F4A460','#D2691E','#8B4513'],
  SIZE: 1.5, // world size

  init() {
    this.lane = 1; this.targetLane = 1; this.laneSmooth = 0;
    this.jumpH = 0; this.vy = 0; this.isJumping = false;
    this.bobPhase = 0; this.animFrame = 0;
    this.colors = State.getSkin().colors;
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
    // Smooth lane transition: lane 0→-1, lane 1→0, lane 2→+1
    const targetSmooth = this.targetLane - 1;
    this.laneSmooth += (targetSmooth - this.laneSmooth) * 0.14;
    if (Math.abs(this.laneSmooth - targetSmooth) < 0.05) {
      this.laneSmooth = targetSmooth;
      this.lane = this.targetLane;
    }

    // Jump
    if (this.isJumping) {
      this.jumpH += this.vy;
      this.vy -= CONFIG.GRAVITY;
      if (this.jumpH <= 0) { this.jumpH = 0; this.vy = 0; this.isJumping = false; }
    }

    this.bobPhase += 0.12;
    this.animFrame++;
  },

  draw() {
    const ctx = Renderer.ctx;
    const z = CONFIG.PLAYER_Z;
    const bob = this.isJumping ? 0 : Math.sin(this.bobPhase) * 0.06;
    const h = this.jumpH + bob;

    // Project using shared function
    const p = Renderer.project(this.laneSmooth, z, h);
    if (!p) return;

    const r = Renderer.worldToPixels(this.SIZE, z);
    const x = p.x;
    const y = p.y;

    // Shadow on ground
    const ps = Renderer.project(this.laneSmooth, z, 0);
    if (ps) {
      const shrink = 1 - this.jumpH * 1.5;
      ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.max(0.1, shrink)})`;
      ctx.beginPath();
      ctx.ellipse(ps.x, ps.y, r * 0.7 * Math.max(0.2, shrink), r * 0.2 * Math.max(0.2, shrink), 0, 0, 6.28);
      ctx.fill();
    }

    // Body
    const grad = ctx.createRadialGradient(x - r*0.2, y - r*0.2, r*0.1, x, y, r);
    grad.addColorStop(0, this.colors[0]);
    grad.addColorStop(0.6, this.colors[1]);
    grad.addColorStop(1, this.colors[2]);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();

    // Fluff
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*6.28 + this.animFrame * 0.04;
      ctx.fillStyle = this.colors[0]; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.arc(x + Math.cos(a)*r*0.82, y + Math.sin(a)*r*0.82, r*0.22, 0, 6.28); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Eyes
    const er = r*0.14, eox = r*0.28, eoy = r*0.15;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x-eox, y-eoy, er, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+eox, y-eoy, er, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x-eox+1, y-eoy-1, er*0.4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+eox+1, y-eoy-1, er*0.4, 0, 6.28); ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x, y+r*0.05, r*0.09, 0, 6.28); ctx.fill();

    // Tongue
    if (State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      ctx.fillStyle = '#FF6B6B';
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(this.animFrame*0.15)*2, y+r*0.35, r*0.1, r*0.18, 0.2, 0, 6.28);
      ctx.fill();
    }

    // Shield
    if (State.game.hasShield) {
      ctx.strokeStyle = 'rgba(88,166,255,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r*1.4, 0, 6.28); ctx.stroke();
    }
  },

  getCollisionInfo() {
    const p = Renderer.project(this.laneSmooth, CONFIG.PLAYER_Z, this.jumpH);
    const r = Renderer.worldToPixels(this.SIZE, CONFIG.PLAYER_Z);
    return p ? { x: p.x, y: p.y, r: r * 0.75, jumpH: this.jumpH } : null;
  },
};

// =============================================
// BERT RUNNER NYC - Player (Bert)
// =============================================

const Player = {
  lane: 1,         // 0=left, 1=center, 2=right
  targetLane: 1,
  screenX: 0,
  jumpY: 0,        // 0 = on ground, positive = in air
  vy: 0,
  isJumping: false,
  bobPhase: 0,
  animFrame: 0,
  colors: ['#F4A460','#D2691E','#8B4513'],
  baseSize: 32,

  init() {
    this.lane = 1;
    this.targetLane = 1;
    this.jumpY = 0;
    this.vy = 0;
    this.isJumping = false;
    this.bobPhase = 0;
    this.animFrame = 0;
    this.colors = State.getSkin().colors;
    this.screenX = Renderer.W / 2;
  },

  getLaneX(lane) {
    const W = Renderer.W;
    const cx = W / 2;
    // Road width at player's depth position
    const rw = W * 0.55 * 0.35; // road half-width scaled at player depth
    return cx + (lane - 1) * (rw * 0.67);
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
    // Smooth lane movement
    const target = this.getLaneX(this.targetLane);
    this.screenX += (target - this.screenX) * 0.15;
    if (Math.abs(this.screenX - target) < 2) this.lane = this.targetLane;

    // Jump physics
    if (this.isJumping) {
      this.jumpY += this.vy;
      this.vy -= CONFIG.GRAVITY;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    this.bobPhase += 0.12;
    this.animFrame++;
  },

  draw() {
    const ctx = Renderer.ctx;
    const H = Renderer.H;

    // Player vertical position on screen
    const baseY = H * CONFIG.PLAYER_BASE_Y;
    const bob = this.isJumping ? 0 : Math.sin(this.bobPhase) * 3;
    const jumpPx = this.jumpY * H * 0.6; // convert jump to pixels
    const y = baseY - jumpPx + bob;
    const x = this.screenX;
    const r = this.baseSize;

    // Shadow
    ctx.fillStyle = `rgba(0,0,0,${0.3 - this.jumpY * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(x, baseY + r * 0.6, r * (1 - this.jumpY * 0.3), r * 0.25 * (1 - this.jumpY * 0.3), 0, 0, 6.28);
    ctx.fill();

    // Body (fluffy ball)
    const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r);
    grad.addColorStop(0, this.colors[0]);
    grad.addColorStop(0.6, this.colors[1]);
    grad.addColorStop(1, this.colors[2]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.28);
    ctx.fill();

    // Fluff tufts
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.28 + this.animFrame * 0.04;
      const tx = x + Math.cos(a) * r * 0.85;
      const ty = y + Math.sin(a) * r * 0.85;
      ctx.fillStyle = this.colors[0];
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(tx, ty, r * 0.22, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Eyes
    const eyeR = r * 0.14;
    const eyeOx = r * 0.28;
    const eyeOy = r * 0.15;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x - eyeOx, y - eyeOy, eyeR, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x + eyeOx, y - eyeOy, eyeR, 0, 6.28); ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x - eyeOx + 1.5, y - eyeOy - 1.5, eyeR * 0.4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x + eyeOx + 1.5, y - eyeOy - 1.5, eyeR * 0.4, 0, 6.28); ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.09, 0, 6.28); ctx.fill();

    // Tongue when fast
    if (State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      ctx.fillStyle = '#FF6B6B';
      const tw = Math.sin(this.animFrame * 0.15) * 2;
      ctx.beginPath();
      ctx.ellipse(x + tw, y + r * 0.35, r * 0.1, r * 0.18, 0.2, 0, 6.28);
      ctx.fill();
    }

    // Shield glow
    if (State.game.hasShield) {
      ctx.strokeStyle = 'rgba(88,166,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r * 1.4, 0, 6.28); ctx.stroke();
      ctx.strokeStyle = 'rgba(88,166,255,0.2)';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, 6.28); ctx.stroke();
    }
  },

  // Collision bounds (screen space)
  getScreenBounds() {
    const H = Renderer.H;
    const baseY = H * CONFIG.PLAYER_BASE_Y;
    const jumpPx = this.jumpY * H * 0.6;
    return {
      x: this.screenX,
      y: baseY - jumpPx,
      r: this.baseSize * 0.8,
      jumpY: this.jumpY,
    };
  },
};

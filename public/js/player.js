// =============================================
// BERT RUNNER NYC - Player (Bert)
// =============================================

const Player = {
  lane: 1,        // 0, 1, 2
  targetLane: 1,
  x: 0,           // actual x position
  y: 0,           // height above ground
  vy: 0,          // vertical velocity
  isJumping: false,
  jumpTimer: 0,
  bobPhase: 0,
  animFrame: 0,
  colors: ['#F4A460','#D2691E','#8B4513'],

  init() {
    this.lane = 1;
    this.targetLane = 1;
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.isJumping = false;
    this.jumpTimer = 0;
    this.bobPhase = 0;
    this.colors = State.getSkin().colors;
  },

  getLaneX(lane) {
    return (lane - 1) * CONFIG.LANE_WIDTH;
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
    // Smooth lane transition
    const targetX = this.getLaneX(this.targetLane);
    this.x += (targetX - this.x) * 0.12;

    // Update lane once close enough
    if (Math.abs(this.x - targetX) < 0.1) {
      this.lane = this.targetLane;
    }

    // Jump physics
    if (this.isJumping) {
      this.y += this.vy;
      this.vy -= CONFIG.GRAVITY;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    // Running bob
    this.bobPhase += 0.12;
    this.animFrame++;
  },

  draw() {
    const ctx = Renderer.ctx;
    const z = CONFIG.PLAYER_Z;
    const bobY = this.isJumping ? 0 : Math.sin(this.bobPhase) * 0.08;
    const drawY = this.y + bobY;

    // Shadow on ground
    const shadowP = Renderer.project(this.x, 0, z);
    if (shadowP) {
      const shadowW = Renderer.projectWidth(1.0, z);
      const jumpShrink = 1 - this.y * 0.3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(shadowP.x, shadowP.y, shadowW * 0.5 * jumpShrink, shadowW * 0.15 * jumpShrink, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Body (fluffy pom)
    const bodySize = 0.5;
    const drawn = Renderer.drawSphere(this.x, drawY, z, bodySize, this.colors);
    if (!drawn) return;

    // Fluff tufts
    const tuftCount = 8;
    for (let i = 0; i < tuftCount; i++) {
      const angle = (i / tuftCount) * Math.PI * 2 + this.animFrame * 0.05;
      const tr = drawn.r * 0.85;
      const tx = drawn.x + Math.cos(angle) * tr;
      const ty = drawn.y + Math.sin(angle) * tr;
      ctx.fillStyle = this.colors[0];
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(tx, ty, drawn.r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Eyes
    const eyeSize = drawn.r * 0.17;
    const eyeOffX = drawn.r * 0.3;
    const eyeOffY = drawn.r * 0.2;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(drawn.x - eyeOffX, drawn.y - eyeOffY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(drawn.x + eyeOffX, drawn.y - eyeOffY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(drawn.x - eyeOffX + 1, drawn.y - eyeOffY - 1, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(drawn.x + eyeOffX + 1, drawn.y - eyeOffY - 1, eyeSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(drawn.x, drawn.y + drawn.r * 0.05, drawn.r * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Tongue (when running fast)
    if (State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      ctx.fillStyle = '#FF6B6B';
      const tongueWag = Math.sin(this.animFrame * 0.15) * 2;
      ctx.beginPath();
      ctx.ellipse(drawn.x + tongueWag, drawn.y + drawn.r * 0.35, drawn.r * 0.12, drawn.r * 0.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield glow
    if (State.game.hasShield) {
      ctx.strokeStyle = 'rgba(88,166,255,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(drawn.x, drawn.y, drawn.r * 1.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(88,166,255,0.2)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(drawn.x, drawn.y, drawn.r * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  // Get collision bounds
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      z: CONFIG.PLAYER_Z,
      r: CONFIG.PLAYER_RADIUS,
    };
  },
};

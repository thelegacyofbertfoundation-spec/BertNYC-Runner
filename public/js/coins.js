// =============================================
// BERT RUNNER NYC - Coins
// =============================================

const Coins = {
  list: [],
  nextGroupDist: 40,

  init() {
    this.list = [];
    this.nextGroupDist = 40;
  },

  spawn(distance) {
    if (distance < this.nextGroupDist) return;

    const lane = Math.floor(Math.random() * 3);
    const floating = Math.random() > 0.65;

    for (let i = 0; i < CONFIG.COIN_GROUP_SIZE; i++) {
      this.list.push({
        z: 100 + i * 5,
        lane: lane,
        floating: floating,
        collected: false,
        bobOffset: Math.random() * 6.28,
        rotPhase: Math.random() * 6.28,
      });
    }

    this.nextGroupDist = distance + 30 + Math.random() * 40;
  },

  update(speed) {
    for (let c of this.list) {
      c.z -= speed;
    }
    this.list = this.list.filter(c => c.z > -5 && !c.collected);
  },

  draw(frame) {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = W / 2;

    for (const c of this.list) {
      if (c.collected || c.z < 0 || c.z > 100) continue;

      const t = Math.min(c.z / 100, 1);
      const scale = 1 - t * 0.95;
      if (scale < 0.03) continue;

      // Position
      const baseY = H - (H - hY) * (1 - t);
      const floatOff = c.floating ? 25 * scale : 0;
      const bob = Math.sin(frame * 0.05 + c.bobOffset) * 4 * scale;
      const y = baseY - 15 * scale - floatOff + bob;

      const roadHW = scale * W * 0.55;
      const x = cx + (c.lane - 1) * (roadHW * 0.67);

      // Size
      const r = 10 * scale;
      if (r < 2) continue;

      // Rotation squeeze
      const squeeze = Math.abs(Math.cos(frame * 0.04 + c.rotPhase));
      const rw = r * Math.max(0.25, squeeze);

      // Draw coin
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(x, y, rw, r, 0, 0, 6.28);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#FFEC80';
      ctx.beginPath();
      ctx.ellipse(x - rw * 0.15, y - r * 0.15, rw * 0.45, r * 0.45, 0, 0, 6.28);
      ctx.fill();

      // B letter
      if (r > 5 && squeeze > 0.5) {
        ctx.fillStyle = '#B8860B';
        ctx.font = `bold ${Math.max(5, r * 0.7)}px Rubik`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', x, y);
      }

      // Glow
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = r * 0.4;
      ctx.fillStyle = 'rgba(255,215,0,0.3)';
      ctx.beginPath(); ctx.arc(x, y, r * 0.2, 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;

      // Store for collision
      c._sx = x;
      c._sy = y;
      c._sr = r;
    }
  },

  checkCollection(playerBounds) {
    let collected = 0;
    const magnetBonus = State.game.hasMagnet ? 60 : 0;

    for (const c of this.list) {
      if (c.collected || c.z > 15 || c.z < -2) continue;
      if (!c._sx) continue;

      const dx = Math.abs(c._sx - playerBounds.x);
      const dy = Math.abs(c._sy - playerBounds.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const hitR = playerBounds.r + (c._sr || 10) + magnetBonus;

      if (dist < hitR) {
        c.collected = true;
        collected++;
        Particles.spawn(c._sx, c._sy, '#FFD700', 5);
      }
    }
    return collected;
  },
};

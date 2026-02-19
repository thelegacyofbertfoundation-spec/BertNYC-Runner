// =============================================
// BERT RUNNER NYC - Coins
// =============================================

const Coins = {
  list: [],
  nextGroupZ: 20,

  init() {
    this.list = [];
    this.nextGroupZ = 20;
  },

  spawn(distance) {
    const worldZ = distance + CONFIG.DRAW_DISTANCE * 0.8;
    if (worldZ < this.nextGroupZ) return;

    const lane = Math.floor(Math.random() * 3);
    const laneX = (lane - 1) * CONFIG.LANE_WIDTH;
    const floating = Math.random() > 0.6;
    const count = CONFIG.COIN_GROUP_SIZE;

    for (let i = 0; i < count; i++) {
      this.list.push({
        x: laneX,
        y: floating ? 1.5 + Math.random() * 0.5 : 0.5,
        z: worldZ + i * 2,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2,
        rotAngle: Math.random() * Math.PI * 2,
      });
    }

    this.nextGroupZ = worldZ + 12 + Math.random() * 15;
  },

  update(speed, frameCount) {
    // Remove far passed coins
    this.list = this.list.filter(c => c.z > -5 && !c.collected);
  },

  draw(distance, frameCount) {
    const ctx = Renderer.ctx;

    for (const c of this.list) {
      if (c.collected) continue;
      const relZ = c.z - distance;
      if (relZ < 0 || relZ > CONFIG.DRAW_DISTANCE) continue;

      const bobY = Math.sin(frameCount * 0.06 + c.bobOffset) * 0.15;
      const drawY = c.y + bobY;

      // Coin as golden circle with 3D effect
      const p = Renderer.project(c.x, drawY, relZ);
      if (!p) continue;

      const r = Renderer.projectHeight(0.35, relZ);
      if (r < 1) continue;

      // Rotation effect (squeeze horizontally)
      const squeeze = Math.abs(Math.cos(frameCount * 0.04 + c.rotAngle));
      const rw = r * Math.max(0.2, squeeze);

      // Outer ring
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, rw, r, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.fillStyle = '#FFEC80';
      ctx.beginPath();
      ctx.ellipse(p.x - rw * 0.15, p.y - r * 0.15, rw * 0.5, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // $BERT text on coin (if big enough)
      if (r > 6) {
        ctx.fillStyle = '#B8860B';
        ctx.font = `bold ${Math.max(6, r * 0.5)}px Rubik`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (squeeze > 0.5) ctx.fillText('B', p.x, p.y);
      }

      // Glow
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = r * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  // Check collection
  checkCollection(playerBounds, distance) {
    let collected = 0;
    const magnetRange = State.game.hasMagnet ? 3.0 : CONFIG.COIN_RADIUS;

    for (const c of this.list) {
      if (c.collected) continue;
      const relZ = c.z - distance;
      const dz = Math.abs(relZ - playerBounds.z);
      const dx = Math.abs(c.x - playerBounds.x);
      const dy = Math.abs(c.y - playerBounds.y);

      if (dz < magnetRange && dx < magnetRange && dy < magnetRange + 1) {
        c.collected = true;
        collected++;
        // Spawn particles at coin location
        const p = Renderer.project(c.x, c.y, relZ);
        if (p) Particles.spawn(p.x, p.y, '#FFD700', 6);
      }
    }

    return collected;
  },
};

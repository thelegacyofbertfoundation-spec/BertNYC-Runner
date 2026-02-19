// =============================================
// BERT RUNNER NYC - Coins
// Uses Renderer.project() for positioning
// =============================================
const Coins = {
  list: [],
  nextGroupDist: 30,

  init() { this.list = []; this.nextGroupDist = 30; },

  spawn(distance) {
    if (distance < this.nextGroupDist) return;

    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    const floating = Math.random() > 0.65;

    for (let i = 0; i < CONFIG.COIN_GROUP_SIZE; i++) {
      this.list.push({
        z: CONFIG.SPAWN_Z + i * CONFIG.COIN_GAP,
        lane: lane,
        height: floating ? 0.8 : 0.3,
        collected: false,
        bobOff: Math.random() * 6.28,
        rotOff: Math.random() * 6.28,
      });
    }
    this.nextGroupDist = distance + 25 + Math.random() * 35;
  },

  update(speed) {
    for (let c of this.list) c.z -= speed;
    this.list = this.list.filter(c => c.z > CONFIG.DESPAWN_Z && !c.collected);
  },

  draw(frame) {
    const ctx = Renderer.ctx;

    for (const c of this.list) {
      if (c.collected || c.z < 0 || c.z > CONFIG.SPAWN_Z + 40) continue;

      const bob = Math.sin(frame * 0.05 + c.bobOff) * 0.1;
      const p = Renderer.project(c.lane, c.z, c.height + bob);
      if (!p || p.scale < 0.01) continue;

      const r = Renderer.worldToPixels(0.5, c.z);
      if (r < 1.5) continue;

      const x = p.x, y = p.y;

      // Rotation squeeze
      const sq = Math.abs(Math.cos(frame * 0.04 + c.rotOff));
      const rw = r * Math.max(0.2, sq);

      // Coin
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.ellipse(x, y, rw, r, 0, 0, 6.28); ctx.fill();

      // Highlight
      ctx.fillStyle = '#FFEC80';
      ctx.beginPath(); ctx.ellipse(x-rw*0.15, y-r*0.15, rw*0.4, r*0.4, 0, 0, 6.28); ctx.fill();

      // B
      if (r > 5 && sq > 0.5) {
        ctx.fillStyle = '#B8860B';
        ctx.font = `bold ${Math.max(5, r*0.7)}px Rubik`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('B', x, y);
      }

      // Store for collision
      c._x = x; c._y = y; c._r = r;
    }
  },

  checkCollection(playerInfo) {
    if (!playerInfo) return 0;
    let got = 0;
    const magnetR = State.game.hasMagnet ? 80 : 0;

    for (const c of this.list) {
      if (c.collected) continue;
      if (c.z < CONFIG.PLAYER_Z - 5 || c.z > CONFIG.PLAYER_Z + 5) continue;
      if (!c._x) continue;

      const dx = c._x - playerInfo.x;
      const dy = c._y - playerInfo.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const hitR = playerInfo.r + (c._r || 8) + magnetR;

      if (dist < hitR) {
        c.collected = true;
        got++;
        Particles.spawn(c._x, c._y, '#FFD700', 5);
      }
    }
    return got;
  },
};

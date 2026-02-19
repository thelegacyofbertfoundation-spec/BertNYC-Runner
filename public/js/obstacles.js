// =============================================
// BERT RUNNER NYC - Obstacles
// Uses Renderer.project() for positioning
// =============================================
const Obstacles = {
  list: [],
  nextSpawnDist: 60,

  init() { this.list = []; this.nextSpawnDist = 60; },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;

    const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    const type = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];

    this.list.push({ z: CONFIG.SPAWN_Z, lane, ...type });

    // Double obstacle at higher speeds
    if (Math.random() < 0.25 && State.game.speed > CONFIG.INITIAL_SPEED * 1.4) {
      let lane2 = lane;
      while (lane2 === lane) lane2 = Math.floor(Math.random() * 3) - 1;
      const type2 = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];
      this.list.push({ z: CONFIG.SPAWN_Z + Math.random() * 8, lane: lane2, ...type2 });
    }

    const sf = (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
    const gap = CONFIG.OBSTACLE_MAX_GAP - (CONFIG.OBSTACLE_MAX_GAP - CONFIG.OBSTACLE_MIN_GAP) * sf * 0.5;
    this.nextSpawnDist = distance + gap * (0.7 + Math.random() * 0.6);
  },

  update(speed) {
    for (let o of this.list) o.z -= speed;
    this.list = this.list.filter(o => o.z > CONFIG.DESPAWN_Z);
  },

  draw() {
    const ctx = Renderer.ctx;
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const o of sorted) {
      if (o.z < 0 || o.z > CONFIG.SPAWN_Z + 10) continue;

      const p = Renderer.project(o.lane, o.z, 0);
      if (!p || p.scale < 0.01) continue;

      const ow = Renderer.worldToPixels(o.w, o.z);
      const oh = Renderer.worldToPixels(o.h, o.z);
      if (ow < 2 || oh < 2) continue;

      const x = p.x;
      const y = p.y;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(x, y, ow*0.5, ow*0.12, 0, 0, 6.28);
      ctx.fill();

      // Main body
      ctx.fillStyle = o.color;
      ctx.fillRect(x - ow/2, y - oh, ow, oh);

      // Top highlight
      ctx.fillStyle = lightenHex(o.color, 30);
      ctx.fillRect(x - ow/2, y - oh, ow, oh * 0.15);

      // Right shade
      ctx.fillStyle = o.dark;
      ctx.fillRect(x + ow/2 - ow*0.13, y - oh, ow*0.13, oh);

      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.strokeRect(x - ow/2, y - oh, ow, oh);

      // Emoji
      if (ow > 12) {
        ctx.font = `${Math.min(Math.floor(ow*0.65), 34)}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.emoji, x, y - oh*0.5);
      }

      // Store screen info for collision
      o._x = x; o._y = y - oh/2; o._w = ow; o._h = oh;
    }
  },

  checkCollision(playerInfo) {
    if (!playerInfo) return null;
    for (const o of this.list) {
      // Only check obstacles near player's depth
      if (o.z < CONFIG.PLAYER_Z - 3 || o.z > CONFIG.PLAYER_Z + 3) continue;
      if (!o._x) continue;

      const dx = Math.abs(o._x - playerInfo.x);
      const dy = Math.abs(o._y - playerInfo.y);
      const hitX = o._w * 0.4 + playerInfo.r;
      const hitY = o._h * 0.4 + playerInfo.r;

      if (dx < hitX && dy < hitY) {
        // Can jump over short obstacles
        if (playerInfo.jumpH > o.h * 0.6) continue;
        return o;
      }
    }
    return null;
  },

  remove(o) { const i = this.list.indexOf(o); if (i >= 0) this.list.splice(i, 1); },
};

function lightenHex(hex, amt) {
  const c = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (c>>16)+amt);
  const g = Math.min(255, ((c>>8)&0xff)+amt);
  const b = Math.min(255, (c&0xff)+amt);
  return `rgb(${r},${g},${b})`;
}

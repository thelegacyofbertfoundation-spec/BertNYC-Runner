// =============================================
// BERT RUNNER NYC - Obstacles
// =============================================

const Obstacles = {
  list: [],
  nextSpawnDist: 80,

  init() {
    this.list = [];
    this.nextSpawnDist = 80;
  },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;

    const lane = Math.floor(Math.random() * 3);
    const type = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];

    this.list.push({
      z: 100, // starts far away
      lane: lane,
      ...type,
    });

    // Double obstacle at higher speeds
    if (Math.random() < 0.25 && State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      let lane2 = lane;
      while (lane2 === lane) lane2 = Math.floor(Math.random() * 3);
      const type2 = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];
      this.list.push({
        z: 100 + Math.random() * 5,
        lane: lane2,
        ...type2,
      });
    }

    const speedFactor = (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED);
    const gap = CONFIG.OBSTACLE_MAX_GAP - (CONFIG.OBSTACLE_MAX_GAP - CONFIG.OBSTACLE_MIN_GAP) * speedFactor * 0.5;
    this.nextSpawnDist = distance + gap * (0.7 + Math.random() * 0.6);
  },

  update(speed) {
    for (let o of this.list) {
      o.z -= speed;
    }
    this.list = this.list.filter(o => o.z > -5);
  },

  draw() {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = W / 2;

    // Sort far to near (painter's algorithm)
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const o of sorted) {
      if (o.z < 0 || o.z > 100) continue;

      const t = Math.min(o.z / 100, 1); // 0=near, 1=far
      const scale = 1 - t * 0.95;
      if (scale < 0.03) continue;

      // Y position
      const y = H - (H - hY) * (1 - t);

      // X position based on lane
      const roadHW = scale * W * 0.55; // road half-width at this depth
      const laneOff = (o.lane - 1) * (roadHW * 0.67);
      const x = cx + laneOff;

      // Size
      const ow = o.w * 40 * scale;
      const oh = o.h * 40 * scale;
      if (ow < 3 || oh < 3) continue;

      // Draw box
      ctx.fillStyle = o.color;
      ctx.fillRect(x - ow / 2, y - oh, ow, oh);

      // Top highlight
      ctx.fillStyle = Renderer.lighten ? Renderer.lighten(o.color, 25) : '#fff';
      try { ctx.fillStyle = lightenColor(o.color, 25); } catch(e) {}
      ctx.fillRect(x - ow / 2, y - oh, ow, oh * 0.12);

      // Side shade
      ctx.fillStyle = o.colorDark;
      ctx.fillRect(x + ow / 2 - ow * 0.12, y - oh, ow * 0.12, oh);

      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - ow / 2, y - oh, ow, oh);

      // Emoji
      if (ow > 14) {
        ctx.font = `${Math.min(ow * 0.7, 36)}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.emoji, x, y - oh / 2);
      }

      // Store screen position for collision
      o._sx = x;
      o._sy = y - oh / 2;
      o._sw = ow;
      o._sh = oh;
    }
  },

  checkCollision(playerBounds) {
    for (const o of this.list) {
      if (o.z < 0 || o.z > 12) continue; // only check near obstacles
      if (!o._sx) continue;

      const dx = Math.abs(o._sx - playerBounds.x);
      const dy = Math.abs(o._sy - playerBounds.y);
      const hitDist = (o._sw / 2 + playerBounds.r) * 0.7;
      const hitDistY = (o._sh / 2 + playerBounds.r) * 0.7;

      if (dx < hitDist && dy < hitDistY && playerBounds.jumpY < o.h * 0.7) {
        return o;
      }
    }
    return null;
  },

  remove(obstacle) {
    const idx = this.list.indexOf(obstacle);
    if (idx >= 0) this.list.splice(idx, 1);
  },
};

function lightenColor(hex, amt) {
  let c = parseInt(hex.replace('#', ''), 16);
  let r = Math.min(255, (c >> 16) + amt);
  let g = Math.min(255, ((c >> 8) & 0xff) + amt);
  let b = Math.min(255, (c & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// =============================================
// BERT RUNNER NYC - Enhanced Obstacles
// =============================================
const Obstacles = {
  list: [],
  nextSpawnDist: 60,

  init() { this.list = []; this.nextSpawnDist = 60; },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;
    const lane = Math.floor(Math.random()*3)-1;
    const type = CONFIG.OBSTACLES[Math.floor(Math.random()*CONFIG.OBSTACLES.length)];
    this.list.push({ z:CONFIG.SPAWN_Z, lane, ...type });

    if (Math.random() < 0.25 && State.game.speed > CONFIG.INITIAL_SPEED * 1.4) {
      let l2 = lane; while(l2===lane) l2=Math.floor(Math.random()*3)-1;
      const t2 = CONFIG.OBSTACLES[Math.floor(Math.random()*CONFIG.OBSTACLES.length)];
      this.list.push({ z:CONFIG.SPAWN_Z+Math.random()*8, lane:l2, ...t2 });
    }

    const sf = (State.game.speed-CONFIG.INITIAL_SPEED)/(CONFIG.MAX_SPEED-CONFIG.INITIAL_SPEED);
    const gap = CONFIG.OBSTACLE_MAX_GAP-(CONFIG.OBSTACLE_MAX_GAP-CONFIG.OBSTACLE_MIN_GAP)*sf*0.5;
    this.nextSpawnDist = distance + gap*(0.7+Math.random()*0.6);
  },

  update(speed) {
    for (let o of this.list) o.z -= speed;
    this.list = this.list.filter(o => o.z > CONFIG.DESPAWN_Z);
  },

  draw() {
    const ctx = Renderer.ctx;
    const sorted = [...this.list].sort((a,b) => b.z-a.z);

    for (const o of sorted) {
      if (o.z < 0 || o.z > CONFIG.SPAWN_Z+10) continue;
      const fog = Renderer.fogAt(o.z);
      if (fog > 0.9) continue;

      const p = Renderer.project(o.lane, o.z, 0);
      if (!p || p.scale < 0.01) continue;

      const ow = Renderer.worldToPixels(o.w, o.z);
      const oh = Renderer.worldToPixels(o.h, o.z);
      if (ow < 2 || oh < 2) continue;

      const x = p.x, y = p.y;
      const alpha = 1 - fog;

      // Shadow on road
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(x, y + 1, ow*0.55, ow*0.12, 0, 0, 6.28);
      ctx.fill();

      // 3D Box: back face (top)
      const depth = oh * 0.15;
      ctx.fillStyle = Renderer.fogColor(o.accent || o.color, o.z);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(x-ow/2, y-oh);
      ctx.lineTo(x-ow/2+depth, y-oh-depth);
      ctx.lineTo(x+ow/2+depth, y-oh-depth);
      ctx.lineTo(x+ow/2, y-oh);
      ctx.closePath(); ctx.fill();

      // 3D Box: right face
      ctx.fillStyle = Renderer.fogColor(o.dark, o.z);
      ctx.beginPath();
      ctx.moveTo(x+ow/2, y-oh);
      ctx.lineTo(x+ow/2+depth, y-oh-depth);
      ctx.lineTo(x+ow/2+depth, y-depth);
      ctx.lineTo(x+ow/2, y);
      ctx.closePath(); ctx.fill();

      // Front face (main body)
      const bodyG = ctx.createLinearGradient(x-ow/2, y-oh, x-ow/2, y);
      bodyG.addColorStop(0, Renderer.fogColor(Renderer.lighten(o.color, 15), o.z));
      bodyG.addColorStop(0.4, Renderer.fogColor(o.color, o.z));
      bodyG.addColorStop(1, Renderer.fogColor(o.dark, o.z));
      ctx.fillStyle = bodyG;
      ctx.fillRect(x-ow/2, y-oh, ow, oh);

      // Highlight stripe
      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.1})`;
      ctx.fillRect(x-ow/2, y-oh, ow, oh*0.08);

      // Outline
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.3})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x-ow/2, y-oh, ow, oh);

      // Reflective strip (on taxis/buses)
      if (o.type === 'taxi' || o.type === 'bus') {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.15})`;
        ctx.fillRect(x-ow/2 + ow*0.05, y-oh*0.6, ow*0.9, oh*0.08);
      }

      // Emoji icon
      if (ow > 14) {
        ctx.font = `${Math.min(Math.floor(ow*0.55), 30)}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(o.emoji, x, y-oh*0.5);
      }

      ctx.globalAlpha = 1;

      // Store screen info
      o._x=x; o._y=y-oh/2; o._w=ow; o._h=oh;
    }
  },

  checkCollision(pi) {
    if (!pi) return null;
    for (const o of this.list) {
      if (o.z<CONFIG.PLAYER_Z-3||o.z>CONFIG.PLAYER_Z+3) continue;
      if (!o._x) continue;
      const dx=Math.abs(o._x-pi.x), dy=Math.abs(o._y-pi.y);
      if (dx < o._w*0.4+pi.r && dy < o._h*0.4+pi.r) {
        if (pi.jumpH > o.h * 0.6) continue;
        return o;
      }
    }
    return null;
  },

  remove(o) { const i=this.list.indexOf(o); if(i>=0) this.list.splice(i,1); },
};

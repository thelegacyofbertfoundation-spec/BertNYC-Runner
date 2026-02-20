// =============================================
// BERT RUNNER NYC - Enhanced Renderer
// =============================================
const Renderer = {
  canvas: null, ctx: null, W: 0, H: 0,
  horizonY: 0, roadH: 0, cx: 0,
  REF_Z: 8, ROAD_W: 0.38,

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.horizonY = this.H * 0.35;
    this.roadH = this.H - this.horizonY;
    this.cx = this.W / 2;
  },

  project(lane, z, height) {
    if (z <= 0.5) return null;
    const p = this.REF_Z / z;
    const screenY = this.horizonY + this.roadH * p;
    const roadHW = this.W * this.ROAD_W * p;
    const laneSpacing = roadHW / 1.5;
    const screenX = this.cx + lane * laneSpacing;
    const jumpPx = height * this.roadH * 0.8 * p;
    return { x: screenX, y: screenY - jumpPx, scale: p, roadHW };
  },

  worldToPixels(worldSize, z) {
    return worldSize * this.roadH * 0.08 * (this.REF_Z / Math.max(z, 0.5));
  },

  // Fog factor: 0 = no fog, 1 = fully fogged
  fogAt(z) {
    if (z < CONFIG.FOG_START) return 0;
    return Math.min(1, (z - CONFIG.FOG_START) / (CONFIG.FOG_END - CONFIG.FOG_START));
  },

  // Mix color with fog
  fogColor(color, z) {
    const f = this.fogAt(z);
    if (f <= 0) return color;
    return this.mixColors(color, CONFIG.FOG_COLOR, f);
  },

  mixColors(c1, c2, t) {
    const r1 = this.parseColor(c1), r2 = this.parseColor(c2);
    const r = Math.round(r1[0] + (r2[0]-r1[0])*t);
    const g = Math.round(r1[1] + (r2[1]-r1[1])*t);
    const b = Math.round(r1[2] + (r2[2]-r1[2])*t);
    return `rgb(${r},${g},${b})`;
  },

  parseColor(c) {
    if (c.startsWith('#')) {
      const n = parseInt(c.slice(1), 16);
      return [n>>16, (n>>8)&0xff, n&0xff];
    }
    const m = c.match(/\d+/g);
    return m ? [+m[0],+m[1],+m[2]] : [0,0,0];
  },

  // ===== Rich Sky =====
  drawBackground(frame) {
    const ctx = this.ctx;
    const W = this.W, hY = this.horizonY;

    // Night sky gradient
    const skyG = ctx.createLinearGradient(0, 0, 0, hY + 20);
    skyG.addColorStop(0, '#020818');
    skyG.addColorStop(0.25, '#0a1030');
    skyG.addColorStop(0.5, '#121845');
    skyG.addColorStop(0.75, '#1a2058');
    skyG.addColorStop(1, '#252668');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, hY + 20);

    // City glow on horizon
    const glowG = ctx.createRadialGradient(W/2, hY, 0, W/2, hY, W*0.6);
    glowG.addColorStop(0, 'rgba(255,150,50,0.12)');
    glowG.addColorStop(0.4, 'rgba(255,100,50,0.06)');
    glowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowG;
    ctx.fillRect(0, hY*0.4, W, hY*0.8);

    // Stars
    this.drawStars(frame);

    // Moon with halo
    this.drawMoon(frame);

    // Distant city silhouette on horizon
    this.drawHorizonCity();
  },

  drawStars(frame) {
    const ctx = this.ctx;
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 80; i++)
        this._stars.push({
          x:Math.random(), y:Math.random()*0.85,
          s:Math.random()*1.5+0.3, p:Math.random()*6.28,
          bright: Math.random()
        });
    }
    for (const s of this._stars) {
      const twinkle = 0.2 + 0.4 * Math.sin(s.p + frame * 0.012) * s.bright;
      ctx.fillStyle = `rgba(255,255,255,${twinkle})`;
      ctx.beginPath(); ctx.arc(s.x*this.W, s.y*this.horizonY, s.s, 0, 6.28); ctx.fill();
    }
  },

  drawMoon(frame) {
    const ctx = this.ctx;
    const x = this.W*0.82, y = this.horizonY*0.22, r = 22;

    // Halo
    const halo = ctx.createRadialGradient(x, y, r, x, y, r*4);
    halo.addColorStop(0, 'rgba(255,255,220,0.08)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y, r*4, 0, 6.28); ctx.fill();

    // Moon body
    const mg = ctx.createRadialGradient(x-4, y-4, 2, x, y, r);
    mg.addColorStop(0, '#FFFFF0');
    mg.addColorStop(0.5, '#E8E8D0');
    mg.addColorStop(1, '#C8C8B0');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();

    // Craters
    ctx.fillStyle = 'rgba(160,160,140,0.25)';
    ctx.beginPath(); ctx.arc(x-6, y-4, 5, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+8, y+3, 3, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+2, y+7, 2.5, 0, 6.28); ctx.fill();
  },

  drawHorizonCity() {
    const ctx = this.ctx;
    if (!this._horizonBuildings) {
      this._horizonBuildings = [];
      for (let i = 0; i < 60; i++) {
        this._horizonBuildings.push({
          x: i / 60,
          w: 0.01 + Math.random() * 0.025,
          h: 5 + Math.random() * 45,
          lit: Math.random() > 0.4,
        });
      }
    }
    const hY = this.horizonY;
    for (const b of this._horizonBuildings) {
      const alpha = b.lit ? 0.2 : 0.35;
      ctx.fillStyle = `rgba(15,15,30,${alpha})`;
      ctx.fillRect(b.x * this.W, hY - b.h, b.w * this.W, b.h + 2);
      // Tiny windows
      if (b.lit && b.h > 15) {
        ctx.fillStyle = 'rgba(255,200,80,0.15)';
        for (let wy = 0; wy < b.h - 5; wy += 6) {
          ctx.fillRect(b.x * this.W + 1, hY - b.h + wy + 2, b.w * this.W - 2, 2);
        }
      }
    }
  },

  // Utility
  lighten(hex, amt) {
    const c = parseInt(hex.replace('#',''),16);
    return `rgb(${Math.min(255,(c>>16)+amt)},${Math.min(255,((c>>8)&0xff)+amt)},${Math.min(255,(c&0xff)+amt)})`;
  },
};

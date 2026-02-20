// =============================================
// BERT RUNNER NYC - Renderer v5
// Lower camera, wider road, more immersive
// =============================================
const Renderer = {
  canvas: null, ctx: null, W: 0, H: 0,
  horizonY: 0, roadH: 0, cx: 0,

  // KEY PERSPECTIVE TUNING
  REF_Z: 5,        // lower = more dramatic perspective = feels closer to ground
  ROAD_W: 0.52,    // wider road = more immersive

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
    // Horizon at 30% = lots of road visible = lower camera feel
    this.horizonY = this.H * 0.30;
    this.roadH = this.H - this.horizonY;
    this.cx = this.W / 2;
  },

  // MASTER PROJECTION
  project(lane, z, height) {
    if (z <= 0.3) return null;
    const p = this.REF_Z / z;
    const screenY = this.horizonY + this.roadH * p;
    const roadHW = this.W * this.ROAD_W * p;
    const laneSpacing = roadHW / 1.5;
    const screenX = this.cx + lane * laneSpacing;
    const jumpPx = height * this.roadH * 0.7 * p;
    return { x: screenX, y: screenY - jumpPx, scale: p, roadHW };
  },

  worldToPixels(worldSize, z) {
    return worldSize * this.roadH * 0.1 * (this.REF_Z / Math.max(z, 0.3));
  },

  fogAt(z) {
    if (z < 60) return 0;
    return Math.min(1, (z - 60) / 160);
  },

  fogColor(color, z) {
    const f = this.fogAt(z);
    if (f <= 0) return color;
    return this.mixColors(color, CONFIG.FOG_COLOR, f);
  },

  mixColors(c1, c2, t) {
    const r1 = this.parseColor(c1), r2 = this.parseColor(c2);
    return `rgb(${Math.round(r1[0]+(r2[0]-r1[0])*t)},${Math.round(r1[1]+(r2[1]-r1[1])*t)},${Math.round(r1[2]+(r2[2]-r1[2])*t)})`;
  },

  parseColor(c) {
    if (c.startsWith('#')) {
      const n = parseInt(c.slice(1), 16);
      return [n>>16,(n>>8)&0xff,n&0xff];
    }
    const m = c.match(/\d+/g);
    return m ? [+m[0],+m[1],+m[2]] : [0,0,0];
  },

  lighten(hex, amt) {
    const c = parseInt(hex.replace('#',''),16);
    return `rgb(${Math.min(255,(c>>16)+amt)},${Math.min(255,((c>>8)&0xff)+amt)},${Math.min(255,(c&0xff)+amt)})`;
  },

  // ===== Background =====
  drawBackground(frame) {
    const ctx = this.ctx;
    const W = this.W, hY = this.horizonY;

    // Sky
    const skyG = ctx.createLinearGradient(0, 0, 0, hY + 10);
    skyG.addColorStop(0, '#020818');
    skyG.addColorStop(0.3, '#0a1030');
    skyG.addColorStop(0.6, '#141848');
    skyG.addColorStop(1, '#252668');
    ctx.fillStyle = skyG;
    ctx.fillRect(0, 0, W, hY + 10);

    // City glow
    const glowG = ctx.createRadialGradient(W/2, hY, 0, W/2, hY, W*0.5);
    glowG.addColorStop(0, 'rgba(255,140,40,0.1)');
    glowG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowG;
    ctx.fillRect(0, hY*0.5, W, hY*0.7);

    // Stars
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 60; i++)
        this._stars.push({ x:Math.random(), y:Math.random()*0.85, s:Math.random()*1.3+0.3, p:Math.random()*6.28 });
    }
    for (const s of this._stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.2+0.3*Math.sin(s.p+frame*0.012)})`;
      ctx.beginPath(); ctx.arc(s.x*W, s.y*hY, s.s, 0, 6.28); ctx.fill();
    }

    // Moon
    const mx = W*0.83, my = hY*0.25;
    const halo = ctx.createRadialGradient(mx, my, 18, mx, my, 80);
    halo.addColorStop(0, 'rgba(255,255,220,0.06)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(mx, my, 80, 0, 6.28); ctx.fill();
    const mg = ctx.createRadialGradient(mx-3, my-3, 2, mx, my, 18);
    mg.addColorStop(0, '#FFFFF0'); mg.addColorStop(0.5, '#E8E8D0'); mg.addColorStop(1, '#C8C8B0');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, 18, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(160,160,140,0.2)';
    ctx.beginPath(); ctx.arc(mx-5, my-3, 4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(mx+6, my+2, 2.5, 0, 6.28); ctx.fill();

    // Horizon city silhouette
    if (!this._hBuildings) {
      this._hBuildings = [];
      for (let i = 0; i < 50; i++)
        this._hBuildings.push({ x:i/50, w:0.01+Math.random()*0.02, h:3+Math.random()*35, lit:Math.random()>0.4 });
    }
    for (const b of this._hBuildings) {
      ctx.fillStyle = b.lit ? 'rgba(20,20,40,0.25)' : 'rgba(10,10,25,0.4)';
      ctx.fillRect(b.x*W, hY-b.h, b.w*W, b.h+2);
      if (b.lit && b.h > 12) {
        ctx.fillStyle = 'rgba(255,200,80,0.12)';
        for (let wy = 0; wy < b.h-4; wy += 5)
          ctx.fillRect(b.x*W+1, hY-b.h+wy+2, b.w*W-2, 1.5);
      }
    }
  },
};

// =============================================
// BERT RUNNER NYC - Renderer
// ONE projection function for everything
// =============================================
const Renderer = {
  canvas: null, ctx: null, W: 0, H: 0,
  horizonY: 0,
  roadH: 0,       // pixels from horizon to screen bottom
  cx: 0,          // center X

  // Projection constants
  REF_Z: 8,       // reference depth (controls perspective strength)
  ROAD_W: 0.38,   // road half-width as fraction of screen width (at near)

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

  // ============================================
  // MASTER PROJECTION - everything uses this
  // lane: -1 (left), 0 (center), +1 (right) or fractional
  // z: depth (larger = farther), must be > 0
  // height: world units above ground (0 = on road)
  // Returns: { x, y, scale } or null if behind camera
  // ============================================
  project(lane, z, height) {
    if (z <= 0.5) return null;
    const p = this.REF_Z / z;              // perspective factor (1 at REF_Z, smaller = farther)
    const screenY = this.horizonY + this.roadH * p;
    const roadHW = this.W * this.ROAD_W * p;   // road half-width at this depth
    const laneSpacing = roadHW / 1.5;      // 3 lanes across the road
    const screenX = this.cx + lane * laneSpacing;
    const jumpPx = height * this.roadH * 0.8 * p;  // height above road in pixels
    return {
      x: screenX,
      y: screenY - jumpPx,
      scale: p,                            // use for sizing objects
      roadHW: roadHW,                      // road half-width at this depth
    };
  },

  // Size an object at a given depth
  worldToPixels(worldSize, z) {
    const p = this.REF_Z / Math.max(z, 0.5);
    return worldSize * this.roadH * 0.08 * p;
  },

  // ===== Sky =====
  clearSky() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.horizonY + 10);
    g.addColorStop(0, '#060614');
    g.addColorStop(0.35, '#0d0d2b');
    g.addColorStop(0.7, '#151540');
    g.addColorStop(1, '#1e1e55');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.horizonY + 10);
  },

  drawStars(frame) {
    const ctx = this.ctx;
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 50; i++)
        this._stars.push({ x:Math.random(), y:Math.random()*0.88, s:Math.random()*1.3+0.4, p:Math.random()*6.28 });
    }
    for (const s of this._stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.25+0.25*Math.sin(s.p+frame*0.015)})`;
      ctx.beginPath(); ctx.arc(s.x*this.W, s.y*this.horizonY, s.s, 0, 6.28); ctx.fill();
    }
  },

  drawMoon() {
    const ctx = this.ctx;
    const x = this.W*0.8, y = this.horizonY*0.25;
    ctx.fillStyle = '#E8E8D0';
    ctx.shadowColor = 'rgba(255,255,200,0.4)'; ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, 6.28); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(180,180,160,0.3)';
    ctx.beginPath(); ctx.arc(x-5, y-3, 4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+6, y+2, 2.5, 0, 6.28); ctx.fill();
  },
};

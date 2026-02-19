// =============================================
// BERT RUNNER NYC - Renderer (Pseudo-3D)
// =============================================

const Renderer = {
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  horizonY: 0,
  roadTop: 0,
  roadBottom: 0,

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
    this.horizonY = this.H * 0.38;
    this.roadTop = this.horizonY;
    this.roadBottom = this.H;
  },

  // Convert a depth (0=near, 1=far) to a Y position on screen
  depthToY(d) {
    return this.horizonY + (this.H - this.horizonY) * (1 - d);
  },

  // Get the road width at a given screen Y
  roadWidthAtY(y) {
    const t = (y - this.horizonY) / (this.H - this.horizonY);
    return t * this.W * 0.7; // road takes 70% of screen width at bottom
  },

  // Convert lane (-1, 0, 1) + depth (0-1) to screen X,Y
  laneToScreen(lane, depth) {
    const y = this.depthToY(depth);
    const rw = this.roadWidthAtY(y);
    const cx = this.W / 2;
    const x = cx + lane * (rw / 3);
    const scale = (y - this.horizonY) / (this.H - this.horizonY);
    return { x, y, scale: Math.max(scale, 0.01) };
  },

  clearSky() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.horizonY + 10);
    g.addColorStop(0, '#060614');
    g.addColorStop(0.3, '#0d0d2b');
    g.addColorStop(0.6, '#151540');
    g.addColorStop(1, '#1e1e55');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.horizonY + 10);
  },

  drawStars(frame) {
    const ctx = this.ctx;
    if (!this._stars) {
      this._stars = [];
      for (let i = 0; i < 50; i++) {
        this._stars.push({
          x: Math.random(), y: Math.random() * 0.9,
          s: Math.random() * 1.3 + 0.4, p: Math.random() * 6.28
        });
      }
    }
    for (const s of this._stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(s.p + frame * 0.015)})`;
      ctx.beginPath();
      ctx.arc(s.x * this.W, s.y * this.horizonY, s.s, 0, 6.28);
      ctx.fill();
    }
  },

  drawMoon() {
    const ctx = this.ctx;
    const x = this.W * 0.8, y = this.horizonY * 0.25;
    ctx.fillStyle = '#E8E8D0';
    ctx.shadowColor = 'rgba(255,255,200,0.4)';
    ctx.shadowBlur = 25;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, 6.28); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(180,180,160,0.3)';
    ctx.beginPath(); ctx.arc(x - 5, y - 3, 4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 6, y + 2, 2.5, 0, 6.28); ctx.fill();
  },
};

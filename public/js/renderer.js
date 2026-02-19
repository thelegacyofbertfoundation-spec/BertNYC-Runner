// =============================================
// BERT RUNNER NYC - 3D Perspective Renderer
// =============================================

const Renderer = {
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  dpr: 1,

  // Camera
  camY: CONFIG.CAMERA_HEIGHT,
  fov: CONFIG.CAMERA_FOV,
  vanishY: 0,    // screen Y of horizon

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.dpr = window.devicePixelRatio || 1;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W * this.dpr;
    this.canvas.height = this.H * this.dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    // Horizon at ~35% from top
    this.vanishY = this.H * 0.35;
  },

  // Project 3D world position to 2D screen
  // x: lateral (-1 left, 0 center, 1 right)
  // y: height above ground
  // z: distance from camera (higher = further away)
  project(x, y, z) {
    if (z <= 0.1) return null; // behind camera
    const scale = this.fov / z;
    const screenX = this.W / 2 + x * scale * this.W * 0.12;
    const screenY = this.vanishY + (this.camY - y) * scale * this.H * 0.15;
    return { x: screenX, y: screenY, scale: scale };
  },

  // Get screen width of an object at distance z
  projectWidth(worldWidth, z) {
    if (z <= 0.1) return 0;
    const scale = this.fov / z;
    return worldWidth * scale * this.W * 0.12;
  },

  // Get screen height of an object at distance z
  projectHeight(worldHeight, z) {
    if (z <= 0.1) return 0;
    const scale = this.fov / z;
    return worldHeight * scale * this.H * 0.15;
  },

  // Clear with sky gradient
  clearSky() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(0, 0, 0, this.vanishY + 30);
    grad.addColorStop(0, '#0a0a20');
    grad.addColorStop(0.3, '#12152a');
    grad.addColorStop(0.6, '#1a2040');
    grad.addColorStop(1, '#2a2050');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.W, this.vanishY + 30);
  },

  // Draw stars in sky
  drawStars(frameCount) {
    const ctx = this.ctx;
    if (!this._stars) {
      this._stars = Array.from({length: 80}, () => ({
        x: Math.random() * this.W,
        y: Math.random() * this.vanishY * 0.9,
        sz: Math.random() * 1.5 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
    }
    this._stars.forEach(s => {
      const alpha = 0.2 + 0.3 * Math.sin(s.tw + frameCount * 0.015);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.sz, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  // Draw a 3D box (used for obstacles)
  drawBox3D(x, y, z, w, h, d, color, colorDark, colorSide) {
    const front = this.project(x, y, z);
    const back = this.project(x, y, z + d);
    if (!front || !back) return;

    const fW = this.projectWidth(w, z);
    const fH = this.projectHeight(h, z);
    const bW = this.projectWidth(w, z + d);
    const bH = this.projectHeight(h, z + d);

    const ctx = this.ctx;

    // Top face
    ctx.fillStyle = colorSide || this.lighten(color, 30);
    ctx.beginPath();
    ctx.moveTo(front.x - fW/2, front.y - fH);
    ctx.lineTo(back.x - bW/2, back.y - bH);
    ctx.lineTo(back.x + bW/2, back.y - bH);
    ctx.lineTo(front.x + fW/2, front.y - fH);
    ctx.closePath();
    ctx.fill();

    // Right face
    ctx.fillStyle = colorDark || this.darken(color, 30);
    ctx.beginPath();
    ctx.moveTo(front.x + fW/2, front.y);
    ctx.lineTo(front.x + fW/2, front.y - fH);
    ctx.lineTo(back.x + bW/2, back.y - bH);
    ctx.lineTo(back.x + bW/2, back.y);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = colorDark || this.darken(color, 20);
    ctx.beginPath();
    ctx.moveTo(front.x - fW/2, front.y);
    ctx.lineTo(front.x - fW/2, front.y - fH);
    ctx.lineTo(back.x - bW/2, back.y - bH);
    ctx.lineTo(back.x - bW/2, back.y);
    ctx.closePath();
    ctx.fill();

    // Front face
    ctx.fillStyle = color;
    ctx.fillRect(front.x - fW/2, front.y - fH, fW, fH);

    // Front face border
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(front.x - fW/2, front.y - fH, fW, fH);
  },

  // Draw a sphere-like circle (for Bert, coins)
  drawSphere(x, y, z, radius, colors) {
    const p = this.project(x, y + radius, z);
    if (!p) return;
    const r = this.projectHeight(radius * 2, z) / 2;
    if (r < 1) return;

    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, r * 0.1, p.x, p.y, r);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.6, colors[1]);
    grad.addColorStop(1, colors[2]);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    return { x: p.x, y: p.y, r: r };
  },

  // Utility color helpers
  lighten(hex, pct) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.min(255, (num >> 16) + pct);
    const g = Math.min(255, ((num >> 8) & 0xff) + pct);
    const b = Math.min(255, (num & 0xff) + pct);
    return `rgb(${r},${g},${b})`;
  },

  darken(hex, pct) {
    const num = parseInt(hex.replace('#',''), 16);
    const r = Math.max(0, (num >> 16) - pct);
    const g = Math.max(0, ((num >> 8) & 0xff) - pct);
    const b = Math.max(0, (num & 0xff) - pct);
    return `rgb(${r},${g},${b})`;
  },
};

// =============================================
// BERT RUNNER NYC - Particle Effects
// =============================================

const Particles = {
  list: [],

  init() {
    this.list = [];
  },

  spawn(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.list.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        size: Math.random() * 4 + 1,
        life: 25 + Math.random() * 10,
        maxLife: 35,
        color: color,
      });
    }
  },

  update() {
    for (const p of this.list) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life--;
      p.vx *= 0.98;
    }
    this.list = this.list.filter(p => p.life > 0);
  },

  draw() {
    const ctx = Renderer.ctx;
    for (const p of this.list) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

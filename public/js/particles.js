// =============================================
// BERT RUNNER NYC - Particles
// =============================================

const Particles = {
  list: [],
  init() { this.list = []; },

  spawn(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.list.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7 - 2,
        size: Math.random() * 3.5 + 1,
        life: 22 + Math.random() * 10,
        maxLife: 32,
        color,
      });
    }
  },

  update() {
    for (const p of this.list) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.vx *= 0.97;
      p.life--;
    }
    this.list = this.list.filter(p => p.life > 0);
  },

  draw() {
    const ctx = Renderer.ctx;
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

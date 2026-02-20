// =============================================
// BERT RUNNER NYC - Enhanced Particles
// =============================================
const Particles = {
  list: [],
  init() { this.list = []; },

  spawn(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const type = Math.random() > 0.6 ? 'sparkle' : 'circle';
      this.list.push({
        x, y, type,
        vx: (Math.random()-0.5)*8,
        vy: (Math.random()-0.5)*8 - 2,
        size: type === 'sparkle' ? Math.random()*2+1 : Math.random()*4+1.5,
        life: 20+Math.random()*15, maxLife:35,
        color, rotation: Math.random()*6.28,
      });
    }
  },

  // Continuous trail effect
  spawnTrail(x, y, color) {
    this.list.push({
      x: x + (Math.random()-0.5)*4, y,
      type: 'trail',
      vx: (Math.random()-0.5)*1.5,
      vy: Math.random()*2 + 1,
      size: Math.random()*3+2,
      life: 12+Math.random()*6, maxLife: 18,
      color, rotation: 0,
    });
  },

  update() {
    for (const p of this.list) {
      p.x += p.vx; p.y += p.vy;
      if (p.type !== 'trail') p.vy += 0.12;
      p.vx *= 0.97;
      p.size *= p.type === 'trail' ? 0.95 : 0.98;
      p.life--;
      p.rotation += 0.1;
    }
    this.list = this.list.filter(p => p.life > 0 && p.size > 0.3);
    // Cap particles
    if (this.list.length > 200) this.list = this.list.slice(-200);
  },

  draw() {
    const ctx = Renderer.ctx;
    for (const p of this.list) {
      const t = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = t;

      if (p.type === 'sparkle') {
        // 4-point star sparkle
        ctx.fillStyle = '#fff';
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i/4)*6.28;
          ctx.lineTo(Math.cos(a)*p.size*2, Math.sin(a)*p.size*2);
          const a2 = a + 6.28/8;
          ctx.lineTo(Math.cos(a2)*p.size*0.5, Math.sin(a2)*p.size*0.5);
        }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      } else if (p.type === 'trail') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = t * 0.4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.28); ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.28); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },
};

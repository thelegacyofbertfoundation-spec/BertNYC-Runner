// =============================================
// BERT RUNNER NYC - Buildings
// =============================================

const Buildings = {
  list: [],

  init() {
    this.list = [];
    for (let i = 0; i < 40; i++) {
      this.list.push(this.create(i * 3));
    }
  },

  create(z) {
    return {
      z: z,
      side: Math.random() > 0.5 ? 1 : -1,
      w: 30 + Math.random() * 60,
      h: 40 + Math.random() * 180,
      color: ['#0e1520','#121a28','#0a1018','#151d2d','#1a2235'][Math.floor(Math.random() * 5)],
      windows: Math.floor(Math.random() * 4) + 1,
      winCols: Math.floor(Math.random() * 3) + 1,
    };
  },

  update(speed) {
    for (let b of this.list) b.z -= speed;
    this.list = this.list.filter(b => b.z > -5);
    while (this.list.length < 40) {
      const farthest = Math.max(...this.list.map(b => b.z), 0);
      this.list.push(this.create(farthest + 2 + Math.random() * 3));
    }
  },

  draw() {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = W / 2;

    // Sort far to near
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const b of sorted) {
      if (b.z < 0 || b.z > 100) continue;

      // Depth factor: 0 = near, 1 = far
      const maxZ = 100;
      const t = Math.min(b.z / maxZ, 1);

      // Y position on screen
      const y = H - (H - hY) * (1 - t);

      // Scale
      const scale = 1 - t * 0.95;
      if (scale < 0.02) continue;

      const bw = b.w * scale;
      const bh = b.h * scale;
      if (bw < 3 || bh < 5) continue;

      // X position: offset from road edge
      const roadW = scale * W * 0.55;
      const sideW = roadW * 1.3;
      const bx = b.side > 0 ? cx + sideW + bw * 0.3 : cx - sideW - bw * 0.3 - bw;

      // Draw building
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, y - bh, bw, bh);

      // Windows
      if (bw > 8 && bh > 12) {
        const px = 3, py = 3;
        const ww = Math.max(2, (bw - px * 2) / b.winCols - 1);
        const wh = Math.max(2, Math.min(ww * 1.2, (bh - py * 2) / b.windows - 1));
        for (let r = 0; r < b.windows; r++) {
          for (let c = 0; c < b.winCols; c++) {
            ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255,200,50,0.6)' : 'rgba(30,40,60,0.4)';
            ctx.fillRect(bx + px + c * (ww + 1), y - bh + py + r * (wh + 1), ww, wh);
          }
        }
      }
    }
  },
};

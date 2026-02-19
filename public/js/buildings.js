// =============================================
// BERT RUNNER NYC - Buildings
// Uses Renderer.project() for positioning
// =============================================
const Buildings = {
  list: [],

  init() {
    this.list = [];
    for (let i = 0; i < 40; i++) this.list.push(this.create(CONFIG.PLAYER_Z + i * 8));
  },

  create(z) {
    return {
      z: z,
      side: Math.random() > 0.5 ? 1 : -1,
      widthW: 1.5 + Math.random() * 3,  // world units
      heightW: 3 + Math.random() * 12,
      color: ['#0e1520','#121a28','#0a1018','#151d2d','#1a2235'][Math.floor(Math.random()*5)],
      winRows: Math.floor(Math.random()*4)+1,
      winCols: Math.floor(Math.random()*3)+1,
      offset: 1.8 + Math.random() * 1.5, // how far from road edge (in lane units)
    };
  },

  update(speed) {
    for (let b of this.list) b.z -= speed;
    this.list = this.list.filter(b => b.z > CONFIG.DESPAWN_Z);
    while (this.list.length < 40) {
      const farthest = Math.max(...this.list.map(b => b.z), CONFIG.PLAYER_Z);
      this.list.push(this.create(farthest + 5 + Math.random() * 8));
    }
  },

  draw() {
    const ctx = Renderer.ctx;
    // Sort far to near
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const b of sorted) {
      if (b.z < 1 || b.z > 300) continue;

      // Project the building base position
      const lanePos = b.side * b.offset;
      const p = Renderer.project(lanePos, b.z, 0);
      if (!p || p.scale < 0.01) continue;

      const bw = Renderer.worldToPixels(b.widthW, b.z);
      const bh = Renderer.worldToPixels(b.heightW, b.z);
      if (bw < 3 || bh < 5) continue;

      const bx = p.x - bw / 2;
      const by = p.y - bh;

      // Building body
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, bw, bh);

      // Windows
      if (bw > 8 && bh > 12) {
        const px = bw * 0.1, py = bh * 0.06;
        const ww = Math.max(2, (bw - px*2) / b.winCols - 1);
        const wh = Math.max(2, Math.min(ww*1.3, (bh - py*2) / b.winRows - 1));
        for (let r = 0; r < b.winRows; r++) {
          for (let c = 0; c < b.winCols; c++) {
            ctx.fillStyle = Math.random() > 0.4 ? 'rgba(255,200,50,0.6)' : 'rgba(30,40,60,0.4)';
            ctx.fillRect(bx + px + c*(ww+1), by + py + r*(wh+1), ww, wh);
          }
        }
      }
    }
  },
};

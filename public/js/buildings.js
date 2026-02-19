// =============================================
// BERT RUNNER NYC - Buildings / Environment
// =============================================

const Buildings = {
  list: [],
  initialized: false,

  init() {
    this.list = [];
    for (let i = 0; i < 30; i++) {
      this.list.push(this.create(i * 4));
    }
    this.initialized = true;
  },

  create(z) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const roadEdge = CONFIG.LANE_WIDTH * 1.5 + 2.5;
    return {
      x: side * (roadEdge + Math.random() * 3),
      z: z,
      w: 2 + Math.random() * 3,
      h: 4 + Math.random() * 16,
      d: 2 + Math.random() * 3,
      color: this.randomColor(),
      windows: Math.floor(Math.random() * 5) + 2,
      windowCols: Math.floor(Math.random() * 3) + 2,
      side: side,
    };
  },

  randomColor() {
    const colors = ['#1a2530','#243447','#1C2833','#2C3E50','#34495E','#1a1a30','#252540'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  update(speed) {
    // Move buildings toward camera
    for (let b of this.list) {
      b.z -= speed * 10;
    }
    // Remove passed buildings, add new ones
    this.list = this.list.filter(b => b.z > -5);
    while (this.list.length < 30) {
      const furthest = Math.max(...this.list.map(b => b.z), 0);
      this.list.push(this.create(furthest + 3 + Math.random() * 3));
    }
  },

  draw() {
    const ctx = Renderer.ctx;

    // Sort by z (far first)
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const b of sorted) {
      if (b.z < 0 || b.z > 50) continue;

      const front = Renderer.project(b.x, 0, b.z);
      const back = Renderer.project(b.x, 0, b.z + b.d);
      if (!front) continue;

      const fW = Renderer.projectWidth(b.w, b.z);
      const fH = Renderer.projectHeight(b.h, b.z);
      const bW = back ? Renderer.projectWidth(b.w, b.z + b.d) : fW * 0.8;
      const bH = back ? Renderer.projectHeight(b.h, b.z + b.d) : fH * 0.8;

      if (fW < 2) continue;

      // Front face
      ctx.fillStyle = b.color;
      ctx.fillRect(front.x - fW/2, front.y - fH, fW, fH);

      // Side face (visible side)
      if (back) {
        const sideColor = Renderer.darken(b.color, 15);
        ctx.fillStyle = sideColor;

        if (b.side > 0) {
          // Right side building - show left face
          ctx.beginPath();
          ctx.moveTo(front.x - fW/2, front.y);
          ctx.lineTo(front.x - fW/2, front.y - fH);
          ctx.lineTo(back.x - bW/2, back.y - bH);
          ctx.lineTo(back.x - bW/2, back.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Left side building - show right face
          ctx.beginPath();
          ctx.moveTo(front.x + fW/2, front.y);
          ctx.lineTo(front.x + fW/2, front.y - fH);
          ctx.lineTo(back.x + bW/2, back.y - bH);
          ctx.lineTo(back.x + bW/2, back.y);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Windows
      this.drawWindows(front.x - fW/2, front.y - fH, fW, fH, b.windows, b.windowCols, b.z);
    }
  },

  drawWindows(bx, by, bw, bh, rows, cols, z) {
    const ctx = Renderer.ctx;
    if (bw < 10 || bh < 15) return;

    const padX = bw * 0.12;
    const padY = bh * 0.06;
    const ww = (bw - padX * 2) / cols - 2;
    const wh = (bh - padY * 2) / rows - 2;
    if (ww < 2 || wh < 2) return;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Random lit/dark
        const lit = Math.random() > 0.35;
        ctx.fillStyle = lit ? 'rgba(255,200,50,0.7)' : 'rgba(30,40,60,0.5)';
        const wx = bx + padX + c * (ww + 2);
        const wy = by + padY + r * (wh + 2);
        ctx.fillRect(wx, wy, ww, wh);
      }
    }
  },
};

// =============================================
// BERT RUNNER NYC - Rich City Environment
// =============================================
const Buildings = {
  list: [],
  streetItems: [], // lamp posts, trash cans, etc

  init() {
    this.list = [];
    this.streetItems = [];
    for (let i = 0; i < 50; i++) this.list.push(this.createBuilding(CONFIG.PLAYER_Z + i * 6));
    for (let i = 0; i < 30; i++) this.streetItems.push(this.createStreetItem(CONFIG.PLAYER_Z + i * 10));
  },

  createBuilding(z) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const style = Math.floor(Math.random() * 5); // 0=brick, 1=glass, 2=brownstone, 3=deli, 4=tall
    const colors = [
      { main:'#2B1810', trim:'#8B4513', win:'rgba(255,200,80,0.5)' },  // brick
      { main:'#1a2a3a', trim:'#3a5a7a', win:'rgba(150,200,255,0.4)' }, // glass
      { main:'#3B2410', trim:'#6B4420', win:'rgba(255,180,60,0.5)' },  // brownstone
      { main:'#1C2833', trim:'#2E4053', win:'rgba(255,220,100,0.6)' }, // deli/shop
      { main:'#151520', trim:'#252535', win:'rgba(200,220,255,0.3)' }, // modern tall
    ][style];

    return {
      z, side,
      offset: 1.6 + Math.random() * 1.2,
      w: 1.2 + Math.random() * 2.5,
      h: style === 4 ? 8 + Math.random() * 15 : 3 + Math.random() * 8,
      style, colors,
      winRows: Math.floor(Math.random() * 6) + 2,
      winCols: Math.floor(Math.random() * 4) + 2,
      hasSign: style === 3 || Math.random() > 0.65,
      signColor: ['#FF0040','#00DDFF','#FFAA00','#FF00FF','#00FF88'][Math.floor(Math.random()*5)],
      signText: ['PIZZA','DELI','24HR','BAR','NYC','CAFE','SHOP','$$$'][Math.floor(Math.random()*8)],
      hasWaterTower: style === 4 && Math.random() > 0.5,
      hasAC: Math.random() > 0.5,
      hasFireEscape: style < 3 && Math.random() > 0.4,
      hasAwning: style === 3,
      awningColor: ['#CC2222','#2255AA','#22AA44','#AA8822'][Math.floor(Math.random()*4)],
    };
  },

  createStreetItem(z) {
    return {
      z,
      side: Math.random() > 0.5 ? 1 : -1,
      type: ['lamppost','trashcan','bench','newsstand'][Math.floor(Math.random()*4)],
      offset: 1.35,
    };
  },

  update(speed) {
    for (let b of this.list) b.z -= speed;
    for (let s of this.streetItems) s.z -= speed;
    this.list = this.list.filter(b => b.z > CONFIG.DESPAWN_Z);
    this.streetItems = this.streetItems.filter(s => s.z > CONFIG.DESPAWN_Z);
    while (this.list.length < 50) {
      const f = Math.max(...this.list.map(b => b.z), CONFIG.PLAYER_Z);
      this.list.push(this.createBuilding(f + 3 + Math.random() * 6));
    }
    while (this.streetItems.length < 30) {
      const f = Math.max(...this.streetItems.map(s => s.z), CONFIG.PLAYER_Z);
      this.streetItems.push(this.createStreetItem(f + 6 + Math.random() * 10));
    }
  },

  draw() {
    const ctx = Renderer.ctx;
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const b of sorted) {
      if (b.z < 1 || b.z > 280) continue;
      const fog = Renderer.fogAt(b.z);
      if (fog > 0.95) continue;

      const p = Renderer.project(b.side * b.offset, b.z, 0);
      if (!p || p.scale < 0.008) continue;

      const bw = Renderer.worldToPixels(b.w, b.z);
      const bh = Renderer.worldToPixels(b.h, b.z);
      if (bw < 3 || bh < 4) continue;

      const bx = p.x - bw / 2;
      const by = p.y - bh;
      const alpha = 1 - fog;

      // Building body
      ctx.fillStyle = Renderer.fogColor(b.colors.main, b.z);
      ctx.fillRect(bx, by, bw, bh);

      // Trim/edge
      ctx.fillStyle = Renderer.fogColor(b.colors.trim, b.z);
      ctx.fillRect(bx, by, bw, Math.max(1, bh * 0.04));      // top trim
      ctx.fillRect(bx, p.y - bh * 0.02, bw, Math.max(1, bh * 0.02)); // bottom trim

      // Windows
      if (bw > 6 && bh > 8) {
        const px = bw * 0.08, py = bh * 0.08;
        const ww = Math.max(1.5, (bw - px*2) / b.winCols - 1.5);
        const wh = Math.max(1.5, Math.min(ww*1.4, (bh - py*2) / b.winRows - 1.5));
        for (let r = 0; r < b.winRows; r++) {
          for (let c = 0; c < b.winCols; c++) {
            const lit = Math.random() > 0.35;
            ctx.fillStyle = lit ?
              `rgba(255,${150+Math.random()*80},${40+Math.random()*60},${alpha * 0.6})` :
              `rgba(20,25,40,${alpha * 0.5})`;
            ctx.fillRect(bx + px + c*(ww+1.5), by + py + r*(wh+1.5), ww, wh);
          }
        }
      }

      // Fire escape
      if (b.hasFireEscape && bw > 10 && alpha > 0.3) {
        ctx.strokeStyle = `rgba(80,80,80,${alpha * 0.5})`;
        ctx.lineWidth = 1;
        const feX = b.side > 0 ? bx + 2 : bx + bw - 6;
        for (let fy = by + bh * 0.15; fy < p.y; fy += bh / b.winRows) {
          ctx.strokeRect(feX, fy, 4, 2);
          ctx.beginPath(); ctx.moveTo(feX + 2, fy + 2); ctx.lineTo(feX + 2, fy + bh/b.winRows - 2); ctx.stroke();
        }
      }

      // Awning
      if (b.hasAwning && alpha > 0.3) {
        ctx.fillStyle = `rgba(${this.hexToRgb(b.awningColor)},${alpha * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(bx - 2, p.y - bh * 0.12);
        ctx.lineTo(bx + bw + 2, p.y - bh * 0.12);
        ctx.lineTo(bx + bw + bw * 0.15, p.y - bh * 0.04);
        ctx.lineTo(bx - bw * 0.15, p.y - bh * 0.04);
        ctx.closePath(); ctx.fill();
      }

      // Neon sign
      if (b.hasSign && bw > 10 && alpha > 0.3) {
        const sy = by + bh * 0.2;
        const sh = Math.max(6, bh * 0.08);
        // Glow
        ctx.shadowColor = b.signColor;
        ctx.shadowBlur = 8 * alpha;
        ctx.fillStyle = b.signColor + Math.floor(alpha * 200).toString(16).padStart(2, '0');
        ctx.fillRect(bx + bw*0.1, sy, bw*0.8, sh);
        ctx.shadowBlur = 0;
        // Text
        if (sh > 5) {
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.font = `bold ${Math.max(5, sh * 0.7)}px Rubik`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(b.signText, bx + bw/2, sy + sh/2);
        }
      }

      // Water tower on top
      if (b.hasWaterTower && bw > 12 && alpha > 0.3) {
        const tw = bw * 0.25, th = bh * 0.08;
        ctx.fillStyle = `rgba(80,60,40,${alpha})`;
        // Legs
        ctx.fillRect(bx + bw*0.3, by - th*0.5, 1, th*0.5);
        ctx.fillRect(bx + bw*0.65, by - th*0.5, 1, th*0.5);
        // Tank
        ctx.fillRect(bx + bw/2 - tw/2, by - th, tw, th * 0.6);
        // Roof
        ctx.beginPath();
        ctx.moveTo(bx + bw/2 - tw/2, by - th);
        ctx.lineTo(bx + bw/2, by - th - th*0.4);
        ctx.lineTo(bx + bw/2 + tw/2, by - th);
        ctx.closePath(); ctx.fill();
      }

      // AC units
      if (b.hasAC && bw > 10 && alpha > 0.3) {
        ctx.fillStyle = `rgba(60,70,80,${alpha * 0.6})`;
        const acy = by + bh * (0.3 + Math.random() * 0.4);
        const acx = b.side > 0 ? bx + bw - 4 : bx;
        ctx.fillRect(acx, acy, 4, 3);
      }
    }

    // Street items
    this.drawStreetItems();
  },

  drawStreetItems() {
    const ctx = Renderer.ctx;
    for (const s of this.streetItems) {
      if (s.z < 2 || s.z > 150) continue;
      const fog = Renderer.fogAt(s.z);
      if (fog > 0.85) continue;

      const p = Renderer.project(s.side * s.offset, s.z, 0);
      if (!p || p.scale < 0.02) continue;
      const alpha = 1 - fog;
      const sz = Renderer.worldToPixels(1, s.z);

      if (s.type === 'lamppost') {
        // Pole
        ctx.fillStyle = `rgba(60,60,60,${alpha})`;
        ctx.fillRect(p.x - 1, p.y - sz * 3, 2, sz * 3);
        // Lamp
        ctx.fillStyle = `rgba(255,220,100,${alpha * 0.8})`;
        ctx.beginPath(); ctx.arc(p.x, p.y - sz * 3, sz * 0.4, 0, 6.28); ctx.fill();
        // Light cone
        ctx.fillStyle = `rgba(255,220,100,${alpha * 0.05})`;
        ctx.beginPath();
        ctx.moveTo(p.x - sz*0.3, p.y - sz*3);
        ctx.lineTo(p.x - sz*1.5, p.y);
        ctx.lineTo(p.x + sz*1.5, p.y);
        ctx.lineTo(p.x + sz*0.3, p.y - sz*3);
        ctx.closePath(); ctx.fill();
      } else if (s.type === 'trashcan') {
        ctx.fillStyle = `rgba(50,60,50,${alpha})`;
        ctx.fillRect(p.x - sz*0.3, p.y - sz*0.6, sz*0.6, sz*0.6);
        ctx.fillStyle = `rgba(30,40,30,${alpha})`;
        ctx.fillRect(p.x - sz*0.35, p.y - sz*0.65, sz*0.7, sz*0.1);
      }
    }
  },

  hexToRgb(hex) {
    const c = parseInt(hex.replace('#',''), 16);
    return `${c>>16},${(c>>8)&0xff},${c&0xff}`;
  },
};

// =============================================
// BERT RUNNER NYC - Detailed Road
// =============================================
const Track = {
  // Pre-generate road details
  details: null,

  initDetails() {
    this.details = [];
    for (let i = 0; i < 50; i++) {
      this.details.push({
        type: ['manhole','crosswalk','puddle','grate','patch'][Math.floor(Math.random()*5)],
        lane: Math.floor(Math.random()*3) - 1,
        offset: Math.random() * 200,
      });
    }
  },

  draw(distance) {
    if (!this.details) this.initDetails();
    const ctx = Renderer.ctx;
    const W = Renderer.W, H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = Renderer.cx;

    const farZ = 300, nearZ = CONFIG.PLAYER_Z * 0.4;
    const steps = 120;
    const dz = (farZ - nearZ) / steps;

    for (let i = 0; i < steps; i++) {
      const z1 = farZ - i * dz;
      const z2 = farZ - (i + 1) * dz;

      const p1 = Renderer.project(0, z1, 0);
      const p2 = Renderer.project(0, z2, 0);
      if (!p1 || !p2) continue;
      if (p1.y < hY - 5 && p2.y < hY - 5) continue;

      const rw1 = p1.roadHW, rw2 = p2.roadHW;
      const sw1 = rw1 * 1.4, sw2 = rw2 * 1.4;
      const fog = Renderer.fogAt(z1);

      // ===== SIDEWALK =====
      const seg = Math.floor(distance * 3 + i * 0.5);
      const sideBase = seg % 2 === 0 ? '#555555' : '#4F4F4F';
      ctx.fillStyle = Renderer.fogColor(sideBase, z1);
      ctx.beginPath();
      ctx.moveTo(cx-sw1, p1.y); ctx.lineTo(cx+sw1, p1.y);
      ctx.lineTo(cx+sw2, p2.y); ctx.lineTo(cx-sw2, p2.y);
      ctx.closePath(); ctx.fill();

      // Sidewalk texture lines
      if (i % 6 === 0 && p1.scale > 0.03) {
        ctx.strokeStyle = `rgba(80,80,80,${(1-fog)*0.4})`;
        ctx.lineWidth = Math.max(0.3, p1.scale * 2);
        ctx.beginPath(); ctx.moveTo(cx-sw1, p1.y); ctx.lineTo(cx+sw1, p1.y); ctx.stroke();
      }

      // ===== ROAD =====
      const roadBase = seg % 2 === 0 ? '#333333' : '#303030';
      ctx.fillStyle = Renderer.fogColor(roadBase, z1);
      ctx.beginPath();
      ctx.moveTo(cx-rw1, p1.y); ctx.lineTo(cx+rw1, p1.y);
      ctx.lineTo(cx+rw2, p2.y); ctx.lineTo(cx-rw2, p2.y);
      ctx.closePath(); ctx.fill();

      // ===== ROAD TEXTURE (subtle asphalt) =====
      if (i % 2 === 0 && p1.scale > 0.05 && fog < 0.7) {
        ctx.fillStyle = `rgba(60,60,60,${(1-fog)*0.15})`;
        const texY = (p1.y + p2.y) / 2;
        for (let tx = 0; tx < 5; tx++) {
          const txX = cx - rw1 + Math.random() * rw1 * 2;
          ctx.fillRect(txX, texY, Math.random()*3+1, 1);
        }
      }

      // ===== CURB =====
      if (p1.scale > 0.02) {
        const curbAlpha = (1 - fog) * 0.6;
        // Curb highlight (raised edge)
        ctx.strokeStyle = `rgba(140,140,130,${curbAlpha})`;
        ctx.lineWidth = Math.max(0.5, p1.scale * 4);
        ctx.beginPath(); ctx.moveTo(cx-rw1, p1.y); ctx.lineTo(cx-rw2, p2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+rw1, p1.y); ctx.lineTo(cx+rw2, p2.y); ctx.stroke();
        // Curb shadow
        ctx.strokeStyle = `rgba(20,20,20,${curbAlpha * 0.5})`;
        ctx.lineWidth = Math.max(0.3, p1.scale * 2);
        ctx.beginPath(); ctx.moveTo(cx-rw1+1, p1.y+1); ctx.lineTo(cx-rw2+1, p2.y+1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+rw1-1, p1.y+1); ctx.lineTo(cx+rw2-1, p2.y+1); ctx.stroke();
      }

      // ===== LANE DASHES =====
      const dashSeg = Math.floor(distance * 5 + i * 0.6);
      if (dashSeg % 3 < 2 && rw1 > 8 && fog < 0.8) {
        const alpha = Math.min(1, p2.scale * 6) * (1 - fog);
        ctx.fillStyle = `rgba(255,215,0,${alpha * 0.65})`;
        for (let l = -1; l <= 1; l += 2) {
          const x1 = cx + l * rw1 / 3;
          const x2 = cx + l * rw2 / 3;
          const dw1 = Math.max(0.5, p1.scale * 5);
          const dw2 = Math.max(0.5, p2.scale * 5);
          ctx.beginPath();
          ctx.moveTo(x1-dw1/2, p1.y); ctx.lineTo(x1+dw1/2, p1.y);
          ctx.lineTo(x2+dw2/2, p2.y); ctx.lineTo(x2-dw2/2, p2.y);
          ctx.closePath(); ctx.fill();
        }
      }

      // ===== ROAD DETAILS (crosswalks, manholes) =====
      if (i % 20 === 0 && p1.scale > 0.04 && fog < 0.6) {
        const detIdx = Math.floor(distance + i) % this.details.length;
        const det = this.details[detIdx];
        this.drawDetail(det, cx, p1.y, p2.y, rw1, rw2, p1.scale, fog);
      }
    }

    // Center line (double yellow)
    this.drawCenterLine(distance);

    // Fill ground below
    const pN = Renderer.project(0, nearZ, 0);
    if (pN && pN.y < H) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, pN.y, W, H - pN.y);
    }
  },

  drawDetail(det, cx, y1, y2, rw1, rw2, scale, fog) {
    const ctx = Renderer.ctx;
    const alpha = (1 - fog) * 0.4;

    if (det.type === 'crosswalk') {
      // White stripes across road
      ctx.fillStyle = `rgba(220,220,210,${alpha})`;
      const stripes = 5;
      const sw = rw1 * 0.6;
      const sh = Math.max(1, scale * 3);
      for (let s = 0; s < stripes; s++) {
        const sy = y1 + s * sh * 2.5;
        ctx.fillRect(cx - sw, sy, sw * 2, sh);
      }
    } else if (det.type === 'manhole') {
      const mx = cx + det.lane * rw1 / 3;
      const mr = Math.max(2, scale * 30);
      ctx.fillStyle = `rgba(50,50,50,${alpha})`;
      ctx.beginPath(); ctx.arc(mx, (y1+y2)/2, mr, 0, 6.28); ctx.fill();
      ctx.strokeStyle = `rgba(80,80,80,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mx, (y1+y2)/2, mr, 0, 6.28); ctx.stroke();
      // Cross lines
      ctx.beginPath();
      ctx.moveTo(mx - mr*0.5, (y1+y2)/2); ctx.lineTo(mx + mr*0.5, (y1+y2)/2);
      ctx.moveTo(mx, (y1+y2)/2 - mr*0.5); ctx.lineTo(mx, (y1+y2)/2 + mr*0.5);
      ctx.stroke();
    } else if (det.type === 'puddle') {
      const px = cx + det.lane * rw1 / 3;
      const pr = Math.max(3, scale * 25);
      ctx.fillStyle = `rgba(40,50,80,${alpha * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(px, (y1+y2)/2, pr, pr * 0.3, 0, 0, 6.28);
      ctx.fill();
      // Reflection highlight
      ctx.fillStyle = `rgba(100,120,180,${alpha * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(px - pr*0.2, (y1+y2)/2 - pr*0.05, pr*0.4, pr*0.1, 0, 0, 6.28);
      ctx.fill();
    }
  },

  drawCenterLine(distance) {
    // Subtle center road marking
  },
};

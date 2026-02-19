// =============================================
// BERT RUNNER NYC - Track / Road
// Uses Renderer.project() for consistency
// =============================================
const Track = {
  draw(distance) {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = Renderer.cx;

    // Draw road segments from far to near
    const farZ = 300;
    const nearZ = CONFIG.PLAYER_Z * 0.5;
    const steps = 100;
    const dz = (farZ - nearZ) / steps;

    for (let i = 0; i < steps; i++) {
      const z1 = farZ - i * dz;
      const z2 = farZ - (i + 1) * dz;

      const p1 = Renderer.project(0, z1, 0);
      const p2 = Renderer.project(0, z2, 0);
      if (!p1 || !p2) continue;
      if (p1.y < hY - 5 && p2.y < hY - 5) continue;

      const rw1 = p1.roadHW;
      const rw2 = p2.roadHW;
      const sw1 = rw1 * 1.35; // sidewalk wider
      const sw2 = rw2 * 1.35;

      // Alternate segment shading based on distance
      const seg = Math.floor(distance * 3 + i * 0.5);

      // Sidewalk
      ctx.fillStyle = seg % 2 === 0 ? '#484848' : '#434343';
      ctx.beginPath();
      ctx.moveTo(cx - sw1, p1.y); ctx.lineTo(cx + sw1, p1.y);
      ctx.lineTo(cx + sw2, p2.y); ctx.lineTo(cx - sw2, p2.y);
      ctx.closePath(); ctx.fill();

      // Road
      ctx.fillStyle = seg % 2 === 0 ? '#2c2c2c' : '#292929';
      ctx.beginPath();
      ctx.moveTo(cx - rw1, p1.y); ctx.lineTo(cx + rw1, p1.y);
      ctx.lineTo(cx + rw2, p2.y); ctx.lineTo(cx - rw2, p2.y);
      ctx.closePath(); ctx.fill();

      // Curb lines
      if (i % 4 === 0 && rw1 > 5) {
        ctx.strokeStyle = `rgba(100,100,100,${Math.min(1, p2.scale * 5)})`;
        ctx.lineWidth = Math.max(0.5, p2.scale * 3);
        ctx.beginPath(); ctx.moveTo(cx - rw1, p1.y); ctx.lineTo(cx - rw2, p2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + rw1, p1.y); ctx.lineTo(cx + rw2, p2.y); ctx.stroke();
      }

      // Lane dashes (2 dividers for 3 lanes)
      const dashSeg = Math.floor(distance * 5 + i * 0.6);
      if (dashSeg % 3 < 2 && rw1 > 8) {
        const alpha = Math.min(1, p2.scale * 6);
        ctx.fillStyle = `rgba(255,210,0,${alpha * 0.7})`;
        for (let l = -1; l <= 1; l += 2) {
          const x1a = cx + l * rw1 / 3;
          const x1b = cx + l * rw2 / 3;
          const dw1 = Math.max(0.5, p1.scale * 4);
          const dw2 = Math.max(0.5, p2.scale * 4);
          ctx.beginPath();
          ctx.moveTo(x1a - dw1/2, p1.y); ctx.lineTo(x1a + dw1/2, p1.y);
          ctx.lineTo(x1b + dw2/2, p2.y); ctx.lineTo(x1b - dw2/2, p2.y);
          ctx.closePath(); ctx.fill();
        }
      }
    }

    // Fill ground below nearest road segment
    const pNear = Renderer.project(0, nearZ, 0);
    if (pNear && pNear.y < H) {
      ctx.fillStyle = '#2c2c2c';
      ctx.fillRect(0, pNear.y, W, H - pNear.y);
    }
  },
};

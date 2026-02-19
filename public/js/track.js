// =============================================
// BERT RUNNER NYC - Track / Road
// =============================================

const Track = {
  draw(distance) {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const hY = Renderer.horizonY;
    const cx = W / 2;

    const segments = 80;
    const segH = (H - hY) / segments;

    for (let i = 0; i < segments; i++) {
      const y = H - i * segH;
      const yNext = H - (i + 1) * segH;
      const t = i / segments; // 0=near, 1=far

      // Road width narrows toward horizon
      const rw = (1 - t * 0.95) * W * 0.55;
      const rwNext = (1 - (i + 1) / segments * 0.95) * W * 0.55;

      // Sidewalk (wider than road)
      const sw = rw * 1.3;
      const swNext = rwNext * 1.3;
      const sideColor = ((Math.floor(distance * 2 + i * 0.4)) % 2 === 0) ? '#484848' : '#424242';
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.moveTo(cx - sw, y);
      ctx.lineTo(cx + sw, y);
      ctx.lineTo(cx + swNext, yNext);
      ctx.lineTo(cx - swNext, yNext);
      ctx.closePath();
      ctx.fill();

      // Road surface
      const roadColor = ((Math.floor(distance * 2 + i * 0.4)) % 2 === 0) ? '#2c2c2c' : '#282828';
      ctx.fillStyle = roadColor;
      ctx.beginPath();
      ctx.moveTo(cx - rw, y);
      ctx.lineTo(cx + rw, y);
      ctx.lineTo(cx + rwNext, yNext);
      ctx.lineTo(cx - rwNext, yNext);
      ctx.closePath();
      ctx.fill();

      // Curb lines
      if (i % 3 === 0 && rw > 10) {
        ctx.strokeStyle = 'rgba(100,100,100,0.5)';
        ctx.lineWidth = Math.max(1, (1 - t) * 2);
        ctx.beginPath(); ctx.moveTo(cx - rw, y); ctx.lineTo(cx - rwNext, yNext); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + rw, y); ctx.lineTo(cx + rwNext, yNext); ctx.stroke();
      }

      // Lane dashes (2 lines dividing 3 lanes)
      const dashPhase = Math.floor(distance * 4 + i * 0.5) % 4;
      if (dashPhase < 2 && rw > 15) {
        ctx.fillStyle = `rgba(255,210,0,${0.7 * (1 - t)})`;
        for (let l = -1; l <= 1; l += 2) {
          const lx1 = cx + l * rw / 3;
          const lx2 = cx + l * rwNext / 3;
          const dw = Math.max(1, (1 - t) * 3);
          ctx.beginPath();
          ctx.moveTo(lx1 - dw / 2, y);
          ctx.lineTo(lx1 + dw / 2, y);
          ctx.lineTo(lx2 + dw / 2, yNext);
          ctx.lineTo(lx2 - dw / 2, yNext);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Fill below-road area
    ctx.fillStyle = '#2c2c2c';
    ctx.fillRect(0, H - 2, W, 4);
  },
};

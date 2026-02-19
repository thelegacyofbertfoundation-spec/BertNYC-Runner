// =============================================
// BERT RUNNER NYC - Track / Road Renderer
// =============================================

const Track = {
  // Draw the 3D road with perspective
  draw(distance) {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const vanishX = W / 2;
    const vanishY = Renderer.vanishY;

    // Road segments from far to near
    const segments = 60;
    const segLen = CONFIG.ROAD_LENGTH / segments;

    for (let i = segments - 1; i >= 0; i--) {
      const z1 = (i + 1) * segLen * 0.3 + 1;
      const z0 = i * segLen * 0.3 + 1;

      // Road edges (3 lanes wide)
      const roadHalfW = CONFIG.LANE_WIDTH * 1.5;
      const sideW = 2.0; // sidewalk width

      const lf0 = Renderer.project(-roadHalfW - sideW, 0, z0);
      const rf0 = Renderer.project(roadHalfW + sideW, 0, z0);
      const lf1 = Renderer.project(-roadHalfW - sideW, 0, z1);
      const rf1 = Renderer.project(roadHalfW + sideW, 0, z1);

      const rl0 = Renderer.project(-roadHalfW, 0, z0);
      const rr0 = Renderer.project(roadHalfW, 0, z0);
      const rl1 = Renderer.project(-roadHalfW, 0, z1);
      const rr1 = Renderer.project(roadHalfW, 0, z1);

      if (!lf0 || !rf0 || !lf1 || !rf1) continue;

      // Sidewalk (left)
      ctx.fillStyle = i % 2 === 0 ? '#555555' : '#505050';
      ctx.beginPath();
      ctx.moveTo(lf0.x, lf0.y);
      ctx.lineTo(rl0.x, rl0.y);
      ctx.lineTo(rl1.x, rl1.y);
      ctx.lineTo(lf1.x, lf1.y);
      ctx.closePath();
      ctx.fill();

      // Sidewalk (right)
      ctx.beginPath();
      ctx.moveTo(rr0.x, rr0.y);
      ctx.lineTo(rf0.x, rf0.y);
      ctx.lineTo(rf1.x, rf1.y);
      ctx.lineTo(rr1.x, rr1.y);
      ctx.closePath();
      ctx.fill();

      // Road surface
      const roadOffset = Math.floor(distance * 10 + i) % 2;
      ctx.fillStyle = roadOffset === 0 ? '#2a2a2a' : '#282828';
      ctx.beginPath();
      ctx.moveTo(rl0.x, rl0.y);
      ctx.lineTo(rr0.x, rr0.y);
      ctx.lineTo(rr1.x, rr1.y);
      ctx.lineTo(rl1.x, rl1.y);
      ctx.closePath();
      ctx.fill();

      // Curb highlight
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rl0.x, rl0.y);
      ctx.lineTo(rl1.x, rl1.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rr0.x, rr0.y);
      ctx.lineTo(rr1.x, rr1.y);
      ctx.stroke();
    }

    // Lane markings (dashed)
    this.drawLaneMarkings(distance);

    // Fill below road to screen bottom
    const groundP = Renderer.project(0, 0, 1);
    if (groundP) {
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, groundP.y, W, H - groundP.y);
    }
  },

  drawLaneMarkings(distance) {
    const ctx = Renderer.ctx;
    const dashLen = 2.0;
    const gapLen = 2.0;
    const totalLen = dashLen + gapLen;

    for (let lane = 0; lane < 2; lane++) {
      const laneX = (lane - 0.5) * CONFIG.LANE_WIDTH;

      for (let d = 0; d < CONFIG.ROAD_LENGTH * 0.3; d += totalLen) {
        const worldZ = d - (distance * 10 % totalLen);
        if (worldZ < 0) continue;

        const z0 = worldZ + 1;
        const z1 = worldZ + dashLen + 1;

        const p0 = Renderer.project(laneX, 0.01, z0);
        const p1 = Renderer.project(laneX, 0.01, z1);
        if (!p0 || !p1) continue;

        const w0 = Renderer.projectWidth(0.15, z0);
        const w1 = Renderer.projectWidth(0.15, z1);

        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = Math.max(0, 1 - z0 / 20);
        ctx.beginPath();
        ctx.moveTo(p0.x - w0/2, p0.y);
        ctx.lineTo(p0.x + w0/2, p0.y);
        ctx.lineTo(p1.x + w1/2, p1.y);
        ctx.lineTo(p1.x - w1/2, p1.y);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  },
};

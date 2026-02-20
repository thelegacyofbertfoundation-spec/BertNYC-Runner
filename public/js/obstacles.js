// =============================================
// BERT RUNNER NYC - 3D Drawn Obstacles
// Each obstacle projects FRONT and BACK edges
// to create visible top and side faces
// =============================================
const Obstacles = {
  list: [],
  nextSpawnDist: 50,

  init() { this.list = []; this.nextSpawnDist = 50; },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;
    const lane = Math.floor(Math.random()*3)-1;
    const type = CONFIG.OBSTACLES[Math.floor(Math.random()*CONFIG.OBSTACLES.length)];
    // depthZ = how long the object is in world Z units
    const depths = { taxi:4, bus:6, barrier:1.5, cone:1, hotdog:3, newsstand:3 };
    this.list.push({
      z: CONFIG.SPAWN_Z, lane, type: type.type,
      w: type.w, h: type.h, jumpable: type.jumpable,
      depthZ: depths[type.type] || 3,
    });

    if (Math.random() < 0.2 && State.game.speed > CONFIG.INITIAL_SPEED * 1.5) {
      let l2 = lane; while(l2===lane) l2=Math.floor(Math.random()*3)-1;
      const t2 = CONFIG.OBSTACLES[Math.floor(Math.random()*CONFIG.OBSTACLES.length)];
      this.list.push({
        z: CONFIG.SPAWN_Z+Math.random()*6, lane:l2, type:t2.type,
        w:t2.w, h:t2.h, jumpable:t2.jumpable,
        depthZ: depths[t2.type] || 3,
      });
    }

    const sf = (State.game.speed-CONFIG.INITIAL_SPEED)/(CONFIG.MAX_SPEED-CONFIG.INITIAL_SPEED);
    const gap = CONFIG.OBSTACLE_MAX_GAP-(CONFIG.OBSTACLE_MAX_GAP-CONFIG.OBSTACLE_MIN_GAP)*sf*0.4;
    this.nextSpawnDist = distance + gap*(0.7+Math.random()*0.6);
  },

  update(speed) {
    for (let o of this.list) o.z -= speed;
    this.list = this.list.filter(o => o.z > CONFIG.DESPAWN_Z);
  },

  draw() {
    const ctx = Renderer.ctx;
    const sorted = [...this.list].sort((a,b) => b.z - a.z);

    for (const o of sorted) {
      if (o.z < 0 || o.z > CONFIG.SPAWN_Z+10) continue;
      const fog = Renderer.fogAt(o.z);
      if (fog > 0.88) continue;

      // Project FRONT edge (near side, facing us)
      const pF = Renderer.project(o.lane, o.z, 0);
      // Project BACK edge (far side)
      const pB = Renderer.project(o.lane, o.z + o.depthZ, 0);
      if (!pF || !pB || pF.scale < 0.008) continue;

      // Widths at front and back depth
      const wF = Renderer.worldToPixels(o.w, o.z);
      const wB = Renderer.worldToPixels(o.w, o.z + o.depthZ);
      // Heights at front and back
      const hF = Renderer.worldToPixels(o.h, o.z);
      const hB = Renderer.worldToPixels(o.h, o.z + o.depthZ);

      if (wF < 2 || hF < 2) continue;

      const a = 1 - fog;
      ctx.globalAlpha = a;

      // Shadow on ground (trapezoid)
      ctx.fillStyle = `rgba(0,0,0,${a * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(pF.x - wF*0.5, pF.y);
      ctx.lineTo(pF.x + wF*0.5, pF.y);
      ctx.lineTo(pB.x + wB*0.5, pB.y);
      ctx.lineTo(pB.x - wB*0.5, pB.y);
      ctx.closePath(); ctx.fill();

      // Draw 3D object based on type
      const info = { pF, pB, wF, wB, hF, hB, fog };
      switch(o.type) {
        case 'taxi': this.drawTaxi3D(ctx, info); break;
        case 'bus': this.drawBus3D(ctx, info); break;
        case 'barrier': this.drawBarrier3D(ctx, info); break;
        case 'cone': this.drawCone3D(ctx, info); break;
        case 'hotdog': this.drawCart3D(ctx, info); break;
        case 'newsstand': this.drawStand3D(ctx, info); break;
      }

      ctx.globalAlpha = 1;
      o._x = pF.x; o._y = pF.y - hF/2; o._w = wF; o._h = hF;
    }
  },

  // =============================================
  // 3D TAXI - the star obstacle
  // =============================================
  drawTaxi3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;
    const bodyH_F = hF * 0.55, cabH_F = hF * 0.38;
    const bodyH_B = hB * 0.55, cabH_B = hB * 0.38;
    const cabW_F = wF * 0.6, cabW_B = wB * 0.6;

    // === TOP FACE of body (visible trapezoid) ===
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.moveTo(pF.x - wF/2, pF.y - bodyH_F);
    ctx.lineTo(pF.x + wF/2, pF.y - bodyH_F);
    ctx.lineTo(pB.x + wB/2, pB.y - bodyH_B);
    ctx.lineTo(pB.x - wB/2, pB.y - bodyH_B);
    ctx.closePath(); ctx.fill();
    // Top face highlight
    ctx.fillStyle = 'rgba(255,255,200,0.15)';
    ctx.fill();

    // === TOP FACE of cabin/roof ===
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(pF.x - cabW_F/2, pF.y - bodyH_F - cabH_F);
    ctx.lineTo(pF.x + cabW_F/2, pF.y - bodyH_F - cabH_F);
    ctx.lineTo(pB.x + cabW_B/2, pB.y - bodyH_B - cabH_B);
    ctx.lineTo(pB.x - cabW_B/2, pB.y - bodyH_B - cabH_B);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,220,0.2)';
    ctx.fill();

    // === FRONT FACE (back of taxi facing us) ===
    const bodyG = ctx.createLinearGradient(pF.x, pF.y - bodyH_F, pF.x, pF.y);
    bodyG.addColorStop(0, '#FFD700');
    bodyG.addColorStop(1, '#CC9900');
    ctx.fillStyle = bodyG;
    ctx.fillRect(pF.x - wF/2, pF.y - bodyH_F, wF, bodyH_F);

    // Front face cabin
    const cabG = ctx.createLinearGradient(pF.x, pF.y - bodyH_F - cabH_F, pF.x, pF.y - bodyH_F);
    cabG.addColorStop(0, '#FFDD33');
    cabG.addColorStop(1, '#FFD700');
    ctx.fillStyle = cabG;
    ctx.fillRect(pF.x - cabW_F/2, pF.y - bodyH_F - cabH_F, cabW_F, cabH_F);

    // === SIDE FACES (left side visible) ===
    ctx.fillStyle = '#D4A800';
    ctx.beginPath();
    ctx.moveTo(pF.x - wF/2, pF.y);
    ctx.lineTo(pF.x - wF/2, pF.y - bodyH_F);
    ctx.lineTo(pB.x - wB/2, pB.y - bodyH_B);
    ctx.lineTo(pB.x - wB/2, pB.y);
    ctx.closePath(); ctx.fill();

    // Right side
    ctx.fillStyle = '#B89500';
    ctx.beginPath();
    ctx.moveTo(pF.x + wF/2, pF.y);
    ctx.lineTo(pF.x + wF/2, pF.y - bodyH_F);
    ctx.lineTo(pB.x + wB/2, pB.y - bodyH_B);
    ctx.lineTo(pB.x + wB/2, pB.y);
    ctx.closePath(); ctx.fill();

    // Cabin sides
    ctx.fillStyle = '#CCA700';
    ctx.beginPath();
    ctx.moveTo(pF.x - cabW_F/2, pF.y - bodyH_F);
    ctx.lineTo(pF.x - cabW_F/2, pF.y - bodyH_F - cabH_F);
    ctx.lineTo(pB.x - cabW_B/2, pB.y - bodyH_B - cabH_B);
    ctx.lineTo(pB.x - cabW_B/2, pB.y - bodyH_B);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#AA8800';
    ctx.beginPath();
    ctx.moveTo(pF.x + cabW_F/2, pF.y - bodyH_F);
    ctx.lineTo(pF.x + cabW_F/2, pF.y - bodyH_F - cabH_F);
    ctx.lineTo(pB.x + cabW_B/2, pB.y - bodyH_B - cabH_B);
    ctx.lineTo(pB.x + cabW_B/2, pB.y - bodyH_B);
    ctx.closePath(); ctx.fill();

    // === Rear window (on front face) ===
    ctx.fillStyle = '#1a2a4a';
    const winW = cabW_F * 0.7, winH = cabH_F * 0.55;
    ctx.fillRect(pF.x - winW/2, pF.y - bodyH_F - cabH_F + cabH_F*0.15, winW, winH);
    // Window reflection
    ctx.fillStyle = 'rgba(120,160,220,0.2)';
    ctx.fillRect(pF.x - winW/2, pF.y - bodyH_F - cabH_F + cabH_F*0.15, winW*0.35, winH);

    // Side windows (on left side face)
    if (wF > 15) {
      ctx.fillStyle = '#1a2a4a';
      const swCount = 2;
      for (let i = 0; i < swCount; i++) {
        const t = (i + 0.5) / (swCount + 0.5);
        const sx = pF.x - wF/2 + (pB.x - wB/2 - pF.x + wF/2) * t * 0.8;
        const sy = pF.y - bodyH_F + (pB.y - bodyH_B - pF.y + bodyH_F) * t * 0.8;
        const sw = wF * 0.12 * (1 - t*0.3);
        const sh = cabH_F * 0.45 * (1 - t*0.3);
        ctx.fillRect(sx - 1, sy - sh - cabH_F*0.1, sw, sh);
      }
    }

    // Taillights (on front face - since we see the back)
    ctx.fillStyle = '#FF1100';
    ctx.shadowColor = '#FF2200'; ctx.shadowBlur = 4;
    ctx.fillRect(pF.x - wF/2 + 2, pF.y - bodyH_F*0.65, wF*0.08, bodyH_F*0.18);
    ctx.fillRect(pF.x + wF/2 - wF*0.08 - 2, pF.y - bodyH_F*0.65, wF*0.08, bodyH_F*0.18);
    ctx.shadowBlur = 0;

    // License plate
    if (wF > 14) {
      ctx.fillStyle = '#E8E8D0';
      const lpW = wF * 0.2, lpH = bodyH_F * 0.12;
      ctx.fillRect(pF.x - lpW/2, pF.y - bodyH_F*0.35, lpW, lpH);
      ctx.fillStyle = '#222';
      ctx.font = `bold ${Math.max(3, lpH*0.65)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('NYC', pF.x, pF.y - bodyH_F*0.35 + lpH/2);
    }

    // Bumper
    ctx.fillStyle = '#AAA';
    ctx.fillRect(pF.x - wF/2 + 1, pF.y - bodyH_F*0.08, wF - 2, bodyH_F*0.06);

    // Wheels (visible at front face bottom)
    ctx.fillStyle = '#111';
    const wr = hF * 0.11;
    ctx.beginPath(); ctx.arc(pF.x - wF*0.32, pF.y, wr, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(pF.x + wF*0.32, pF.y, wr, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(pF.x - wF*0.32, pF.y, wr*0.4, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(pF.x + wF*0.32, pF.y, wr*0.4, 0, 6.28); ctx.fill();

    // TAXI sign on roof
    if (wF > 16) {
      const sW = cabW_F*0.3, sH = cabH_F*0.25;
      ctx.fillStyle = '#FFE680';
      ctx.fillRect(pF.x-sW/2, pF.y-bodyH_F-cabH_F-sH, sW, sH);
      ctx.fillStyle = '#222';
      ctx.font = `bold ${Math.max(3, sH*0.55)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('TAXI', pF.x, pF.y-bodyH_F-cabH_F-sH/2);
    }
  },

  // =============================================
  // 3D BUS
  // =============================================
  drawBus3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;

    // Top face
    ctx.fillStyle = '#BBBBBB';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2, pF.y-hF);
    ctx.lineTo(pF.x+wF/2, pF.y-hF);
    ctx.lineTo(pB.x+wB/2, pB.y-hB);
    ctx.lineTo(pB.x-wB/2, pB.y-hB);
    ctx.closePath(); ctx.fill();

    // Side faces
    ctx.fillStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2,pF.y); ctx.lineTo(pF.x-wF/2,pF.y-hF);
    ctx.lineTo(pB.x-wB/2,pB.y-hB); ctx.lineTo(pB.x-wB/2,pB.y);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.moveTo(pF.x+wF/2,pF.y); ctx.lineTo(pF.x+wF/2,pF.y-hF);
    ctx.lineTo(pB.x+wB/2,pB.y-hB); ctx.lineTo(pB.x+wB/2,pB.y);
    ctx.closePath(); ctx.fill();

    // Blue stripe on sides
    ctx.fillStyle = '#2255AA';
    const stripeY1 = 0.45, stripeY2 = 0.58;
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2, pF.y-hF*stripeY2);
    ctx.lineTo(pF.x-wF/2, pF.y-hF*stripeY1);
    ctx.lineTo(pB.x-wB/2, pB.y-hB*stripeY1);
    ctx.lineTo(pB.x-wB/2, pB.y-hB*stripeY2);
    ctx.closePath(); ctx.fill();
    // Right side stripe
    ctx.beginPath();
    ctx.moveTo(pF.x+wF/2, pF.y-hF*stripeY2);
    ctx.lineTo(pF.x+wF/2, pF.y-hF*stripeY1);
    ctx.lineTo(pB.x+wB/2, pB.y-hB*stripeY1);
    ctx.lineTo(pB.x+wB/2, pB.y-hB*stripeY2);
    ctx.closePath(); ctx.fill();

    // Front face (rear of bus)
    const bg = ctx.createLinearGradient(pF.x, pF.y-hF, pF.x, pF.y);
    bg.addColorStop(0, '#CCC'); bg.addColorStop(1, '#999');
    ctx.fillStyle = bg;
    ctx.fillRect(pF.x-wF/2, pF.y-hF, wF, hF);

    // Blue stripe on front
    ctx.fillStyle = '#2255AA';
    ctx.fillRect(pF.x-wF/2, pF.y-hF*stripeY2, wF, hF*(stripeY2-stripeY1));

    // Rear window
    ctx.fillStyle = '#1a2a4a';
    ctx.fillRect(pF.x-wF*0.35, pF.y-hF*0.88, wF*0.7, hF*0.25);

    // Taillights
    ctx.fillStyle = '#FF2200';
    ctx.shadowColor = '#FF2200'; ctx.shadowBlur = 3;
    ctx.fillRect(pF.x-wF/2+2, pF.y-hF*0.4, wF*0.08, hF*0.12);
    ctx.fillRect(pF.x+wF/2-wF*0.08-2, pF.y-hF*0.4, wF*0.08, hF*0.12);
    ctx.shadowBlur = 0;

    // Side windows
    if (wF > 14) {
      ctx.fillStyle = '#1a2a4a';
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 3; i++) {
          const t = (i+0.5) / 3.5;
          const sx = (side<0 ? pF.x-wF/2 : pF.x+wF/2) + (side<0 ? pB.x-wB/2-pF.x+wF/2 : pB.x+wB/2-pF.x-wF/2)*t;
          const sy = pF.y-hF*0.85 + (pB.y-hB*0.85-pF.y+hF*0.85)*t;
          ctx.fillRect(sx + (side<0?1:-wF*0.08), sy, wF*0.07*(1-t*0.3), hF*0.2*(1-t*0.3));
        }
      }
    }

    // Route number & MTA
    if (wF > 18) {
      ctx.fillStyle = '#FF8800';
      ctx.fillRect(pF.x+wF*0.15, pF.y-hF*0.95, wF*0.2, hF*0.08);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(3, hF*0.05)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('MTA', pF.x, pF.y-hF*0.52);
    }

    // Wheels
    ctx.fillStyle = '#111';
    const wr = hF*0.07;
    ctx.beginPath(); ctx.arc(pF.x-wF*0.34, pF.y, wr, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(pF.x+wF*0.34, pF.y, wr, 0, 6.28); ctx.fill();
  },

  // =============================================
  // 3D BARRIER
  // =============================================
  drawBarrier3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;

    // Top face
    ctx.fillStyle = '#FF7700';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2, pF.y-hF);
    ctx.lineTo(pF.x+wF/2, pF.y-hF);
    ctx.lineTo(pB.x+wB/2, pB.y-hB);
    ctx.lineTo(pB.x-wB/2, pB.y-hB);
    ctx.closePath(); ctx.fill();

    // Front face with stripes
    const stripes = 6;
    const sw = wF / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i%2===0 ? '#FF6600' : '#FFFFFF';
      ctx.fillRect(pF.x-wF/2+i*sw, pF.y-hF, sw+0.5, hF);
    }

    // Side faces
    ctx.fillStyle = '#CC5500';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2,pF.y); ctx.lineTo(pF.x-wF/2,pF.y-hF);
    ctx.lineTo(pB.x-wB/2,pB.y-hB); ctx.lineTo(pB.x-wB/2,pB.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#AA4400';
    ctx.beginPath();
    ctx.moveTo(pF.x+wF/2,pF.y); ctx.lineTo(pF.x+wF/2,pF.y-hF);
    ctx.lineTo(pB.x+wB/2,pB.y-hB); ctx.lineTo(pB.x+wB/2,pB.y);
    ctx.closePath(); ctx.fill();

    // Reflectors
    if (wF > 10) {
      ctx.fillStyle = '#FF0000'; ctx.shadowColor='#FF0000'; ctx.shadowBlur=3;
      ctx.beginPath(); ctx.arc(pF.x-wF*0.3, pF.y-hF*0.5, Math.max(1.5,wF*0.025), 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(pF.x+wF*0.3, pF.y-hF*0.5, Math.max(1.5,wF*0.025), 0, 6.28); ctx.fill();
      ctx.shadowBlur = 0;
    }
  },

  // =============================================
  // 3D CONE
  // =============================================
  drawCone3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;

    // Base (flat box)
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF*0.7, pF.y);
    ctx.lineTo(pF.x+wF*0.7, pF.y);
    ctx.lineTo(pB.x+wB*0.7, pB.y);
    ctx.lineTo(pB.x-wB*0.7, pB.y);
    ctx.closePath(); ctx.fill();

    // Cone body
    const cg = ctx.createLinearGradient(pF.x-wF/2, pF.y, pF.x+wF/2, pF.y);
    cg.addColorStop(0, '#CC4400');
    cg.addColorStop(0.5, '#FF6600');
    cg.addColorStop(1, '#CC4400');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(pF.x-wF*0.45, pF.y-hF*0.1);
    ctx.lineTo(pF.x, pF.y-hF);
    ctx.lineTo(pF.x+wF*0.45, pF.y-hF*0.1);
    ctx.closePath(); ctx.fill();

    // White stripes
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(pF.x-wF*0.28, pF.y-hF*0.55, wF*0.56, hF*0.1);
    ctx.fillRect(pF.x-wF*0.15, pF.y-hF*0.8, wF*0.3, hF*0.06);
  },

  // =============================================
  // 3D HOT DOG CART
  // =============================================
  drawCart3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;
    const bF = hF*0.55, bB = hB*0.55;

    // Top face of cart body
    ctx.fillStyle = '#AA2222';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2, pF.y-bF);
    ctx.lineTo(pF.x+wF/2, pF.y-bF);
    ctx.lineTo(pB.x+wB/2, pB.y-bB);
    ctx.lineTo(pB.x-wB/2, pB.y-bB);
    ctx.closePath(); ctx.fill();

    // Sides
    ctx.fillStyle = '#CC3333';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2,pF.y); ctx.lineTo(pF.x-wF/2,pF.y-bF);
    ctx.lineTo(pB.x-wB/2,pB.y-bB); ctx.lineTo(pB.x-wB/2,pB.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#992222';
    ctx.beginPath();
    ctx.moveTo(pF.x+wF/2,pF.y); ctx.lineTo(pF.x+wF/2,pF.y-bF);
    ctx.lineTo(pB.x+wB/2,pB.y-bB); ctx.lineTo(pB.x+wB/2,pB.y);
    ctx.closePath(); ctx.fill();

    // Front face
    ctx.fillStyle = '#BB2828';
    ctx.fillRect(pF.x-wF/2, pF.y-bF, wF, bF);

    // Umbrella
    ctx.fillStyle = '#2244CC';
    const uy = pF.y - hF;
    ctx.beginPath();
    ctx.moveTo(pF.x-wF*0.6, pF.y-bF);
    ctx.quadraticCurveTo(pF.x, uy - hF*0.1, pF.x+wF*0.6, pF.y-bF);
    ctx.closePath(); ctx.fill();
    // Stripe
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF*0.2, pF.y-bF);
    ctx.quadraticCurveTo(pF.x, uy-hF*0.06, pF.x+wF*0.2, pF.y-bF);
    ctx.closePath(); ctx.fill();
    // Pole
    ctx.fillStyle = '#666';
    ctx.fillRect(pF.x-0.5, uy, 1.5, hF*0.5);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(pF.x-wF*0.32, pF.y, hF*0.06, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(pF.x+wF*0.32, pF.y, hF*0.06, 0, 6.28); ctx.fill();

    // HOT DOG text
    if (wF > 14) {
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${Math.max(3, bF*0.15)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('HOT DOG', pF.x, pF.y-bF*0.5);
    }
  },

  // =============================================
  // 3D NEWSSTAND
  // =============================================
  drawStand3D(ctx, d) {
    const { pF, pB, wF, wB, hF, hB } = d;

    // Top face
    ctx.fillStyle = '#2a5a2a';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2-1, pF.y-hF);
    ctx.lineTo(pF.x+wF/2+1, pF.y-hF);
    ctx.lineTo(pB.x+wB/2+1, pB.y-hB);
    ctx.lineTo(pB.x-wB/2-1, pB.y-hB);
    ctx.closePath(); ctx.fill();

    // Sides
    ctx.fillStyle = '#1a3a1a';
    ctx.beginPath();
    ctx.moveTo(pF.x-wF/2,pF.y); ctx.lineTo(pF.x-wF/2,pF.y-hF);
    ctx.lineTo(pB.x-wB/2,pB.y-hB); ctx.lineTo(pB.x-wB/2,pB.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0e2a0e';
    ctx.beginPath();
    ctx.moveTo(pF.x+wF/2,pF.y); ctx.lineTo(pF.x+wF/2,pF.y-hF);
    ctx.lineTo(pB.x+wB/2,pB.y-hB); ctx.lineTo(pB.x+wB/2,pB.y);
    ctx.closePath(); ctx.fill();

    // Front face
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(pF.x-wF/2, pF.y-hF, wF, hF);
    // Opening
    ctx.fillStyle = '#081808';
    ctx.fillRect(pF.x-wF/2+wF*0.08, pF.y-hF*0.88, wF*0.84, hF*0.5);
    // Magazines
    const mc = Math.min(4, Math.floor(wF/6));
    const mw = wF*0.8/(mc+0.5);
    const magC = ['#FF4444','#4444FF','#44BB44','#FFAA00'];
    for (let i = 0; i < mc; i++) {
      ctx.fillStyle = magC[i%4];
      ctx.fillRect(pF.x-wF/2+wF*0.1+i*(mw+1), pF.y-hF*0.82, mw-1, hF*0.3);
    }
    // Counter
    ctx.fillStyle = '#3a6a3a';
    ctx.fillRect(pF.x-wF/2+1, pF.y-hF*0.32, wF-2, hF*0.05);
  },

  // Utility
  checkCollision(pi) {
    if (!pi) return null;
    for (const o of this.list) {
      if (o.z < CONFIG.PLAYER_Z-3 || o.z > CONFIG.PLAYER_Z+3) continue;
      if (!o._x) continue;
      const dx = Math.abs(o._x-pi.x), dy = Math.abs(o._y-pi.y);
      if (dx < o._w*0.38+pi.r && dy < o._h*0.38+pi.r) {
        if (o.jumpable && pi.jumpH > o.h*0.5) continue;
        if (!o.jumpable && pi.jumpH > o.h*0.8) continue;
        return o;
      }
    }
    return null;
  },

  remove(o) { const i=this.list.indexOf(o); if(i>=0) this.list.splice(i,1); },
};

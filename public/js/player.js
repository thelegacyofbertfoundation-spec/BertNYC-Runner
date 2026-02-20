// =============================================
// BERT RUNNER NYC - Enhanced Player
// =============================================
const Player = {
  lane:1, targetLane:1, laneSmooth:0,
  jumpH:0, vy:0, isJumping:false,
  bobPhase:0, animFrame:0,
  colors:['#F4A460','#D2691E','#8B4513'],
  SIZE: 1.5,
  trailTimer: 0,

  init() {
    this.lane=1; this.targetLane=1; this.laneSmooth=0;
    this.jumpH=0; this.vy=0; this.isJumping=false;
    this.bobPhase=0; this.animFrame=0; this.trailTimer=0;
    this.colors = State.getSkin().colors;
  },

  switchLane(dir) {
    if(dir>0&&this.targetLane<2) this.targetLane++;
    else if(dir<0&&this.targetLane>0) this.targetLane--;
  },
  jump() { if(!this.isJumping){this.isJumping=true;this.vy=CONFIG.JUMP_FORCE;} },

  update() {
    const ts = this.targetLane-1;
    this.laneSmooth += (ts-this.laneSmooth)*0.14;
    if(Math.abs(this.laneSmooth-ts)<0.05){this.laneSmooth=ts;this.lane=this.targetLane;}

    if(this.isJumping){
      this.jumpH+=this.vy; this.vy-=CONFIG.GRAVITY;
      if(this.jumpH<=0){this.jumpH=0;this.vy=0;this.isJumping=false;}
    }

    this.bobPhase+=0.12; this.animFrame++;

    // Spawn trail particles
    this.trailTimer++;
    if (this.trailTimer % 3 === 0 && State.game.running) {
      const p = Renderer.project(this.laneSmooth, CONFIG.PLAYER_Z + 0.5, this.jumpH * 0.3);
      if (p) {
        const speedFactor = State.game.speed / CONFIG.MAX_SPEED;
        Particles.spawn(p.x + (Math.random()-0.5)*6, p.y + 8, this.colors[1], 1 + Math.floor(speedFactor * 2));
      }
    }
  },

  draw() {
    const ctx = Renderer.ctx;
    const z = CONFIG.PLAYER_Z;
    const bob = this.isJumping ? 0 : Math.sin(this.bobPhase)*0.06;
    const h = this.jumpH + bob;
    const p = Renderer.project(this.laneSmooth, z, h);
    if(!p) return;

    const r = Renderer.worldToPixels(this.SIZE, z);
    const x = p.x, y = p.y;
    const speedFactor = Math.min(1, (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED));

    // Shadow
    const ps = Renderer.project(this.laneSmooth, z, 0);
    if(ps){
      const shrink = Math.max(0.15, 1 - this.jumpH * 1.5);
      const shadowG = ctx.createRadialGradient(ps.x, ps.y, 0, ps.x, ps.y, r * 0.8 * shrink);
      shadowG.addColorStop(0, `rgba(0,0,0,${0.35 * shrink})`);
      shadowG.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowG;
      ctx.beginPath();
      ctx.ellipse(ps.x, ps.y, r*0.8*shrink, r*0.25*shrink, 0, 0, 6.28);
      ctx.fill();
    }

    // Speed blur effect (duplicate slightly behind at high speed)
    if (speedFactor > 0.4) {
      const blurAlpha = speedFactor * 0.15;
      ctx.globalAlpha = blurAlpha;
      this.drawBertBody(ctx, x, y + r * 0.1, r * 0.95);
      ctx.globalAlpha = blurAlpha * 0.5;
      this.drawBertBody(ctx, x, y + r * 0.2, r * 0.9);
      ctx.globalAlpha = 1;
    }

    // Main body
    this.drawBertBody(ctx, x, y, r);

    // Eyes with expression
    this.drawEyes(ctx, x, y, r);

    // Nose
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(x, y + r*0.08, r*0.1, 0, 6.28); ctx.fill();

    // Mouth - happy!
    ctx.fillStyle = '#FF6B6B';
    if (State.game.speed > CONFIG.INITIAL_SPEED * 1.3) {
      // Open mouth with tongue
      ctx.beginPath();
      ctx.arc(x, y + r*0.22, r*0.14, 0, Math.PI);
      ctx.fill();
      // Tongue
      const tw = Math.sin(this.animFrame*0.12)*2;
      ctx.beginPath();
      ctx.ellipse(x+tw, y+r*0.38, r*0.08, r*0.13, 0, 0, 6.28);
      ctx.fill();
    } else {
      // Smile
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y + r*0.15, r*0.12, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Ears (little triangles on top)
    ctx.fillStyle = this.colors[1];
    ctx.beginPath();
    ctx.moveTo(x - r*0.5, y - r*0.7);
    ctx.lineTo(x - r*0.25, y - r*1.05);
    ctx.lineTo(x - r*0.05, y - r*0.7);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r*0.05, y - r*0.7);
    ctx.lineTo(x + r*0.25, y - r*1.05);
    ctx.lineTo(x + r*0.5, y - r*0.7);
    ctx.closePath(); ctx.fill();
    // Inner ear
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(x - r*0.4, y - r*0.72);
    ctx.lineTo(x - r*0.25, y - r*0.95);
    ctx.lineTo(x - r*0.12, y - r*0.72);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r*0.12, y - r*0.72);
    ctx.lineTo(x + r*0.25, y - r*0.95);
    ctx.lineTo(x + r*0.4, y - r*0.72);
    ctx.closePath(); ctx.fill();

    // Running legs animation
    if (!this.isJumping) {
      const legPhase = this.animFrame * 0.2;
      ctx.fillStyle = this.colors[2];
      const legR = r * 0.15;
      // Left leg
      const llx = x - r*0.25 + Math.sin(legPhase) * r*0.15;
      const lly = y + r*0.75 + Math.abs(Math.sin(legPhase)) * r*0.1;
      ctx.beginPath(); ctx.arc(llx, lly, legR, 0, 6.28); ctx.fill();
      // Right leg
      const rlx = x + r*0.25 + Math.sin(legPhase + Math.PI) * r*0.15;
      const rly = y + r*0.75 + Math.abs(Math.sin(legPhase + Math.PI)) * r*0.1;
      ctx.beginPath(); ctx.arc(rlx, rly, legR, 0, 6.28); ctx.fill();
    }

    // Shield effect
    if(State.game.hasShield){
      ctx.strokeStyle = 'rgba(88,166,255,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x,y,r*1.5,0,6.28); ctx.stroke();
      // Animated shield sparkle
      const sa = this.animFrame * 0.08;
      ctx.fillStyle = 'rgba(88,166,255,0.6)';
      ctx.beginPath(); ctx.arc(x+Math.cos(sa)*r*1.4, y+Math.sin(sa)*r*1.4, 2, 0, 6.28); ctx.fill();
    }
  },

  drawBertBody(ctx, x, y, r) {
    // Outer fluff ring
    for (let i = 0; i < 10; i++) {
      const a = (i/10)*6.28 + this.animFrame*0.03;
      const fx = x + Math.cos(a)*r*0.88;
      const fy = y + Math.sin(a)*r*0.88;
      const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, r*0.3);
      fg.addColorStop(0, this.colors[0]);
      fg.addColorStop(1, this.colors[1] + '00');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, fy, r*0.3, 0, 6.28); ctx.fill();
    }

    // Main body gradient
    const grad = ctx.createRadialGradient(x-r*0.15, y-r*0.15, r*0.05, x, y, r);
    grad.addColorStop(0, this.colors[0]);
    grad.addColorStop(0.5, this.colors[1]);
    grad.addColorStop(1, this.colors[2]);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(x-r*0.2, y-r*0.3, r*0.4, r*0.25, -0.3, 0, 6.28);
    ctx.fill();
  },

  drawEyes(ctx, x, y, r) {
    const er = r*0.16, eox = r*0.28, eoy = r*0.18;
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x-eox, y-eoy, er*1.1, er*1.2, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+eox, y-eoy, er*1.1, er*1.2, 0, 0, 6.28); ctx.fill();
    // Pupils (look forward)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(x-eox+1, y-eoy, er*0.7, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+eox+1, y-eoy, er*0.7, 0, 6.28); ctx.fill();
    // Shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x-eox+2, y-eoy-2, er*0.3, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.arc(x+eox+2, y-eoy-2, er*0.3, 0, 6.28); ctx.fill();
  },

  getCollisionInfo() {
    const p=Renderer.project(this.laneSmooth,CONFIG.PLAYER_Z,this.jumpH);
    const r=Renderer.worldToPixels(this.SIZE,CONFIG.PLAYER_Z);
    return p?{x:p.x,y:p.y,r:r*0.75,jumpH:this.jumpH}:null;
  },
};

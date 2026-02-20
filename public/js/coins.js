// =============================================
// BERT RUNNER NYC - Enhanced Coins
// =============================================
const Coins = {
  list: [],
  nextGroupDist: 30,

  init() { this.list=[]; this.nextGroupDist=30; },

  spawn(distance) {
    if(distance<this.nextGroupDist) return;
    const lane = Math.floor(Math.random()*3)-1;
    const floating = Math.random() > 0.65;
    // Coin pattern: line, arc, or zigzag
    const pattern = Math.floor(Math.random()*3);

    for(let i=0; i<CONFIG.COIN_GROUP_SIZE; i++){
      let cl = lane;
      if (pattern === 1) cl = lane + Math.sin(i*0.8)*0.3; // arc
      if (pattern === 2) cl = lane + (i%2===0?0.3:-0.3); // zigzag

      this.list.push({
        z:CONFIG.SPAWN_Z+i*CONFIG.COIN_GAP,
        lane:cl, height:floating?0.8:0.3,
        collected:false,
        bobOff:Math.random()*6.28, rotOff:Math.random()*6.28,
      });
    }
    this.nextGroupDist = distance + 25+Math.random()*35;
  },

  update(speed) {
    for(let c of this.list) c.z-=speed;
    this.list = this.list.filter(c=>c.z>CONFIG.DESPAWN_Z&&!c.collected);
  },

  draw(frame) {
    const ctx = Renderer.ctx;
    for(const c of this.list){
      if(c.collected||c.z<0||c.z>CONFIG.SPAWN_Z+40) continue;
      const fog = Renderer.fogAt(c.z);
      if(fog>0.85) continue;

      const bob = Math.sin(frame*0.05+c.bobOff)*0.1;
      const p = Renderer.project(c.lane, c.z, c.height+bob);
      if(!p||p.scale<0.01) continue;

      const r = Renderer.worldToPixels(0.5, c.z);
      if(r<1.5) continue;

      const x=p.x, y=p.y;
      const alpha = 1-fog;
      const sq = Math.abs(Math.cos(frame*0.04+c.rotOff));
      const rw = r*Math.max(0.2,sq);

      // Outer glow
      ctx.globalAlpha = alpha * 0.15;
      const glow = ctx.createRadialGradient(x, y, r*0.3, x, y, r*2.5);
      glow.addColorStop(0, '#FFD700');
      glow.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r*2.5, 0, 6.28); ctx.fill();

      // Coin body
      ctx.globalAlpha = alpha;
      const coinG = ctx.createLinearGradient(x-rw, y-r, x+rw, y+r);
      coinG.addColorStop(0, '#FFF176');
      coinG.addColorStop(0.3, '#FFD700');
      coinG.addColorStop(0.7, '#FFA000');
      coinG.addColorStop(1, '#FF8F00');
      ctx.fillStyle = coinG;
      ctx.beginPath(); ctx.ellipse(x, y, rw, r, 0, 0, 6.28); ctx.fill();

      // Edge ring
      ctx.strokeStyle = `rgba(180,130,0,${alpha})`;
      ctx.lineWidth = Math.max(0.5, r*0.08);
      ctx.beginPath(); ctx.ellipse(x, y, rw*0.85, r*0.85, 0, 0, 6.28); ctx.stroke();

      // B letter
      if(r>5&&sq>0.5){
        ctx.fillStyle = `rgba(139,69,0,${alpha})`;
        ctx.font = `bold ${Math.max(5,r*0.65)}px Rubik`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('B',x,y);
      }

      // Sparkle
      if (Math.random() > 0.92 && r > 4) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.8})`;
        const sx = x + (Math.random()-0.5)*r*1.5;
        const sy = y + (Math.random()-0.5)*r*1.5;
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, 6.28); ctx.fill();
      }

      ctx.globalAlpha = 1;
      c._x=x; c._y=y; c._r=r;
    }
  },

  checkCollection(pi) {
    if(!pi) return 0; let got=0;
    const magnetR = State.game.hasMagnet?80:0;
    for(const c of this.list){
      if(c.collected) continue;
      if(c.z<CONFIG.PLAYER_Z-5||c.z>CONFIG.PLAYER_Z+5) continue;
      if(!c._x) continue;
      const dx=c._x-pi.x, dy=c._y-pi.y;
      if(Math.sqrt(dx*dx+dy*dy)<pi.r+(c._r||8)+magnetR){
        c.collected=true; got++;
        Particles.spawn(c._x,c._y,'#FFD700',8);
        Particles.spawn(c._x,c._y,'#FFF176',4);
      }
    }
    return got;
  },
};

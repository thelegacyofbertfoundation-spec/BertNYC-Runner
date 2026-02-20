// =============================================
// BERT RUNNER NYC - Drawn Obstacles v5
// Actual vehicle shapes
// =============================================
const Obstacles = {
  list: [],
  nextSpawnDist: 60,

  init() { this.list=[]; this.nextSpawnDist=60; },

  spawn(distance) {
    if (distance < this.nextSpawnDist) return;
    const lane = Math.floor(Math.random()*3)-1;
    const types = CONFIG.OBSTACLES;
    const t = types[Math.floor(Math.random()*types.length)];
    this.list.push({ z:CONFIG.SPAWN_Z, lane, type:t.type, w:t.w, h:t.h });

    if (Math.random()<0.22 && State.game.speed>CONFIG.INITIAL_SPEED*1.5) {
      let l2=lane; while(l2===lane) l2=Math.floor(Math.random()*3)-1;
      const t2 = types[Math.floor(Math.random()*types.length)];
      this.list.push({ z:CONFIG.SPAWN_Z+Math.random()*6, lane:l2, type:t2.type, w:t2.w, h:t2.h });
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
    const sorted = [...this.list].sort((a,b)=>b.z-a.z);

    for (const o of sorted) {
      if (o.z<0||o.z>CONFIG.SPAWN_Z+10) continue;
      const fog = Renderer.fogAt(o.z);
      if (fog>0.92) continue;

      const p = Renderer.project(o.lane, o.z, 0);
      if (!p||p.scale<0.008) continue;

      const ow = Renderer.worldToPixels(o.w, o.z);
      const oh = Renderer.worldToPixels(o.h, o.z);
      if (ow<3||oh<3) continue;

      const x=p.x, y=p.y;
      ctx.globalAlpha = 1 - fog;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath(); ctx.ellipse(x, y+2, ow*0.5, ow*0.08, 0, 0, 6.28); ctx.fill();

      switch(o.type) {
        case 'taxi': this.drawTaxi(ctx,x,y,ow,oh); break;
        case 'bus': this.drawBus(ctx,x,y,ow,oh); break;
        case 'barrier': this.drawBarrier(ctx,x,y,ow,oh); break;
        case 'cone': this.drawCone(ctx,x,y,ow,oh); break;
        case 'dumpster': this.drawDumpster(ctx,x,y,ow,oh); break;
        default: this.drawTaxi(ctx,x,y,ow,oh);
      }

      ctx.globalAlpha = 1;
      o._x=x; o._y=y-oh/2; o._w=ow; o._h=oh;
    }
  },

  drawTaxi(ctx, x, y, w, h) {
    const bx=x-w/2, by=y-h;
    // Body
    const bg=ctx.createLinearGradient(bx,by,bx,y);
    bg.addColorStop(0,'#FFE44D'); bg.addColorStop(0.3,'#FFD700'); bg.addColorStop(1,'#CC9900');
    ctx.fillStyle=bg;
    this.rr(ctx,bx,by+h*0.15,w,h*0.85,w*0.06);
    // Roof
    ctx.fillStyle='#FFEC80';
    this.rr(ctx,bx+w*0.12,by,w*0.76,h*0.4,w*0.05);
    // Windshield
    ctx.fillStyle='rgba(130,180,220,0.7)';
    ctx.fillRect(bx+w*0.15,by+h*0.05,w*0.7,h*0.25);
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(bx+w*0.15,by+h*0.05,w*0.35,h*0.12);
    // Side windows
    ctx.fillStyle='rgba(100,160,200,0.55)';
    ctx.fillRect(bx+w*0.05,by+h*0.2,w*0.2,h*0.18);
    ctx.fillRect(bx+w*0.75,by+h*0.2,w*0.2,h*0.18);
    // Checker stripe
    ctx.fillStyle='#222';
    ctx.fillRect(bx+w*0.05,by+h*0.55,w*0.9,h*0.06);
    const cs=Math.max(2,w*0.04);
    for(let i=0;i<Math.floor(w*0.9/cs/2);i++){
      if(i%2===0){ctx.fillStyle='#FFD700';ctx.fillRect(bx+w*0.05+i*cs*2,by+h*0.55,cs,h*0.06);}
    }
    // Lights
    ctx.fillStyle='#FFF8DC';
    ctx.beginPath();ctx.arc(bx+w*0.1,by+h*0.7,w*0.045,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(bx+w*0.9,by+h*0.7,w*0.045,0,6.28);ctx.fill();
    ctx.fillStyle='#CC0000';
    ctx.fillRect(bx,by+h*0.75,w*0.05,h*0.07);
    ctx.fillRect(bx+w*0.95,by+h*0.75,w*0.05,h*0.07);
    // Wheels
    this.drawWheels(ctx,x,y,w,h);
    // Taxi sign
    if(w>15){ctx.fillStyle='#FFE';ctx.fillRect(bx+w*0.38,by-h*0.07,w*0.24,h*0.09);
    ctx.fillStyle='#111';ctx.font=`bold ${Math.max(4,h*0.055)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TAXI',x,by-h*0.025);}
  },

  drawBus(ctx, x, y, w, h) {
    const bx=x-w/2, by=y-h;
    const bg=ctx.createLinearGradient(bx,by,bx,y);
    bg.addColorStop(0,'#DD3333'); bg.addColorStop(0.4,'#CC2222'); bg.addColorStop(1,'#991515');
    ctx.fillStyle=bg;
    this.rr(ctx,bx,by+h*0.05,w,h*0.95,w*0.03);
    ctx.fillStyle='#AA1818';ctx.fillRect(bx+w*0.02,by,w*0.96,h*0.1);
    // Windows
    ctx.fillStyle='rgba(120,180,220,0.6)';ctx.fillRect(bx+w*0.05,by+h*0.12,w*0.9,h*0.26);
    ctx.fillStyle='#BB2020';
    const wc=Math.floor(w/12);
    for(let i=1;i<wc;i++) ctx.fillRect(bx+w*0.05+i*(w*0.9/wc),by+h*0.12,Math.max(1,w*0.01),h*0.26);
    ctx.fillStyle='rgba(255,255,255,0.65)';ctx.fillRect(bx+w*0.02,by+h*0.43,w*0.96,h*0.035);
    if(w>20){ctx.fillStyle='#111';ctx.fillRect(bx+w*0.15,by+h*0.48,w*0.7,h*0.07);
    ctx.fillStyle='#FFB800';ctx.font=`bold ${Math.max(4,h*0.04)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('MTA',x,by+h*0.515);}
    ctx.fillStyle='#881515';ctx.fillRect(bx+w*0.35,by+h*0.55,w*0.12,h*0.4);
    ctx.fillStyle='#FFFACD';
    ctx.beginPath();ctx.arc(bx+w*0.06,by+h*0.7,w*0.035,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(bx+w*0.94,by+h*0.7,w*0.035,0,6.28);ctx.fill();
    this.drawWheels(ctx,x,y,w,h);
  },

  drawBarrier(ctx, x, y, w, h) {
    const bx=x-w/2, by=y-h;
    ctx.fillStyle='#888';
    ctx.fillRect(bx+w*0.1,by+h*0.6,w*0.06,h*0.4);
    ctx.fillRect(bx+w*0.84,by+h*0.6,w*0.06,h*0.4);
    const bg=ctx.createLinearGradient(bx,by,bx,by+h*0.6);
    bg.addColorStop(0,'#FFAA00'); bg.addColorStop(1,'#E08800');
    ctx.fillStyle=bg;
    this.rr(ctx,bx,by,w,h*0.6,w*0.03);
    ctx.save();ctx.beginPath();ctx.rect(bx,by,w,h*0.6);ctx.clip();
    const sw=Math.max(4,w*0.1);
    for(let si=-5;si<w/sw+5;si++){if(si%2===0){ctx.fillStyle='rgba(255,255,255,0.45)';
    ctx.beginPath();ctx.moveTo(bx+si*sw,by);ctx.lineTo(bx+(si+1)*sw,by);ctx.lineTo(bx+(si+0.3)*sw,by+h*0.6);ctx.lineTo(bx+(si-0.7)*sw,by+h*0.6);ctx.closePath();ctx.fill();}}
    ctx.restore();
  },

  drawCone(ctx, x, y, w, h) {
    const bx=x-w/2, by=y-h;
    ctx.fillStyle='#222';ctx.fillRect(bx-w*0.15,y-h*0.1,w*1.3,h*0.1);
    const cg=ctx.createLinearGradient(x,by,x,y);
    cg.addColorStop(0,'#FF6600'); cg.addColorStop(0.5,'#FF4400'); cg.addColorStop(1,'#CC3300');
    ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(x,by);ctx.lineTo(bx+w*0.85,y-h*0.1);ctx.lineTo(bx+w*0.15,y-h*0.1);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.75)';
    ctx.fillRect(bx+w*0.2,by+h*0.3,w*0.6,h*0.07);
    ctx.fillRect(bx+w*0.28,by+h*0.55,w*0.44,h*0.05);
  },

  drawDumpster(ctx, x, y, w, h) {
    const bx=x-w/2, by=y-h;
    const dg=ctx.createLinearGradient(bx,by,bx,y);
    dg.addColorStop(0,'#2E8B57'); dg.addColorStop(0.6,'#267348'); dg.addColorStop(1,'#1B5E3B');
    ctx.fillStyle=dg;
    ctx.beginPath();ctx.moveTo(bx+w*0.05,by+h*0.1);ctx.lineTo(bx+w*0.95,by+h*0.1);ctx.lineTo(bx+w,y);ctx.lineTo(bx,y);ctx.closePath();ctx.fill();
    ctx.fillStyle='#236B43';this.rr(ctx,bx+w*0.02,by,w*0.96,h*0.15,w*0.02);
    ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=1;
    for(let ri=0.3;ri<0.9;ri+=0.2){ctx.beginPath();ctx.moveTo(bx+w*0.08,by+h*ri);ctx.lineTo(bx+w*0.92,by+h*ri);ctx.stroke();}
  },

  drawWheels(ctx, x, y, w, h) {
    const wr=Math.max(2,w*0.065);
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath();ctx.arc(x-w*0.3,y,wr,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(x+w*0.3,y,wr,0,6.28);ctx.fill();
    ctx.fillStyle='#444';
    ctx.beginPath();ctx.arc(x-w*0.3,y,wr*0.45,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(x+w*0.3,y,wr*0.45,0,6.28);ctx.fill();
  },

  rr(ctx,x,y,w,h,r,so){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();if(so)ctx.stroke();else ctx.fill();},

  checkCollision(pi) {
    if(!pi) return null;
    for(const o of this.list){
      if(o.z<CONFIG.PLAYER_Z-3||o.z>CONFIG.PLAYER_Z+3) continue;
      if(!o._x) continue;
      const dx=Math.abs(o._x-pi.x),dy=Math.abs(o._y-pi.y);
      if(dx<o._w*0.38+pi.r&&dy<o._h*0.38+pi.r){if(pi.jumpH>o.h*0.6)continue;return o;}
    }
    return null;
  },
  remove(o){const i=this.list.indexOf(o);if(i>=0)this.list.splice(i,1);},
};

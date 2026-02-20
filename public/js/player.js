// =============================================
// BERT RUNNER NYC - Player v5
// Bigger, more detailed Bert
// =============================================
const Player = {
  lane:1, targetLane:1, laneSmooth:0,
  jumpH:0, vy:0, isJumping:false,
  bobPhase:0, animFrame:0,
  colors:['#F4A460','#D2691E','#8B4513'],
  SIZE: 1.8, // bigger character

  init() {
    this.lane=1;this.targetLane=1;this.laneSmooth=0;
    this.jumpH=0;this.vy=0;this.isJumping=false;
    this.bobPhase=0;this.animFrame=0;
    this.colors=State.getSkin().colors;
  },
  switchLane(d){if(d>0&&this.targetLane<2)this.targetLane++;else if(d<0&&this.targetLane>0)this.targetLane--;},
  jump(){if(!this.isJumping){this.isJumping=true;this.vy=CONFIG.JUMP_FORCE;}},

  update() {
    const ts=this.targetLane-1;
    this.laneSmooth+=(ts-this.laneSmooth)*0.14;
    if(Math.abs(this.laneSmooth-ts)<0.05){this.laneSmooth=ts;this.lane=this.targetLane;}
    if(this.isJumping){this.jumpH+=this.vy;this.vy-=CONFIG.GRAVITY;if(this.jumpH<=0){this.jumpH=0;this.vy=0;this.isJumping=false;}}
    this.bobPhase+=0.12;this.animFrame++;
  },

  draw() {
    const ctx=Renderer.ctx;
    const z=CONFIG.PLAYER_Z;
    const bob=this.isJumping?0:Math.sin(this.bobPhase)*0.05;
    const p=Renderer.project(this.laneSmooth,z,this.jumpH+bob);
    if(!p) return;
    const r=Renderer.worldToPixels(this.SIZE,z);
    const x=p.x, y=p.y;

    // Shadow
    const ps=Renderer.project(this.laneSmooth,z,0);
    if(ps){
      const sh=Math.max(0.15,1-this.jumpH*1.5);
      const sg=ctx.createRadialGradient(ps.x,ps.y,0,ps.x,ps.y,r*0.75*sh);
      sg.addColorStop(0,`rgba(0,0,0,${0.3*sh})`);sg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(ps.x,ps.y,r*0.75*sh,r*0.22*sh,0,0,6.28);ctx.fill();
    }

    // Running legs
    if(!this.isJumping){
      const lp=this.animFrame*0.2;
      ctx.fillStyle=this.colors[2];
      const lr=r*0.14;
      ctx.beginPath();ctx.arc(x-r*0.22+Math.sin(lp)*r*0.12,y+r*0.8+Math.abs(Math.sin(lp))*r*0.08,lr,0,6.28);ctx.fill();
      ctx.beginPath();ctx.arc(x+r*0.22+Math.sin(lp+Math.PI)*r*0.12,y+r*0.8+Math.abs(Math.sin(lp+Math.PI))*r*0.08,lr,0,6.28);ctx.fill();
    }

    // Fluff ring
    for(let i=0;i<10;i++){
      const a=(i/10)*6.28+this.animFrame*0.03;
      const fx=x+Math.cos(a)*r*0.86, fy=y+Math.sin(a)*r*0.86;
      const fg=ctx.createRadialGradient(fx,fy,0,fx,fy,r*0.28);
      fg.addColorStop(0,this.colors[0]);fg.addColorStop(1,this.colors[1]+'00');
      ctx.fillStyle=fg;ctx.beginPath();ctx.arc(fx,fy,r*0.28,0,6.28);ctx.fill();
    }

    // Body
    const grad=ctx.createRadialGradient(x-r*0.15,y-r*0.15,r*0.05,x,y,r);
    grad.addColorStop(0,this.colors[0]);grad.addColorStop(0.5,this.colors[1]);grad.addColorStop(1,this.colors[2]);
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.fill();

    // Highlight
    ctx.fillStyle='rgba(255,255,255,0.07)';
    ctx.beginPath();ctx.ellipse(x-r*0.2,y-r*0.3,r*0.4,r*0.25,-0.3,0,6.28);ctx.fill();

    // Ears
    ctx.fillStyle=this.colors[1];
    ctx.beginPath();ctx.moveTo(x-r*0.48,y-r*0.68);ctx.lineTo(x-r*0.25,y-r*1.02);ctx.lineTo(x-r*0.05,y-r*0.68);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(x+r*0.05,y-r*0.68);ctx.lineTo(x+r*0.25,y-r*1.02);ctx.lineTo(x+r*0.48,y-r*0.68);ctx.closePath();ctx.fill();
    ctx.fillStyle='#FFB6C1';
    ctx.beginPath();ctx.moveTo(x-r*0.38,y-r*0.7);ctx.lineTo(x-r*0.25,y-r*0.92);ctx.lineTo(x-r*0.12,y-r*0.7);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(x+r*0.12,y-r*0.7);ctx.lineTo(x+r*0.25,y-r*0.92);ctx.lineTo(x+r*0.38,y-r*0.7);ctx.closePath();ctx.fill();

    // Eyes
    const er=r*0.15, eox=r*0.27, eoy=r*0.17;
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.ellipse(x-eox,y-eoy,er*1.1,er*1.2,0,0,6.28);ctx.fill();
    ctx.beginPath();ctx.ellipse(x+eox,y-eoy,er*1.1,er*1.2,0,0,6.28);ctx.fill();
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath();ctx.arc(x-eox+1,y-eoy,er*0.65,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(x+eox+1,y-eoy,er*0.65,0,6.28);ctx.fill();
    ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(x-eox+2,y-eoy-2,er*0.28,0,6.28);ctx.fill();
    ctx.beginPath();ctx.arc(x+eox+2,y-eoy-2,er*0.28,0,6.28);ctx.fill();

    // Nose
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x,y+r*0.06,r*0.09,0,6.28);ctx.fill();

    // Mouth
    if(State.game.speed>CONFIG.INITIAL_SPEED*1.3){
      ctx.fillStyle='#FF6B6B';ctx.beginPath();ctx.arc(x,y+r*0.22,r*0.13,0,Math.PI);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+Math.sin(this.animFrame*0.12)*2,y+r*0.36,r*0.07,r*0.12,0,0,6.28);ctx.fill();
    } else {
      ctx.strokeStyle='#333';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y+r*0.15,r*0.1,0.2,Math.PI-0.2);ctx.stroke();
    }

    // Shield
    if(State.game.hasShield){
      ctx.strokeStyle='rgba(88,166,255,0.4)';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(x,y,r*1.5,0,6.28);ctx.stroke();
      const sa=this.animFrame*0.08;
      ctx.fillStyle='rgba(88,166,255,0.6)';
      ctx.beginPath();ctx.arc(x+Math.cos(sa)*r*1.4,y+Math.sin(sa)*r*1.4,2,0,6.28);ctx.fill();
    }
  },

  getCollisionInfo() {
    const p=Renderer.project(this.laneSmooth,CONFIG.PLAYER_Z,this.jumpH);
    const r=Renderer.worldToPixels(this.SIZE,CONFIG.PLAYER_Z);
    return p?{x:p.x,y:p.y,r:r*0.7,jumpH:this.jumpH}:null;
  },
};

// =============================================
// BERT RUNNER NYC - Particles v5
// =============================================
const Particles = {
  list: [],
  init() { this.list=[]; },
  spawnTrail(x,y,color) {
    this.list.push({x:x+(Math.random()-0.5)*3,y,type:'trail',
      vx:(Math.random()-0.5)*1,vy:Math.random()*1.5+0.5,
      size:Math.random()*2.5+1.5,life:10+Math.random()*5,maxLife:15,color,rot:0});
  },
  spawn(x,y,color,count) {
    for(let i=0;i<count;i++){
      const type=Math.random()>0.6?'sparkle':'circle';
      this.list.push({x,y,type,vx:(Math.random()-0.5)*7,vy:(Math.random()-0.5)*7-2,
        size:type==='sparkle'?Math.random()*2+0.8:Math.random()*3.5+1.5,
        life:18+Math.random()*12,maxLife:30,color,rot:Math.random()*6.28});
    }
  },
  update() {
    for(const p of this.list){p.x+=p.vx;p.y+=p.vy;if(p.type!=='trail')p.vy+=0.12;p.vx*=0.97;p.size*=p.type==='trail'?0.94:0.98;p.life--;p.rot+=0.1;}
    this.list=this.list.filter(p=>p.life>0&&p.size>0.3);
    if(this.list.length>150) this.list=this.list.slice(-150);
  },
  draw() {
    const ctx=Renderer.ctx;
    for(const p of this.list){
      const t=Math.max(0,p.life/p.maxLife);
      ctx.globalAlpha=t;
      if(p.type==='sparkle'){
        ctx.fillStyle='#fff';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
        ctx.beginPath();
        for(let i=0;i<4;i++){const a=(i/4)*6.28;ctx.lineTo(Math.cos(a)*p.size*2,Math.sin(a)*p.size*2);const a2=a+6.28/8;ctx.lineTo(Math.cos(a2)*p.size*0.4,Math.sin(a2)*p.size*0.4);}
        ctx.closePath();ctx.fill();ctx.restore();
      } else if(p.type==='trail'){
        ctx.fillStyle=p.color;ctx.globalAlpha=t*0.35;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,6.28);ctx.fill();
      } else {
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,6.28);ctx.fill();
      }
    }
    ctx.globalAlpha=1;
  },
};

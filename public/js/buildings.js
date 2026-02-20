// =============================================
// BERT RUNNER NYC - Buildings v5
// =============================================
const Buildings = {
  list: [],
  streetItems: [],

  init() {
    this.list = []; this.streetItems = [];
    for (let i=0;i<45;i++) this.list.push(this.mkB(CONFIG.PLAYER_Z+i*5));
    for (let i=0;i<25;i++) this.streetItems.push(this.mkS(CONFIG.PLAYER_Z+i*8));
  },

  mkB(z) {
    const side = Math.random()>0.5?1:-1;
    const style = Math.floor(Math.random()*4);
    const cols = [
      {main:'#2B1810',trim:'#8B4513',win:'rgba(255,200,80,0.5)'},
      {main:'#1a2a3a',trim:'#3a5a7a',win:'rgba(150,200,255,0.4)'},
      {main:'#3B2410',trim:'#6B4420',win:'rgba(255,180,60,0.5)'},
      {main:'#1C2833',trim:'#2E4053',win:'rgba(255,220,100,0.6)'},
    ][style];
    return {
      z, side, offset:1.5+Math.random()*1.0, w:1.2+Math.random()*2.5,
      h:3+Math.random()*(style===1?14:8), style, cols,
      winR:Math.floor(Math.random()*5)+2, winC:Math.floor(Math.random()*3)+2,
      hasSign:style===3||Math.random()>0.6,
      signCol:['#FF0040','#00DDFF','#FFAA00','#FF00FF','#00FF88'][Math.floor(Math.random()*5)],
      signTxt:['PIZZA','DELI','24HR','BAR','NYC','CAFE','SHOP'][Math.floor(Math.random()*7)],
      hasAwning:style===3, awnCol:['#CC2222','#2255AA','#22AA44'][Math.floor(Math.random()*3)],
    };
  },

  mkS(z) {
    return { z, side:Math.random()>0.5?1:-1, type:Math.random()>0.5?'lamp':'trash', offset:1.3 };
  },

  update(speed) {
    for(let b of this.list) b.z-=speed;
    for(let s of this.streetItems) s.z-=speed;
    this.list=this.list.filter(b=>b.z>CONFIG.DESPAWN_Z);
    this.streetItems=this.streetItems.filter(s=>s.z>CONFIG.DESPAWN_Z);
    while(this.list.length<45){const f=Math.max(...this.list.map(b=>b.z),CONFIG.PLAYER_Z);this.list.push(this.mkB(f+3+Math.random()*5));}
    while(this.streetItems.length<25){const f=Math.max(...this.streetItems.map(s=>s.z),CONFIG.PLAYER_Z);this.streetItems.push(this.mkS(f+5+Math.random()*8));}
  },

  draw() {
    const ctx=Renderer.ctx;
    const sorted=[...this.list].sort((a,b)=>b.z-a.z);
    for(const b of sorted){
      if(b.z<1||b.z>250) continue;
      const fog=Renderer.fogAt(b.z); if(fog>0.93) continue;
      const p=Renderer.project(b.side*b.offset,b.z,0);
      if(!p||p.scale<0.008) continue;
      const bw=Renderer.worldToPixels(b.w,b.z), bh=Renderer.worldToPixels(b.h,b.z);
      if(bw<3||bh<4) continue;
      const bx=p.x-bw/2, by=p.y-bh, alpha=1-fog;

      ctx.fillStyle=Renderer.fogColor(b.cols.main,b.z);
      ctx.fillRect(bx,by,bw,bh);
      // Trim
      ctx.fillStyle=Renderer.fogColor(b.cols.trim,b.z);
      ctx.fillRect(bx,by,bw,Math.max(1,bh*0.04));
      // Windows
      if(bw>6&&bh>8){
        const px=bw*0.08,py=bh*0.08;
        const ww=Math.max(1.5,(bw-px*2)/b.winC-1.5), wh=Math.max(1.5,Math.min(ww*1.3,(bh-py*2)/b.winR-1.5));
        for(let r=0;r<b.winR;r++) for(let c=0;c<b.winC;c++){
          ctx.fillStyle=Math.random()>0.35?`rgba(255,${150+Math.random()*80},${40+Math.random()*60},${alpha*0.55})`:`rgba(20,25,40,${alpha*0.45})`;
          ctx.fillRect(bx+px+c*(ww+1.5),by+py+r*(wh+1.5),ww,wh);
        }
      }
      // Awning
      if(b.hasAwning&&alpha>0.3){
        ctx.fillStyle=`rgba(${this.htr(b.awnCol)},${alpha*0.65})`;
        ctx.beginPath();ctx.moveTo(bx-2,p.y-bh*0.12);ctx.lineTo(bx+bw+2,p.y-bh*0.12);
        ctx.lineTo(bx+bw+bw*0.12,p.y-bh*0.04);ctx.lineTo(bx-bw*0.12,p.y-bh*0.04);ctx.closePath();ctx.fill();
      }
      // Neon sign
      if(b.hasSign&&bw>10&&alpha>0.3){
        const sy=by+bh*0.2, sh=Math.max(5,bh*0.07);
        ctx.shadowColor=b.signCol; ctx.shadowBlur=6*alpha;
        ctx.fillStyle=b.signCol; ctx.globalAlpha=alpha*0.8;
        ctx.fillRect(bx+bw*0.1,sy,bw*0.8,sh);
        ctx.shadowBlur=0; ctx.globalAlpha=alpha;
        if(sh>4){ctx.fillStyle=`rgba(255,255,255,${alpha*0.85})`;
        ctx.font=`bold ${Math.max(4,sh*0.65)}px Rubik`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.signTxt,bx+bw/2,sy+sh/2);}
        ctx.globalAlpha=1;
      }
    }
    // Street items
    for(const s of this.streetItems){
      if(s.z<2||s.z>120) continue;
      const fog=Renderer.fogAt(s.z); if(fog>0.8) continue;
      const p=Renderer.project(s.side*s.offset,s.z,0);
      if(!p||p.scale<0.02) continue;
      const a=1-fog, sz=Renderer.worldToPixels(1,s.z);
      if(s.type==='lamp'){
        ctx.fillStyle=`rgba(60,60,60,${a})`;ctx.fillRect(p.x-1,p.y-sz*2.8,2,sz*2.8);
        ctx.fillStyle=`rgba(255,220,100,${a*0.75})`;ctx.beginPath();ctx.arc(p.x,p.y-sz*2.8,sz*0.35,0,6.28);ctx.fill();
        ctx.fillStyle=`rgba(255,220,100,${a*0.04})`;ctx.beginPath();ctx.moveTo(p.x-sz*0.3,p.y-sz*2.8);ctx.lineTo(p.x-sz*1.2,p.y);ctx.lineTo(p.x+sz*1.2,p.y);ctx.lineTo(p.x+sz*0.3,p.y-sz*2.8);ctx.closePath();ctx.fill();
      } else {
        ctx.fillStyle=`rgba(50,55,50,${a})`;ctx.fillRect(p.x-sz*0.25,p.y-sz*0.5,sz*0.5,sz*0.5);
      }
    }
  },
  htr(h){const c=parseInt(h.replace('#',''),16);return`${c>>16},${(c>>8)&0xff},${c&0xff}`;},
};

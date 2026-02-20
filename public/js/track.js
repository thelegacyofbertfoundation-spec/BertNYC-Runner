// =============================================
// BERT RUNNER NYC - Track v5
// =============================================
const Track = {
  details: null,

  initDetails() {
    this.details = [];
    for (let i = 0; i < 40; i++) {
      this.details.push({
        type: ['manhole','crosswalk','puddle'][Math.floor(Math.random()*3)],
        lane: Math.floor(Math.random()*3)-1,
      });
    }
  },

  draw(distance) {
    if (!this.details) this.initDetails();
    const ctx = Renderer.ctx;
    const W = Renderer.W, H = Renderer.H, hY = Renderer.horizonY, cx = Renderer.cx;

    const farZ = 250, nearZ = CONFIG.PLAYER_Z * 0.3;
    const steps = 100;
    const dz = (farZ - nearZ) / steps;

    for (let i = 0; i < steps; i++) {
      const z1 = farZ - i * dz;
      const z2 = farZ - (i+1) * dz;
      const p1 = Renderer.project(0, z1, 0);
      const p2 = Renderer.project(0, z2, 0);
      if (!p1 || !p2) continue;
      if (p1.y < hY-5 && p2.y < hY-5) continue;

      const rw1 = p1.roadHW, rw2 = p2.roadHW;
      const sw1 = rw1*1.35, sw2 = rw2*1.35;
      const fog = Renderer.fogAt(z1);
      const seg = Math.floor(distance*3 + i*0.5);

      // Sidewalk
      ctx.fillStyle = Renderer.fogColor(seg%2===0?'#555':'#505050', z1);
      ctx.beginPath();
      ctx.moveTo(cx-sw1,p1.y); ctx.lineTo(cx+sw1,p1.y);
      ctx.lineTo(cx+sw2,p2.y); ctx.lineTo(cx-sw2,p2.y);
      ctx.closePath(); ctx.fill();

      // Sidewalk grid lines
      if (i%8===0 && p1.scale>0.03) {
        ctx.strokeStyle = `rgba(80,80,80,${(1-fog)*0.35})`;
        ctx.lineWidth = Math.max(0.3, p1.scale*2);
        ctx.beginPath(); ctx.moveTo(cx-sw1,p1.y); ctx.lineTo(cx+sw1,p1.y); ctx.stroke();
      }

      // Road
      ctx.fillStyle = Renderer.fogColor(seg%2===0?'#363636':'#333', z1);
      ctx.beginPath();
      ctx.moveTo(cx-rw1,p1.y); ctx.lineTo(cx+rw1,p1.y);
      ctx.lineTo(cx+rw2,p2.y); ctx.lineTo(cx-rw2,p2.y);
      ctx.closePath(); ctx.fill();

      // Asphalt texture
      if (i%2===0 && p1.scale>0.04 && fog<0.6) {
        ctx.fillStyle = `rgba(55,55,55,${(1-fog)*0.2})`;
        for (let t=0;t<4;t++) {
          ctx.fillRect(cx-rw1+Math.random()*rw1*2, (p1.y+p2.y)/2, Math.random()*4+1, 0.8);
        }
      }

      // Curbs
      if (p1.scale > 0.02) {
        const ca = (1-fog)*0.55;
        ctx.strokeStyle = `rgba(150,145,130,${ca})`;
        ctx.lineWidth = Math.max(0.8, p1.scale*5);
        ctx.beginPath(); ctx.moveTo(cx-rw1,p1.y); ctx.lineTo(cx-rw2,p2.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+rw1,p1.y); ctx.lineTo(cx+rw2,p2.y); ctx.stroke();
      }

      // Lane dashes
      const ds = Math.floor(distance*5+i*0.6);
      if (ds%3<2 && rw1>8 && fog<0.8) {
        const a = Math.min(1,p2.scale*6)*(1-fog);
        ctx.fillStyle = `rgba(255,210,0,${a*0.6})`;
        for (let l=-1;l<=1;l+=2) {
          const x1=cx+l*rw1/3, x2=cx+l*rw2/3;
          const dw = Math.max(0.8, p1.scale*5);
          ctx.beginPath();
          ctx.moveTo(x1-dw/2,p1.y); ctx.lineTo(x1+dw/2,p1.y);
          ctx.lineTo(x2+dw/2,p2.y); ctx.lineTo(x2-dw/2,p2.y);
          ctx.closePath(); ctx.fill();
        }
      }

      // Road details
      if (i%25===0 && p1.scale>0.04 && fog<0.5) {
        const di = Math.floor(distance+i)%this.details.length;
        this.drawDetail(this.details[di], cx, p1.y, p2.y, rw1, p1.scale, fog);
      }
    }

    // Fill below
    const pN = Renderer.project(0, nearZ, 0);
    if (pN && pN.y < H) {
      ctx.fillStyle = '#363636';
      ctx.fillRect(0, pN.y, W, H-pN.y);
    }
  },

  drawDetail(det, cx, y1, y2, rw, scale, fog) {
    const ctx = Renderer.ctx;
    const a = (1-fog)*0.35;
    if (det.type==='crosswalk') {
      ctx.fillStyle = `rgba(220,220,210,${a})`;
      const sw=rw*0.55, sh=Math.max(1, scale*4);
      for (let s=0;s<4;s++) ctx.fillRect(cx-sw, y1+s*sh*2.5, sw*2, sh);
    } else if (det.type==='manhole') {
      const mx=cx+det.lane*rw/3, mr=Math.max(2,scale*25);
      ctx.fillStyle=`rgba(45,45,45,${a})`; ctx.beginPath(); ctx.arc(mx,(y1+y2)/2,mr,0,6.28); ctx.fill();
      ctx.strokeStyle=`rgba(75,75,75,${a})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(mx,(y1+y2)/2,mr,0,6.28); ctx.stroke();
    }
  },
};

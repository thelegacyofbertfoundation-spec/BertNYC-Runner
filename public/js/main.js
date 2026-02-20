// =============================================
// BERT RUNNER NYC - Main v5
// =============================================
const Game = {
  rafId: null, shakeX:0, shakeY:0,

  init() {
    State.load(); Renderer.init();
    UI.showScreen('menuScreen'); UI.updateMenuUI();
    if(window.Telegram?.WebApp){const tg=window.Telegram.WebApp;tg.ready();tg.expand();try{tg.setHeaderColor('#0D1117');tg.setBackgroundColor('#0D1117');}catch(e){}}
    console.log('🐾 Bert Runner NYC v5');
  },

  loop() {
    if(!State.game.running) return;
    const g=State.game; g.frameCount++;
    g.speed=Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED+g.frameCount*CONFIG.SPEED_INCREMENT);
    g.distance+=g.speed;
    if(g.frameCount%3===0) g.score+=g.hasScoreBoost?2:1;

    Player.update(); Buildings.update(g.speed);
    Obstacles.spawn(g.distance); Obstacles.update(g.speed);
    Coins.spawn(g.distance); Coins.update(g.speed);
    Particles.update();

    const pi=Player.getCollisionInfo();
    const hit=Obstacles.checkCollision(pi);
    if(hit){
      if(g.hasShield){
        g.hasShield=false;Obstacles.remove(hit);
        if(hit._x){Particles.spawn(hit._x,hit._y,'#58A6FF',12);Particles.spawn(hit._x,hit._y,'#fff',6);}
        this.shakeX=6;this.shakeY=4;UI.showToast('Shield saved you! 🛡️');
      } else {
        cancelAnimationFrame(Game.rafId);
        if(pi){Particles.spawn(pi.x,pi.y,'#FF4444',18);Particles.spawn(pi.x,pi.y,Player.colors[0],12);}
        this.shakeX=10;this.shakeY=7;
        this.render();
        setTimeout(()=>UI.gameOver(),250);
        return;
      }
    }

    const got=Coins.checkCollection(pi);
    if(got>0) g.coins+=g.hasCoinBoost?got*2:got;

    this.shakeX*=0.85;this.shakeY*=0.85;
    if(Math.abs(this.shakeX)<0.5)this.shakeX=0;
    if(Math.abs(this.shakeY)<0.5)this.shakeY=0;

    this.render(); UI.updateHUD();
    Game.rafId=requestAnimationFrame(Game.loop.bind(Game));
  },

  render() {
    const ctx=Renderer.ctx, W=Renderer.W, H=Renderer.H;
    ctx.save();
    if(this.shakeX||this.shakeY) ctx.translate((Math.random()-0.5)*this.shakeX,(Math.random()-0.5)*this.shakeY);
    ctx.clearRect(-20,-20,W+40,H+40);

    Renderer.drawBackground(State.game.frameCount);
    Buildings.draw();
    Track.draw(State.game.distance);
    Obstacles.draw();
    Coins.draw(State.game.frameCount);
    Player.draw();
    Particles.draw();
    ctx.restore();

    // Vignette
    const sf=Math.min(1,(State.game.speed-CONFIG.INITIAL_SPEED)/(CONFIG.MAX_SPEED-CONFIG.INITIAL_SPEED));
    const vig=ctx.createRadialGradient(W/2,H/2,W*0.3,W/2,H/2,W*0.8);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,`rgba(0,0,0,${0.25+sf*0.25})`);
    ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

    // Speed lines
    if(State.game.speed>CONFIG.INITIAL_SPEED*1.5){
      const cx=Renderer.cx,cy=Renderer.horizonY;
      ctx.strokeStyle=`rgba(255,255,255,${sf*0.05})`;ctx.lineWidth=1;
      for(let i=0;i<Math.floor(sf*8);i++){const a=Math.random()*6.28,r1=25+Math.random()*50,r2=r1+40+Math.random()*80;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1*0.4);ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2*0.4);ctx.stroke();}
    }
  },
};

document.addEventListener('DOMContentLoaded',()=>Game.init());

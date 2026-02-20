// =============================================
// BERT RUNNER NYC - Main Game Loop
// =============================================
const Game = {
  rafId: null,
  shakeX: 0, shakeY: 0,

  init() {
    State.load();
    Renderer.init();
    UI.showScreen('menuScreen');
    UI.updateMenuUI();
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); tg.expand();
      try { tg.setHeaderColor('#0D1117'); tg.setBackgroundColor('#0D1117'); } catch(e){}
    }
    console.log('🐾 Bert Runner NYC v4 initialized');
  },

  loop() {
    if (!State.game.running) return;
    const g = State.game;
    g.frameCount++;

    g.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + g.frameCount * CONFIG.SPEED_INCREMENT);
    g.distance += g.speed;

    if (g.frameCount % 3 === 0) g.score += g.hasScoreBoost ? 2 : 1;

    // Update
    Player.update();
    Buildings.update(g.speed);
    Obstacles.spawn(g.distance);
    Obstacles.update(g.speed);
    Coins.spawn(g.distance);
    Coins.update(g.speed);
    Particles.update();

    // Collision
    const pi = Player.getCollisionInfo();
    const hit = Obstacles.checkCollision(pi);
    if (hit) {
      if (g.hasShield) {
        g.hasShield = false;
        Obstacles.remove(hit);
        if(hit._x) {
          Particles.spawn(hit._x, hit._y, '#58A6FF', 15);
          Particles.spawn(hit._x, hit._y, '#ffffff', 8);
        }
        this.shakeX = 8; this.shakeY = 5;
        UI.showToast('Shield saved you! 🛡️');
      } else {
        cancelAnimationFrame(Game.rafId);
        // Death particles
        if (pi) {
          Particles.spawn(pi.x, pi.y, '#FF4444', 20);
          Particles.spawn(pi.x, pi.y, Player.colors[0], 15);
        }
        this.shakeX = 12; this.shakeY = 8;
        // Brief delay before game over screen
        setTimeout(() => UI.gameOver(), 300);
        // Render one more frame with shake
        this.render();
        return;
      }
    }

    const got = Coins.checkCollection(pi);
    if (got > 0) g.coins += g.hasCoinBoost ? got*2 : got;

    // Screen shake decay
    this.shakeX *= 0.85;
    this.shakeY *= 0.85;
    if (Math.abs(this.shakeX) < 0.5) this.shakeX = 0;
    if (Math.abs(this.shakeY) < 0.5) this.shakeY = 0;

    this.render();
    UI.updateHUD();
    Game.rafId = requestAnimationFrame(Game.loop.bind(Game));
  },

  render() {
    const ctx = Renderer.ctx;
    const W = Renderer.W, H = Renderer.H;

    // Apply screen shake
    ctx.save();
    if (this.shakeX || this.shakeY) {
      ctx.translate(
        (Math.random()-0.5) * this.shakeX,
        (Math.random()-0.5) * this.shakeY
      );
    }

    ctx.clearRect(-20, -20, W+40, H+40);

    // Rich background
    Renderer.drawBackground(State.game.frameCount);

    // Scene
    Buildings.draw();
    Track.draw(State.game.distance);
    Obstacles.draw();
    Coins.draw(State.game.frameCount);
    Player.draw();
    Particles.draw();

    ctx.restore();

    // Post-processing effects
    this.drawVignette();
    this.drawSpeedLines();
  },

  drawVignette() {
    const ctx = Renderer.ctx;
    const W = Renderer.W, H = Renderer.H;
    const speedFactor = Math.min(1, (State.game.speed-CONFIG.INITIAL_SPEED)/(CONFIG.MAX_SPEED-CONFIG.INITIAL_SPEED));

    // Corner vignette (always present, stronger at speed)
    const vigStrength = 0.3 + speedFactor * 0.3;
    const vig = ctx.createRadialGradient(W/2, H/2, W*0.3, W/2, H/2, W*0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${vigStrength})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Bottom road glow
    const roadGlow = ctx.createLinearGradient(0, H*0.85, 0, H);
    roadGlow.addColorStop(0, 'rgba(0,0,0,0)');
    roadGlow.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = roadGlow;
    ctx.fillRect(0, H*0.85, W, H*0.15);
  },

  drawSpeedLines() {
    if (State.game.speed < CONFIG.INITIAL_SPEED * 1.5) return;
    const ctx = Renderer.ctx;
    const cx = Renderer.cx, cy = Renderer.horizonY;
    const sf = (State.game.speed-CONFIG.INITIAL_SPEED)/(CONFIG.MAX_SPEED-CONFIG.INITIAL_SPEED);
    const count = Math.floor(sf * 10);

    ctx.strokeStyle = `rgba(255,255,255,${sf * 0.06})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      const a = Math.random()*6.28;
      const r1 = 30+Math.random()*60;
      const r2 = r1+40+Math.random()*100;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1*0.4);
      ctx.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2*0.4);
      ctx.stroke();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());

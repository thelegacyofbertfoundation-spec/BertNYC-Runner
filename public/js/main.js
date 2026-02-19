// =============================================
// BERT RUNNER NYC - Main Game Loop
// =============================================
const Game = {
  rafId: null,

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
    console.log('🐾 Bert Runner NYC v3 initialized');
  },

  loop() {
    if (!State.game.running) return;
    const g = State.game;
    g.frameCount++;

    // Accelerate
    g.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + g.frameCount * CONFIG.SPEED_INCREMENT);
    g.distance += g.speed;

    // Score
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
        if (hit._x) Particles.spawn(hit._x, hit._y, '#58A6FF', 10);
        UI.showToast('Shield saved you! 🛡️');
      } else {
        cancelAnimationFrame(Game.rafId);
        UI.gameOver();
        return;
      }
    }

    const coinsGot = Coins.checkCollection(pi);
    if (coinsGot > 0) g.coins += g.hasCoinBoost ? coinsGot * 2 : coinsGot;

    // Render
    Game.render();
    UI.updateHUD();
    Game.rafId = requestAnimationFrame(Game.loop.bind(Game));
  },

  render() {
    const ctx = Renderer.ctx;
    ctx.clearRect(0, 0, Renderer.W, Renderer.H);

    // Background
    Renderer.clearSky();
    Renderer.drawStars(State.game.frameCount);
    Renderer.drawMoon();

    // Scene (far to near order)
    Buildings.draw();
    Track.draw(State.game.distance);
    Obstacles.draw();
    Coins.draw(State.game.frameCount);
    Player.draw();
    Particles.draw();

    // Speed lines
    if (State.game.speed > CONFIG.INITIAL_SPEED * 2) {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      const cx = Renderer.cx, cy = Renderer.horizonY;
      for (let i = 0; i < 5; i++) {
        const a = Math.random()*6.28, r1 = 30+Math.random()*60, r2 = r1+50+Math.random()*80;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1*0.4);
        ctx.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2*0.4);
        ctx.stroke();
      }
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());

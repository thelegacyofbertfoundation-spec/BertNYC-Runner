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
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0D1117');
        tg.setBackgroundColor('#0D1117');
      } catch(e) {}
    }

    console.log('🐾 Bert Runner NYC initialized');
  },

  loop() {
    if (!State.game.running) return;

    const g = State.game;
    g.frameCount++;

    // Speed increase
    g.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + g.frameCount * CONFIG.SPEED_INCREMENT);
    g.distance += g.speed;

    // Score
    if (g.frameCount % 3 === 0) {
      g.score += g.hasScoreBoost ? 2 : 1;
    }

    // === UPDATE ===
    Player.update();
    Buildings.update(g.speed);
    Obstacles.spawn(g.distance);
    Obstacles.update(g.speed);
    Coins.spawn(g.distance);
    Coins.update(g.speed);
    Particles.update();

    // === COLLISION ===
    const pb = Player.getScreenBounds();

    const hit = Obstacles.checkCollision(pb);
    if (hit) {
      if (g.hasShield) {
        g.hasShield = false;
        Obstacles.remove(hit);
        if (hit._sx) Particles.spawn(hit._sx, hit._sy, '#58A6FF', 10);
        UI.showToast('Shield saved you! 🛡️');
      } else {
        // GAME OVER
        cancelAnimationFrame(Game.rafId);
        UI.gameOver();
        return;
      }
    }

    const coinsGot = Coins.checkCollection(pb);
    if (coinsGot > 0) {
      g.coins += g.hasCoinBoost ? coinsGot * 2 : coinsGot;
    }

    // === RENDER ===
    Game.render();
    UI.updateHUD();

    Game.rafId = requestAnimationFrame(Game.loop.bind(Game));
  },

  render() {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;

    ctx.clearRect(0, 0, W, H);

    // Sky + stars + moon
    Renderer.clearSky();
    Renderer.drawStars(State.game.frameCount);
    Renderer.drawMoon();

    // Buildings (behind road)
    Buildings.draw();

    // Road
    Track.draw(State.game.distance);

    // Obstacles
    Obstacles.draw();

    // Coins
    Coins.draw(State.game.frameCount);

    // Player (on top)
    Player.draw();

    // Particles
    Particles.draw();

    // Speed lines at high speed
    if (State.game.speed > CONFIG.INITIAL_SPEED * 2) {
      this.drawSpeedLines();
    }
  },

  drawSpeedLines() {
    const ctx = Renderer.ctx;
    const cx = Renderer.W / 2;
    const cy = Renderer.horizonY;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * 6.28;
      const r1 = 40 + Math.random() * 80;
      const r2 = r1 + 60 + Math.random() * 100;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.4);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.4);
      ctx.stroke();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());

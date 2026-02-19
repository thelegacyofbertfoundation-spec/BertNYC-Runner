// =============================================
// BERT RUNNER NYC - Main Game Loop
// =============================================

const Game = {
  lastTime: 0,

  init() {
    // Load saved state
    State.load();

    // Init renderer
    Renderer.init();

    // Show menu
    UI.showScreen('menuScreen');
    UI.updateMenuUI();

    // Telegram WebApp integration
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0D1117');
      tg.setBackgroundColor('#0D1117');
    }

    console.log('🐾 Bert Runner NYC initialized');
  },

  loop(timestamp) {
    if (!State.game.running) return;

    const g = State.game;
    g.frameCount++;

    // Increase speed over time
    g.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + g.frameCount * CONFIG.SPEED_INCREMENT);

    // Advance distance
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
    Coins.update(g.speed, g.frameCount);
    Particles.update();

    // Collision detection
    const playerBounds = Player.getBounds();

    // Check obstacle collision
    const hit = Obstacles.checkCollision(playerBounds, g.distance);
    if (hit) {
      if (g.hasShield) {
        g.hasShield = false;
        Obstacles.remove(hit);
        const p = Renderer.project(hit.x, hit.h * 0.5, hit.z - g.distance);
        if (p) Particles.spawn(p.x, p.y, '#58A6FF', 12);
        UI.showToast('Shield saved you! 🛡️');
      } else {
        UI.gameOver();
        return;
      }
    }

    // Check coin collection
    const coinsCollected = Coins.checkCollection(playerBounds, g.distance);
    if (coinsCollected > 0) {
      const value = g.hasCoinBoost ? coinsCollected * 2 : coinsCollected;
      g.coins += value;
    }

    // === RENDER ===
    Game.render();

    // Update HUD
    UI.updateHUD();

    // Next frame
    requestAnimationFrame(Game.loop.bind(Game));
  },

  render() {
    const g = State.game;
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Sky
    Renderer.clearSky();
    Renderer.drawStars(g.frameCount);

    // Moon
    this.drawMoon();

    // Buildings (behind road)
    Buildings.draw();

    // Road / Track
    Track.draw(g.distance);

    // Obstacles (sorted far to near)
    Obstacles.draw(g.distance);

    // Coins
    Coins.draw(g.distance, g.frameCount);

    // Player (always on top)
    Player.draw();

    // Particles (screen space, on top of everything)
    Particles.draw();

    // Speed lines effect at high speed
    if (g.speed > CONFIG.INITIAL_SPEED * 1.8) {
      this.drawSpeedLines();
    }
  },

  drawMoon() {
    const ctx = Renderer.ctx;
    const moonX = Renderer.W * 0.8;
    const moonY = Renderer.vanishY * 0.3;
    const moonR = 25;

    ctx.fillStyle = '#E8E8D0';
    ctx.shadowColor = 'rgba(255,255,200,0.3)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Craters
    ctx.fillStyle = 'rgba(200,200,180,0.4)';
    ctx.beginPath();
    ctx.arc(moonX - 6, moonY - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 8, moonY + 3, 3, 0, Math.PI * 2);
    ctx.fill();
  },

  drawSpeedLines() {
    const ctx = Renderer.ctx;
    const W = Renderer.W;
    const H = Renderer.H;
    const cx = W / 2;
    const cy = Renderer.vanishY;

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r1 = 50 + Math.random() * 100;
      const r2 = r1 + 80 + Math.random() * 120;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1 * 0.4);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2 * 0.4);
      ctx.stroke();
    }
  },
};

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});

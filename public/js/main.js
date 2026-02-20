// =============================================
// BERT RUNNER NYC - Main Game Loop (Three.js)
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
      } catch (e) {}
    }
    console.log('🐾 Bert Runner NYC v7 (Three.js) initialized');
  },

  loop() {
    if (!State.game.running) return;
    const g = State.game;
    g.frameCount++;

    // Gradual speed increase
    g.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.INITIAL_SPEED + g.frameCount * CONFIG.SPEED_INCREMENT);
    g.distance += g.speed;

    // Score
    if (g.frameCount % 5 === 0) g.score += g.hasScoreBoost ? 2 : 1;

    // Update all systems
    Player.update();
    Track.update(g.speed);
    Buildings.update(g.speed);
    Obstacles.spawn(g.distance);
    Obstacles.update(g.speed);
    Coins.spawn(g.distance);
    Coins.update(g.speed, g.frameCount);
    Particles.update();

    // Player trail particles
    if (g.frameCount % 3 === 0) {
      const pi = Player.getCollisionInfo();
      if (pi) {
        Particles.spawnTrail(pi.x, 0.2, pi.z, Player.colors[1]);
      }
    }

    // Collision detection
    const pi = Player.getCollisionInfo();
    const hit = Obstacles.checkCollision(pi);
    if (hit) {
      if (g.hasShield) {
        g.hasShield = false;
        Particles.burst(hit.group.position.x, 1, hit.group.position.z, 0x58a6ff);
        Obstacles.remove(hit);
        UI.showToast('Shield saved you! 🛡️');
      } else {
        cancelAnimationFrame(Game.rafId);
        if (pi) Particles.burst(pi.x, pi.y, pi.z, 0xff4444);
        // Final render
        Particles.update();
        Renderer.render();
        setTimeout(() => UI.gameOver(), 350);
        return;
      }
    }

    // Coin collection
    const got = Coins.checkCollection(pi);
    if (got > 0) g.coins += g.hasCoinBoost ? got * 2 : got;

    // Camera follow — smooth, with slight sway
    const cam = Renderer.camera;
    const targetX = Player.group.position.x * 0.3;
    const targetY = 4.5 + Player.group.position.y * 0.3;
    cam.position.x += (targetX - cam.position.x) * 0.05;
    cam.position.y += (targetY - cam.position.y) * 0.08;

    // Render
    Renderer.render();
    UI.updateHUD();

    Game.rafId = requestAnimationFrame(Game.loop.bind(Game));
  },
};

document.addEventListener('DOMContentLoaded', () => Game.init());

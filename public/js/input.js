// =============================================
// BERT RUNNER NYC - Input
// =============================================
const Input = {
  startX: 0, startY: 0, startTime: 0,
  SWIPE_THRESH: 40,

  init() {
    const el = document.getElementById('gameCanvas');
    el.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
    el.addEventListener('touchend', e => this.onTouchEnd(e), { passive: false });
    document.addEventListener('keydown', e => this.onKey(e));
  },

  onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this.startX = t.clientX;
    this.startY = t.clientY;
    this.startTime = Date.now();
  },

  onTouchEnd(e) {
    e.preventDefault();
    if (!State.game.running) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.startX;
    const dy = t.clientY - this.startY;
    const dt = Date.now() - this.startTime;

    if (dt < 300) {
      if (Math.abs(dx) > this.SWIPE_THRESH && Math.abs(dx) > Math.abs(dy)) {
        Player.switchLane(dx > 0 ? 1 : -1);
      } else if (dy < -this.SWIPE_THRESH) {
        Player.jump();
      } else {
        // Tap = jump
        Player.jump();
      }
    } else if (Math.abs(dx) > this.SWIPE_THRESH) {
      Player.switchLane(dx > 0 ? 1 : -1);
    }
  },

  onKey(e) {
    if (!State.game.running) return;
    switch (e.key) {
      case 'ArrowLeft': case 'a': Player.switchLane(-1); break;
      case 'ArrowRight': case 'd': Player.switchLane(1); break;
      case 'ArrowUp': case 'w': case ' ': Player.jump(); break;
    }
  },
};

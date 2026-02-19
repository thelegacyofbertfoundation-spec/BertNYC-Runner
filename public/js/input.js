// =============================================
// BERT RUNNER NYC - Input Handling
// =============================================

const Input = {
  touchStartX: 0,
  touchStartY: 0,
  touchStartTime: 0,
  active: false,

  init() {
    this.active = false;
  },

  bind() {
    const canvas = Renderer.canvas;
    this.active = true;

    canvas.ontouchstart = (e) => {
      e.preventDefault();
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
    };

    canvas.ontouchend = (e) => {
      e.preventDefault();
      if (!State.game.running) return;

      const dx = e.changedTouches[0].clientX - this.touchStartX;
      const dy = e.changedTouches[0].clientY - this.touchStartY;
      const dt = Date.now() - this.touchStartTime;

      // Determine gesture
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        // Horizontal swipe → lane change
        Player.switchLane(dx > 0 ? 1 : -1);
      } else if (dy < -30) {
        // Swipe up → jump
        Player.jump();
      } else if (dt < 300) {
        // Quick tap → jump
        Player.jump();
      }
    };

    // Keyboard (for desktop testing)
    document.onkeydown = (e) => {
      if (!State.game.running) return;
      switch(e.key) {
        case 'ArrowLeft':
        case 'a':
          Player.switchLane(-1);
          break;
        case 'ArrowRight':
        case 'd':
          Player.switchLane(1);
          break;
        case 'ArrowUp':
        case 'w':
        case ' ':
          Player.jump();
          e.preventDefault();
          break;
      }
    };
  },

  unbind() {
    this.active = false;
    const canvas = Renderer.canvas;
    canvas.ontouchstart = null;
    canvas.ontouchend = null;
    document.onkeydown = null;
  },
};

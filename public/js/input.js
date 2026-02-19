// =============================================
// BERT RUNNER NYC - Input
// =============================================
const Input = {
  startX: 0, startY: 0, startTime: 0,

  bind() {
    const c = Renderer.canvas;
    c.ontouchstart = (e) => {
      e.preventDefault();
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.startTime = Date.now();
    };
    c.ontouchend = (e) => {
      e.preventDefault();
      if (!State.game.running) return;
      const dx = e.changedTouches[0].clientX - this.startX;
      const dy = e.changedTouches[0].clientY - this.startY;
      const dt = Date.now() - this.startTime;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        Player.switchLane(dx > 0 ? 1 : -1);
      } else if (dy < -30) {
        Player.jump();
      } else if (dt < 300) {
        Player.jump();
      }
    };
    document.onkeydown = (e) => {
      if (!State.game.running) return;
      switch(e.key) {
        case 'ArrowLeft': case 'a': Player.switchLane(-1); break;
        case 'ArrowRight': case 'd': Player.switchLane(1); break;
        case 'ArrowUp': case 'w': case ' ': Player.jump(); e.preventDefault(); break;
      }
    };
  },
  unbind() {
    Renderer.canvas.ontouchstart = null;
    Renderer.canvas.ontouchend = null;
    document.onkeydown = null;
  },
};

// =============================================
// BERT RUNNER NYC - Obstacles
// =============================================

const Obstacles = {
  list: [],
  nextSpawnZ: 30,

  init() {
    this.list = [];
    this.nextSpawnZ = 30;
  },

  spawn(distance) {
    const worldZ = distance + CONFIG.DRAW_DISTANCE;

    // Check if we should spawn
    if (worldZ < this.nextSpawnZ) return;

    // Pick random lane(s)
    const lane = Math.floor(Math.random() * 3);
    const type = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];

    this.list.push({
      x: (lane - 1) * CONFIG.LANE_WIDTH,
      y: 0,
      z: worldZ,
      lane: lane,
      ...type,
    });

    // Sometimes spawn double obstacle (2 lanes blocked)
    if (Math.random() < 0.25 && State.game.speed > CONFIG.INITIAL_SPEED * 1.3) {
      let lane2 = lane;
      while (lane2 === lane) lane2 = Math.floor(Math.random() * 3);
      const type2 = CONFIG.OBSTACLES[Math.floor(Math.random() * CONFIG.OBSTACLES.length)];
      this.list.push({
        x: (lane2 - 1) * CONFIG.LANE_WIDTH,
        y: 0,
        z: worldZ + Math.random() * 3,
        lane: lane2,
        ...type2,
      });
    }

    // Set next spawn distance
    const gapRange = CONFIG.OBSTACLE_MAX_GAP - CONFIG.OBSTACLE_MIN_GAP;
    const speedFactor = Math.min(1, (State.game.speed - CONFIG.INITIAL_SPEED) / (CONFIG.MAX_SPEED - CONFIG.INITIAL_SPEED));
    const gap = CONFIG.OBSTACLE_MAX_GAP - gapRange * speedFactor * 0.5;
    this.nextSpawnZ = worldZ + gap * (0.7 + Math.random() * 0.6);
  },

  update(speed) {
    // Remove passed obstacles
    this.list = this.list.filter(o => o.z > -5);
  },

  draw(distance) {
    // Sort by z (far first for painter's algorithm)
    const sorted = [...this.list].sort((a, b) => b.z - a.z);

    for (const o of sorted) {
      const relZ = o.z - distance;
      if (relZ < 0 || relZ > CONFIG.DRAW_DISTANCE) continue;

      // Draw 3D box
      Renderer.drawBox3D(
        o.x, o.y, relZ,
        o.w, o.h, o.d,
        o.color, o.colorDark
      );

      // Draw emoji on front face for extra visibility
      const front = Renderer.project(o.x, o.h * 0.5, relZ);
      if (front) {
        const size = Renderer.projectHeight(o.h * 0.6, relZ);
        if (size > 8) {
          const ctx = Renderer.ctx;
          ctx.font = `${Math.min(size, 40)}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(o.emoji, front.x, front.y);
        }
      }
    }
  },

  // Check collision with player
  checkCollision(playerBounds, distance) {
    for (const o of this.list) {
      const relZ = o.z - distance;
      const dz = Math.abs(relZ - playerBounds.z);
      const dx = Math.abs(o.x - playerBounds.x);

      // Only check obstacles near player Z
      if (dz < (o.d / 2 + playerBounds.r) &&
          dx < (o.w / 2 + playerBounds.r - 0.2)) {
        // Height check - can jump over low obstacles
        if (playerBounds.y < o.h - 0.2) {
          return o;
        }
      }
    }
    return null;
  },

  // Remove obstacle (used when shield breaks)
  remove(obstacle) {
    const idx = this.list.indexOf(obstacle);
    if (idx >= 0) this.list.splice(idx, 1);
  },
};

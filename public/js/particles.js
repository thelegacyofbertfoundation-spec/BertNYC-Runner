// =============================================
// BERT RUNNER NYC - 3D Particles
// =============================================
const Particles = {
  points: null,
  particles: [],
  MAX: 200,
  geo: null,
  positions: null,
  colors: null,
  sizes: null,

  init() {
    if (this.points) Renderer.scene.remove(this.points);
    this.particles = [];

    this.geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.MAX * 3);
    this.colors = new Float32Array(this.MAX * 3);
    this.sizes = new Float32Array(this.MAX);

    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geo, mat);
    Renderer.scene.add(this.points);
  },

  burst(x, y, z, color) {
    const c = new THREE.Color(color);
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.15,
        vy: Math.random() * 0.12 + 0.02,
        vz: (Math.random() - 0.5) * 0.15,
        life: 25 + Math.random() * 15,
        maxLife: 40,
        r: c.r, g: c.g, b: c.b,
      });
    }
    if (this.particles.length > this.MAX) {
      this.particles = this.particles.slice(-this.MAX);
    }
  },

  // Trail behind player
  spawnTrail(x, y, z, color) {
    const c = new THREE.Color(color);
    this.particles.push({
      x: x + (Math.random() - 0.5) * 0.3,
      y: y + Math.random() * 0.2,
      z: z + 0.5,
      vx: (Math.random() - 0.5) * 0.02,
      vy: Math.random() * 0.03,
      vz: 0.02 + Math.random() * 0.02,
      life: 12 + Math.random() * 6,
      maxLife: 18,
      r: c.r, g: c.g, b: c.b,
    });
    if (this.particles.length > this.MAX) {
      this.particles = this.particles.slice(-this.MAX);
    }
  },

  // Compatibility alias
  spawn(x, y, color, count) {
    this.burst(x || 0, y || 1, 0, typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : (color || 0xffffff));
  },

  update() {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.vy -= 0.002; // gravity
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Update buffer
    for (let i = 0; i < this.MAX; i++) {
      const p = this.particles[i];
      if (p) {
        const t = p.life / p.maxLife;
        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;
        this.colors[i * 3] = p.r * t;
        this.colors[i * 3 + 1] = p.g * t;
        this.colors[i * 3 + 2] = p.b * t;
        this.sizes[i] = t * 0.2;
      } else {
        this.positions[i * 3 + 1] = -100; // hide
        this.sizes[i] = 0;
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.size.needsUpdate = true;
  },
};

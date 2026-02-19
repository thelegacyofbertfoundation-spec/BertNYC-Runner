// =============================================
// BERT RUNNER NYC - State Management
// =============================================

const State = {
  // Persistent state (saved to localStorage)
  data: {
    energy: 5,
    lastEnergyTime: Date.now(),
    coins: 0,
    bestScore: 0,
    ownedSkins: ['default'],
    equippedSkin: 'default',
    powerUps: { magnet: 0, shield: 0, doubleCoins: 0, scoreBoost: 0 },
    totalGames: 0,
    weeklyScores: [],
    monthlyScores: [],
    allTimeScores: [],
    vipExpiry: 0,
    unlimitedExpiry: 0,
  },

  // Runtime game state (not saved)
  game: {
    running: false,
    score: 0,
    coins: 0,
    speed: CONFIG.INITIAL_SPEED,
    distance: 0,
    frameCount: 0,
    continueCount: 0,
    hasScoreBoost: false,
    hasCoinBoost: false,
    hasShield: false,
    hasMagnet: false,
  },

  load() {
    try {
      const saved = localStorage.getItem('bertRunnerState');
      if (saved) this.data = { ...this.data, ...JSON.parse(saved) };
    } catch(e) { console.warn('State load failed:', e); }
  },

  save() {
    try {
      localStorage.setItem('bertRunnerState', JSON.stringify(this.data));
    } catch(e) { console.warn('State save failed:', e); }
  },

  regenEnergy() {
    if (this.data.energy >= CONFIG.MAX_ENERGY) {
      this.data.lastEnergyTime = Date.now();
      return;
    }
    const elapsed = Date.now() - this.data.lastEnergyTime;
    const gained = Math.floor(elapsed / CONFIG.ENERGY_REGEN_MS);
    if (gained > 0) {
      this.data.energy = Math.min(CONFIG.MAX_ENERGY, this.data.energy + gained);
      this.data.lastEnergyTime = Date.now();
      this.save();
    }
  },

  isUnlimited() {
    return Date.now() < this.data.unlimitedExpiry || Date.now() < this.data.vipExpiry;
  },

  getSkin() {
    return CONFIG.SKINS.find(s => s.id === this.data.equippedSkin) || CONFIG.SKINS[0];
  },

  resetGame() {
    this.game.running = false;
    this.game.score = 0;
    this.game.coins = 0;
    this.game.speed = CONFIG.INITIAL_SPEED;
    this.game.distance = 0;
    this.game.frameCount = 0;
    this.game.continueCount = 0;
    this.game.hasScoreBoost = false;
    this.game.hasCoinBoost = false;
    this.game.hasShield = false;
    this.game.hasMagnet = false;
  },

  applyPowerUps() {
    const pu = this.data.powerUps;
    if (pu.scoreBoost > 0)  { this.game.hasScoreBoost = true; pu.scoreBoost--; }
    if (pu.doubleCoins > 0) { this.game.hasCoinBoost = true;  pu.doubleCoins--; }
    if (pu.shield > 0)      { this.game.hasShield = true;     pu.shield--; }
    if (pu.magnet > 0)      { this.game.hasMagnet = true;     pu.magnet--; }
    this.save();
  },

  recordScore() {
    this.data.coins += this.game.coins;
    this.data.totalGames++;
    const isNewBest = this.game.score > this.data.bestScore;
    if (isNewBest) this.data.bestScore = this.game.score;
    this.data.weeklyScores.push(this.game.score);
    this.data.monthlyScores.push(this.game.score);
    this.data.allTimeScores.push(this.game.score);
    // Trim
    if (this.data.weeklyScores.length > 50) this.data.weeklyScores = this.data.weeklyScores.slice(-50);
    if (this.data.monthlyScores.length > 200) this.data.monthlyScores = this.data.monthlyScores.slice(-200);
    this.save();
    return isNewBest;
  },
};

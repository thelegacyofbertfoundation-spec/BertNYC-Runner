// =============================================
// BERT RUNNER NYC - State
// =============================================
const State = {
  data: { coins:0, bestScore:0, energy:CONFIG.MAX_ENERGY, lastEnergyTime:Date.now(),
          ownedSkins:['default'], activeSkin:'default', totalGames:0, totalCoins:0 },
  game: { running:false, score:0, coins:0, distance:0, speed:CONFIG.INITIAL_SPEED,
          frameCount:0, hasShield:false, hasMagnet:false, hasCoinBoost:false, hasScoreBoost:false },

  save() { try { localStorage.setItem('bertRunnerNYC', JSON.stringify(this.data)); } catch(e){} },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('bertRunnerNYC'));
      if (d) Object.assign(this.data, d);
    } catch(e){}
    this.regenEnergy();
  },

  regenEnergy() {
    const now = Date.now(), elapsed = now - this.data.lastEnergyTime;
    const gained = Math.floor(elapsed / CONFIG.ENERGY_REGEN_MS);
    if (gained > 0) {
      this.data.energy = Math.min(CONFIG.MAX_ENERGY, this.data.energy + gained);
      this.data.lastEnergyTime = now;
      this.save();
    }
  },

  useEnergy() {
    this.regenEnergy();
    if (this.data.energy <= 0) return false;
    this.data.energy--; this.data.lastEnergyTime = Date.now();
    this.save(); return true;
  },

  getEnergyTimer() {
    if (this.data.energy >= CONFIG.MAX_ENERGY) return '';
    const elapsed = Date.now() - this.data.lastEnergyTime;
    const remaining = CONFIG.ENERGY_REGEN_MS - elapsed;
    if (remaining <= 0) { this.regenEnergy(); return ''; }
    const m = Math.floor(remaining/60000), s = Math.floor((remaining%60000)/1000);
    return `${m}:${s.toString().padStart(2,'0')}`;
  },

  resetGame() {
    this.game = { running:true, score:0, coins:0, distance:0, speed:CONFIG.INITIAL_SPEED,
                  frameCount:0, hasShield:false, hasMagnet:false, hasCoinBoost:false, hasScoreBoost:false };
  },

  endGame() {
    this.game.running = false;
    this.data.totalGames++;
    this.data.coins += this.game.coins;
    this.data.totalCoins += this.game.coins;
    if (this.game.score > this.data.bestScore) this.data.bestScore = this.game.score;
    this.save();
  },

  getSkin() {
    return CONFIG.SKINS.find(s => s.id === this.data.activeSkin) || CONFIG.SKINS[0];
  },
};

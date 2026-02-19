// =============================================
// BERT RUNNER NYC - State Management
// =============================================
const State = {
  data: {
    energy:5, lastEnergyTime:Date.now(), coins:0, bestScore:0,
    ownedSkins:['default'], equippedSkin:'default',
    powerUps:{magnet:0,shield:0,doubleCoins:0,scoreBoost:0},
    totalGames:0, weeklyScores:[], monthlyScores:[], allTimeScores:[],
    vipExpiry:0, unlimitedExpiry:0,
  },
  game: {
    running:false, score:0, coins:0, speed:CONFIG.INITIAL_SPEED,
    distance:0, frameCount:0, continueCount:0,
    hasScoreBoost:false, hasCoinBoost:false, hasShield:false, hasMagnet:false,
  },
  load() {
    try { const s=localStorage.getItem('bertRunnerState'); if(s) this.data={...this.data,...JSON.parse(s)}; } catch(e){}
  },
  save() {
    try { localStorage.setItem('bertRunnerState',JSON.stringify(this.data)); } catch(e){}
  },
  regenEnergy() {
    if(this.data.energy>=CONFIG.MAX_ENERGY){this.data.lastEnergyTime=Date.now();return;}
    const g=Math.floor((Date.now()-this.data.lastEnergyTime)/CONFIG.ENERGY_REGEN_MS);
    if(g>0){this.data.energy=Math.min(CONFIG.MAX_ENERGY,this.data.energy+g);this.data.lastEnergyTime=Date.now();this.save();}
  },
  isUnlimited(){return Date.now()<this.data.unlimitedExpiry||Date.now()<this.data.vipExpiry;},
  getSkin(){return CONFIG.SKINS.find(s=>s.id===this.data.equippedSkin)||CONFIG.SKINS[0];},
  resetGame(){
    const g=this.game; g.running=false;g.score=0;g.coins=0;g.speed=CONFIG.INITIAL_SPEED;
    g.distance=0;g.frameCount=0;g.continueCount=0;
    g.hasScoreBoost=false;g.hasCoinBoost=false;g.hasShield=false;g.hasMagnet=false;
  },
  applyPowerUps(){
    const p=this.data.powerUps;
    if(p.scoreBoost>0){this.game.hasScoreBoost=true;p.scoreBoost--;}
    if(p.doubleCoins>0){this.game.hasCoinBoost=true;p.doubleCoins--;}
    if(p.shield>0){this.game.hasShield=true;p.shield--;}
    if(p.magnet>0){this.game.hasMagnet=true;p.magnet--;}
    this.save();
  },
  recordScore(){
    this.data.coins+=this.game.coins; this.data.totalGames++;
    const nb=this.game.score>this.data.bestScore;
    if(nb) this.data.bestScore=this.game.score;
    this.data.weeklyScores.push(this.game.score);
    this.data.monthlyScores.push(this.game.score);
    this.data.allTimeScores.push(this.game.score);
    if(this.data.weeklyScores.length>50) this.data.weeklyScores=this.data.weeklyScores.slice(-50);
    if(this.data.monthlyScores.length>200) this.data.monthlyScores=this.data.monthlyScores.slice(-200);
    this.save(); return nb;
  },
};

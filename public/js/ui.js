// =============================================
// BERT RUNNER NYC - UI System
// =============================================
const UI = {
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    if (id === 'menuScreen') this.updateMenuUI();
  },

  updateMenuUI() {
    State.regenEnergy();
    const ec = document.getElementById('energyCount');
    if (ec) ec.textContent = State.data.energy;
    const et = document.getElementById('energyTimer');
    if (et) et.textContent = State.getEnergyTimer();
    const ab = document.getElementById('watchAdBtn');
    const bb = document.getElementById('buyEnergyBtn');
    if (ab) ab.style.display = State.data.energy < CONFIG.MAX_ENERGY ? '' : 'none';
    if (bb) bb.style.display = State.data.energy < CONFIG.MAX_ENERGY ? '' : 'none';
  },

  startGame() {
    if (!State.useEnergy()) {
      this.showToast('No energy! Wait or buy more ⚡');
      return;
    }
    State.resetGame();
    Player.init();
    Buildings.init();
    Obstacles.init();
    Coins.init();
    Particles.init();
    Input.init();
    this.showScreen('gameScreen');
    this.updateHUD();
    Game.loop();
  },

  gameOver() {
    State.endGame();
    cancelAnimationFrame(Game.rafId);
    const fs = document.getElementById('finalScore');
    if (fs) fs.textContent = State.game.score;
    const bs = document.getElementById('bestScoreText');
    if (bs) bs.innerHTML = `Best: <span>${State.data.bestScore}</span>`;
    const ce = document.getElementById('coinsEarned');
    if (ce) ce.innerHTML = `🪙 +${State.game.coins} coins`;
    this.showScreen('gameOverScreen');
    this.submitScore(State.game.score);
  },

  continueRun() {
    if (window.Telegram?.WebApp) {
      Telegram.WebApp.openInvoice('continue_run_invoice', (status) => {
        if (status === 'paid') this.doContiune();
      });
    } else {
      this.showToast('Telegram Stars required');
    }
  },
  continueRunAd() { this.showToast('Ads coming soon!'); },
  doContiune() {
    State.game.running = true;
    State.game.hasShield = true;
    this.showScreen('gameScreen');
    Game.loop();
  },

  updateHUD() {
    const hs = document.getElementById('hudScore');
    if (hs) hs.textContent = State.game.score;
    const hc = document.getElementById('hudCoins');
    if (hc) hc.innerHTML = `🪙 ${State.game.coins}`;
    const hm = document.getElementById('hudMultiplier');
    if (hm) hm.style.display = State.game.hasScoreBoost ? '' : 'none';
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  },

  // === SHOP ===
  purchaseItem(item) {
    if (!window.Telegram?.WebApp) {
      this.showToast('Open in Telegram to purchase');
      return;
    }
    const tg = Telegram.WebApp;
    const prices = { energy3:15, energy10:40, unlimitedDay:75, magnet:10, shield:12, doubleCoins:8, scoreBoost:15, vipWeekly:150 };
    const p = prices[item];
    if (!p) return;
    this.showToast(`Opening payment for ${p} ⭐...`);
    try {
      tg.openInvoice(`${item}_invoice`, (status) => {
        if (status === 'paid') this.onPurchaseSuccess(item);
        else this.showToast('Payment cancelled');
      });
    } catch(e) { this.showToast('Payment not available'); }
  },

  onPurchaseSuccess(item) {
    switch(item) {
      case 'energy3': State.data.energy = Math.min(CONFIG.MAX_ENERGY + 3, State.data.energy + 3); break;
      case 'energy10': State.data.energy = Math.min(CONFIG.MAX_ENERGY + 10, State.data.energy + 10); break;
      case 'unlimitedDay': State.data.energy = 999; break;
      case 'magnet': State.game.hasMagnet = true; break;
      case 'shield': State.game.hasShield = true; break;
      case 'doubleCoins': State.game.hasCoinBoost = true; break;
      case 'scoreBoost': State.game.hasScoreBoost = true; break;
    }
    State.save();
    this.updateMenuUI();
    this.showToast('Purchase successful! 🎉');
  },

  buyEnergy() { this.purchaseItem('energy3'); },
  watchAdForEnergy() { this.showToast('Ads coming soon!'); },

  // === LEADERBOARD ===
  renderLeaderboard() {
    const podium = document.getElementById('lbPodium');
    const list = document.getElementById('lbList');
    if (!podium || !list) return;

    const entries = this.generateFakeLeaderboard();
    podium.innerHTML = entries.slice(0, 3).map((e, i) => {
      const medals = ['🥇','🥈','🥉'];
      return `<div class="podium-entry"><div class="podium-medal">${medals[i]}</div><div class="podium-name">${e.name}</div><div class="podium-score">${e.score.toLocaleString()}</div></div>`;
    }).join('');

    list.innerHTML = entries.slice(3, 20).map((e, i) => {
      return `<div class="lb-entry"><span class="lb-rank">${i+4}</span><span class="lb-name">${e.name}</span><span class="lb-score">${e.score.toLocaleString()}</span></div>`;
    }).join('');
  },

  generateFakeLeaderboard() {
    const names = CONFIG.BOT_NAMES;
    const entries = names.map(n => ({ name: n, score: Math.floor(Math.random() * 5000) + 500 }));
    entries.push({ name: '⭐ You', score: State.data.bestScore });
    entries.sort((a, b) => b.score - a.score);
    return entries;
  },

  switchLBTab(tab, btn) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    this.renderLeaderboard();
  },

  // === SKINS ===
  renderSkins() {
    const grid = document.getElementById('skinsGrid');
    if (!grid) return;
    grid.innerHTML = CONFIG.SKINS.map(s => {
      const owned = State.data.ownedSkins.includes(s.id);
      const active = State.data.activeSkin === s.id;
      const grad = `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]}, ${s.colors[2]})`;
      return `<div class="shop-item ${active ? 'active-skin' : ''}" onclick="UI.selectSkin('${s.id}')">
        <div class="skin-preview" style="background:${grad}"></div>
        <div class="item-name">${s.name}</div>
        <div class="item-desc">${s.desc}</div>
        ${active ? '<div class="item-price">✅ Equipped</div>' :
          owned ? '<div class="item-price" style="color:#4CAF50">Tap to equip</div>' :
          `<div class="item-price">🪙 ${s.price} coins</div>`}
      </div>`;
    }).join('');
  },

  selectSkin(id) {
    const s = CONFIG.SKINS.find(s => s.id === id);
    if (!s) return;
    if (State.data.ownedSkins.includes(id)) {
      State.data.activeSkin = id;
      State.save();
      this.renderSkins();
      this.showToast(`${s.name} equipped! 🎨`);
    } else if (State.data.coins >= s.price) {
      State.data.coins -= s.price;
      State.data.ownedSkins.push(id);
      State.data.activeSkin = id;
      State.save();
      this.renderSkins();
      this.showToast(`${s.name} unlocked! 🎉`);
    } else {
      this.showToast(`Need ${s.price - State.data.coins} more coins!`);
    }
  },

  submitScore(score) {
    try {
      const baseUrl = window.location.origin;
      const tg = window.Telegram?.WebApp;
      const userId = tg?.initDataUnsafe?.user?.id || 'anon';
      const username = tg?.initDataUnsafe?.user?.username || 'Player';
      fetch(`${baseUrl}/api/score`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, username, score }),
      }).catch(() => {});
    } catch(e) {}
  },
};

// =============================================
// BERT RUNNER NYC - UI Manager
// =============================================

const UI = {
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'menuScreen') this.updateMenuUI();
    if (id === 'shopScreen') this.updateShopUI();
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  },

  // ===== MENU =====
  updateMenuUI() {
    State.regenEnergy();
    document.getElementById('energyCount').textContent = State.data.energy;
    const empty = State.data.energy <= 0 && !State.isUnlimited();
    document.getElementById('watchAdBtn').style.display = empty ? 'flex' : 'none';
    document.getElementById('buyEnergyBtn').style.display = empty ? 'flex' : 'none';
    if (State.data.energy < CONFIG.MAX_ENERGY && !State.isUnlimited()) {
      this.updateEnergyTimer();
    } else {
      document.getElementById('energyTimer').textContent = State.isUnlimited() ? '∞ Unlimited' : '';
    }
  },

  updateEnergyTimer() {
    if (State.data.energy >= CONFIG.MAX_ENERGY || State.isUnlimited()) {
      document.getElementById('energyTimer').textContent = '';
      return;
    }
    const elapsed = Date.now() - State.data.lastEnergyTime;
    const remaining = CONFIG.ENERGY_REGEN_MS - (elapsed % CONFIG.ENERGY_REGEN_MS);
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    document.getElementById('energyTimer').textContent = `(${mins}:${secs.toString().padStart(2,'0')})`;
  },

  // ===== GAME START =====
  startGame() {
    State.regenEnergy();
    if (State.data.energy <= 0 && !State.isUnlimited()) {
      this.showToast('No plays left! Watch an ad or buy more ⚡');
      document.getElementById('watchAdBtn').style.display = 'flex';
      document.getElementById('buyEnergyBtn').style.display = 'flex';
      return;
    }

    if (!State.isUnlimited()) {
      State.data.energy--;
      State.save();
    }

    // Reset game state
    State.resetGame();
    State.applyPowerUps();

    // Init game objects
    Player.init();
    Obstacles.init();
    Coins.init();
    Particles.init();
    Buildings.init();
    Input.bind();

    // HUD
    if (State.game.hasScoreBoost) {
      document.getElementById('hudMultiplier').classList.add('active');
      document.getElementById('hudMultiplier').textContent = '2x SCORE';
    } else {
      document.getElementById('hudMultiplier').classList.remove('active');
    }

    this.showScreen('gameScreen');
    State.game.running = true;
    Game.loop();
  },

  // ===== GAME OVER =====
  gameOver() {
    State.game.running = false;
    Input.unbind();

    try { navigator.vibrate?.(100); } catch(e) {}

    const isNewBest = State.recordScore();

    document.getElementById('finalScore').textContent = State.game.score.toLocaleString();
    document.getElementById('bestScoreText').innerHTML = isNewBest ?
      '<span class="new-best">🎉 NEW BEST!</span>' :
      `Best: <span>${State.data.bestScore.toLocaleString()}</span>`;
    document.getElementById('coinsEarned').textContent = `🪙 +${State.game.coins} coins`;

    const canContinue = State.game.continueCount < 2;
    document.getElementById('continueBtn').style.display = canContinue ? 'flex' : 'none';
    document.getElementById('continueAdBtn').style.display = canContinue ? 'flex' : 'none';

    this.showScreen('gameOverScreen');
  },

  continueRun() {
    if (State.data.coins < 10) {
      this.showToast('Not enough Stars! ⭐');
      this.triggerStarPurchase(10);
      return;
    }
    State.data.coins -= 10;
    State.save();
    this.resumeRun();
  },

  continueRunAd() {
    this.showToast('Loading ad... 📺');
    setTimeout(() => this.resumeRun(), 1500);
  },

  resumeRun() {
    State.game.continueCount++;
    State.game.hasShield = true;
    // Clear nearby obstacles
    const dist = State.game.distance;
    Obstacles.list = Obstacles.list.filter(o =>
      Math.abs(o.z - dist - CONFIG.PLAYER_Z) > 8
    );
    Input.bind();
    this.showScreen('gameScreen');
    State.game.running = true;
    Game.loop();
  },

  // ===== SHOP =====
  updateShopUI() {
    document.getElementById('shopStarBalance').textContent = State.data.coins;
    const skinsHtml = CONFIG.SKINS.filter(s => s.id !== 'default').map(skin => {
      const owned = State.data.ownedSkins.includes(skin.id);
      return `<div class="shop-item ${owned ? 'owned' : ''} ${skin.featured ? 'featured' : ''}" onclick="UI.purchaseItem('skin_${skin.id}')">
        ${skin.featured ? '<div class="best-value">EXCLUSIVE</div>' : ''}
        <div style="background:radial-gradient(circle,${skin.colors[0]} 30%,${skin.colors[1]} 60%,${skin.colors[2]} 100%);width:50px;height:50px;border-radius:50%;margin-bottom:6px"></div>
        <div class="item-name">${skin.name}</div>
        <div class="item-desc">${skin.desc}</div>
        <div class="item-price ${owned ? 'owned-badge' : ''}">${owned ? '✅ Owned' : `⭐ ${skin.price} Stars`}</div>
      </div>`;
    }).join('');
    document.getElementById('shopSkins').innerHTML = skinsHtml;
  },

  purchaseItem(itemId) {
    const prices = {
      energy3: 15, energy10: 40, unlimitedDay: 75,
      magnet: 10, shield: 12, doubleCoins: 8, scoreBoost: 15,
      vipWeekly: 150,
    };

    if (itemId.startsWith('skin_')) {
      const sid = itemId.replace('skin_', '');
      const skin = CONFIG.SKINS.find(s => s.id === sid);
      if (!skin) return;
      if (State.data.ownedSkins.includes(sid)) {
        State.data.equippedSkin = sid;
        State.save();
        this.showToast(skin.name + ' equipped! 🎨');
        this.updateShopUI();
        return;
      }
      if (State.data.coins < skin.price) {
        this.showToast('Not enough Stars! ⭐');
        this.triggerStarPurchase(skin.price);
        return;
      }
      State.data.coins -= skin.price;
      State.data.ownedSkins.push(sid);
      State.data.equippedSkin = sid;
      State.save();
      this.showToast(skin.name + ' unlocked! 🎉');
      this.updateShopUI();
      return;
    }

    const price = prices[itemId];
    if (!price) return;
    if (State.data.coins < price) {
      this.showToast('Not enough Stars! ⭐');
      this.triggerStarPurchase(price);
      return;
    }
    State.data.coins -= price;
    switch(itemId) {
      case 'energy3': State.data.energy += 3; break;
      case 'energy10': State.data.energy += 10; break;
      case 'unlimitedDay': State.data.unlimitedExpiry = Date.now() + 86400000; break;
      case 'magnet': State.data.powerUps.magnet++; break;
      case 'shield': State.data.powerUps.shield++; break;
      case 'doubleCoins': State.data.powerUps.doubleCoins++; break;
      case 'scoreBoost': State.data.powerUps.scoreBoost++; break;
      case 'vipWeekly':
        State.data.vipExpiry = Date.now() + 604800000;
        State.data.powerUps.doubleCoins += 7;
        if (!State.data.ownedSkins.includes('nyc')) State.data.ownedSkins.push('nyc');
        break;
    }
    State.save();
    this.showToast('Purchase complete! ✅');
    this.updateMenuUI();
    this.updateShopUI();
  },

  triggerStarPurchase(amount) {
    // Telegram Stars payment
    // window.Telegram?.WebApp?.openInvoice(invoiceUrl)
    this.showToast(`Would open Telegram Stars payment for ⭐${amount}`);
  },

  buyEnergy() { this.purchaseItem('energy3'); },

  watchAdForEnergy() {
    this.showToast('Loading ad... 📺');
    setTimeout(() => {
      State.data.energy += 1;
      State.save();
      this.updateMenuUI();
      this.showToast('+1 Play earned! ⚡');
    }, 1500);
  },

  // ===== LEADERBOARD =====
  switchLBTab(type, btn) {
    document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    this.renderLeaderboard(type);
  },

  renderLeaderboard(type = 'weekly') {
    const entries = [];
    const ranges = { weekly: [50, 800], monthly: [200, 2500], alltime: [500, 5000] };
    const [min, max] = ranges[type];

    for (let i = 0; i < 20; i++) {
      entries.push({
        name: CONFIG.BOT_NAMES[i],
        score: Math.floor(Math.random() * (max - min) + min),
        isPlayer: false,
      });
    }
    const pb = type === 'weekly' ? Math.max(0, ...State.data.weeklyScores) :
               type === 'monthly' ? Math.max(0, ...State.data.monthlyScores) :
               State.data.bestScore;
    entries.push({ name: 'You', score: pb, isPlayer: true });
    entries.sort((a, b) => b.score - a.score);

    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3, 20);
    const po = [top3[1], top3[0], top3[2]].filter(Boolean);
    const medals = ['🥈', '🥇', '🥉'];

    document.getElementById('lbPodium').innerHTML = po.map((e, i) => {
      if (!e) return '';
      return `<div class="podium-spot"><div class="podium-avatar">${e.name[0]}</div>
        <div class="podium-name">${e.name}${e.isPlayer ? ' (You)' : ''}</div>
        <div class="podium-score">${e.score.toLocaleString()}</div>
        <div class="podium-bar">${medals[i]}</div></div>`;
    }).join('');

    document.getElementById('lbList').innerHTML = rest.map((e, i) =>
      `<div class="lb-entry ${e.isPlayer ? 'you' : ''}">
        <div class="lb-rank">${i + 4}</div>
        <div class="lb-entry-name">${e.name}${e.isPlayer ? ' (You)' : ''}</div>
        <div class="lb-entry-score">${e.score.toLocaleString()}</div>
      </div>`
    ).join('');
  },

  // ===== SKINS =====
  renderSkins() {
    document.getElementById('skinsGrid').innerHTML = CONFIG.SKINS.map(skin => {
      const owned = State.data.ownedSkins.includes(skin.id);
      const eq = State.data.equippedSkin === skin.id;
      return `<div class="skin-card ${eq ? 'equipped' : ''}" onclick="UI.equipSkin('${skin.id}')">
        <div class="skin-preview" style="background:radial-gradient(circle,${skin.colors[0]} 30%,${skin.colors[1]} 60%,${skin.colors[2]} 100%)"></div>
        <div class="skin-name">${skin.name}</div>
        <div style="font-size:11px;color:var(--text-dim)">${skin.desc}</div>
        <div style="margin-top:6px;font-size:12px;font-weight:700;color:${eq ? 'var(--success)' : owned ? 'var(--blue)' : 'var(--star-gold)'}">
          ${eq ? '✅ Equipped' : owned ? 'Tap to Equip' : '🔒 ⭐' + skin.price}
        </div>
      </div>`;
    }).join('');
  },

  equipSkin(sid) {
    if (!State.data.ownedSkins.includes(sid)) {
      this.showScreen('shopScreen');
      this.updateShopUI();
      this.showToast('Visit shop to unlock! 🛒');
      return;
    }
    State.data.equippedSkin = sid;
    State.save();
    this.renderSkins();
    this.showToast('Skin equipped! 🎨');
  },

  // HUD update
  updateHUD() {
    document.getElementById('hudScore').textContent = State.game.score.toLocaleString();
    document.getElementById('hudCoins').textContent = '🪙 ' + State.game.coins;
  },
};

// Energy timer interval
setInterval(() => UI.updateEnergyTimer(), 1000);

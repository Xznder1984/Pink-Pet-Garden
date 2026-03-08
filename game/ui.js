// ============================================================
//  game/ui.js — Enhanced UI Management System
//  Handles screen transitions, popups, tabs, toasts, and more.
// ============================================================

const UI = (() => {

  let currentTab = 'garden';
  let toastQueue = [];
  let isShowingToast = false;

  // ── SCREEN TRANSITIONS ────────────────────────────────────
  function showGame() {
    const menuScreen = document.getElementById('screen-menu');
    const gameScreen = document.getElementById('screen-game');

    if (menuScreen) menuScreen.classList.add('hidden');
    if (gameScreen) {
      gameScreen.classList.remove('hidden');
      gameScreen.classList.add('active');
    }

    Engine.start();
    Music.playGame();
    showToast('🌸 Welcome to Pink Pet Paradise!');
  }

  function backToMenu() {
    SaveSystem.saveGame();
    Engine.stop();

    const gameScreen = document.getElementById('screen-game');
    const menuScreen = document.getElementById('screen-menu');

    if (gameScreen) {
      gameScreen.classList.add('hidden');
      gameScreen.classList.remove('active');
    }
    if (menuScreen) {
      menuScreen.classList.remove('hidden');
      menuScreen.classList.add('active');
    }

    Music.playMenu();
  }

  function showHowTo() {
    const howto = document.getElementById('screen-howto');
    if (howto) {
      howto.classList.remove('hidden');
      howto.classList.add('active');
    }
  }

  function hideHowTo() {
    const howto = document.getElementById('screen-howto');
    if (howto) {
      howto.classList.add('hidden');
      howto.classList.remove('active');
    }
  }

  // ── TABS ──────────────────────────────────────────────────
  function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tab) btn.classList.add('active');
    });

    // Update panels
    document.querySelectorAll('.bottom-panel').forEach(panel => {
      panel.classList.remove('active-panel');
      panel.classList.add('hidden-panel');
    });

    const activePanel = document.getElementById(`panel-${tab}`);
    if (activePanel) {
      activePanel.classList.remove('hidden-panel');
      activePanel.classList.add('active-panel');
    }
  }

  // ── COIN DISPLAY ──────────────────────────────────────────
  function updateCoinDisplay() {
    const coinEl = document.getElementById('coin-count');
    if (coinEl) {
      const current = parseInt(coinEl.textContent) || 0;
      const target = SaveSystem.state.coins;

      if (current !== target) {
        animateNumber(coinEl, current, target, 500);
      }
    }
  }

  function animateNumber(element, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);

      element.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ── PET LIST ──────────────────────────────────────────────
  function rebuildPetList() {
    const container = document.getElementById('pet-list-container');
    if (!container) return;

    container.innerHTML = '';
    const pets = SaveSystem.state.pets;

    if (pets.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:20px 10px;color:#C090B0;font-size:12px;">
          <div style="font-size:24px;margin-bottom:8px;">🥚</div>
          Buy an egg in the Shop!
        </div>
      `;
      return;
    }

    pets.forEach(pet => {
      const div = document.createElement('div');
      div.className = 'pet-list-item';
      if (Pets.getSelectedId() === pet.id) div.classList.add('selected');

      const happinessColor = pet.happiness > 70 ? '#7BC96F' : pet.happiness > 40 ? '#FFD700' : '#FF6B6B';
      const hungerColor = pet.hunger > 70 ? '#7BC96F' : pet.hunger > 40 ? '#FFD700' : '#FF6B6B';

      div.innerHTML = `
        <span class="pet-emoji">${pet.emoji}</span>
        <div class="pet-name-sm">${pet.name}</div>
        <div class="pet-stats">
          <span style="color:${happinessColor}">❤️${Math.round(pet.happiness)}</span>
          <span style="color:${hungerColor}">🍎${Math.round(pet.hunger)}</span>
          <span>⭐${pet.level}</span>
        </div>
      `;

      div.onclick = () => {
        document.querySelectorAll('.pet-list-item').forEach(item => item.classList.remove('selected'));
        div.classList.add('selected');
        showPetPopup(pet);
      };

      container.appendChild(div);
    });
  }

  // ── PET POPUP ─────────────────────────────────────────────
  function showPetPopup(pet) {
    const popup = document.getElementById('pet-popup');
    if (!popup) return;

    popup.classList.remove('hidden');

    const nameEl = document.getElementById('pet-popup-name');
    const statsEl = document.getElementById('pet-popup-stats');

    if (nameEl) nameEl.textContent = `${pet.emoji} ${pet.name}`;

    if (statsEl) {
      const happinessBar = createBar(pet.happiness, '#FF85B3');
      const hungerBar = createBar(pet.hunger, '#7BC96F');
      const xpPercent = (pet.xp / (pet.level * 60)) * 100;
      const xpBar = createBar(xpPercent, '#FFD700');

      statsEl.innerHTML = `
        <div class="stat-row">
          <span>❤️ Happiness</span>
          ${happinessBar}
        </div>
        <div class="stat-row">
          <span>🍎 Hunger</span>
          ${hungerBar}
        </div>
        <div class="stat-row">
          <span>⭐ Level ${pet.level}</span>
          ${xpBar}
          <small>${Math.floor(pet.xp)}/${pet.level * 60} XP</small>
        </div>
        <div class="pet-personality">
          <span class="rarity-badge rarity-${pet.rarity}">${pet.rarity}</span>
          <span>${pet.personality} personality</span>
        </div>
      `;
    }
  }

  function createBar(percent, color) {
    const clamped = Math.max(0, Math.min(100, percent));
    return `
      <div class="stat-bar">
        <div class="stat-bar-fill" style="width:${clamped}%;background:${color}"></div>
      </div>
    `;
  }

  function closePetPopup() {
    const popup = document.getElementById('pet-popup');
    if (popup) popup.classList.add('hidden');

    document.querySelectorAll('.pet-list-item').forEach(item => item.classList.remove('selected'));
  }

  // ── EGG HATCH SEQUENCE ────────────────────────────────────
  function startHatchSequence() {
    const overlay = document.getElementById('hatch-overlay');
    const egg = document.getElementById('hatch-egg');
    const text = document.getElementById('hatch-text');
    const reveal = document.getElementById('hatch-pet-reveal');

    if (overlay) overlay.classList.remove('hidden');
    if (egg) egg.style.display = 'block';
    if (text) text.style.display = 'block';
    if (reveal) reveal.classList.add('hidden');

    // Animate egg
    if (egg) {
      egg.style.animation = 'none';
      setTimeout(() => egg.style.animation = '', 10);
    }
  }

  function showHatchResult(pet) {
    const egg = document.getElementById('hatch-egg');
    const text = document.getElementById('hatch-text');
    const reveal = document.getElementById('hatch-pet-reveal');
    const emojiEl = document.getElementById('hatch-pet-emoji');
    const nameEl = document.getElementById('hatch-pet-name');

    if (egg) egg.style.display = 'none';
    if (text) text.style.display = 'none';

    if (!pet) {
      closeHatch();
      return;
    }

    if (reveal) reveal.classList.remove('hidden');
    if (emojiEl) emojiEl.textContent = pet.emoji;
    if (nameEl) nameEl.textContent = pet.name;

    // Celebration effects
    Particles.burst(window.innerWidth / 2, window.innerHeight / 2 - 50, 'sparkle', 20);
    Particles.burst(window.innerWidth / 2 - 100, window.innerHeight / 2, 'heart', 12);
    Particles.burst(window.innerWidth / 2 + 100, window.innerHeight / 2, 'star', 12);

    rebuildPetList();
  }

  function closeHatch() {
    const overlay = document.getElementById('hatch-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ── EVENT LOG ─────────────────────────────────────────────
  const MAX_LOG = 15;

  function logEvent(msg) {
    const log = document.getElementById('event-log');
    if (!log) return;

    const item = document.createElement('div');
    item.className = 'event-item';
    item.innerHTML = `<span class="event-time">${getTimeString()}</span> ${msg}`;

    log.insertBefore(item, log.firstChild);

    while (log.children.length > MAX_LOG) {
      log.removeChild(log.lastChild);
    }
  }

  function getTimeString() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // ── ACHIEVEMENTS ──────────────────────────────────────────
  function addAchievement(text) {
    const list = document.getElementById('achievement-list');
    if (!list) return;

    const badge = document.createElement('div');
    badge.className = 'achievement-badge';
    badge.textContent = text;
    list.appendChild(badge);

    // Animate in
    badge.style.animation = 'achievement-pop 0.5s ease';
  }

  function loadAchievements() {
    const list = document.getElementById('achievement-list');
    if (!list) return;

    list.innerHTML = '';
    const { achievements } = SaveSystem.state;

    const achievementList = [
      { key: 'firstPet', text: '🐾 First Pet' },
      { key: 'fivePets', text: '🐾 Pet Collector' },
      { key: 'tenPets', text: '🐾 Pet Hoarder' },
      { key: 'allPets', text: '🏆 Pet Master' },
      { key: 'level5', text: '⭐ Experienced' },
      { key: 'level10', text: '⭐ Pet Expert' },
    ];

    achievementList.forEach(ach => {
      if (achievements[ach.key]) addAchievement(ach.text);
    });
  }

  // ── TOAST NOTIFICATION ────────────────────────────────────
  function showToast(msg) {
    toastQueue.push(msg);
    if (!isShowingToast) processToastQueue();
  }

  function processToastQueue() {
    if (toastQueue.length === 0) {
      isShowingToast = false;
      return;
    }

    isShowingToast = true;
    const msg = toastQueue.shift();
    const toast = document.getElementById('toast');

    if (!toast) {
      processToastQueue();
      return;
    }

    toast.textContent = msg;
    toast.classList.remove('hidden');

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.classList.add('hidden');
        processToastQueue();
      }, 300);
    }, 2500);
  }

  // ── MENU PETAL RAIN ───────────────────────────────────────
  function spawnMenuPetals() {
    const container = document.getElementById('menu-petals');
    if (!container) return;

    const petals = ['🌸', '🌺', '🌷', '🌹', '💐', '🌼', '🌻'];

    setInterval(() => {
      const el = document.createElement('div');
      el.className = 'petal';
      el.textContent = petals[Math.floor(Math.random() * petals.length)];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.animationDuration = (5 + Math.random() * 4) + 's';
      el.style.fontSize = (16 + Math.random() * 10) + 'px';

      container.appendChild(el);

      el.addEventListener('animationend', () => el.remove());
    }, 600);
  }

  // ── INITIALIZE ────────────────────────────────────────────
  function init() {
    updateCoinDisplay();
    rebuildPetList();
    loadAchievements();
    spawnMenuPetals();
    switchTab('garden');

    // Initial welcome message
    setTimeout(() => {
      if (SaveSystem.state.pets.length === 0) {
        logEvent('💡 Tip: Buy an egg in the Shop to get your first pet!');
      }
    }, 1000);
  }

  return {
    showGame,
    backToMenu,
    showHowTo,
    hideHowTo,
    switchTab,
    updateCoinDisplay,
    rebuildPetList,
    showPetPopup,
    closePetPopup,
    startHatchSequence,
    showHatchResult,
    closeHatch,
    logEvent,
    addAchievement,
    loadAchievements,
    showToast,
    init,
  };
})();

// ============================================================
//  game/save.js — Enhanced Save & Load System
//  Persists all game data to localStorage with versioning.
// ============================================================

const SaveSystem = (() => {

  const SAVE_KEY = 'pinkPetParadise_v2';
  const BACKUP_KEY = 'pinkPetParadise_backup';
  const SAVE_VERSION = 2;

  // Default game state
  function defaultState() {
    return {
      version: SAVE_VERSION,
      coins: 100,  // Generous starting coins
      pets: [],
      eggs: [],
      garden: {},
      decorations: [],
      achievements: {},
      stats: {
        petsHatched: 0,
        flowersGrown: 0,
        coinsEarned: 0,
        minigamesWon: 0,
        totalPlayTime: 0,
      },
      settings: {
        musicEnabled: true,
        particlesEnabled: true,
      },
      lastSaved: Date.now(),
      firstPlayed: Date.now(),
    };
  }

  let state = defaultState();
  let saveTimeout = null;

  // ── SAVE ──────────────────────────────────────────────────
  function saveGame() {
    try {
      // Create backup before saving
      const currentSave = localStorage.getItem(SAVE_KEY);
      if (currentSave) {
        localStorage.setItem(BACKUP_KEY, currentSave);
      }

      state.lastSaved = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));

      // Only show toast occasionally
      if (Math.random() < 0.3) {
        UI.showToast('💾 Game saved!');
      }

      return true;
    } catch (e) {
      console.error('Save failed:', e);
      UI.showToast('⚠️ Save failed!');
      return false;
    }
  }

  // Debounced save for frequent updates
  function queueSave(delay = 1000) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveGame(), delay);
  }

  // ── LOAD ──────────────────────────────────────────────────
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);

      if (raw) {
        const loaded = JSON.parse(raw);

        // Version migration
        if (loaded.version !== SAVE_VERSION) {
          console.log(`Migrating save from v${loaded.version || 1} to v${SAVE_VERSION}`);
          migrateSave(loaded);
        }

        // Deep merge with defaults
        state = deepMerge(defaultState(), loaded);

        console.log('✅ Save loaded successfully');
        return state;
      }
    } catch (e) {
      console.error('Load failed:', e);

      // Try backup
      try {
        const backup = localStorage.getItem(BACKUP_KEY);
        if (backup) {
          state = JSON.parse(backup);
          console.log('✅ Loaded from backup');
          return state;
        }
      } catch (backupError) {
        console.error('Backup also failed:', backupError);
      }
    }

    // Start fresh
    state = defaultState();
    console.log('🆕 New game started');
    return state;
  }

  // ── MIGRATION ─────────────────────────────────────────────
  function migrateSave(loaded) {
    // Add missing fields
    if (!loaded.version) loaded.version = 1;
    if (!loaded.settings) loaded.settings = { musicEnabled: true, particlesEnabled: true };
    if (!loaded.stats.totalPlayTime) loaded.stats.totalPlayTime = 0;
    if (!loaded.firstPlayed) loaded.firstPlayed = Date.now();

    loaded.version = SAVE_VERSION;
  }

  // ── DEEP MERGE ────────────────────────────────────────────
  function deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  // ── RESET ─────────────────────────────────────────────────
  function resetGame() {
    if (!confirm('Are you sure? All progress will be lost!')) return false;

    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    state = defaultState();

    UI.showToast('🗑️ Game reset!');
    return true;
  }

  // ── COINS ─────────────────────────────────────────────────
  function addCoins(amount) {
    state.coins += amount;
    state.stats.coinsEarned += amount;

    if (UI && UI.updateCoinDisplay) {
      UI.updateCoinDisplay();
    }

    queueSave(500);
  }

  function spendCoins(amount) {
    if (state.coins < amount) return false;

    state.coins -= amount;

    if (UI && UI.updateCoinDisplay) {
      UI.updateCoinDisplay();
    }

    queueSave(500);
    return true;
  }

  // ── AUTO SAVE ─────────────────────────────────────────────
  function startAutoSave() {
    // Save every 60 seconds
    setInterval(() => {
      saveGame();
    }, 60000);

    // Track play time
    setInterval(() => {
      state.stats.totalPlayTime += 1;
    }, 1000);

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      saveGame();
    });

    // Save on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) saveGame();
    });
  }

  // ── EXPORT/IMPORT ─────────────────────────────────────────
  function exportSave() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `pink-pet-paradise-save-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importSave(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      state = deepMerge(defaultState(), data);
      saveGame();
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  return {
    state,
    saveGame,
    queueSave,
    loadGame,
    resetGame,
    addCoins,
    spendCoins,
    startAutoSave,
    exportSave,
    importSave,
  };
})();

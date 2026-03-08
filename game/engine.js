// =============================================================
// game/engine.js — Core Game Engine for Pink Pet Paradise
// The master controller that ties all systems together.
// Handles: init, game loop, rendering, auto-save, input handling.
// =============================================================

const Engine = {

  // Canvas and rendering context
  canvas: null,
  ctx: null,

  // Game loop tracking
  lastTime:    0,
  running:     false,
  animFrameId: null,
  deltaTime:   0,  // seconds since last frame

  // Auto-save every 30 seconds
  AUTO_SAVE_INTERVAL: 30000,
  lastSaveTime: 0,

  // Mouse tracking for pet interactions
  mouseX: 0,
  mouseY: 0,

  // ---- Initialize the game engine ----
  init() {
    // Setup canvas
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());

    // Setup mouse tracking
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      Pets.setMousePos(this.mouseX, this.mouseY);
    });

    // Setup click handling
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleCanvasClick(x, y);
    });

    // Load saved game or start fresh
    SaveSystem.loadGame();

    // Initialize all subsystems
    Weather.init();
    Garden.init(this.canvas);
    Shop.init();
    UI.init();

    // Start auto-save
    SaveSystem.startAutoSave();

    console.log('🎮 Engine initialized');
  },

  // ---- Start the game (called from UI when Play is clicked) ----
  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.lastSaveTime = Date.now();

    // Start music
    Music.playGame();

    // Initial UI updates
    UI.updateCoinDisplay();
    UI.rebuildPetList();

    // Start the game loop
    this._loop(this.lastTime);

    console.log('🎮 Game started');
  },

  // ---- Stop the game loop ----
  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    Music.stop();
    console.log('🎮 Game stopped');
  },

  // ---- Resize canvas to fit container ----
  resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper && this.canvas) {
      this.canvas.width = wrapper.clientWidth;
      this.canvas.height = wrapper.clientHeight;
    }
  },

  // ---- Main game loop ----
  _loop(timestamp) {
    if (!this.running) return;

    this.animFrameId = requestAnimationFrame(t => this._loop(t));

    // Calculate delta time
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.deltaTime = dt / 1000; // Convert to seconds

    // Update all systems
    this.update(this.deltaTime);

    // Render everything
    this.render();

    // Auto-save check
    if (Date.now() - this.lastSaveTime > this.AUTO_SAVE_INTERVAL) {
      this._autoSave();
    }
  },

  // ---- Update all game systems ----
  update(dt) {
    // Update weather (day/night cycle, clouds, rain)
    Weather.update(dt, this.canvas.width);

    // Update pets (AI, movement, stats)
    Pets.update(dt, this.canvas);

    // Update garden (flower growth)
    Garden.update();

    // Update particles
    // Particles are drawn directly in render, no update needed for simple system
  },

  // ---- Render the game world ----
  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Draw sky, ground, weather effects
    Weather.draw(ctx, w, h);

    // Draw decorations (behind garden)
    this.drawDecorations(ctx);

    // Draw garden (flowers and soil)
    Garden.draw(ctx, this.canvas);

    // Draw pets
    Pets.draw(ctx);

    // Draw particles on top
    Particles.update(ctx);
  },

  // ---- Draw placed decorations ----
  drawDecorations(ctx) {
    const decorations = SaveSystem.state.decorations;
    decorations.forEach(deco => {
      const pos = Garden.getCellPixel(this.canvas, deco.col, deco.row);
      if (pos) {
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(deco.emoji, pos.x + 28, pos.y + 20);
      }
    });
  },

  // ---- Handle canvas clicks ----
  handleCanvasClick(x, y) {
    // Check if clicked on a pet first
    if (Pets.handleClick(x, y)) {
      return;
    }

    // Check if clicked on garden
    if (Garden.handleClick(this.canvas, x, y)) {
      return;
    }

    // Clicked on empty space - close popups
    UI.closePetPopup();
  },

  // ---- Auto-save ----
  _autoSave() {
    this.lastSaveTime = Date.now();
    SaveSystem.saveGame();
  },

  // ---- Manual save ----
  save() {
    SaveSystem.saveGame();
  },
};

// ---- Music System ----
const Music = {
  menuAudio: null,
  gameAudio: null,
  enabled: true,

  init() {
    // Create audio elements
    this.menuAudio = new Audio('assets/menu.mp3');
    this.gameAudio = new Audio('assets/music.mp3');

    // Configure looping
    this.menuAudio.loop = true;
    this.gameAudio.loop = true;

    // Set volume
    this.menuAudio.volume = 0.5;
    this.gameAudio.volume = 0.4;
  },

  playMenu() {
    if (!this.enabled) return;
    this.gameAudio?.pause();
    this.menuAudio?.play().catch(() => {});
  },

  playGame() {
    if (!this.enabled) return;
    this.menuAudio?.pause();
    this.gameAudio?.play().catch(() => {});
  },

  stop() {
    this.menuAudio?.pause();
    this.gameAudio?.pause();
  },

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      // Resume appropriate track based on current screen
      const gameScreen = document.getElementById('screen-game');
      if (gameScreen && !gameScreen.classList.contains('hidden')) {
        this.playGame();
      } else {
        this.playMenu();
      }
    } else {
      this.stop();
    }
    return this.enabled;
  },
};

// ---- Boot the engine when the page is ready ----
window.addEventListener('DOMContentLoaded', () => {
  Music.init();
  Music.playMenu();
  Engine.init();
});

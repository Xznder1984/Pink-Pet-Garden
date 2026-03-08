// ============================================================
//  game/garden.js — Enhanced Flower Planting + Growth System
//  Players click soil spots on the canvas to plant flowers.
//  Flowers have 3 growth stages with animations, saved automatically.
// ============================================================

const Garden = (() => {

  // ── FLOWER TYPES ─────────────────────────────────────────
  const FLOWER_TYPES = [
    { id:'rose',      name:'Rose',       emoji:'🌹', growTime:20, coinReward:8,  color:'#FF6B6B', desc:'Classic red rose' },
    { id:'sunflower', name:'Sunflower',  emoji:'🌻', growTime:15, coinReward:6,  color:'#FFD700', desc:'Loves the sun' },
    { id:'tulip',     name:'Tulip',      emoji:'🌷', growTime:25, coinReward:10, color:'#FF9CC2', desc:'Spring favorite' },
    { id:'daisy',     name:'Daisy',      emoji:'🌼', growTime:12, coinReward:5,  color:'#FFFACD', desc:'Simple and sweet' },
    { id:'cherry',    name:'Blossom',    emoji:'🌸', growTime:30, coinReward:12, color:'#FFB7D5', desc:'Beautiful sakura' },
    { id:'clover',    name:'Clover',     emoji:'🍀', growTime:18, coinReward:7,  color:'#7BC96F', desc:'Lucky four-leaf' },
    { id:'lavender',  name:'Lavender',   emoji:'💜', growTime:22, coinReward:9,  color:'#C49BFF', desc:'Calming scent' },
    { id:'poppy',     name:'Poppy',      emoji:'🌺', growTime:16, coinReward:7,  color:'#FF6B9D', desc:'Vibrant colors' },
  ];

  // ── GARDEN GRID CONFIG ────────────────────────────────────
  const GRID_COLS   = 8;   // number of soil plots across
  const GRID_ROWS   = 2;   // number of soil rows
  const CELL_SIZE   = 56;  // pixels per cell
  const CELL_GAP    = 10;

  let selectedFlowerType = 'rose';
  let canvasRef          = null;
  let animationTime      = 0;

  // ── INITIALIZE: Build UI flower buttons ──────────────────
  function init(canvas) {
    canvasRef = canvas;
    buildFlowerSelector();
  }

  function buildFlowerSelector() {
    const container = document.getElementById('flower-selector');
    if (!container) return;

    container.innerHTML = '';
    FLOWER_TYPES.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'flower-btn' + (f.id === selectedFlowerType ? ' selected' : '');
      btn.innerHTML = `
        <span class="flower-emoji">${f.emoji}</span>
        <span class="flower-name">${f.name}</span>
        <span class="flower-stats">⏱${f.growTime}s • 🪙${f.coinReward}</span>
      `;
      btn.title = `${f.desc} - Grows in ${f.growTime}s, rewards ${f.coinReward} coins`;
      btn.onclick = () => selectFlower(f.id, btn);
      container.appendChild(btn);
    });
  }

  function selectFlower(id, btn) {
    selectedFlowerType = id;
    document.querySelectorAll('.flower-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const flower = FLOWER_TYPES.find(f => f.id === id);
    UI.showToast(`🌸 Selected ${flower.name} - ${flower.desc}`);
  }

  // ── GRID POSITION HELPERS ─────────────────────────────────
  function getCellPixel(canvas, col, row) {
    const totalW = GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const startX = (canvas.width - totalW) / 2;
    const groundY = canvas.height * 0.62;

    return {
      x: startX + col * (CELL_SIZE + CELL_GAP),
      y: groundY + row * (CELL_SIZE * 0.75 + CELL_GAP) + 4,
      centerX: startX + col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2,
      centerY: groundY + row * (CELL_SIZE * 0.75 + CELL_GAP) + 4 + (CELL_SIZE * 0.75) / 2,
    };
  }

  function clickToCell(canvas, cx, cy) {
    const totalW = GRID_COLS * (CELL_SIZE + CELL_GAP) - CELL_GAP;
    const startX = (canvas.width - totalW) / 2;
    const groundY = canvas.height * 0.62;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const px = startX + col * (CELL_SIZE + CELL_GAP);
        const py = groundY + row * (CELL_SIZE * 0.75 + CELL_GAP) + 4;
        if (cx >= px && cx <= px + CELL_SIZE &&
            cy >= py && cy <= py + CELL_SIZE * 0.75) {
          return { col, row };
        }
      }
    }
    return null;
  }

  // ── PLANT A FLOWER ────────────────────────────────────────
  function plantFlower(col, row) {
    const key = `${col},${row}`;
    const garden = SaveSystem.state.garden;
    const type = FLOWER_TYPES.find(f => f.id === selectedFlowerType);

    if (garden[key]) {
      UI.showToast('🌱 There\'s already a plant here!');
      return;
    }
    if (!type) return;

    garden[key] = {
      type: type.id,
      plantedAt: Date.now(),
      stage: 0,    // 0=seed, 1=sprout, 2=bloom
      watered: false,
    };

    UI.logEvent(`🌱 Planted a ${type.name}!`);

    // Planting particles
    const pos = getCellPixel(canvasRef, col, row);
    Particles.spawn(pos.centerX, pos.centerY, 'petal', 5);

    SaveSystem.saveGame();
  }

  // ── UPDATE ALL FLOWERS ────────────────────────────────────
  function update() {
    animationTime += 0.016;

    const garden = SaveSystem.state.garden;
    const now = Date.now();

    Object.entries(garden).forEach(([key, plot]) => {
      const type = FLOWER_TYPES.find(f => f.id === plot.type);
      if (!type) return;

      const age = (now - plot.plantedAt) / 1000;
      const stageDuration = type.growTime;

      const newStage = age >= stageDuration * 2 ? 2
                     : age >= stageDuration ? 1
                     : 0;

      // Award coins when flower blooms
      if (newStage === 2 && plot.stage < 2) {
        SaveSystem.addCoins(type.coinReward);
        UI.logEvent(`🌸 Your ${type.name} bloomed! +${type.coinReward} coins!`);
        SaveSystem.state.stats.flowersGrown++;

        const [col, row] = key.split(',').map(Number);
        const pos = getCellPixel(canvasRef, col, row);
        Particles.spawn(pos.centerX, pos.centerY, 'petal', 10);
      }

      plot.stage = newStage;
    });
  }

  // ── HARVEST FLOWER ────────────────────────────────────────
  function harvestFlower(col, row) {
    const key = `${col},${row}`;
    const plot = SaveSystem.state.garden[key];
    if (!plot || plot.stage < 2) return;

    const type = FLOWER_TYPES.find(f => f.id === plot.type);
    delete SaveSystem.state.garden[key];

    UI.logEvent(`🌺 Harvested a ${type?.name || 'flower'}!`);
    UI.showToast(`🌺 Harvested ${type?.name || 'flower'}!`);

    const pos = getCellPixel(canvasRef, col, row);
    Particles.spawn(pos.centerX, pos.centerY, 'sparkle', 6);

    SaveSystem.saveGame();
  }

  // ── DRAW GARDEN ───────────────────────────────────────────
  function draw(ctx, canvas) {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        drawCell(ctx, canvas, col, row);
      }
    }
  }

  function drawCell(ctx, canvas, col, row) {
    const pos = getCellPixel(canvas, col, row);
    const key = `${col},${row}`;
    const plot = SaveSystem.state.garden[key];
    const cellH = CELL_SIZE * 0.75;

    // Soil background with gradient
    const soilGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + cellH);
    if (plot) {
      soilGrad.addColorStop(0, '#D4A76A');
      soilGrad.addColorStop(1, '#C49A5A');
    } else {
      soilGrad.addColorStop(1, '#B88D5A');
      soilGrad.addColorStop(0, '#C89A6A');
    }

    ctx.fillStyle = soilGrad;
    ctx.strokeStyle = 'rgba(140, 80, 40, 0.4)';
    ctx.lineWidth = 1.5;

    // Draw rounded rectangle
    roundRect(ctx, pos.x, pos.y, CELL_SIZE, cellH, 10);
    ctx.fill();
    ctx.stroke();

    // Soil texture dots
    ctx.fillStyle = 'rgba(100, 60, 30, 0.15)';
    for (let i = 0; i < 5; i++) {
      const dx = (i * 13 + col * 7) % (CELL_SIZE - 10) + 5;
      const dy = (i * 11 + row * 5) % (cellH - 8) + 4;
      ctx.beginPath();
      ctx.arc(pos.x + dx, pos.y + dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (plot) {
      drawPlant(ctx, plot, pos, cellH);
    } else {
      // Empty soil hint
      ctx.font = '11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText('🌿', pos.centerX, pos.centerY);
    }
  }

  function drawPlant(ctx, plot, pos, cellH) {
    const type = FLOWER_TYPES.find(f => f.id === plot.type);
    const emojis = ['🌱', '🌿', type ? type.emoji : '🌸'];

    // Animated growth
    const growthWiggle = plot.stage === 2 ? Math.sin(animationTime * 2) * 2 : 0;
    const size = 16 + plot.stage * 7;

    ctx.save();
    ctx.translate(pos.centerX + growthWiggle, pos.centerY);

    // Shadow under plant
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(0, cellH * 0.35, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plant emoji
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojis[plot.stage], 0, 0);

    ctx.restore();

    // Progress bar for growing plants
    if (plot.stage < 2) {
      const type = FLOWER_TYPES.find(f => f.id === plot.type);
      const age = (Date.now() - plot.plantedAt) / 1000;
      const maxAge = type.growTime * 2;
      const progress = Math.min(age / maxAge, 1);

      const barW = CELL_SIZE - 12;
      const barH = 5;
      const barX = pos.x + 6;
      const barY = pos.y + cellH - 10;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      roundRect(ctx, barX, barY, barW, barH, 3);
      ctx.fill();

      // Progress fill with gradient
      const progGrad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
      progGrad.addColorStop(0, '#7BC96F');
      progGrad.addColorStop(1, '#A8E6A3');
      ctx.fillStyle = progGrad;
      roundRect(ctx, barX, barY, barW * progress, barH, 3);
      ctx.fill();
    }
  }

  // ── HELPER: Draw rounded rectangle ────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // ── CLICK HANDLER ─────────────────────────────────────────
  function handleClick(canvas, cx, cy) {
    const cell = clickToCell(canvas, cx, cy);
    if (!cell) return false;

    const key = `${cell.col},${cell.row}`;
    const plot = SaveSystem.state.garden[key];

    if (plot && plot.stage === 2) {
      harvestFlower(cell.col, cell.row);
    } else if (!plot) {
      plantFlower(cell.col, cell.row);
    } else {
      UI.showToast('🌱 This flower is still growing!');
    }
    return true;
  }

  return {
    init,
    update,
    draw,
    handleClick,
    getCellPixel,
    FLOWER_TYPES,
  };
})();

// ============================================================
//  game/minigame.js — Polished Mini-Games
//  1. Catch Falling Hearts  2. Pet Click Frenzy
// ============================================================

const Minigame = (() => {

  // ── SHARED MINIGAME STATE ─────────────────────────────────
  let active = false;
  let gameType = null;    // 'hearts' | 'petclick'
  let score = 0;
  let timeLeft = 30;
  let timerHandle = null;
  let animHandle = null;
  let canvas = null;
  let ctx = null;
  let objects = [];
  let particles = [];
  let comboCount = 0;
  let lastSpawnTime = 0;
  let gameStartTime = 0;

  // ── SETUP CANVAS ─────────────────────────────────────────
  function setupCanvas() {
    canvas = document.getElementById('minigame-canvas');
    if (!canvas) return;

    canvas.width = Math.min(600, window.innerWidth * 0.9);
    canvas.height = 400;
    ctx = canvas.getContext('2d');
  }

  // ── GAME 1: CATCH FALLING HEARTS ─────────────────────────
  function startHearts() {
    gameType = 'hearts';
    score = 0;
    timeLeft = 30;
    objects = [];
    particles = [];
    comboCount = 0;
    lastSpawnTime = 0;
    gameStartTime = Date.now();

    showOverlay('💖 Catch the Hearts!', 'hearts');
    setupCanvas();
    active = true;
    startTimer();
    loop();
  }

  function spawnHearts() {
    if (!active) return;

    const now = Date.now();
    const elapsed = (now - gameStartTime) / 1000;

    // Spawn rate increases over time
    const spawnDelay = Math.max(400, 1200 - elapsed * 20);

    if (now - lastSpawnTime > spawnDelay) {
      const emojis = ['💖', '💕', '💗', '❤️', '🩷', '💝'];
      const count = 1 + Math.floor(Math.random() * 2) + Math.floor(elapsed / 10);

      for (let i = 0; i < count; i++) {
        objects.push({
          x: 30 + Math.random() * (canvas.width - 60),
          y: -30 - Math.random() * 50,
          vy: 2 + Math.random() * 2.5 + elapsed * 0.05,
          vx: Math.sin(elapsed) * 0.5,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          size: 24 + Math.random() * 12,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.1,
          hit: false,
          alpha: 1,
          points: 1,
        });
      }
      lastSpawnTime = now;
    }
  }

  function updateHearts(dt) {
    spawnHearts();

    objects.forEach(h => {
      if (!h.hit) {
        h.y += h.vy;
        h.x += h.vx + Math.sin(Date.now() * 0.003 + h.y * 0.01) * 0.5;
        h.rotation += h.rotSpeed;
      } else {
        h.y -= 3;
        h.alpha -= dt * 2;
        h.size *= 1.05;
      }
    });

    objects = objects.filter(h => h.y < canvas.height + 40 && h.alpha > 0);
  }

  function drawHearts() {
    // Gradient background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#FFE4F0');
    bg.addColorStop(0.5, '#F5C8FF');
    bg.addColorStop(1, '#E8D5FF');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Floating clouds
    drawClouds();

    // Hearts
    objects.forEach(h => {
      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rotation);
      ctx.font = `${h.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (!h.hit) {
        // Glow effect
        ctx.shadowColor = 'rgba(255, 100, 150, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(h.emoji, 0, 0);
      } else {
        ctx.fillText('✨', 0, 0);
      }
      ctx.restore();
    });

    // Particles
    drawParticles();

    // Combo display
    if (comboCount > 1) {
      ctx.font = 'bold 18px Nunito, sans-serif';
      ctx.fillStyle = `hsl(${300 + comboCount * 10}, 80%, 60%)`;
      ctx.textAlign = 'left';
      ctx.fillText(`🔥 Combo x${comboCount}!`, 15, 35);
    }
  }

  function clickHearts(cx, cy) {
    let hitCount = 0;

    objects.forEach(h => {
      if (h.hit) return;
      const dist = Math.hypot(cx - h.x, cy - h.y);
      if (dist < h.size) {
        h.hit = true;
        hitCount++;
        comboCount++;

        const pts = h.points * (1 + Math.floor(comboCount / 5));
        score += pts;
        updateScoreDisplay();

        spawnParticles(cx, cy, '💖', 6);
      }
    });

    if (hitCount === 0) {
      comboCount = 0;
    }
  }

  // ── GAME 2: PET CLICK FRENZY ──────────────────────────────
  function startPetClick() {
    gameType = 'petclick';
    score = 0;
    timeLeft = 30;
    objects = [];
    particles = [];
    comboCount = 0;
    gameStartTime = Date.now();

    showOverlay('🐾 Pet Frenzy!', 'petclick');
    setupCanvas();
    active = true;
    spawnClickPet();
    startTimer();
    loop();
  }

  const PET_EMOJIS = ['🐱', '🐶', '🐹', '🐰', '🦊', '🐻', '⭐', '🌙', '🍀', '🐱', '🐶'];

  function spawnClickPet() {
    if (!active) return;

    const elapsed = (Date.now() - gameStartTime) / 1000;
    const isBonus = Math.random() < 0.15;

    objects.push({
      x: 50 + Math.random() * (canvas.width - 100),
      y: 50 + Math.random() * (canvas.height - 100),
      emoji: isBonus ? '👑' : PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)],
      size: isBonus ? 45 : 35 + Math.random() * 15,
      life: 1,
      maxLife: 1,
      decay: 0.008 + elapsed * 0.0003,
      scale: 0,
      targetScale: 1,
      isBonus: isBonus,
      points: isBonus ? 5 : 1,
    });
  }

  function updatePetClick(dt) {
    // Spawn new pets
    if (objects.length < 3 + Math.floor((Date.now() - gameStartTime) / 10000)) {
      if (Math.random() < 0.03) spawnClickPet();
    }

    objects.forEach(p => {
      // Pop in animation
      if (p.scale < p.targetScale) {
        p.scale += dt * 5;
        if (p.scale > p.targetScale) p.scale = p.targetScale;
      }

      p.life -= p.decay;

      // Pulse effect
      p.displayScale = p.scale * (0.9 + Math.sin(Date.now() * 0.008) * 0.1);
    });

    objects = objects.filter(p => p.life > 0);
  }

  function drawPetClick() {
    // Pattern background
    for (let r = 0; r < canvas.height / 50 + 1; r++) {
      for (let c = 0; c < canvas.width / 50 + 1; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#FFE4F0' : '#F5D0E8';
        ctx.fillRect(c * 50, r * 50, 50, 50);
      }
    }

    // Draw pets
    objects.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.scale(p.displayScale, p.displayScale);

      // Circle background
      ctx.fillStyle = p.isBonus ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Countdown ring
      ctx.strokeStyle = p.isBonus ? '#FFD700' : 'rgba(255, 100, 180, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.85, -Math.PI / 2, -Math.PI / 2 + (1 - p.life) * Math.PI * 2);
      ctx.stroke();

      // Emoji
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);

      ctx.restore();
    });

    drawParticles();
  }

  function clickPetClick(cx, cy) {
    objects.forEach(p => {
      const dist = Math.hypot(cx - p.x, cy - p.y);
      if (dist < p.size * 0.8 && p.life > 0) {
        p.life = -1;
        comboCount++;
        score += p.points + Math.floor(comboCount / 5);
        updateScoreDisplay();

        const particleEmoji = p.isBonus ? '👑' : p.emoji;
        spawnParticles(cx, cy, particleEmoji, 8);
      }
    });
  }

  // ── PARTICLES ─────────────────────────────────────────────
  function spawnParticles(x, y, emoji, count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 3 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        emoji,
        alpha: 1,
        size: 16 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  function drawParticles() {
    particles.forEach((p, i) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.rotation += p.rotSpeed;
      p.alpha -= 0.025;
    });

    particles = particles.filter(p => p.alpha > 0);
  }

  function drawClouds() {
    const time = Date.now() * 0.0005;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';

    for (let i = 0; i < 3; i++) {
      const x = ((time * 20 + i * 200) % (canvas.width + 100)) - 50;
      const y = 30 + i * 40;
      drawCloud(x, y, 60 + i * 10);
    }
  }

  function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── MAIN GAME LOOP ─────────────────────────────────────────
  let lastTime = 0;
  function loop(ts = 0) {
    if (!active) return;

    const dt = Math.min((ts - lastTime) / 1000, 0.1);
    lastTime = ts;

    if (gameType === 'hearts') {
      updateHearts(dt);
      drawHearts();
    } else if (gameType === 'petclick') {
      updatePetClick(dt);
      drawPetClick();
    }

    animHandle = requestAnimationFrame(loop);
  }

  // ── TIMER ─────────────────────────────────────────────────
  function startTimer() {
    timerHandle = setInterval(() => {
      timeLeft--;
      const timerEl = document.getElementById('minigame-timer-display');
      if (timerEl) timerEl.textContent = `⏱ ${timeLeft}`;

      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  // ── END GAME ──────────────────────────────────────────────
  function endGame() {
    active = false;
    clearInterval(timerHandle);
    cancelAnimationFrame(animHandle);

    // Final draw
    ctx.fillStyle = 'rgba(255, 228, 240, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.font = 'bold 36px Fredoka One, cursive';
    ctx.fillStyle = '#FF5599';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 Time\'s Up!', canvas.width / 2, canvas.height / 2 - 50);

    // Score
    ctx.font = 'bold 24px Nunito, sans-serif';
    ctx.fillStyle = '#5A3050';
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 5);

    // Calculate reward
    const baseReward = Math.max(score * 2, 10);
    const bonus = comboCount > 10 ? 20 : comboCount > 5 ? 10 : 0;
    const totalReward = baseReward + bonus;

    SaveSystem.addCoins(totalReward);
    SaveSystem.state.stats.minigamesWon++;

    // Reward text
    ctx.font = '18px Nunito, sans-serif';
    ctx.fillStyle = '#FF85B3';
    ctx.fillText(`+${totalReward} coins earned! 🪙`, canvas.width / 2, canvas.height / 2 + 40);

    if (bonus > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`Combo bonus: +${bonus}! 🔥`, canvas.width / 2, canvas.height / 2 + 70);
    }

    UI.logEvent(`🎮 Minigame: ${score} pts, +${totalReward} coins!`);
    Particles.winEffect();
  }

  // ── CANVAS CLICK ───────────────────────────────────────────
  function handleCanvasClick(e) {
    if (!active) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (gameType === 'hearts') clickHearts(cx, cy);
    else if (gameType === 'petclick') clickPetClick(cx, cy);
  }

  // ── OVERLAY HELPERS ───────────────────────────────────────
  function showOverlay(title) {
    active = true;
    const overlay = document.getElementById('minigame-overlay');
    const titleEl = document.getElementById('minigame-title');
    const scoreEl = document.getElementById('minigame-score-display');
    const timerEl = document.getElementById('minigame-timer-display');

    if (overlay) overlay.classList.remove('hidden');
    if (titleEl) titleEl.textContent = title;
    if (scoreEl) scoreEl.textContent = 'Score: 0';
    if (timerEl) timerEl.textContent = '⏱ 30';

    // Add click listener
    if (canvas) {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.addEventListener('click', handleCanvasClick);
    }
  }

  function updateScoreDisplay() {
    const el = document.getElementById('minigame-score-display');
    if (el) el.textContent = `Score: ${score}`;
  }

  function quit() {
    active = false;
    clearInterval(timerHandle);
    cancelAnimationFrame(animHandle);
    const overlay = document.getElementById('minigame-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  return { startHearts, startPetClick, quit };
})();

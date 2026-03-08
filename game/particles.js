// ============================================================
//  game/particles.js — Enhanced Particle Effects System
//  Creates floating emoji particles for various game events.
// ============================================================

const Particles = (() => {

  const canvasParticles = [];
  let globalTime = 0;

  // Particle configurations
  const PARTICLE_TYPES = {
    heart: {
      emojis: ['💖', '💕', '💗', '❤️', '🩷', '♥️'],
      gravity: 0.05,
      drag: 0.99,
      colors: ['#FF69B4', '#FF1493', '#FFB6C1'],
    },
    sparkle: {
      emojis: ['✨', '⭐', '💫', '🌟', '✦', '⚡'],
      gravity: 0.02,
      drag: 0.98,
      colors: ['#FFD700', '#FFA500', '#FFFF00'],
    },
    petal: {
      emojis: ['🌸', '🌺', '🌹', '🌷', '💐', '🌼'],
      gravity: 0.03,
      drag: 0.995,
      colors: ['#FFB7C5', '#FF69B4', '#FFC0CB'],
    },
    coin: {
      emojis: ['🪙', '💰', '💎', '👑'],
      gravity: 0.08,
      drag: 0.99,
      colors: ['#FFD700', '#FFA500'],
    },
    star: {
      emojis: ['⭐', '🌟', '💫', '✨'],
      gravity: 0.04,
      drag: 0.98,
      colors: ['#FFD700', '#FFFF00'],
    },
  };

  function spawn(x, y, type = 'heart', count = 6, options = {}) {
    const config = PARTICLE_TYPES[type] || PARTICLE_TYPES.heart;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.8;
      const speed = (options.speed || 2) + Math.random() * 2;
      const size = (options.size || 16) + Math.random() * 12;

      canvasParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        emoji: config.emojis[Math.floor(Math.random() * config.emojis.length)],
        alpha: 1,
        size: size,
        life: 1,
        decay: 0.01 + Math.random() * 0.01,
        gravity: config.gravity,
        drag: config.drag,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 2 + Math.random() * 2,
      });
    }
  }

  function update(ctx) {
    globalTime += 0.016;

    for (let i = canvasParticles.length - 1; i >= 0; i--) {
      const p = canvasParticles[i];

      // Physics
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.vy *= p.drag;

      // Wobble effect
      p.wobble += p.wobbleSpeed * 0.016;
      p.x += Math.sin(p.wobble) * 0.5;

      // Rotation
      p.rotation += p.rotSpeed;

      // Life decay
      p.life -= p.decay;

      if (p.life <= 0) {
        canvasParticles.splice(i, 1);
        continue;
      }

      // Draw
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.font = `${p.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Add glow
      ctx.shadowColor = 'rgba(255, 200, 200, 0.5)';
      ctx.shadowBlur = 5;

      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    }
  }

  function burst(x, y, type = 'heart', count = 12) {
    const overlay = document.getElementById('particle-overlay');
    if (!overlay) return;

    const config = PARTICLE_TYPES[type] || PARTICLE_TYPES.heart;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'html-particle';
      el.textContent = config.emojis[Math.floor(Math.random() * config.emojis.length)];

      const offsetX = (Math.random() - 0.5) * 120;
      const offsetY = (Math.random() - 0.5) * 80;
      el.style.left = (x + offsetX) + 'px';
      el.style.top = (y + offsetY) + 'px';
      el.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
      el.style.animationDelay = (Math.random() * 0.3) + 's';
      el.style.fontSize = (18 + Math.random() * 14) + 'px';

      overlay.appendChild(el);

      el.addEventListener('animationend', () => {
        if (el.parentNode) el.remove();
      });
    }
  }

  function createExplosion(x, y, type = 'sparkle') {
    spawn(x, y, type, 15, { speed: 4 });
    burst(x, y, type, 10);
  }

  function feedEffect(x, y) {
    spawn(x, y, 'heart', 10);
    burst(x, y, 'heart', 8);
  }

  function playEffect(x, y) {
    spawn(x, y, 'sparkle', 10);
    burst(x, y, 'sparkle', 8);
  }

  function winEffect() {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    burst(cx, cy - 100, 'sparkle', 25);
    burst(cx - 100, cy, 'heart', 15);
    burst(cx + 100, cy, 'coin', 15);
    burst(cx, cy + 50, 'star', 12);

    // Delayed secondary burst
    setTimeout(() => {
      burst(cx - 50, cy - 50, 'sparkle', 10);
      burst(cx + 50, cy - 50, 'heart', 10);
    }, 300);
  }

  function levelUpEffect(x, y) {
    spawn(x, y, 'star', 15, { speed: 3 });
    burst(x, y, 'star', 12);
  }

  return {
    spawn,
    update,
    burst,
    createExplosion,
    feedEffect,
    playEffect,
    winEffect,
    levelUpEffect,
  };
})();

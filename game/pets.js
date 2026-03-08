// ============================================================
//  game/pets.js — All 15 Pets + Advanced Wandering AI + Interactions
//  Pets wander around the garden, gain happiness, level up, and interact.
//  Each pet has unique personality traits that affect behavior.
// ============================================================

const Pets = (() => {

  // ── PET TEMPLATES (15 unique pets) ───────────────────────
  // Each template defines appearance, personality, and unique traits
  const PET_TEMPLATES = [
    { id:'luna',     name:'Luna',      emoji:'🐱', color:'#E8D5FF', speed:1.2, personality:'shy',     rarity:'common' },
    { id:'biscuit',  name:'Biscuit',   emoji:'🐈', color:'#FFD09B', speed:1.5, personality:'playful', rarity:'common' },
    { id:'pudding',  name:'Pudding',   emoji:'🐶', color:'#FFE4B5', speed:1.4, personality:'loyal',   rarity:'common' },
    { id:'mochi',    name:'Mochi',     emoji:'🐹', color:'#FFC0CB', speed:2.0, personality:'speedy',  rarity:'common' },
    { id:'daisy',    name:'Daisy',     emoji:'🐰', color:'#F0FFF0', speed:1.6, personality:'bouncy',  rarity:'common' },
    { id:'coco',     name:'Coco',      emoji:'🐻', color:'#D2B48C', speed:0.8, personality:'sleepy',  rarity:'common' },
    { id:'pixel',    name:'Pixel',     emoji:'🤖', color:'#B0E0FF', speed:1.0, personality:'curious', rarity:'rare' },
    { id:'bubbles',  name:'Bubbles',   emoji:'🐠', color:'#87CEEB', speed:1.8, personality:'playful', rarity:'rare' },
    { id:'sprout',   name:'Sprout',    emoji:'🌱', color:'#90EE90', speed:0.6, personality:'sleepy',  rarity:'rare' },
    { id:'stardust', name:'Stardust',  emoji:'⭐', color:'#FFFACD', speed:2.2, personality:'speedy',  rarity:'epic' },
    { id:'pebble',   name:'Pebble',    emoji:'🪨', color:'#C0C0C0', speed:0.5, personality:'shy',     rarity:'epic' },
    { id:'ember',    name:'Ember',     emoji:'🦊', color:'#FF8C00', speed:1.9, personality:'playful', rarity:'epic' },
    { id:'dewdrop',  name:'Dewdrop',   emoji:'💧', color:'#ADD8E6', speed:1.3, personality:'bouncy',  rarity:'legendary' },
    { id:'clover',   name:'Clover',    emoji:'🍀', color:'#98FB98', speed:1.5, personality:'loyal',   rarity:'legendary' },
    { id:'nova',     name:'Nova',      emoji:'🌙', color:'#9B89C8', speed:2.0, personality:'curious', rarity:'legendary' },
  ];

  // Personality traits affect behavior
  const PERSONALITY_TRAITS = {
    shy:     { wanderChance: 0.005, mouseChase: false, idleVariance: 0.5, sleepChance: 0.02 },
    playful: { wanderChance: 0.025, mouseChase: true,  idleVariance: 1.3, sleepChance: 0.005 },
    loyal:   { wanderChance: 0.012, mouseChase: true,  idleVariance: 0.9, sleepChance: 0.01 },
    speedy:  { wanderChance: 0.035, mouseChase: false, idleVariance: 2.2, sleepChance: 0.008 },
    bouncy:  { wanderChance: 0.018, mouseChase: true,  idleVariance: 1.6, sleepChance: 0.01 },
    sleepy:  { wanderChance: 0.003, mouseChase: false, idleVariance: 0.2, sleepChance: 0.04 },
    curious: { wanderChance: 0.028, mouseChase: true,  idleVariance: 1.1, sleepChance: 0.008 },
  };

  // Track current mouse position for mouse-chasing
  let mouseX = 0;
  let mouseY = 0;

  // Currently selected pet (for the popup)
  let selectedPetId = null;

  // Animation timers
  let globalTime = 0;

  // ── CREATE A PET FROM A TEMPLATE ─────────────────────────
  function createPet(templateId, canvasWidth, canvasHeight) {
    const template = PET_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    // Calculate spawn position (on the grass area)
    const groundTop = canvasHeight * 0.62;
    const groundHeight = canvasHeight * 0.3;

    return {
      id:          template.id,
      name:        template.name,
      emoji:       template.emoji,
      color:       template.color,
      speed:       template.speed,
      personality: template.personality,
      rarity:      template.rarity,

      // Position: random inside the grass area
      x:           80 + Math.random() * (canvasWidth - 160),
      y:           groundTop + Math.random() * groundHeight,

      // Velocity
      vx:          (Math.random() - 0.5) * 2,
      vy:          (Math.random() - 0.5) * 2,

      // Wander timer
      wanderTimer: Math.random() * 3,
      idleTimer:   0,

      // Stats
      happiness:   80 + Math.floor(Math.random() * 20),  // 0–100
      hunger:      80 + Math.floor(Math.random() * 20),  // 0–100 (100=full)
      level:       1,
      xp:          0,

      // Animation
      frame:       0,
      frameTimer:  0,
      bounceY:     0,
      bounceDir:   1,
      bounceSpeed: 3 + Math.random() * 2,
      wiggle:      0,

      // Sleeping state
      sleeping:    false,
      sleepTimer:  0,

      // State: 'wander' | 'chase' | 'idle' | 'sleep' | 'excited'
      state:       'wander',
      stateTimer:  0,

      // Interaction cooldown
      lastFed:     0,
      lastPlayed:  0,
    };
  }

  // ── SPAWN A PET WHEN AN EGG HATCHES ──────────────────────
  function hatchEgg(canvas) {
    const state   = SaveSystem.state;
    const owned   = new Set(state.pets.map(p => p.id));
    const options = PET_TEMPLATES.filter(t => !owned.has(t.id));

    if (options.length === 0) {
      UI.showToast('🐾 You already have all 15 pets!');
      return null;
    }

    // Weight by rarity (rarer pets are less likely)
    const weighted = [];
    options.forEach(t => {
      const weight = t.rarity === 'common' ? 4 : t.rarity === 'rare' ? 2 : t.rarity === 'epic' ? 1 : 0.5;
      for (let i = 0; i < weight; i++) weighted.push(t);
    });

    const template = weighted[Math.floor(Math.random() * weighted.length)];
    const pet      = createPet(template.id, canvas.width, canvas.height);

    state.pets.push(pet);
    state.stats.petsHatched++;
    SaveSystem.saveGame();
    UI.rebuildPetList();
    checkAchievements();

    return pet;
  }

  // ── UPDATE ALL PETS (called every frame) ─────────────────
  function update(delta, canvas) {
    globalTime += delta;

    const w = canvas.width;
    const h = canvas.height;
    const groundTop    = h * 0.60;
    const groundBottom = h * 0.92;
    const isNight = Weather.isNight();

    SaveSystem.state.pets.forEach(pet => {
      updatePet(pet, delta, w, groundTop, groundBottom, isNight);
    });
  }

  // ── UPDATE SINGLE PET ────────────────────────────────────
  function updatePet(pet, delta, w, groundTop, groundBottom, isNight) {
    const traits = PERSONALITY_TRAITS[pet.personality];

    // ── Stats decay over time ──
    const hungerDecay = pet.state === 'sleep' ? 0.05 : 0.25;
    pet.hunger = Math.max(0, pet.hunger - delta * hungerDecay);

    const happyDecay = pet.hunger < 30 ? 0.3 : pet.hunger < 60 ? 0.15 : 0.08;
    pet.happiness = Math.max(0, pet.happiness - delta * happyDecay);

    // ── XP gain (slow passive gain) ──
    if (pet.happiness > 50 && pet.hunger > 50) {
      pet.xp += delta * 0.3;
    }

    // ── Level up check ──
    const xpNeeded = pet.level * 60;
    if (pet.xp >= xpNeeded) {
      pet.xp -= xpNeeded;
      pet.level++;
      pet.happiness = Math.min(100, pet.happiness + 20);
      UI.logEvent(`🌟 ${pet.name} reached level ${pet.level}!`);
      Particles.spawn(pet.x, pet.y, 'star', 12);
    }

    // ── Animation: gentle bounce ──
    pet.bounceY += pet.bounceDir * delta * pet.bounceSpeed * 10;
    if (Math.abs(pet.bounceY) > 4) pet.bounceDir *= -1;

    // ── Animation: wiggle when moving ──
    if (Math.abs(pet.vx) > 0.5 || Math.abs(pet.vy) > 0.5) {
      pet.wiggle = Math.sin(globalTime * 15) * 3;
    } else {
      pet.wiggle *= 0.9;
    }

    // ── State machine ──
    pet.stateTimer -= delta;

    // Sleep behavior
    if (pet.state !== 'sleep' && pet.state !== 'excited') {
      // Chance to sleep at night or when very tired
      const sleepChance = (isNight ? 0.003 : 0.001) + (pet.happiness < 20 ? 0.01 : 0);
      if (Math.random() < sleepChance || pet.happiness < 10) {
        pet.state = 'sleep';
        pet.sleepTimer = 15 + Math.random() * 20;
      }
    }

    if (pet.state === 'sleep') {
      pet.sleepTimer -= delta;
      pet.vx *= 0.95;
      pet.vy *= 0.95;

      // Wake up if well-rested or manually interacted with
      if (pet.sleepTimer <= 0 || pet.happiness > 80) {
        pet.state = 'wander';
        pet.happiness = Math.min(100, pet.happiness + 10);
      }
      return; // Don't move while sleeping
    }

    // Excited state (after playing)
    if (pet.state === 'excited') {
      if (pet.stateTimer <= 0) {
        pet.state = 'wander';
      } else {
        // Fast erratic movement
        pet.vx += (Math.random() - 0.5) * delta * 20;
        pet.vy += (Math.random() - 0.5) * delta * 20;
      }
    }

    // Chase mouse behavior
    if (traits.mouseChase && pet.state !== 'excited') {
      const dx = mouseX - pet.x;
      const dy = mouseY - pet.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 150 && Math.random() < 0.02) {
        pet.state = 'chase';
        pet.stateTimer = 3;
      }

      if (pet.state === 'chase') {
        if (dist > 15 && pet.stateTimer > 0) {
          pet.vx = (dx / dist) * pet.speed * 2.5;
          pet.vy = (dy / dist) * pet.speed * 2.5;
        } else {
          pet.state = 'wander';
        }
      }
    }

    // Wander behavior
    if (pet.state === 'wander' || pet.state === 'idle') {
      pet.wanderTimer -= delta;

      if (pet.wanderTimer <= 0) {
        // Pick new direction
        const variance = traits.idleVariance;
        const angle = Math.random() * Math.PI * 2;
        const speed = pet.speed * (0.5 + Math.random() * 0.5) * variance;

        pet.vx = Math.cos(angle) * speed;
        pet.vy = Math.sin(angle) * speed * 0.6; // Less vertical movement

        pet.wanderTimer = 1 + Math.random() * 3;
        pet.state = Math.abs(pet.vx) + Math.abs(pet.vy) < 0.3 ? 'idle' : 'wander';
      }
    }

    // ── Apply movement ──
    pet.x += pet.vx;
    pet.y += pet.vy;

    // ── Boundary constraints ──
    const margin = 25;
    if (pet.x < margin) {
      pet.x = margin;
      pet.vx = Math.abs(pet.vx) * 0.8;
    }
    if (pet.x > w - margin) {
      pet.x = w - margin;
      pet.vx = -Math.abs(pet.vx) * 0.8;
    }
    if (pet.y < groundTop) {
      pet.y = groundTop;
      pet.vy = Math.abs(pet.vy) * 0.8;
    }
    if (pet.y > groundBottom) {
      pet.y = groundBottom;
      pet.vy = -Math.abs(pet.vy) * 0.8;
    }

    // ── Friction ──
    pet.vx *= 0.985;
    pet.vy *= 0.985;
  }

  // ── DRAW ALL PETS ─────────────────────────────────────────
  function draw(ctx) {
    const pets = SaveSystem.state.pets;
    // Sort by Y so pets further down appear in front
    const sorted = [...pets].sort((a, b) => a.y - b.y);

    sorted.forEach(pet => {
      drawPet(ctx, pet);
    });
  }

  // ── DRAW SINGLE PET ──────────────────────────────────────
  function drawPet(ctx, pet) {
    const x = pet.x + pet.wiggle;
    const y = pet.y + pet.bounceY;

    ctx.save();

    // Shadow under pet (scales with bounce)
    const shadowScale = 1 - Math.abs(pet.bounceY) * 0.03;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#3D2F3D';
    ctx.beginPath();
    ctx.ellipse(pet.x, pet.y + 16, 18 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Glow effect for selected pet
    if (pet.id === selectedPetId) {
      const glowPulse = 1 + Math.sin(globalTime * 5) * 0.1;
      ctx.fillStyle = 'rgba(255, 150, 200, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 28 * glowPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glow effect for rare pets
    if (pet.rarity === 'legendary') {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    // Colored circle body
    ctx.fillStyle = pet.color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2.5;

    // Add subtle gradient
    const grad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 22);
    grad.addColorStop(0, lightenColor(pet.color, 20));
    grad.addColorStop(1, pet.color);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(x, y, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pet emoji
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Slight tilt based on movement
    const tilt = pet.vx * 0.05;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillText(pet.emoji, 0, 0);
    ctx.restore();

    // Level badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x + 15, y - 15, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5A3050';
    ctx.font = 'bold 10px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pet.level, x + 15, y - 15);

    // Status indicators
    if (pet.state === 'sleep') {
      // Sleeping Z's animation
      const zOffset = Math.sin(globalTime * 3) * 3;
      ctx.font = '14px serif';
      ctx.fillStyle = '#9B89C8';
      ctx.fillText('💤', x + 10, y - 30 + zOffset);
    }

    if (pet.hunger < 25) {
      // Hunger warning
      ctx.font = '13px serif';
      ctx.fillText('😫', x - 12, y - 28);
    }

    if (pet.happiness > 90 && pet.hunger > 70) {
      // Happy indicator
      ctx.font = '12px serif';
      ctx.fillText('✨', x + 18, y + 5);
    }

    ctx.restore();
  }

  // ── COLOR HELPER ─────────────────────────────────────────
  function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x00FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  // ── PET CLICK DETECTION ───────────────────────────────────
  function handleClick(cx, cy) {
    const pets = SaveSystem.state.pets;
    // Check in reverse order (top pets first)
    for (let i = pets.length - 1; i >= 0; i--) {
      const pet = pets[i];
      const dist = Math.hypot(cx - pet.x, cy - (pet.y + pet.bounceY));
      if (dist < 26) {
        selectedPetId = pet.id;
        UI.showPetPopup(pet);

        // Happiness boost from attention
        pet.happiness = Math.min(100, pet.happiness + 3);

        // Small bounce effect
        pet.bounceY = -5;
        pet.bounceDir = 1;

        Particles.spawn(pet.x, pet.y, 'heart', 4);
        return true;
      }
    }
    selectedPetId = null;
    UI.closePetPopup();
    return false;
  }

  // ── FEED SELECTED PET ─────────────────────────────────────
  function feedSelected() {
    const pet = getSelected();
    if (!pet) return;

    pet.hunger = Math.min(100, pet.hunger + 45);
    pet.happiness = Math.min(100, pet.happiness + 20);
    pet.xp += 5;
    pet.lastFed = Date.now();

    // Wake up if sleeping
    if (pet.state === 'sleep') {
      pet.state = 'wander';
      pet.happiness = Math.min(100, pet.happiness + 10);
    }

    Particles.feedEffect(pet.x, pet.y);
    UI.logEvent(`🍎 You fed ${pet.name}!`);
    UI.showPetPopup(pet);
    UI.rebuildPetList();
    SaveSystem.saveGame();
  }

  // ── PLAY WITH SELECTED PET ────────────────────────────────
  function playWithSelected() {
    const pet = getSelected();
    if (!pet) return;

    pet.happiness = Math.min(100, pet.happiness + 30);
    pet.xp += 15;
    pet.lastPlayed = Date.now();

    // Enter excited state
    pet.state = 'excited';
    pet.stateTimer = 3;

    // Excited movement
    pet.vx = (Math.random() - 0.5) * pet.speed * 6;
    pet.vy = -pet.speed * 3;
    pet.bounceSpeed = 6;

    Particles.playEffect(pet.x, pet.y);
    UI.logEvent(`🎾 You played with ${pet.name}!`);
    UI.showPetPopup(pet);

    // Earn a coin for playing
    SaveSystem.addCoins(2);
    SaveSystem.saveGame();

    // Reset bounce speed after excitement
    setTimeout(() => {
      pet.bounceSpeed = 3 + Math.random() * 2;
    }, 3000);
  }

  function getSelected() {
    if (!selectedPetId) return null;
    return SaveSystem.state.pets.find(p => p.id === selectedPetId);
  }

  function setMousePos(x, y) {
    mouseX = x;
    mouseY = y;
  }

  // ── CHECK ACHIEVEMENTS ────────────────────────────────────
  function checkAchievements() {
    const { pets, achievements } = SaveSystem.state;

    if (pets.length >= 1 && !achievements.firstPet) {
      achievements.firstPet = true;
      UI.logEvent('🏆 Achievement: First Pet!');
      UI.addAchievement('🐾 First Pet');
    }
    if (pets.length >= 5 && !achievements.fivePets) {
      achievements.fivePets = true;
      UI.logEvent('🏆 Achievement: Pet Collector!');
      UI.addAchievement('🐾 Pet Collector');
    }
    if (pets.length >= 10 && !achievements.tenPets) {
      achievements.tenPets = true;
      UI.logEvent('🏆 Achievement: Pet Hoarder!');
      UI.addAchievement('🐾 Pet Hoarder');
    }
    if (pets.length >= 15 && !achievements.allPets) {
      achievements.allPets = true;
      UI.logEvent('🏆 Achievement: All 15 Pets Collected!');
      UI.addAchievement('🏆 Pet Master!');
    }

    // Check for high level pets
    const maxLevel = Math.max(...pets.map(p => p.level), 0);
    if (maxLevel >= 5 && !achievements.level5) {
      achievements.level5 = true;
      UI.logEvent('🏆 Achievement: Level 5 Pet!');
      UI.addAchievement('⭐ Experienced');
    }
    if (maxLevel >= 10 && !achievements.level10) {
      achievements.level10 = true;
      UI.logEvent('🏆 Achievement: Level 10 Pet!');
      UI.addAchievement('⭐ Pet Expert');
    }
  }

  function getTemplates() {
    return PET_TEMPLATES;
  }

  function getSelectedId() {
    return selectedPetId;
  }

  return {
    PET_TEMPLATES,
    createPet,
    hatchEgg,
    update,
    draw,
    handleClick,
    feedSelected,
    playWithSelected,
    getSelected,
    getSelectedId,
    setMousePos,
    checkAchievements,
    getTemplates,
  };
})();

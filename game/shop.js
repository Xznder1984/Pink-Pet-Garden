// ============================================================
//  game/shop.js — Enhanced Shop System with Coin Economy
//  Players spend coins on eggs, toys, food, and decorations.
// ============================================================

const Shop = (() => {

  // ── ALL SHOP ITEMS ────────────────────────────────────────
  const ITEMS = [
    // EGGS
    { id:'egg_basic',   category:'egg',   name:'Basic Egg',   emoji:'🥚', cost:30,
      desc:'Hatch a random pet! Common pets more likely.', action: buyEgg },
    { id:'egg_golden',  category:'egg',   name:'Golden Egg',  emoji:'🌟', cost:80,
      desc:'Higher chance of rare and epic pets!', action: buyEgg },
    { id:'egg_rainbow', category:'egg',   name:'Rainbow Egg', emoji:'🌈', cost:150,
      desc:'Guaranteed rare or better pet!', action: buyEgg },

    // FOOD
    { id:'food_apple',  category:'food',  name:'Apple',       emoji:'🍎', cost:5,
      desc:'Feeds one pet. +35 hunger, +10 happiness', action: buyFood },
    { id:'food_cake',   category:'food',  name:'Cake',        emoji:'🎂', cost:15,
      desc:'Delicious treat! +50 hunger, +25 happiness', action: buyCake },
    { id:'food_cookie', category:'food',  name:'Cookie',      emoji:'🍪', cost:8,
      desc:'Sweet snack. +20 happiness', action: buyCookie },

    // TOYS
    { id:'toy_ball',    category:'toy',   name:'Ball',        emoji:'🎾', cost:15,
      desc:'All pets play together! +20 happiness each', action: buyToy },
    { id:'toy_yarn',    category:'toy',   name:'Yarn',        emoji:'🧶', cost:12,
      desc:'Cats love this! +25 happiness for playful pets', action: buyToy },
    { id:'toy_robot',   category:'toy',   name:'Robot Toy',   emoji:'🤖', cost:25,
      desc:'Pixel\'s favorite! +30 happiness, +XP bonus', action: buyToy },

    // BOOSTS
    { id:'boost_rain',  category:'boost', name:'Coin Rain',   emoji:'🌧️', cost:50,
      desc:'Instant +60 coins!', action: buyCoinRain },
    { id:'boost_fertilizer', category:'boost', name:'Fertilizer', emoji:'💩', cost:20,
      desc:'All flowers grow 2x faster for 30s', action: buyFertilizer },
  ];

  // DECORATIONS (placed in the garden via the Decor tab)
  const DECORATIONS = [
    { id:'deco_bed',      name:'Pet Bed',       emoji:'🛏️', cost:25 },
    { id:'deco_tree',     name:'Pink Tree',     emoji:'🌸', cost:30 },
    { id:'deco_lamp',     name:'Garden Lamp',   emoji:'🏮', cost:20 },
    { id:'deco_well',     name:'Wishing Well',  emoji:'🪣', cost:40 },
    { id:'deco_bench',    name:'Park Bench',    emoji:'🪑', cost:28 },
    { id:'deco_chest',    name:'Treasure Chest',emoji:'📦', cost:35 },
    { id:'deco_fountain', name:'Fountain',      emoji:'⛲', cost:55 },
    { id:'deco_statue',   name:'Angel Statue',  emoji:'👼', cost:45 },
    { id:'deco_rock',     name:'Garden Rock',   emoji:'🪨', cost:15 },
    { id:'deco_mushroom', name:'Mushroom',      emoji:'🍄', cost:18 },
  ];

  let selectedDeco = null;
  let fertilizerActive = false;
  let fertilizerEndTime = 0;

  // ── INIT: Build the shop UI ───────────────────────────────
  function init() {
    buildShopUI();
    buildDecorPanel();
  }

  function buildShopUI() {
    const container = document.getElementById('shop-items-container');
    if (!container) return;

    container.innerHTML = '';

    // Group items by category
    const categories = {};
    ITEMS.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    // Create category sections
    const categoryNames = {
      egg: '🥚 Eggs',
      food: '🍎 Food',
      toy: '🎾 Toys',
      boost: '⚡ Boosts'
    };

    Object.entries(categories).forEach(([cat, items]) => {
      const catDiv = document.createElement('div');
      catDiv.className = 'shop-category';
      catDiv.innerHTML = `<h4>${categoryNames[cat] || cat}</h4>`;

      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'shop-items-row';

      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
          <span class="item-emoji">${item.emoji}</span>
          <span class="item-name">${item.name}</span>
          <span class="item-cost">🪙 ${item.cost}</span>
        `;
        div.title = item.desc;
        div.onclick = () => purchaseItem(item);
        itemsDiv.appendChild(div);
      });

      catDiv.appendChild(itemsDiv);
      container.appendChild(catDiv);
    });
  }

  function buildDecorPanel() {
    const container = document.getElementById('decor-selector');
    if (!container) return;

    container.innerHTML = '';

    DECORATIONS.forEach(deco => {
      const btn = document.createElement('button');
      btn.className = 'decor-btn';
      btn.innerHTML = `
        <span class="decor-emoji">${deco.emoji}</span>
        <span class="decor-name">${deco.name}</span>
        <span class="decor-cost">🪙${deco.cost}</span>
      `;
      btn.onclick = () => selectDecor(deco, btn);
      container.appendChild(btn);
    });
  }

  function selectDecor(deco, btn) {
    if (selectedDeco === deco) {
      // Deselect
      selectedDeco = null;
      btn.classList.remove('selected');
      UI.showToast('❌ Decoration cancelled');
      return;
    }

    selectedDeco = deco;
    document.querySelectorAll('.decor-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    UI.showToast(`${deco.emoji} Click the garden to place ${deco.name}!`);
  }

  function placeDecor(col, row) {
    if (!selectedDeco) return false;

    // Check if spot is occupied
    const existing = SaveSystem.state.decorations.find(d => d.col === col && d.row === row);
    if (existing) {
      UI.showToast('❌ Something is already there!');
      return false;
    }

    SaveSystem.state.decorations.push({
      id: selectedDeco.id,
      col,
      row,
      emoji: selectedDeco.emoji,
      name: selectedDeco.name
    });

    UI.logEvent(`${selectedDeco.emoji} Placed ${selectedDeco.name}!`);
    Particles.spawn(
      Garden.getCellPixel(document.getElementById('game-canvas'), col, row).centerX,
      Garden.getCellPixel(document.getElementById('game-canvas'), col, row).centerY,
      'sparkle', 6
    );

    selectedDeco = null;
    document.querySelectorAll('.decor-btn').forEach(b => b.classList.remove('selected'));
    SaveSystem.saveGame();
    return true;
  }

  // ── PURCHASE LOGIC ────────────────────────────────────────
  function purchaseItem(item) {
    if (!SaveSystem.spendCoins(item.cost)) {
      UI.showToast(`🪙 Need ${item.cost} coins for ${item.name}!`);
      return;
    }

    item.action(item);
    UI.showToast(`${item.emoji} Bought ${item.name}!`);
    UI.logEvent(`🛍️ Purchased ${item.name} for 🪙${item.cost}`);
    SaveSystem.saveGame();
  }

  // ── ITEM ACTIONS ──────────────────────────────────────────
  function buyEgg(item) {
    UI.startHatchSequence();

    // Hatch delay for suspense
    setTimeout(() => {
      const canvas = document.getElementById('game-canvas');
      const pet = Pets.hatchEgg(canvas);
      UI.showHatchResult(pet);

      if (pet) {
        // Bonus for better eggs
        if (item.id === 'egg_golden') {
          pet.xp += 50;
          UI.showToast('✨ Golden bonus: +50 XP!');
        } else if (item.id === 'egg_rainbow') {
          pet.xp += 100;
          pet.happiness = 100;
          UI.showToast('🌈 Rainbow bonus: +100 XP & max happiness!');
        }
      }
    }, 2500);
  }

  function buyFood(item) {
    const pet = Pets.getSelected() || SaveSystem.state.pets[0];
    if (!pet) {
      UI.showToast('🐾 No pets yet! Buy an egg first.');
      return;
    }

    pet.hunger = Math.min(100, pet.hunger + 35);
    pet.happiness = Math.min(100, pet.happiness + 10);
    pet.xp += 3;

    Particles.feedEffect(pet.x, pet.y);
    UI.logEvent(`🍎 Fed ${pet.name} an apple!`);
    UI.rebuildPetList();
    if (Pets.getSelectedId() === pet.id) UI.showPetPopup(pet);
  }

  function buyCake(item) {
    const pet = Pets.getSelected() || SaveSystem.state.pets[0];
    if (!pet) {
      UI.showToast('🐾 No pets yet!');
      return;
    }

    pet.hunger = Math.min(100, pet.hunger + 50);
    pet.happiness = Math.min(100, pet.happiness + 25);
    pet.xp += 8;

    Particles.spawn(pet.x, pet.y, 'sparkle', 10);
    UI.logEvent(`🎂 ${pet.name} enjoyed the cake!`);
    UI.rebuildPetList();
    if (Pets.getSelectedId() === pet.id) UI.showPetPopup(pet);
  }

  function buyCookie(item) {
    const pet = Pets.getSelected() || SaveSystem.state.pets[0];
    if (!pet) {
      UI.showToast('🐾 No pets yet!');
      return;
    }

    pet.happiness = Math.min(100, pet.happiness + 20);
    pet.xp += 5;

    Particles.playEffect(pet.x, pet.y);
    UI.logEvent(`🍪 ${pet.name} loves the cookie!`);
    UI.rebuildPetList();
    if (Pets.getSelectedId() === pet.id) UI.showPetPopup(pet);
  }

  function buyToy(item) {
    const pets = SaveSystem.state.pets;
    if (pets.length === 0) {
      UI.showToast('🐾 No pets to play with!');
      return;
    }

    let bonus = 15;
    if (item.id === 'toy_yarn') bonus = 25;
    if (item.id === 'toy_robot') bonus = 30;

    pets.forEach(pet => {
      pet.happiness = Math.min(100, pet.happiness + bonus);
      pet.xp += item.id === 'toy_robot' ? 10 : 3;

      // Excited movement
      pet.vx = (Math.random() - 0.5) * pet.speed * 5;
      pet.vy = -pet.speed * 2;
      pet.state = 'excited';
      pet.stateTimer = 4;

      Particles.spawn(pet.x, pet.y, 'sparkle', 4);
    });

    Particles.winEffect();
    UI.logEvent(`${item.emoji} All pets played with ${item.name}!`);
    UI.rebuildPetList();
  }

  function buyCoinRain(item) {
    SaveSystem.addCoins(60);
    Particles.winEffect();
    UI.logEvent('🌧️ Coin rain! +60 coins!');
  }

  function buyFertilizer(item) {
    fertilizerActive = true;
    fertilizerEndTime = Date.now() + 30000;
    UI.showToast('💩 Fertilizer active! Flowers grow 2x faster for 30s!');
    UI.logEvent('💩 Fertilizer activated!');
  }

  // ── GETTERS ───────────────────────────────────────────────
  function isFertilizerActive() {
    if (fertilizerActive && Date.now() > fertilizerEndTime) {
      fertilizerActive = false;
    }
    return fertilizerActive;
  }

  function getSelectedDeco() {
    return selectedDeco;
  }

  return {
    init,
    ITEMS,
    DECORATIONS,
    placeDecor,
    getSelectedDeco,
    isFertilizerActive,
  };
})();

# 🌸 Pink Pet Paradise

A cozy kawaii pet simulator game built with Electron. Hatch eggs, grow gardens, and collect adorable pets!

![Game Preview](assets/puppy.svg)

## ✨ Features

- 🥚 **Hatch Eggs** - Buy eggs and watch them hatch into unique pets
- 🌺 **Garden System** - Plant and grow 8 different types of flowers
- 🛍️ **Shop** - Purchase eggs, toys, and decorations with in-game coins
- 🎮 **Minigames** - Play "Catch Hearts" and "Pet Frenzy" to earn coins
- 🌤️ **Weather & Day/Night Cycle** - Watch the world change with dynamic weather
- 💾 **Save System** - Your progress is automatically saved
- 🎵 **Music** - Toggle background music on/off

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 16 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/Xznder1984/Pink-Pet-Garden.git

# Navigate to project folder
cd Pink-Pet-Garden

# Install dependencies
npm install

# Run the game
npm start
```

## 🛠️ Building

### Windows

```bash
npm run build:win
```

Creates:
- `dist/Pink Pet Paradise Setup.exe` - Installer
- `dist/Pink Pet Paradise.exe` - Portable version

### Mac

```bash
npm run build:mac
```

Creates:
- `dist/Pink Pet Paradise.dmg` - Disk image installer
- `dist/Pink Pet Paradise.zip` - Portable version
- `dist/mac/Pink Pet Paradise.app` - App bundle

### Build All Platforms

```bash
npm run build:all
```

## 🎮 How to Play

1. **Start the game** - Click "Play Now" on the menu screen
2. **Get your first pet** - Go to the Shop tab and buy an egg
3. **Hatch it** - Wait for the egg to hatch or interact with it
4. **Feed & Play** - Keep your pets happy by feeding and playing with them
5. **Grow a garden** - Plant flowers in the Garden tab
6. **Play minigames** - Earn coins by playing games in the Games tab

## 🐾 Pets

Collect 15 unique pets including:
- 🐱 Cats (Luna, Biscuit)
- 🐶 Dogs (Biscuit the pup)
- 🐹 Hamsters
- 🐰 Bunnies
- 🦊 Foxes
- 🐻 Bears
- ⭐ And more rare pets!

## 🌺 Flowers

Grow 8 different flower types:
- 🌹 Rose
- 🌻 Sunflower
- 🌷 Tulip
- 🪻 Lavender
- 🌸 Cherry Blossom
- 💮 Daisy
- 🏵️ Marigold
- 🌼 Dandelion

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run in development mode |
| `npm run dev` | Run with debugging enabled |
| `npm run build` | Build for current platform |
| `npm run build:mac` | Build for Mac |
| `npm run build:win` | Build for Windows |
| `npm run build:all` | Build for all platforms |

## 🏗️ Tech Stack

- **Electron** - Desktop app framework
- **HTML5 Canvas** - Game rendering
- **Vanilla JavaScript** - Game logic
- **CSS3** - Styling and animations

## 📁 Project Structure

```
pink-pet-garden/
├── assets/          # Images, audio, icons
├── game/            # Game modules
│   ├── engine.js    # Core game loop
│   ├── pets.js      # Pet system
│   ├── garden.js    # Garden system
│   ├── shop.js      # Shop system
│   ├── minigame.js  # Minigames
│   ├── weather.js   # Weather system
│   ├── ui.js        # UI handling
│   ├── particles.js # Particle effects
│   └── save.js      # Save system
├── .github/workflows/  # GitHub Actions
├── index.html       # Main HTML
├── main.js          # Electron main process
├── preload.js       # Electron preload
├── style.css        # Styles
└── package.json     # Dependencies
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests!

## 📄 License

MIT License - feel free to use this project however you'd like!

---

Made with 💕 by Pink Pet Paradise Studio

// ============================================================
//  game/weather.js — Enhanced Weather & Day/Night Cycle System
//  Smoothly transitions between times of day and weather states.
// ============================================================

const Weather = (() => {

  // Weather states with visual properties
  const WEATHERS = [
    { id: 'sunny',  name: 'Sunny',  icon: '☀️', cloudOpacity: 0.2, windMult: 1 },
    { id: 'cloudy', name: 'Cloudy', icon: '☁️', cloudOpacity: 0.85, windMult: 1.2 },
    { id: 'rain',   name: 'Rainy',  icon: '🌧️', cloudOpacity: 1, windMult: 0.8 },
    { id: 'windy',  name: 'Windy',  icon: '💨', cloudOpacity: 0.5, windMult: 2.5 },
  ];

  // Time-of-day states with sky colors
  const TIMES = [
    { id: 'dawn',   name: 'Dawn',   icon: '🌅', skyTop: '#FF9A8B', skyMid: '#FECFEF', skyBot: '#FFF5E6' },
    { id: 'day',    name: 'Day',    icon: '☀️', skyTop: '#4FACFE', skyMid: '#A8EDEA', skyBot: '#F0F8FF' },
    { id: 'sunset', name: 'Sunset', icon: '🌇', skyTop: '#667eea', skyMid: '#f093fb', skyBot: '#FFD194' },
    { id: 'night',  name: 'Night',  icon: '🌙', skyTop: '#0f0c29', skyMid: '#302b63', skyBot: '#24243e' },
  ];

  let currentWeather = WEATHERS[0];
  let currentTime = TIMES[1];
  let timeIndex = 1;
  let timeProgress = 0;
  let dayCycleTime = 0;

  // Visual elements
  let rainDrops = [];
  let stars = [];
  let clouds = [];
  let fireflies = [];

  // Timers
  let weatherTimer = 0;
  const WEATHER_CHANGE_INTERVAL = 90; // seconds

  // Animation
  let globalTime = 0;

  function init() {
    // Initialize clouds
    for (let i = 0; i < 6; i++) {
      clouds.push(createCloud());
    }

    // Initialize stars
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.6,
        size: 0.5 + Math.random() * 1.5,
        twinkleSpeed: 1 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Initialize fireflies for night
    for (let i = 0; i < 15; i++) {
      fireflies.push({
        x: Math.random(),
        y: 0.6 + Math.random() * 0.4,
        vx: (Math.random() - 0.5) * 0.001,
        vy: (Math.random() - 0.5) * 0.001,
        phase: Math.random() * Math.PI * 2,
      });
    }

    weatherTimer = WEATHER_CHANGE_INTERVAL;
  }

  function createCloud() {
    return {
      x: Math.random(),
      y: 0.05 + Math.random() * 0.25,
      width: 0.08 + Math.random() * 0.08,
      speed: 0.0002 + Math.random() * 0.0003,
      puffs: Array(3 + Math.floor(Math.random() * 3)).fill(0).map(() => ({
        dx: (Math.random() - 0.5) * 0.04,
        dy: (Math.random() - 0.5) * 0.02,
        size: 0.7 + Math.random() * 0.4,
      })),
    };
  }

  function update(delta, canvasWidth) {
    globalTime += delta;

    // Day/night cycle (~6 minutes full cycle)
    dayCycleTime += delta / 360;
    if (dayCycleTime >= 1) dayCycleTime = 0;

    // Map to time index
    const rawIndex = dayCycleTime * 4;
    timeIndex = Math.floor(rawIndex) % 4;
    timeProgress = rawIndex % 1;
    currentTime = TIMES[timeIndex];

    // Weather changes
    weatherTimer -= delta;
    if (weatherTimer <= 0) {
      const next = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      if (next.id !== currentWeather.id) {
        currentWeather = next;
        UI.logEvent(`${currentWeather.icon} Weather changed to ${currentWeather.name}`);
      }
      weatherTimer = WEATHER_CHANGE_INTERVAL + Math.random() * 60;
    }

    // Update clouds
    clouds.forEach(c => {
      c.x += c.speed * currentWeather.windMult;
      if (c.x > 1.2) {
        c.x = -0.2;
        c.y = 0.05 + Math.random() * 0.25;
      }
    });

    // Update rain
    if (currentWeather.id === 'rain') {
      for (let i = 0; i < 5; i++) {
        rainDrops.push({
          x: Math.random(),
          y: -0.05,
          speed: 0.3 + Math.random() * 0.2,
          length: 0.01 + Math.random() * 0.01,
        });
      }
    }
    rainDrops.forEach(r => {
      r.y += r.speed * delta;
      r.x -= 0.01 * delta; // Wind slant
    });
    rainDrops = rainDrops.filter(r => r.y < 1);

    // Update fireflies
    if (currentTime.id === 'night') {
      fireflies.forEach(f => {
        f.x += f.vx * delta;
        f.y += f.vy * delta;
        f.phase += delta * 2;

        // Wrap around
        if (f.x < 0) f.x = 1;
        if (f.x > 1) f.x = 0;
        if (f.y < 0.5) f.y = 0.9;
        if (f.y > 1) f.y = 0.6;
      });
    }

    // Update UI
    updateUI();
  }

  function updateUI() {
    const weatherIcon = document.getElementById('weather-icon');
    const weatherName = document.getElementById('weather-name');
    const dayIcon = document.getElementById('day-icon');
    const dayName = document.getElementById('day-name');

    if (weatherIcon) weatherIcon.textContent = currentWeather.icon;
    if (weatherName) weatherName.textContent = currentWeather.name;
    if (dayIcon) dayIcon.textContent = currentTime.icon;
    if (dayName) dayName.textContent = currentTime.name;
  }

  function draw(ctx, width, height) {
    // Interpolate sky colors
    const nextIndex = (timeIndex + 1) % 4;
    const curTime = TIMES[timeIndex];
    const nxtTime = TIMES[nextIndex];

    const skyTop = lerpColor(curTime.skyTop, nxtTime.skyTop, timeProgress);
    const skyMid = lerpColor(curTime.skyMid, nxtTime.skyMid, timeProgress);
    const skyBot = lerpColor(curTime.skyBot, nxtTime.skyBot, timeProgress);

    // Draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.5, skyMid);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw celestial body (sun/moon)
    drawCelestialBody(ctx, width, height);

    // Draw stars at night
    if (currentTime.id === 'night' || (currentTime.id === 'sunset' && timeProgress > 0.5)) {
      drawStars(ctx, width, height);
    }

    // Draw clouds
    drawClouds(ctx, width, height);

    // Draw rain
    if (currentWeather.id === 'rain') {
      drawRain(ctx, width, height);
    }

    // Draw ground
    drawGround(ctx, width, height);

    // Draw fireflies at night
    if (currentTime.id === 'night') {
      drawFireflies(ctx, width, height);
    }
  }

  function drawCelestialBody(ctx, width, height) {
    const cx = width * (0.2 + dayCycleTime * 0.6);
    const cy = height * (0.15 + Math.sin(dayCycleTime * Math.PI) * 0.1);

    if (currentTime.id === 'day') {
      // Sun
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FFA500';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.fill();

      // Sun rays
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (globalTime * 0.5) + (i * Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 35, cy + Math.sin(angle) * 35);
        ctx.lineTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 50);
        ctx.stroke();
      }
      ctx.restore();
    } else if (currentTime.id === 'night') {
      // Moon
      ctx.save();
      ctx.fillStyle = '#F5F5DC';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();

      // Moon craters
      ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 3, 4, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 5, 3, 0, Math.PI * 2);
      ctx.arc(cx - 3, cy + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStars(ctx, width, height) {
    const alpha = currentTime.id === 'night' ? 1 : 0.5;

    stars.forEach(s => {
      const twinkle = Math.sin(globalTime * s.twinkleSpeed + s.twinkleOffset);
      const starAlpha = alpha * (0.5 + twinkle * 0.5);

      ctx.save();
      ctx.globalAlpha = starAlpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawClouds(ctx, width, height) {
    const opacity = currentWeather.cloudOpacity;

    clouds.forEach(c => {
      const cx = c.x * width;
      const cy = c.y * height;
      const cw = c.width * width;

      ctx.save();
      ctx.globalAlpha = opacity * 0.8;
      ctx.fillStyle = currentWeather.id === 'rain' ? '#B0B0B0' : '#FFFFFF';

      c.puffs.forEach(puff => {
        ctx.beginPath();
        ctx.arc(
          cx + puff.dx * width,
          cy + puff.dy * height,
          cw * 0.3 * puff.size,
          0, Math.PI * 2
        );
        ctx.fill();
      });

      ctx.restore();
    });
  }

  function drawRain(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.6)';
    ctx.lineWidth = 1.5;

    rainDrops.forEach(r => {
      ctx.beginPath();
      ctx.moveTo(r.x * width, r.y * height);
      ctx.lineTo((r.x - 0.005) * width, (r.y + r.length) * height);
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawGround(ctx, width, height) {
    const groundY = height * 0.6;

    // Grass gradient
    const grassGrad = ctx.createLinearGradient(0, groundY, 0, height);

    if (currentTime.id === 'night') {
      grassGrad.addColorStop(0, '#2d4a3e');
      grassGrad.addColorStop(1, '#1a2f26');
    } else if (currentTime.id === 'sunset') {
      grassGrad.addColorStop(0, '#8B9A6B');
      grassGrad.addColorStop(1, '#6B7A4B');
    } else {
      grassGrad.addColorStop(0, '#A8E6A3');
      grassGrad.addColorStop(1, '#7BC96F');
    }

    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Grass texture
    ctx.save();
    ctx.strokeStyle = currentTime.id === 'night' ? 'rgba(100, 120, 100, 0.3)' : 'rgba(100, 160, 80, 0.2)';
    ctx.lineWidth = 1;

    for (let i = 0; i < width; i += 20) {
      const h = 5 + Math.sin(i * 0.1) * 3;
      const gx = i + Math.sin(globalTime + i * 0.01) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, groundY + 5);
      ctx.lineTo(gx + 2, groundY + 5 - h);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFireflies(ctx, width, height) {
    ctx.save();

    fireflies.forEach(f => {
      const glow = (Math.sin(f.phase) + 1) / 2;
      const alpha = 0.3 + glow * 0.7;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ADFF2F';
      ctx.shadowColor = '#ADFF2F';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(f.x * width, f.y * height, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function lerpColor(hex1, hex2, t) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r},${g},${b})`;
  }

  function getCurrent() { return currentWeather; }
  function getCurrentTime() { return currentTime; }
  function isNight() { return currentTime.id === 'night'; }
  function isRaining() { return currentWeather.id === 'rain'; }

  return { init, update, draw, getCurrent, getCurrentTime, isNight, isRaining };
})();

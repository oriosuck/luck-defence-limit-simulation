const activeStages = new WeakMap();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

function loadImage(source) {
  return new Promise((resolve) => {
    if (!source) return resolve(null);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, r);
}

class BattleStage {
  constructor(canvas, character) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    this.character = character;
    this.heroImage = null;
    this.width = 1;
    this.height = 1;
    this.startedAt = performance.now();
    this.lastFrame = this.startedAt;
    this.animationFrame = null;
    this.isVisible = true;
    this.attackStartedAt = 0;
    this.attackDuration = 680;
    this.breakthrough = null;
    this.projectiles = [];

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.onVisibilityChange = () => {
      this.isVisible = !document.hidden;
      if (this.isVisible && !this.animationFrame) this.start();
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.resize();
    this.setCharacter(character);
    this.start();
  }

  async setCharacter(character) {
    this.character = character;
    const requestedSource = character?.image;
    const image = await loadImage(requestedSource);
    if (this.character?.image === requestedSource) this.heroImage = image;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    const pixelWidth = Math.round(this.width * dpr);
    const pixelHeight = Math.round(this.height * dpr);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    if (this.animationFrame || !this.isVisible) return;
    const tick = (now) => {
      this.animationFrame = null;
      const delta = Math.min(40, now - this.lastFrame);
      this.lastFrame = now;
      this.update(now, delta);
      this.draw(now);
      if (this.isVisible) this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  update(now) {
    this.projectiles = this.projectiles.filter((projectile) => now - projectile.startedAt < projectile.duration);
    if (this.breakthrough && now - this.breakthrough.startedAt > 1250) this.breakthrough = null;
  }

  playAttack() {
    const now = performance.now();
    if (now - this.attackStartedAt < this.attackDuration * 0.75) return;
    this.attackStartedAt = now;
    this.projectiles.push({ startedAt: now + 150, duration: 520, damage: 1284 + Math.floor(Math.random() * 240) });
  }

  playBreakthrough(success) {
    this.breakthrough = { success, startedAt: performance.now() };
  }

  draw(now) {
    const ctx = this.context;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);

    this.drawBackground(ctx, w, h, now);
    this.drawMonster(ctx, w * 0.76, h * 0.55, now);
    this.drawHero(ctx, w * 0.27, h * 0.78, now);
    this.drawProjectiles(ctx, w, h, now);
    this.drawOverlay(ctx, w, h, now);
  }

  drawBackground(ctx, w, h, now) {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#506b88');
    sky.addColorStop(0.58, '#b69275');
    sky.addColorStop(1, '#554436');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const glowX = w * 0.7 + Math.sin(now / 3200) * 5;
    const glow = ctx.createRadialGradient(glowX, h * 0.22, 4, glowX, h * 0.22, w * 0.4);
    glow.addColorStop(0, 'rgba(255,225,166,.56)');
    glow.addColorStop(1, 'rgba(255,225,166,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h * 0.72);

    ctx.fillStyle = '#3e473f';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.lineTo(w * 0.18, h * 0.35);
    ctx.lineTo(w * 0.34, h * 0.55);
    ctx.lineTo(w * 0.52, h * 0.29);
    ctx.lineTo(w * 0.76, h * 0.55);
    ctx.lineTo(w, h * 0.38);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    const ground = ctx.createLinearGradient(0, h * 0.62, 0, h);
    ground.addColorStop(0, '#617151');
    ground.addColorStop(1, '#273229');
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    ctx.fillStyle = 'rgba(24,25,20,.25)';
    ctx.beginPath();
    ctx.ellipse(w * 0.27, h * 0.82, w * 0.19, h * 0.055, 0, 0, Math.PI * 2);
    ctx.ellipse(w * 0.76, h * 0.72, w * 0.13, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHero(ctx, anchorX, anchorY, now) {
    const presentation = this.character?.presentation ?? {};
    const idle = Math.sin(now / 420) * 3;
    const attackElapsed = now - this.attackStartedAt;
    const attacking = attackElapsed >= 0 && attackElapsed < this.attackDuration;
    const attackProgress = clamp(attackElapsed / this.attackDuration, 0, 1);
    const lunge = attacking ? Math.sin(Math.PI * attackProgress) * 22 : 0;
    const squash = attacking ? 1 - Math.sin(Math.PI * attackProgress) * 0.04 : 1;
    const image = this.heroImage;

    if (!image) {
      ctx.fillStyle = '#f2c256';
      ctx.beginPath();
      ctx.arc(anchorX, anchorY - 78 + idle, 44, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    const baseHeight = Math.min(this.height * 0.62, this.width * 0.47);
    const scale = presentation.scale ?? 1.18;
    const drawHeight = baseHeight * scale;
    const drawWidth = drawHeight * (image.naturalWidth / image.naturalHeight);
    const x = anchorX - drawWidth / 2 + (presentation.x ?? 0) + lunge;
    const y = anchorY - drawHeight + (presentation.y ?? 0) + idle;

    ctx.save();
    ctx.translate(x + drawWidth / 2, anchorY);
    ctx.scale(1 / squash, squash);
    ctx.translate(-(x + drawWidth / 2), -anchorY);
    ctx.drawImage(image, x, y, drawWidth, drawHeight);
    ctx.restore();
  }

  drawMonster(ctx, x, y, now) {
    const bob = Math.sin(now / 360 + 1.2) * 3;
    ctx.save();
    ctx.translate(x, y + bob);

    const body = ctx.createRadialGradient(-12, -18, 4, 0, 0, 62);
    body.addColorStop(0, '#a99bc4');
    body.addColorStop(0.55, '#66577f');
    body.addColorStop(1, '#382f4b');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ede6c7';
    ctx.beginPath();
    ctx.moveTo(-38, -25); ctx.lineTo(-25, -60); ctx.lineTo(-10, -31);
    ctx.moveTo(38, -25); ctx.lineTo(25, -60); ctx.lineTo(10, -31);
    ctx.fill();
    ctx.fillStyle = '#f5d85c';
    ctx.beginPath();
    ctx.arc(-17, -5, 7, 0, Math.PI * 2);
    ctx.arc(17, -5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#271e2c';
    ctx.fillRect(-19, -7, 4, 7);
    ctx.fillRect(15, -7, 4, 7);
    ctx.restore();

    const barWidth = Math.min(126, this.width * 0.28);
    roundedRect(ctx, x - barWidth / 2, y - 79 + bob, barWidth, 13, 7);
    ctx.fillStyle = 'rgba(23,16,23,.78)';
    ctx.fill();
    roundedRect(ctx, x - barWidth / 2 + 2, y - 77 + bob, (barWidth - 4) * 0.82, 9, 5);
    ctx.fillStyle = '#dc4f58';
    ctx.fill();
  }

  drawProjectiles(ctx, w, h, now) {
    for (const projectile of this.projectiles) {
      const elapsed = now - projectile.startedAt;
      if (elapsed < 0) continue;
      const progress = clamp(elapsed / projectile.duration, 0, 1);
      const eased = easeOutCubic(progress);
      const startX = w * 0.36;
      const startY = h * 0.53;
      const endX = w * 0.72;
      const endY = h * 0.52;
      const x = startX + ((endX - startX) * eased);
      const y = startY + ((endY - startY) * eased) - Math.sin(Math.PI * progress) * 20;

      if (progress < 0.82) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 24);
        glow.addColorStop(0, '#fffbd0');
        glow.addColorStop(0.35, '#ffc83d');
        glow.addColorStop(1, 'rgba(255,104,41,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 25, y - 25, 50, 50);
      } else {
        const pop = (progress - 0.82) / 0.18;
        ctx.save();
        ctx.globalAlpha = 1 - pop;
        ctx.fillStyle = '#fff1a8';
        ctx.font = `900 ${22 + pop * 8}px system-ui`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#40222a';
        ctx.lineWidth = 5;
        ctx.strokeText(formatDamage(projectile.damage), endX, endY - 30 - pop * 24);
        ctx.fillText(formatDamage(projectile.damage), endX, endY - 30 - pop * 24);
        ctx.restore();
      }
    }
  }

  drawOverlay(ctx, w, h, now) {
    if (!this.breakthrough) return;
    const progress = clamp((now - this.breakthrough.startedAt) / 1250, 0, 1);
    const alpha = progress < 0.22 ? progress / 0.22 : 1 - ((progress - 0.72) / 0.28);
    const safeAlpha = clamp(alpha, 0, 1);
    ctx.save();
    ctx.globalAlpha = safeAlpha;
    ctx.fillStyle = this.breakthrough.success ? 'rgba(255,193,48,.2)' : 'rgba(77,42,104,.3)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = this.breakthrough.success ? '#ffe36c' : '#d1a4ff';
    ctx.strokeStyle = '#2c1d23';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.font = `1000 ${clamp(w * 0.065, 22, 32)}px system-ui`;
    const label = this.breakthrough.success ? '한계 돌파 성공' : '한계 돌파 실패';
    ctx.strokeText(label, w / 2, h * 0.18);
    ctx.fillText(label, w / 2, h * 0.18);
    ctx.restore();
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}

function formatDamage(value) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function mountBattleStage(canvas, character) {
  if (!canvas) return null;
  activeStages.get(canvas)?.destroy();
  const stage = new BattleStage(canvas, character);
  activeStages.set(canvas, stage);
  return stage;
}


/* =========================================================
   SUPER RUMMY — PARTICLE EFFECTS MANAGER
   FILE: js/animation/particle-effects-manager.js
   PURPOSE: Lightweight visual particle effects
   ========================================================= */

const DEFAULT_CONFIG = {
  enabled: true,
  maxParticles: 100,
  particleLifetime: 1200,
  reducedMotion: false
};

export class ParticleEffectsManager {
  constructor(options = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...options
    };

    this.canvas = null;
    this.context = null;
    this.particles = [];
    this.animationFrame = null;
    this.lastFrame = 0;
    this.destroyed = false;

    this.resizeHandler = () => this.resize();

    if (typeof document !== "undefined") {
      this.createCanvas();
    }
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "sr-particle-canvas";

    Object.assign(this.canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "999",
      overflow: "hidden"
    });

    this.context = this.canvas.getContext("2d");

    if (!this.context) {
      this.canvas = null;
      return;
    }

    document.body.appendChild(this.canvas);

    window.addEventListener("resize", this.resizeHandler);
    this.resize();
  }

  resize() {
    if (!this.canvas) return;

    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(window.innerWidth * ratio);
    this.canvas.height = Math.floor(window.innerHeight * ratio);

    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  getPoint(position = {}) {
    return {
      x: Number.isFinite(position.x)
        ? position.x
        : window.innerWidth / 2,

      y: Number.isFinite(position.y)
        ? position.y
        : window.innerHeight / 2
    };
  }

  createParticle(x, y, options = {}) {
    const angle = Math.random() * Math.PI * 2;
    const speed = options.speed ?? (1 + Math.random() * 4);

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: options.size ?? (2 + Math.random() * 4),
      color: options.color || "#d9b56d",
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      gravity: options.gravity ?? 0.035,
      life: options.life ?? this.config.particleLifetime,
      maxLife: options.life ?? this.config.particleLifetime,
      shape: options.shape || "circle"
    };
  }

  emit(position, count = 20, options = {}) {
    if (
      !this.config.enabled ||
      this.config.reducedMotion ||
      this.destroyed ||
      !this.canvas
    ) {
      return 0;
    }

    const point = this.getPoint(position);

    const available = Math.max(
      0,
      this.config.maxParticles - this.particles.length
    );

    const amount = Math.min(
      Math.max(0, Math.floor(count)),
      available
    );

    for (let i = 0; i < amount; i++) {
      this.particles.push(
        this.createParticle(point.x, point.y, options)
      );
    }

    this.startLoop();
    return amount;
  }

  sparkle(position, count = 16) {
    return this.emit(position, count, {
      color: "#f5d78e",
      size: 3,
      speed: 2.5,
      life: 850,
      gravity: 0
    });
  }

  cardGlow(position) {
    return this.emit(position, 12, {
      color: "#b88cff",
      size: 2.5,
      speed: 1.8,
      life: 700,
      gravity: -0.015
    });
  }

  celebrate(position) {
    return this.emit(position, 65, {
      color: this.randomCelebrationColor(),
      size: 4,
      speed: 5,
      life: 1500,
      gravity: 0.08,
      shape: "square"
    });
  }

  randomCelebrationColor() {
    const colors = [
      "#e8c878",
      "#a78bfa",
      "#ffffff",
      "#78d6b0",
      "#f29b9b"
    ];

    return colors[
      Math.floor(Math.random() * colors.length)
    ];
  }

  startLoop() {
    if (this.animationFrame || this.destroyed) return;

    this.lastFrame = 0;

    const frame = timestamp => {
      this.animationFrame = null;

      if (this.destroyed) return;

      const delta = this.lastFrame
        ? Math.min(timestamp - this.lastFrame, 40)
        : 16;

      this.lastFrame = timestamp;

      this.update(delta);
      this.draw();

      if (this.particles.length > 0) {
        this.animationFrame = requestAnimationFrame(frame);
      } else {
        this.context?.clearRect(
          0,
          0,
          window.innerWidth,
          window.innerHeight
        );
      }
    };

    this.animationFrame = requestAnimationFrame(frame);
  }

  update(delta) {
    const factor = delta / 16.67;

    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * factor;
      particle.y += particle.vy * factor;

      particle.vy += particle.gravity * factor;
      particle.rotation += particle.rotationSpeed * factor;
      particle.life -= delta;

      return (
        particle.life > 0 &&
        particle.y < window.innerHeight + 60
      );
    });
  }

  draw() {
    if (!this.context || !this.canvas) return;

    const ctx = this.context;

    ctx.clearRect(
      0,
      0,
      window.innerWidth,
      window.innerHeight
    );

    for (const particle of this.particles) {
      const opacity = Math.max(
        0,
        Math.min(1, particle.life / particle.maxLife)
      );

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.fillStyle = particle.color;

      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      if (particle.shape === "square") {
        ctx.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size
        );
      } else {
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          particle.size,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    }
  }

  clear() {
    this.particles = [];

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.context && this.canvas) {
      this.context.clearRect(
        0,
        0,
        window.innerWidth,
        window.innerHeight
      );
    }
  }

  setEnabled(enabled) {
    this.config.enabled = Boolean(enabled);

    if (!this.config.enabled) {
      this.clear();
    }
  }

  setReducedMotion(enabled) {
    this.config.reducedMotion = Boolean(enabled);

    if (this.config.reducedMotion) {
      this.clear();
    }
  }

  destroy() {
    if (this.destroyed) return;

    this.clear();
    this.destroyed = true;

    if (typeof window !== "undefined") {
      window.removeEventListener("resize", this.resizeHandler);
    }

    this.canvas?.remove();

    this.canvas = null;
    this.context = null;
  }
}

export function createParticleEffectsManager(options = {}) {
  return new ParticleEffectsManager(options);
}

/* ================= FILE END ================= */
  

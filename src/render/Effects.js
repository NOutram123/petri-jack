export class Effects {
  constructor() {
    this.particles = [];
    this.floaters = [];
  }

  update(dt) {
    for (const particle of this.particles) {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.radius += particle.grow * dt;
    }
    this.particles = this.particles.filter((particle) => particle.age < particle.life);

    for (const floater of this.floaters) {
      floater.age += dt;
      floater.y -= 28 * dt;
    }
    this.floaters = this.floaters.filter((floater) => floater.age < floater.life);
  }

  addSpray(x, y, angle, color) {
    for (let i = 0; i < 5; i += 1) {
      const spread = angle + (Math.random() - 0.5) * 0.75;
      const speed = 35 + Math.random() * 90;
      this.particles.push(makeParticle(x, y, spread, speed, color, 2 + Math.random() * 4, 0.55));
    }
  }

  addFlame(x, y, angle) {
    for (let i = 0; i < 8; i += 1) {
      const spread = angle + (Math.random() - 0.5) * 0.68;
      const speed = 120 + Math.random() * 190;
      const color = Math.random() > 0.45 ? "#ffcc42" : "#ff5a24";
      this.particles.push(makeParticle(x + Math.cos(angle) * 24, y + Math.sin(angle) * 24, spread, speed, color, 5 + Math.random() * 8, 0.38));
    }
  }

  addHit(x, y, color) {
    if (Math.random() > 0.45) {
      return;
    }
    this.particles.push(makeParticle(x, y, Math.random() * Math.PI * 2, 35 + Math.random() * 80, color, 3, 0.35));
  }

  addSplat(x, y, color) {
    for (let i = 0; i < 18; i += 1) {
      this.particles.push(makeParticle(x, y, Math.random() * Math.PI * 2, 40 + Math.random() * 160, color, 4 + Math.random() * 7, 0.9));
    }
  }

  addPickup(x, y, color) {
    for (let i = 0; i < 12; i += 1) {
      this.particles.push(makeParticle(x, y, Math.random() * Math.PI * 2, 50 + Math.random() * 100, color, 4, 0.7));
    }
  }

  addFloater(text, x, y, color = "#f8ffd9") {
    this.floaters.push({ text, x, y, color, age: 0, life: 1.2 });
  }
}

function makeParticle(x, y, angle, speed, color, radius, life) {
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    grow: -radius / life,
    color,
    age: 0,
    life
  };
}

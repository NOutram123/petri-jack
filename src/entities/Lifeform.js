import { Entity } from "./Entity.js";

export class Lifeform extends Entity {
  constructor(x, y, options) {
    super(x, y, options.radius);
    this.type = options.type;
    this.health = options.health;
    this.maxHealth = options.health;
    this.speed = options.speed;
    this.contactDamage = options.contactDamage;
    this.scoreValue = options.scoreValue;
    this.color = options.color;
    this.secondaryColor = options.secondaryColor;
    this.pulseOffset = options.pulseOffset ?? 0;
    this.hitFlash = 0;
  }

  update(dt) {
    super.update(dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 0.12;
    if (this.health <= 0) {
      this.dead = true;
    }
    return this.dead;
  }

  feed(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.radius = Math.min(this.radius + amount * 0.015, this.maxRadius ?? this.radius + 2);
  }
}

import { Lifeform } from "./Lifeform.js";
import { constrainCircleToDish, distance } from "../game/Collision.js";

export class Bacteria extends Lifeform {
  constructor(x, y, rng = Math.random, aggression = 0.5) {
    super(x, y, {
      type: "bacteria",
      radius: 15 + rng() * 5,
      health: 30,
      speed: 95 + aggression * 35 + rng() * 22,
      contactDamage: 7 + aggression * 5,
      scoreValue: 115,
      color: "#d7ff45",
      secondaryColor: "#fffaa8",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 8;
    this.aggression = aggression;
    this.wanderAngle = rng() * Math.PI * 2;
    this.feedCooldown = 0.35 + rng() * 0.5;
    this.multiplyCooldown = 5 + rng() * 5;
  }

  update(dt, game) {
    super.update(dt);
    const target = this.findFood(game);
    let angle = this.wanderAngle;
    if (target) {
      angle = Math.atan2(target.y - this.y, target.x - this.x);
    } else {
      this.wanderAngle += Math.sin(this.age * 1.7 + this.pulseOffset) * dt * 2.2;
      angle += Math.sin(this.age * 5.3) * 0.28;
    }

    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
    constrainCircleToDish(this, game.dishRadius);

    this.feedCooldown -= dt;
    if (this.feedCooldown <= 0 && target && distance(this, target) < this.radius + target.radius + 12) {
      target.takeDamage?.(9);
      if (target.nibbled !== undefined) {
        target.nibbled += 3;
        if (target.nibbled > 12) {
          target.dead = true;
        }
      }
      this.feed(8);
      this.multiplyCooldown -= 1.2;
      this.feedCooldown = 0.7;
    }

    this.multiplyCooldown -= dt;
    if (this.multiplyCooldown <= 0 && game.canSpawnMoreLifeforms()) {
      game.spawnLifeform(new Bacteria(this.x + 20, this.y - 12, Math.random, this.aggression + 0.05));
      this.multiplyCooldown = 8.5;
    }
  }

  findFood(game) {
    let best = null;
    let bestDistance = Infinity;
    const candidates = [
      ...game.sugarCubes,
      ...game.lifeforms.filter((item) => item !== this && (item.type === "plant" || item.type === "animal"))
    ];
    for (const item of candidates) {
      if (item.dead) {
        continue;
      }
      const d = distance(this, item);
      if (d < bestDistance && d < 420) {
        best = item;
        bestDistance = d;
      }
    }
    return best;
  }
}

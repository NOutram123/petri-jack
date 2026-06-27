import { Lifeform } from "./Lifeform.js";
import { constrainCircleToDish, distance } from "../game/Collision.js";

export class FungalSpore extends Lifeform {
  constructor(x, y, rng = Math.random, aggression = 0.45) {
    super(x, y, {
      type: "fungus",
      radius: 20 + rng() * 7,
      health: 48,
      speed: 42 + aggression * 16 + rng() * 10,
      contactDamage: 8 + aggression * 4,
      scoreValue: 190,
      color: "#c58bff",
      secondaryColor: "#f4d4ff",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 18;
    this.driftAngle = rng() * Math.PI * 2;
    this.seedCooldown = 3 + rng() * 3;
  }

  update(dt, game) {
    super.update(dt);
    this.driftAngle += Math.sin(this.age * 0.8 + this.pulseOffset) * dt * 1.1;
    this.x += Math.cos(this.driftAngle) * this.speed * dt;
    this.y += Math.sin(this.driftAngle) * this.speed * dt;
    constrainCircleToDish(this, game.dishRadius);

    this.seedCooldown -= dt;
    if (this.seedCooldown <= 0) {
      game.fungalMats.push({
        x: this.x + Math.cos(this.age) * 24,
        y: this.y + Math.sin(this.age) * 24,
        radius: 34 + Math.random() * 22,
        age: 0,
        life: 10,
        damagePerSecond: 10
      });
      this.feed(3);
      this.seedCooldown = 4.5;
    }

    const sugar = game.sugarCubes.find((item) => !item.dead && distance(this, item) < this.radius + item.radius + 28);
    if (sugar) {
      sugar.nibbled += dt * 4;
      this.feed(dt * 6);
      if (sugar.nibbled > 12) {
        sugar.dead = true;
      }
    }
  }
}

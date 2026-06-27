import { Lifeform } from "./Lifeform.js";
import { constrainCircleToDish, distance } from "../game/Collision.js";

export class AnimalCell extends Lifeform {
  constructor(x, y, rng = Math.random, aggression = 0.4) {
    super(x, y, {
      type: "animal",
      radius: 24 + rng() * 8,
      health: 58,
      speed: 58 + aggression * 35 + rng() * 12,
      contactDamage: 9 + aggression * 6,
      scoreValue: 160,
      color: "#ff5b7b",
      secondaryColor: "#ffb3c2",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 11;
    this.aggression = aggression;
    this.wanderAngle = rng() * Math.PI * 2;
    this.feedCooldown = 0.5 + rng();
  }

  update(dt, game) {
    super.update(dt);
    const jackDistance = distance(this, game.jack);
    let angle = this.wanderAngle;

    if (jackDistance < 520 + this.aggression * 240) {
      angle = Math.atan2(game.jack.y - this.y, game.jack.x - this.x);
      angle += Math.sin(this.age * 4 + this.pulseOffset) * 0.35;
    } else {
      this.wanderAngle += Math.sin(this.age * 0.9 + this.pulseOffset) * dt * 1.4;
    }

    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
    constrainCircleToDish(this, game.dishRadius);

    this.feedCooldown -= dt;
    if (this.feedCooldown <= 0) {
      const sugar = game.sugarCubes.find((item) => !item.dead && distance(this, item) < this.radius + item.radius + 16);
      if (sugar) {
        sugar.dead = true;
        this.feed(12);
      } else {
        const plant = game.lifeforms.find((item) => item.type === "plant" && !item.dead && distance(this, item) < this.radius + item.radius + 10);
        if (plant) {
          plant.takeDamage(11);
          this.feed(5);
        }
      }
      this.feedCooldown = 1.0;
    }
  }
}

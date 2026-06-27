import { Lifeform } from "./Lifeform.js";
import { constrainCircleToDish, distance } from "../game/Collision.js";

export class AlienLifeform extends Lifeform {
  constructor(x, y, rng = Math.random, aggression = 1) {
    super(x, y, {
      type: "alien",
      radius: 46 + rng() * 10,
      health: 260,
      speed: 24 + aggression * 10,
      contactDamage: 18 + aggression * 8,
      scoreValue: 800,
      color: "#9f174d",
      secondaryColor: "#d942ff",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 34;
    this.aggression = aggression;
    this.driftAngle = rng() * Math.PI * 2;
    this.tendrils = [];
    this.tendrilCooldown = 0.5;
    this.feedCooldown = 0.6;
  }

  update(dt, game) {
    super.update(dt);
    const jackAngle = Math.atan2(game.jack.y - this.y, game.jack.x - this.x);
    this.driftAngle += Math.sin(this.age * 0.65 + this.pulseOffset) * dt * 0.9;
    const angle = distance(this, game.jack) < 760 ? jackAngle : this.driftAngle;
    this.x += Math.cos(angle) * this.speed * dt;
    this.y += Math.sin(angle) * this.speed * dt;
    constrainCircleToDish(this, game.dishRadius);

    this.feedCooldown -= dt;
    if (this.feedCooldown <= 0) {
      this.feedNearby(game);
      this.feedCooldown = 0.75;
    }

    this.tendrilCooldown -= dt;
    if (this.tendrilCooldown <= 0 && this.tendrils.length < 5) {
      this.tendrils.push({
        angle: jackAngle + (Math.random() - 0.5) * 0.5,
        length: this.radius * 0.9,
        maxLength: 250 + this.aggression * 110,
        age: 0,
        latched: false
      });
      this.tendrilCooldown = 1.15;
    }

    for (const tendril of this.tendrils) {
      tendril.age += dt;
      const targetAngle = Math.atan2(game.jack.y - this.y, game.jack.x - this.x);
      tendril.angle = lerpAngle(tendril.angle, targetAngle, dt * 2.4);
      tendril.length = Math.min(tendril.maxLength, tendril.length + (110 + this.aggression * 55) * dt);
      const tip = this.tendrilTip(tendril);
      tendril.latched = distance(tip, game.jack) < game.jack.radius + 18;
      if (tendril.latched) {
        const damaged = game.jack.damage((16 + this.aggression * 8) * dt, "alien");
        if (damaged) {
          game.audio.playJackDamage();
        }
      }
    }
    this.tendrils = this.tendrils.filter((tendril) => tendril.age < 5.5);
  }

  takeDamage(amount, source = "generic") {
    let adjusted = amount;
    if (source === "bleach") {
      adjusted *= 0.45;
    }
    if (source === "flame") {
      adjusted *= 1.55;
    }
    return super.takeDamage(adjusted);
  }

  tendrilTip(tendril) {
    return {
      x: this.x + Math.cos(tendril.angle) * tendril.length,
      y: this.y + Math.sin(tendril.angle) * tendril.length
    };
  }

  feedNearby(game) {
    const sugar = game.sugarCubes.find((item) => !item.dead && distance(this, item) < this.radius + item.radius + 48);
    if (sugar) {
      sugar.dead = true;
      this.feed(18);
      return;
    }

    const prey = game.lifeforms.find((item) =>
      item !== this &&
      !item.dead &&
      item.type !== "alien" &&
      distance(this, item) < this.radius + item.radius + 36
    );
    if (prey) {
      prey.takeDamage(28, "alien");
      this.feed(10);
    }
  }
}

function lerpAngle(a, b, t) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * Math.min(1, t);
}

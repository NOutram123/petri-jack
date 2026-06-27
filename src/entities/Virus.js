import { Lifeform } from "./Lifeform.js";
import { constrainCircleToDish, distance } from "../game/Collision.js";

export class Virus extends Lifeform {
  constructor(x, y, rng = Math.random, aggression = 0.65) {
    super(x, y, {
      type: "virus",
      radius: 13 + rng() * 4,
      health: 24,
      speed: 150 + aggression * 40 + rng() * 30,
      contactDamage: 10 + aggression * 6,
      scoreValue: 145,
      color: "#7e7cff",
      secondaryColor: "#d5d3ff",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 6;
    this.aggression = aggression;
    this.angle = rng() * Math.PI * 2;
    this.infectCooldown = 0.8 + rng();
  }

  update(dt, game) {
    super.update(dt);
    const jackDistance = distance(this, game.jack);
    if (jackDistance < 640) {
      this.angle = Math.atan2(game.jack.y - this.y, game.jack.x - this.x) + Math.sin(this.age * 9) * 0.95;
    } else {
      this.angle += Math.sin(this.age * 6.5 + this.pulseOffset) * dt * 5;
    }

    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;
    constrainCircleToDish(this, game.dishRadius);

    this.infectCooldown -= dt;
    if (this.infectCooldown <= 0) {
      const host = game.lifeforms.find((item) =>
        item !== this &&
        !item.dead &&
        (item.type === "plant" || item.type === "animal" || item.type === "bacteria") &&
        distance(this, item) < this.radius + item.radius + 18
      );
      if (host) {
        host.infected = Math.min(3, (host.infected ?? 0) + 1);
        host.takeDamage(7 + host.infected * 3);
        this.feed(4);
        if (host.dead && game.canSpawnMoreLifeforms()) {
          game.spawnLifeform(new Virus(host.x, host.y, Math.random, this.aggression));
        }
      }
      this.infectCooldown = 0.95;
    }
  }
}

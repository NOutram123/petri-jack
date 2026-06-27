import { Lifeform } from "./Lifeform.js";
import { distance } from "../game/Collision.js";

export class PlantCell extends Lifeform {
  constructor(x, y, rng = Math.random) {
    super(x, y, {
      type: "plant",
      radius: 22 + rng() * 11,
      health: 34,
      speed: 12 + rng() * 8,
      contactDamage: 1.5,
      scoreValue: 75,
      color: "#78e56a",
      secondaryColor: "#d6ff80",
      pulseOffset: rng() * Math.PI * 2
    });
    this.maxRadius = this.radius + 9;
    this.driftAngle = rng() * Math.PI * 2;
    this.feedCooldown = rng();
  }

  update(dt, game) {
    super.update(dt);
    this.driftAngle += Math.sin(this.age * 0.7 + this.pulseOffset) * dt * 0.18;
    this.x += Math.cos(this.driftAngle) * this.speed * dt * 0.22;
    this.y += Math.sin(this.driftAngle) * this.speed * dt * 0.22;

    this.feedCooldown -= dt;
    if (this.feedCooldown <= 0) {
      const cube = game.sugarCubes.find((item) => !item.dead && distance(this, item) < this.radius + 92);
      if (cube) {
        this.feed(3.5);
        cube.nibbled += 1;
        if (cube.nibbled > 12) {
          cube.dead = true;
        }
      }
      this.feedCooldown = 1.15;
    }
  }
}

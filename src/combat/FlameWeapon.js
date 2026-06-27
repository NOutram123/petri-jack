import { Weapon } from "./Weapon.js";

export class FlameWeapon extends Weapon {
  constructor() {
    super({
      type: "flame",
      name: "Flamethrower",
      rating: 2,
      maxTank: 100,
      drainRate: 22
    });
    this.cone = null;
  }

  update(dt, game, firing) {
    this.active = firing && this.canFire();
    this.cone = null;
    if (!this.active) {
      return;
    }

    this.drain(dt);
    this.cone = {
      x: game.jack.x,
      y: game.jack.y,
      facing: game.jack.facing,
      length: 185,
      halfAngle: Math.PI / 5,
      damagePerSecond: 46
    };
    game.effects.addFlame(game.jack.x, game.jack.y, game.jack.facing);
    game.audio.playFlame(dt);
  }
}

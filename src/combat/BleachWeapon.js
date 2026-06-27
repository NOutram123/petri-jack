import { Weapon } from "./Weapon.js";

export class BleachWeapon extends Weapon {
  constructor() {
    super({
      type: "bleach",
      name: "Bleach Sprayer",
      rating: 1,
      maxTank: 100,
      drainRate: 13
    });
    this.dropTimer = 0;
  }

  update(dt, game, firing) {
    this.active = firing && this.canFire();
    if (!this.active) {
      return;
    }

    this.drain(dt);
    this.dropTimer -= dt;
    const moving = Math.hypot(game.jack.vx, game.jack.vy) > 4;
    if (this.dropTimer <= 0 && moving) {
      const behind = game.jack.facing + Math.PI;
      game.bleachPuddles.push({
        x: game.jack.x + Math.cos(behind) * 30,
        y: game.jack.y + Math.sin(behind) * 30,
        radius: 22 + Math.random() * 11,
        age: 0,
        life: 5.2,
        damagePerSecond: 18
      });
      game.effects.addSpray(game.jack.x, game.jack.y, behind, "#bffff0");
      game.audio.playBleach(dt);
      this.dropTimer = 0.085;
    }
  }
}

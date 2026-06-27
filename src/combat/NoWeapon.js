import { Weapon } from "./Weapon.js";

export class NoWeapon extends Weapon {
  constructor() {
    super({
      type: "none",
      name: "Unarmed",
      rating: 0,
      maxTank: 1,
      drainRate: 0
    });
    this.tank = 0;
    this.cone = null;
  }

  update() {
    this.active = false;
    this.cone = null;
  }

  refill() {}

  canFire() {
    return false;
  }
}

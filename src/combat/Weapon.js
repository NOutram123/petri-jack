export const WEAPON_RATINGS = Object.freeze({
  none: 0,
  bleach: 1,
  flame: 2
});

export class Weapon {
  constructor(options) {
    this.type = options.type;
    this.name = options.name;
    this.rating = options.rating;
    this.maxTank = options.maxTank;
    this.tank = options.maxTank;
    this.drainRate = options.drainRate;
    this.active = false;
  }

  refill() {
    this.tank = this.maxTank;
  }

  addTank(amount) {
    this.tank = Math.min(this.maxTank, this.tank + amount);
  }

  canFire() {
    return this.tank > 0;
  }

  drain(dt) {
    this.tank = Math.max(0, this.tank - this.drainRate * dt);
  }
}

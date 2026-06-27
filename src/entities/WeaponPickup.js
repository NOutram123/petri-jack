import { Entity } from "./Entity.js";
import { WEAPON_RATINGS } from "../combat/Weapon.js";

export class WeaponPickup extends Entity {
  constructor(x, y, weaponType) {
    super(x, y, 24);
    this.weaponType = weaponType;
    this.rating = WEAPON_RATINGS[weaponType] ?? 1;
    this.pickupCooldown = 0;
  }
}

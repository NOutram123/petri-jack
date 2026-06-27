import { Entity } from "./Entity.js";

export class TankPickup extends Entity {
  constructor(x, y, tankType, amount = 55) {
    super(x, y, 27);
    this.tankType = tankType;
    this.amount = amount;
  }
}

import { Entity } from "./Entity.js";

export class SugarCube extends Entity {
  constructor(x, y) {
    super(x, y, 16);
    this.nibbled = 0;
  }

  update(dt) {
    super.update(dt);
  }
}

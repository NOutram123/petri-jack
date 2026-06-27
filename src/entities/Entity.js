export class Entity {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dead = false;
    this.age = 0;
  }

  update(dt) {
    this.age += dt;
  }
}

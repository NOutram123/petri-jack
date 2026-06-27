export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 1;
    this.height = 1;
    this.lag = 7.5;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
  }

  update(target, dt) {
    const targetX = target.x - this.width / 2;
    const targetY = target.y - this.height / 2;
    const follow = 1 - Math.exp(-this.lag * dt);
    this.x += (targetX - this.x) * follow;
    this.y += (targetY - this.y) * follow;
  }

  worldToScreen(point) {
    return { x: point.x - this.x, y: point.y - this.y };
  }

  screenToWorld(point) {
    return { x: point.x + this.x, y: point.y + this.y };
  }
}

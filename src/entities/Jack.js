import { Entity } from "./Entity.js";
import { constrainCircleToDish } from "../game/Collision.js";
import { BleachWeapon } from "../combat/BleachWeapon.js";
import { FlameWeapon } from "../combat/FlameWeapon.js";
import { NoWeapon } from "../combat/NoWeapon.js";

export class Jack extends Entity {
  constructor() {
    super(0, 0, 22);
    this.name = "Jack O'Reilly";
    this.baseSpeed = 245;
    this.speed = this.baseSpeed;
    this.vx = 0;
    this.vy = 0;
    this.facing = -Math.PI / 2;
    this.runTime = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.lives = 3;
    this.score = 0;
    this.weapon = new NoWeapon();
    this.invulnerable = 1.4;
    this.lastDamageType = "generic";
  }

  update(dt, input, dishRadius) {
    super.update(dt);
    const axis = input.axis();
    this.speed = this.baseSpeed * (input.down("sprint") ? 2 : 1);
    this.vx = axis.x * this.speed;
    this.vy = axis.y * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (axis.magnitude > 0) {
      this.facing = Math.atan2(axis.y, axis.x);
      this.runTime += dt * 11;
    } else {
      this.runTime += dt * 2.6;
    }

    constrainCircleToDish(this, dishRadius);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
  }

  damage(amount, type = "generic") {
    if (this.invulnerable > 0) {
      return false;
    }
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = 0.45;
    this.lastDamageType = type;
    return true;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  respawn() {
    this.x = 0;
    this.y = 0;
    this.health = this.maxHealth;
    this.invulnerable = 1.6;
  }

  setWeapon(type) {
    this.weapon = type === "flame" ? new FlameWeapon() : new BleachWeapon();
  }
}

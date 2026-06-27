import { circlesOverlap, distance, pointInCone } from "../game/Collision.js";

export class DamageSystem {
  update(dt, game) {
    this.updateHazards(dt, game);
    this.updateLifeformContact(dt, game);
    this.updatePickups(dt, game);
  }

  updateHazards(dt, game) {
    for (const puddle of game.bleachPuddles) {
      puddle.age += dt;
      for (const lifeform of game.lifeforms) {
        if (!lifeform.dead && distance(puddle, lifeform) < puddle.radius + lifeform.radius) {
          this.damageLifeform(lifeform, puddle.damagePerSecond * dt, game, "bleach");
        }
      }
    }
    game.bleachPuddles = game.bleachPuddles.filter((puddle) => puddle.age < puddle.life);

    for (const mat of game.fungalMats) {
      mat.age += dt;
      if (distance(mat, game.jack) < mat.radius + game.jack.radius) {
        const damaged = game.jack.damage(mat.damagePerSecond * dt, "fungus");
        if (damaged) {
          game.audio.playJackDamage();
        }
      }
    }
    game.fungalMats = game.fungalMats.filter((mat) => mat.age < mat.life);

    const cone = game.jack.weapon?.cone;
    if (cone) {
      for (const lifeform of game.lifeforms) {
        if (!lifeform.dead && pointInCone(lifeform, cone, cone.facing, cone.length + lifeform.radius, cone.halfAngle)) {
          this.damageLifeform(lifeform, cone.damagePerSecond * dt, game, "flame");
        }
      }
    }
  }

  updateLifeformContact(dt, game) {
    for (const lifeform of game.lifeforms) {
      if (lifeform.dead || lifeform.contactDamage <= 0) {
        continue;
      }
      if (circlesOverlap(game.jack, lifeform)) {
        const damaged = game.jack.damage(lifeform.contactDamage * dt * 90, lifeform.type);
        if (damaged) {
          game.audio.playJackDamage();
        }
      }
    }
  }

  updatePickups(dt, game) {
    for (const cube of game.sugarCubes) {
      if (!cube.dead && circlesOverlap(game.jack, cube)) {
        cube.dead = true;
        game.jack.heal(10);
        game.jack.score += 15;
        game.effects.addPickup(cube.x, cube.y, "#f7f0d6");
        game.audio.playPickup();
      }
    }
    game.sugarCubes = game.sugarCubes.filter((cube) => !cube.dead);

    for (const tank of game.tankPickups) {
      tank.messageCooldown = Math.max(0, (tank.messageCooldown ?? 0) - dt);
      if (tank.dead || !circlesOverlap(game.jack, tank)) {
        continue;
      }

      if (game.jack.weapon.type === tank.tankType) {
        game.jack.weapon.addTank(tank.amount);
        tank.dead = true;
        game.showPickupIndicator(tank.tankType === "flame" ? "Fuel" : "Bleach", tank.x, tank.y);
        game.effects.addPickup(tank.x, tank.y, tank.tankType === "flame" ? "#ff9b30" : "#9ffff0");
        game.audio.playPickup();
      } else if (tank.messageCooldown <= 0 && game.jack.weapon.type === "none") {
        game.showPickupIndicator("Need weapon", tank.x, tank.y);
        tank.messageCooldown = 0.8;
      } else if (tank.messageCooldown <= 0) {
        game.showPickupIndicator("Wrong tank", tank.x, tank.y);
        tank.messageCooldown = 0.8;
      }
    }
    game.tankPickups = game.tankPickups.filter((tank) => !tank.dead);

    for (const pickup of game.weaponPickups) {
      pickup.pickupCooldown = Math.max(0, (pickup.pickupCooldown ?? 0) - dt);
      if (pickup.dead || pickup.pickupCooldown > 0 || !circlesOverlap(game.jack, pickup)) {
        continue;
      }

      const current = game.jack.weapon;
      let label = "Swap";
      if (current.type === pickup.weaponType) {
        current.refill();
        label = "Refill";
      } else {
        label = pickup.rating > current.rating ? "Upgrade" : pickup.rating < current.rating ? "Downgrade" : "Swap";
        if (current.type !== "none") {
          const dropped = new pickup.constructor(pickup.x, pickup.y, current.type);
          dropped.pickupCooldown = 1.2;
          game.weaponPickups.push(dropped);
        }
        game.jack.setWeapon(pickup.weaponType);
      }
      pickup.dead = true;
      game.showPickupIndicator(label, pickup.x, pickup.y);
      game.audio.playPickup();
    }
    game.weaponPickups = game.weaponPickups.filter((pickup) => !pickup.dead);
  }

  damageLifeform(lifeform, amount, game, source = "generic") {
    const killed = lifeform.takeDamage(amount, source);
    game.effects.addHit(lifeform.x, lifeform.y, lifeform.color);
    if (killed) {
      game.jack.score += lifeform.scoreValue;
      game.effects.addSplat(lifeform.x, lifeform.y, lifeform.color);
      game.audio.playSplat();
    }
  }
}

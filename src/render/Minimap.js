export class Minimap {
  render(ctx, game, x, y, size) {
    const radius = size / 2;
    const scale = radius / game.dishRadius;

    ctx.save();
    ctx.translate(x + radius, y + radius);
    ctx.fillStyle = "rgba(8, 13, 10, 0.74)";
    ctx.strokeStyle = "rgba(218, 247, 220, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    for (const tank of game.tankPickups) {
      if (tank.dead) {
        continue;
      }
      ctx.fillStyle = tank.tankType === "flame" ? "#ff9b30" : "#9ffff0";
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(tank.x * scale - 3, tank.y * scale - 3, 6, 6);
      ctx.fill();
      ctx.stroke();
    }

    for (const pickup of game.weaponPickups) {
      if (pickup.dead) {
        continue;
      }
      const sx = pickup.x * scale;
      const sy = pickup.y * scale;
      ctx.strokeStyle = pickup.weaponType === "flame" ? "#ff7b28" : "#9ffff0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const lifeform of game.lifeforms) {
      if (lifeform.dead) {
        continue;
      }
      ctx.fillStyle = lifeformColor(lifeform.type);
      ctx.beginPath();
      ctx.arc(lifeform.x * scale, lifeform.y * scale, lifeformDot(lifeform.type), 0, Math.PI * 2);
      ctx.fill();
      if (lifeform.type === "alien") {
        ctx.strokeStyle = "rgba(255,72,180,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lifeform.x * scale, lifeform.y * scale, 9, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = "#ffd533";
    ctx.strokeStyle = "#241d00";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(game.jack.x * scale, game.jack.y * scale, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function lifeformColor(type) {
  if (type === "plant") return "#9dff75";
  if (type === "animal") return "#ff5d82";
  if (type === "bacteria") return "#e7ff4c";
  if (type === "virus") return "#8f8bff";
  if (type === "fungus") return "#d095ff";
  if (type === "alien") return "#d51b72";
  return "#ffffff";
}

function lifeformDot(type) {
  if (type === "plant") return 3;
  if (type === "animal") return 4;
  if (type === "fungus") return 4.5;
  if (type === "alien") return 7;
  return 3.5;
}

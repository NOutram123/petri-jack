import { Minimap } from "./Minimap.js";

export class Hud {
  constructor() {
    this.minimap = new Minimap();
  }

  render(ctx, game, width, height) {
    const margin = 20;
    this.panel(ctx, margin, margin, 520, 166);
    this.bar(ctx, margin + 24, margin + 54, 260, 22, game.jack.health / game.jack.maxHealth, "#ff4f66", "HEALTH");
    this.bar(ctx, margin + 24, margin + 112, 260, 20, game.jack.weapon.tank / game.jack.weapon.maxTank, "#89fff0", "TANK");

    ctx.fillStyle = "#f5f8dc";
    ctx.font = "800 21px Inter, Segoe UI, sans-serif";
    ctx.fillText(`Lives ${game.jack.lives}`, margin + 320, margin + 67);
    ctx.fillText(game.jack.weapon.name, margin + 320, margin + 123);

    ctx.font = "700 17px Inter, Segoe UI, sans-serif";
    ctx.fillStyle = "rgba(235,245,215,0.78)";
    ctx.fillText(`Dish ${game.levelNumber} / ${game.levelName}`, margin + 24, margin + 151);
    ctx.fillText(`Score ${game.jack.score}`, margin + 320, margin + 151);

    const miniSize = Math.min(328, Math.max(236, width * 0.26));
    this.panel(ctx, width - miniSize - margin, margin, miniSize, miniSize + 52);
    this.minimap.render(ctx, game, width - miniSize - margin, margin + 4, miniSize);
    ctx.fillStyle = "#ecf7d8";
    ctx.font = "800 18px Inter, Segoe UI, sans-serif";
    ctx.fillText(`Clearance ${Math.round(game.clearance * 100)}%`, width - miniSize - margin + 22, margin + miniSize + 36);

    if (game.audio.muted) {
      ctx.fillStyle = "rgba(255,230,150,0.85)";
      ctx.font = "800 16px Inter, Segoe UI, sans-serif";
      ctx.fillText("MUTED", margin + 24, margin + 188);
    }
  }

  panel(ctx, x, y, width, height) {
    ctx.save();
    ctx.fillStyle = "rgba(5, 9, 7, 0.66)";
    ctx.strokeStyle = "rgba(203, 255, 212, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  bar(ctx, x, y, width, height, value, color, label) {
    ctx.fillStyle = "rgba(232,245,219,0.14)";
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, value)) * width, height);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "900 14px Inter, Segoe UI, sans-serif";
    ctx.fillText(label, x, y - 9);
  }
}

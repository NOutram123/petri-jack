import { SpriteFactory } from "./SpriteFactory.js";
import { Hud } from "./Hud.js";
import { GameState } from "../game/StateManager.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.sprites = new SpriteFactory();
    this.hud = new Hud();
    this.splashImage = null;
    this.loadOptionalSplash();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  loadOptionalSplash() {
    fetch("./assets/splash.png", { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return;
        }
        this.splashImage = new Image();
        this.splashImage.src = "./assets/splash.png";
      })
      .catch(() => {});
  }

  resize() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.width = Math.floor(window.innerWidth * dpr);
    this.height = Math.floor(window.innerHeight * dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.logicalWidth = window.innerWidth;
    this.logicalHeight = window.innerHeight;
  }

  render(game) {
    const ctx = this.ctx;
    const width = this.logicalWidth;
    const height = this.logicalHeight;
    ctx.clearRect(0, 0, width, height);

    if (game.state.is(GameState.SPLASH)) {
      this.renderSplash(ctx, game, width, height);
      return;
    }

    this.renderWorld(ctx, game, width, height);
    this.renderOverlay(ctx, game, width, height);
  }

  renderWorld(ctx, game, width, height) {
    ctx.save();
    ctx.translate(-game.camera.x, -game.camera.y);
    this.renderDish(ctx, game);
    this.renderBleach(ctx, game);
    this.renderFungalMats(ctx, game);
    this.renderPickups(ctx, game);

    for (const lifeform of game.lifeforms) {
      if (lifeform.type === "alien") {
        this.renderAlienTendrils(ctx, lifeform, game.time);
      }
      this.sprites.drawLifeform(ctx, lifeform, game.time);
    }

    this.renderEffects(ctx, game);
    if (game.jack.weapon.cone) {
      this.renderFlameCone(ctx, game.jack.weapon.cone);
    }
    this.sprites.drawJack(ctx, game.jack, game.time);
    ctx.restore();

    const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.28, width / 2, height / 2, Math.max(width, height) * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  renderDish(ctx, game) {
    const r = game.dishRadius;
    const gradient = ctx.createRadialGradient(-r * 0.22, -r * 0.2, r * 0.1, 0, 0, r);
    gradient.addColorStop(0, "#30422b");
    gradient.addColorStop(0.56, "#162112");
    gradient.addColorStop(1, "#080b08");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();

    for (const stain of game.background.stains) {
      const color = stain.hue === "green" ? `rgba(94,145,68,${stain.alpha})` : `rgba(128,48,64,${stain.alpha})`;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(stain.x, stain.y, stain.radius * 1.35, stain.radius, Math.sin(game.time * 0.2 + stain.x) * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bubble of game.background.bubbles) {
      const driftX = Math.cos(game.time * 0.25 + bubble.drift) * 4;
      const driftY = Math.sin(game.time * 0.18 + bubble.drift) * 4;
      ctx.strokeStyle = `rgba(190,240,220,${bubble.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bubble.x + driftX, bubble.y + driftY, bubble.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const scratch of game.background.scratches) {
      ctx.strokeStyle = `rgba(228,244,211,${scratch.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(scratch.x, scratch.y);
      ctx.lineTo(scratch.x + Math.cos(scratch.angle) * scratch.length, scratch.y + Math.sin(scratch.angle) * scratch.length);
      ctx.stroke();
    }

    for (const fragment of game.background.debris) {
      ctx.fillStyle = `rgba(216,231,183,${fragment.alpha})`;
      ctx.save();
      ctx.translate(fragment.x, fragment.y);
      ctx.rotate(fragment.angle);
      ctx.fillRect(-fragment.radius, -fragment.radius * 0.35, fragment.radius * 2, fragment.radius * 0.7);
      ctx.restore();
    }

    ctx.restore();
    ctx.strokeStyle = "rgba(221, 249, 239, 0.76)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(94, 255, 198, 0.18)";
    ctx.lineWidth = 20;
    ctx.stroke();
  }

  renderBleach(ctx, game) {
    for (const puddle of game.bleachPuddles) {
      const alpha = 1 - puddle.age / puddle.life;
      const gradient = ctx.createRadialGradient(puddle.x, puddle.y, 0, puddle.x, puddle.y, puddle.radius);
      gradient.addColorStop(0, `rgba(206,255,242,${0.42 * alpha})`);
      gradient.addColorStop(1, `rgba(108,255,205,${0.03 * alpha})`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderFungalMats(ctx, game) {
    for (const mat of game.fungalMats) {
      const alpha = 1 - mat.age / mat.life;
      const gradient = ctx.createRadialGradient(mat.x, mat.y, 0, mat.x, mat.y, mat.radius);
      gradient.addColorStop(0, `rgba(209,142,255,${0.28 * alpha})`);
      gradient.addColorStop(0.72, `rgba(106,58,130,${0.18 * alpha})`);
      gradient.addColorStop(1, `rgba(37,18,48,0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mat.x, mat.y, mat.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(235,190,255,${0.18 * alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mat.x, mat.y, mat.radius * (0.72 + Math.sin(game.time * 2 + mat.x) * 0.08), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderPickups(ctx, game) {
    for (const sugar of game.sugarCubes) {
      ctx.save();
      ctx.translate(sugar.x, sugar.y);
      ctx.rotate(Math.PI / 4 + Math.sin(game.time + sugar.x) * 0.08);
      ctx.fillStyle = "#f4ecd8";
      ctx.strokeStyle = "rgba(70,54,40,0.8)";
      ctx.lineWidth = 2;
      ctx.fillRect(-12, -12, 24, 24);
      ctx.strokeRect(-12, -12, 24, 24);
      ctx.restore();
    }

    for (const pickup of game.weaponPickups) {
      const color = pickup.weaponType === "flame" ? "#ff7b28" : "#9ffff0";
      ctx.save();
      ctx.translate(pickup.x, pickup.y);
      ctx.rotate(game.time * 1.5);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 23 + Math.sin(game.time * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(-12, -5, 24, 10);
      ctx.restore();
    }

    for (const tank of game.tankPickups) {
      const color = tank.tankType === "flame" ? "#ff9b30" : "#9ffff0";
      ctx.save();
      ctx.translate(tank.x, tank.y);
      ctx.strokeStyle = color;
      ctx.fillStyle = "rgba(7,10,8,0.82)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-14, -20, 28, 40, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(-8, -12, 16, 20 + Math.sin(game.time * 4 + tank.x) * 3);
      ctx.restore();
    }
  }

  renderEffects(ctx, game) {
    for (const particle of game.effects.particles) {
      const alpha = 1 - particle.age / particle.life;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.5, particle.radius), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.font = "800 20px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    for (const floater of game.effects.floaters) {
      const alpha = 1 - floater.age / floater.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.textAlign = "start";
    ctx.globalAlpha = 1;
  }

  renderFlameCone(ctx, cone) {
    const gradient = ctx.createRadialGradient(cone.x, cone.y, 10, cone.x, cone.y, cone.length);
    gradient.addColorStop(0, "rgba(255,240,113,0.74)");
    gradient.addColorStop(0.55, "rgba(255,88,32,0.34)");
    gradient.addColorStop(1, "rgba(255,40,20,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(cone.x, cone.y);
    ctx.arc(cone.x, cone.y, cone.length, cone.facing - cone.halfAngle, cone.facing + cone.halfAngle);
    ctx.closePath();
    ctx.fill();
  }

  renderAlienTendrils(ctx, alien, time) {
    for (const tendril of alien.tendrils ?? []) {
      const tip = alien.tendrilTip(tendril);
      ctx.strokeStyle = tendril.latched ? "rgba(255,80,150,0.95)" : "rgba(170,35,110,0.7)";
      ctx.lineWidth = tendril.latched ? 8 : 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(alien.x, alien.y);
      const midLength = tendril.length * 0.55;
      const wobble = Math.sin(time * 5 + tendril.age * 3) * 34;
      ctx.quadraticCurveTo(
        alien.x + Math.cos(tendril.angle + 0.45) * midLength,
        alien.y + Math.sin(tendril.angle + 0.45) * midLength + wobble,
        tip.x,
        tip.y
      );
      ctx.stroke();

      ctx.fillStyle = tendril.latched ? "rgba(255,155,210,0.9)" : "rgba(218,68,156,0.75)";
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, tendril.latched ? 13 : 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderOverlay(ctx, game, width, height) {
    this.hud.render(ctx, game, width, height);
    if (game.state.is(GameState.PAUSED)) {
      this.centerMessage(ctx, width, height, "Paused", "Press Escape to return to the dish");
    }
    if (game.state.is(GameState.LEVEL_CLEARED)) {
      this.centerMessage(ctx, width, height, "Dish Cleared", `Bonus banked. Press Enter for Dish ${game.levelNumber + 1}`);
    }
    if (game.state.is(GameState.GAME_OVER)) {
      this.centerMessage(ctx, width, height, "Jack Is Gone", `${game.deathMessage} Press R to restart.`);
    }
  }

  renderSplash(ctx, game, width, height) {
    const imageReady = this.splashImage?.complete && this.splashImage.naturalWidth > 0;
    if (imageReady) {
      ctx.drawImage(this.splashImage, 0, 0, width, height);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(0, 0, width, height);
    } else {
      const gradient = ctx.createRadialGradient(width * 0.48, height * 0.46, 40, width * 0.5, height * 0.5, Math.max(width, height) * 0.72);
      gradient.addColorStop(0, "#314527");
      gradient.addColorStop(0.48, "#10180f");
      gradient.addColorStop(1, "#030503");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      for (let i = 0; i < 18; i += 1) {
        ctx.strokeStyle = `rgba(${90 + i * 6}, ${210 - i * 3}, ${150 + i}, ${0.1 + i * 0.008})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(Math.sin(game.time + i) * 90, Math.cos(game.time * 0.6 + i) * 45, 160 + i * 18, 70 + i * 8, i * 0.31 + game.time * 0.03, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f4dc";
    ctx.font = "900 72px Inter, Segoe UI, sans-serif";
    ctx.fillText("Petri Jack", width / 2, height * 0.34);
    ctx.fillStyle = "rgba(185,255,202,0.86)";
    ctx.font = "700 19px Inter, Segoe UI, sans-serif";
    ctx.fillText("A grim little dish. A yellow suit. Too many things still moving.", width / 2, height * 0.4);

    ctx.fillStyle = "rgba(239,248,218,0.88)";
    ctx.font = "600 17px Inter, Segoe UI, sans-serif";
    ctx.fillText("WASD move   Shift run   Space weapon   Escape pause   M mute", width / 2, height * 0.58);
    ctx.fillStyle = Math.sin(game.time * 5) > 0 ? "#fff0a8" : "#f8ffd9";
    ctx.font = "800 23px Inter, Segoe UI, sans-serif";
    ctx.fillText("Press Enter to start", width / 2, height * 0.68);
    ctx.textAlign = "start";
  }

  centerMessage(ctx, width, height, title, subtitle) {
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f5f3d8";
    ctx.font = "900 54px Inter, Segoe UI, sans-serif";
    ctx.fillText(title, width / 2, height * 0.43);
    ctx.fillStyle = "rgba(216,245,210,0.88)";
    ctx.font = "700 19px Inter, Segoe UI, sans-serif";
    ctx.fillText(subtitle, width / 2, height * 0.51);
    ctx.textAlign = "start";
  }
}

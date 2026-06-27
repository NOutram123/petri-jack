export class SpriteFactory {
  drawJack(ctx, jack, time) {
    ctx.save();
    ctx.translate(jack.x, jack.y);
    ctx.rotate(jack.facing);

    const bob = Math.sin(jack.runTime) * 2.2;
    const stride = Math.sin(jack.runTime) * 7;
    const blink = jack.invulnerable > 0 && Math.floor(time * 18) % 2 === 0;
    ctx.globalAlpha = blink ? 0.58 : 1;

    ctx.fillStyle = "#17180d";
    ctx.beginPath();
    ctx.ellipse(-4, 8, 23, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f3cc2e";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-19, 15 + stride * 0.25);
    ctx.moveTo(-8, 7);
    ctx.lineTo(-14, 25 - stride * 0.2);
    ctx.stroke();

    ctx.strokeStyle = "#d69a12";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(21, 11 - stride * 0.25);
    ctx.moveTo(6, 8);
    ctx.lineTo(18, 23 + stride * 0.18);
    ctx.stroke();

    ctx.fillStyle = "#f0c62f";
    ctx.strokeStyle = "#151407";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-17, -18 + bob, 36, 40, 11);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#141407";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -3 + bob);
    ctx.lineTo(7, 13 + bob);
    ctx.moveTo(8, -4 + bob);
    ctx.lineTo(-8, 13 + bob);
    ctx.stroke();

    ctx.fillStyle = "#e86c22";
    ctx.beginPath();
    ctx.ellipse(-18, 0 + bob, 15, 23, 0.25, 0, Math.PI * 2);
    ctx.ellipse(-12, -11 + bob, 10, 15, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2c3a2";
    ctx.strokeStyle = "#24140e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(13, -8 + bob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#22150e";
    ctx.beginPath();
    ctx.arc(18, -11 + bob, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawLifeform(ctx, lifeform, time) {
    const pulse = 1 + Math.sin(time * 3 + lifeform.pulseOffset) * 0.09;
    const radius = lifeform.radius * pulse;
    ctx.save();
    ctx.translate(lifeform.x, lifeform.y);

    if (lifeform.type === "alien") {
      this.drawAlienBiomass(ctx, lifeform, time, radius);
      ctx.restore();
      return;
    }

    const gradient = ctx.createRadialGradient(-radius * 0.25, -radius * 0.3, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, lifeform.hitFlash > 0 ? "#ffffff" : lifeform.secondaryColor);
    gradient.addColorStop(0.58, lifeform.color);
    gradient.addColorStop(1, "rgba(12, 16, 11, 0.1)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = strokeFor(lifeform.type);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2 + time * 0.25;
      ctx.moveTo(Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.45) * radius * 0.42,
        Math.sin(a + 0.45) * radius * 0.42,
        Math.cos(a + 0.25) * radius * 0.78,
        Math.sin(a + 0.25) * radius * 0.78
      );
    }
    ctx.stroke();

    if (lifeform.type === "animal" || lifeform.type === "bacteria" || lifeform.type === "virus" || lifeform.type === "fungus") {
      ctx.strokeStyle = tendrilFor(lifeform.type);
      ctx.lineWidth = 4;
      const count = lifeform.type === "virus" ? 8 : lifeform.type === "bacteria" ? 4 : lifeform.type === "fungus" ? 10 : 5;
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + Math.sin(time * 2 + i) * 0.2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * radius * 0.8, Math.sin(a) * radius * 0.8);
        ctx.quadraticCurveTo(Math.cos(a) * radius * 1.2, Math.sin(a) * radius * 1.2, Math.cos(a + 0.4) * radius * 1.45, Math.sin(a + 0.4) * radius * 1.45);
        ctx.stroke();
      }
    }

    if (lifeform.infected) {
      ctx.strokeStyle = "rgba(165,165,255,0.88)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 5 + Math.sin(time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawAlienBiomass(ctx, lifeform, time, radius) {
    const outer = ctx.createRadialGradient(-radius * 0.2, -radius * 0.25, radius * 0.08, 0, 0, radius * 1.35);
    outer.addColorStop(0, lifeform.hitFlash > 0 ? "#ffffff" : "#ff68d6");
    outer.addColorStop(0.36, "#9f174d");
    outer.addColorStop(0.74, "#421036");
    outer.addColorStop(1, "rgba(30,6,28,0.08)");
    ctx.fillStyle = outer;
    ctx.beginPath();
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const wobble = 1 + Math.sin(time * 2.4 + i * 1.7 + lifeform.pulseOffset) * 0.16;
      const r = radius * wobble * (i % 3 === 0 ? 1.18 : 1);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,72,180,0.62)";
    ctx.lineWidth = 3;
    ctx.stroke();

    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2 + time * 0.35;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,80,165,0.7)" : "rgba(120,30,180,0.62)";
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * radius * 0.38, Math.sin(a) * radius * 0.32, radius * 0.15, radius * 0.28, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function strokeFor(type) {
  if (type === "plant") return "rgba(201,255,152,0.7)";
  if (type === "bacteria") return "rgba(245,255,120,0.78)";
  if (type === "virus") return "rgba(190,190,255,0.82)";
  if (type === "fungus") return "rgba(235,190,255,0.76)";
  if (type === "alien") return "rgba(255,72,180,0.8)";
  return "rgba(255,190,205,0.75)";
}

function tendrilFor(type) {
  if (type === "bacteria") return "rgba(230,255,70,0.55)";
  if (type === "virus") return "rgba(135,125,255,0.58)";
  if (type === "fungus") return "rgba(205,125,255,0.5)";
  return "rgba(255,95,130,0.5)";
}

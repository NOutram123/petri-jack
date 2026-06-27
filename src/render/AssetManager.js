import { ASSET_TUNING } from "./AssetTuning.js";

export class AssetManager {
  constructor(manifestUrl = "./assets/asset-manifest.json") {
    this.manifestUrl = manifestUrl;
    this.sprites = new Map();
    this.screens = new Map();
    this.ready = false;
    this.loadedCount = 0;
    this.requestedCount = 0;
    this.load();
  }

  async load() {
    try {
      const response = await fetch(this.manifestUrl, { cache: "no-store" });
      if (!response.ok) {
        this.ready = true;
        return;
      }
      const manifest = await response.json();
      if (manifest.autoload === false) {
        this.ready = true;
        return;
      }
      const normalized = normalizeManifest(manifest);
      await Promise.all([
        this.loadGroup(normalized.sprites, this.sprites),
        this.loadGroup(normalized.screens, this.screens)
      ]);
    } catch {
      // Asset packs are optional. Procedural rendering remains the fallback.
    } finally {
      this.ready = true;
    }
  }

  async loadGroup(group, target) {
    const entries = Object.entries(group);
    this.requestedCount += entries.length;
    await Promise.all(entries.map(async ([id, descriptor]) => {
      const image = await this.loadImageIfPresent(descriptor.path);
      if (!image) {
        return;
      }
      target.set(id, {
        ...descriptor,
        image,
        frameWidth: descriptor.frameWidth ?? image.naturalWidth,
        frameHeight: descriptor.frameHeight ?? image.naturalHeight,
        frames: descriptor.frames ?? 1,
        fps: descriptor.fps ?? 8,
        anchorX: descriptor.anchorX ?? descriptor.anchor?.[0] ?? ASSET_TUNING[id]?.anchorX ?? 0.5,
        anchorY: descriptor.anchorY ?? descriptor.anchor?.[1] ?? ASSET_TUNING[id]?.anchorY ?? 0.5,
        scale: descriptor.scale ?? 1,
        drawScale: descriptor.drawScale ?? ASSET_TUNING[id]?.drawScale ?? 1,
        drawOffsetX: descriptor.drawOffsetX ?? descriptor.drawOffset?.x ?? ASSET_TUNING[id]?.drawOffsetX ?? 0,
        drawOffsetY: descriptor.drawOffsetY ?? descriptor.drawOffset?.y ?? ASSET_TUNING[id]?.drawOffsetY ?? 0,
        sourceInset: descriptor.sourceInset ?? ASSET_TUNING[id]?.sourceInset ?? {}
      });
      this.loadedCount += 1;
    }));
  }

  async loadImageIfPresent(path) {
    if (!path) {
      return null;
    }

    try {
      const exists = await fetch(path, { method: "HEAD", cache: "no-store" });
      if (!exists.ok) {
        return null;
      }
      return await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = path;
      });
    } catch {
      return null;
    }
  }

  sprite(id) {
    return this.sprites.get(id) ?? null;
  }

  screen(id) {
    return this.screens.get(id) ?? null;
  }

  drawSprite(ctx, id, x, y, options = {}) {
    const sprite = this.sprite(id);
    if (!sprite) {
      return false;
    }

    const frame = frameFor(sprite, options.time ?? 0, options.frame);
    drawDescriptor(ctx, sprite, x, y, frame, options);
    return true;
  }

  drawScreen(ctx, id, x, y, width, height) {
    const screen = this.screen(id);
    if (!screen) {
      return false;
    }
    drawCover(ctx, screen.image, x, y, width, height);
    return true;
  }
}

function normalizeManifest(manifest) {
  if (manifest.sprites || manifest.screens) {
    return {
      sprites: manifest.sprites ?? {},
      screens: manifest.screens ?? {}
    };
  }

  const sprites = {};
  const screens = {};
  for (const asset of manifest.assets ?? []) {
    const id = asset.id ?? idFromPath(asset.path, asset.animationType);
    if (!id) {
      continue;
    }

    const descriptor = {
      ...asset,
      path: asset.path?.startsWith("./") ? asset.path : `./${asset.path}`,
      anchorX: asset.anchor?.[0],
      anchorY: asset.anchor?.[1],
      fps: asset.fps ?? fpsFor(id, asset.animationType)
    };

    if (asset.animationType === "screen" || id.startsWith("screen.") || id.startsWith("death.") || id === "splash") {
      screens[id] = descriptor;
    } else {
      sprites[id] = descriptor;
    }
  }

  return { sprites, screens };
}

function idFromPath(path, animationType) {
  const normalized = path?.replaceAll("\\", "/") ?? "";
  const file = normalized.split("/").pop()?.replace(/\.png$/i, "");
  if (!file) {
    return null;
  }

  if (file === "splash") return "splash";
  if (file === "death_generic") return "death.generic";
  if (file === "death_alien") return "death.alien";
  if (normalized.includes("/jack/")) {
    const [animation, direction] = file.split("_");
    return `jack.${animation}.${direction}`;
  }
  if (file === "plant_cell") return "lifeform.plant";
  if (file === "animal_cell") return "lifeform.animal";
  if (file === "fungal_spore") return "lifeform.fungus";
  if (file === "alien_biomass") return "lifeform.alien";
  if (file === "bacteria") return "lifeform.bacteria";
  if (file === "virus") return "lifeform.virus";
  if (file === "weapon_bleach") return "pickup.weapon_bleach";
  if (file === "weapon_flame") return "pickup.weapon_flame";
  if (file === "tank_bleach") return "pickup.tank_bleach";
  if (file === "tank_fuel") return "pickup.tank_fuel";
  if (file === "sugar_cube") return "pickup.sugar_cube";
  if (file === "bleach_puddle") return "effect.bleach_puddle";
  if (file === "flame_cone") return "effect.flame_cone";
  if (file === "fungal_mat") return "effect.fungal_mat";
  if (file === "alien_tendril_tip") return "effect.alien_tendril_tip";
  return animationType === "screen" ? `screen.${file}` : file;
}

function fpsFor(id, animationType) {
  if (id.startsWith("jack.idle")) return 1;
  if (id.startsWith("jack.run")) return 7;
  if (id === "lifeform.virus") return 13;
  if (id === "lifeform.bacteria") return 11;
  if (id.startsWith("effect.flame")) return 12;
  if (animationType === "single" || animationType === "screen") return 1;
  return 8;
}

function frameFor(sprite, time, explicitFrame) {
  if (Number.isFinite(explicitFrame)) {
    return Math.max(0, Math.min(sprite.frames - 1, Math.floor(explicitFrame)));
  }
  return Math.floor(time * sprite.fps) % Math.max(1, sprite.frames);
}

function drawDescriptor(ctx, sprite, x, y, frame, options) {
  const inset = sprite.sourceInset ?? {};
  const insetLeft = inset.left ?? 0;
  const insetTop = inset.top ?? 0;
  const insetRight = inset.right ?? 0;
  const insetBottom = inset.bottom ?? 0;
  const sourceWidth = sprite.frameWidth - insetLeft - insetRight;
  const sourceHeight = sprite.frameHeight - insetTop - insetBottom;
  const scale = (options.scale ?? 1) * sprite.scale * sprite.drawScale;
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const dx = -width * sprite.anchorX + sprite.drawOffsetX * (options.offsetScale ?? 1);
  const dy = -height * sprite.anchorY + sprite.drawOffsetY * (options.offsetScale ?? 1);

  ctx.save();
  ctx.translate(x, y);
  if (options.rotation) {
    ctx.rotate(options.rotation);
  }
  if (options.alpha !== undefined) {
    ctx.globalAlpha *= options.alpha;
  }
  ctx.drawImage(
    sprite.image,
    frame * sprite.frameWidth + insetLeft,
    insetTop,
    sourceWidth,
    sourceHeight,
    dx,
    dy,
    width,
    height
  );
  ctx.restore();
}

function drawCover(ctx, image, x, y, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;

  if (imageRatio > targetRatio) {
    sw = image.naturalHeight * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / targetRatio;
    sy = (image.naturalHeight - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

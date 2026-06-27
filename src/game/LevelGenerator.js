import { PlantCell } from "../entities/PlantCell.js";
import { AnimalCell } from "../entities/AnimalCell.js";
import { Bacteria } from "../entities/Bacteria.js";
import { Virus } from "../entities/Virus.js";
import { FungalSpore } from "../entities/FungalSpore.js";
import { AlienLifeform } from "../entities/AlienLifeform.js";
import { SugarCube } from "../entities/SugarCube.js";
import { TankPickup } from "../entities/TankPickup.js";
import { WeaponPickup } from "../entities/WeaponPickup.js";

export const LEVELS = [
  {
    dish: 1,
    name: "Agar Nursery",
    radius: 1750,
    plants: 20,
    animals: 0,
    bacteria: 0,
    viruses: 0,
    fungi: 0,
    aliens: 0,
    sugar: 7,
    pickups: [{ type: "bleach", distance: 230, angle: -0.35 }, { type: "flame", distance: 620 }],
    tanks: [{ type: "bleach", count: 4 }, { type: "flame", count: 3 }],
    aggression: 0.15
  },
  {
    dish: 2,
    name: "Motile Bloom",
    radius: 1780,
    plants: 18,
    animals: 8,
    bacteria: 0,
    viruses: 0,
    fungi: 0,
    aliens: 0,
    sugar: 9,
    pickups: [{ type: "flame", distance: 480 }, { type: "bleach", distance: 960 }],
    tanks: [{ type: "bleach", count: 4 }, { type: "flame", count: 4 }],
    aggression: 0.45
  },
  {
    dish: 3,
    name: "Feeding Medium",
    radius: 1800,
    plants: 24,
    animals: 15,
    bacteria: 0,
    viruses: 0,
    fungi: 0,
    aliens: 0,
    sugar: 12,
    pickups: [{ type: "flame", distance: 420 }, { type: "bleach", distance: 980 }],
    tanks: [{ type: "bleach", count: 5 }, { type: "flame", count: 5 }],
    aggression: 0.72
  },
  {
    dish: 4,
    name: "Bacterial Surge",
    radius: 1810,
    plants: 18,
    animals: 12,
    bacteria: 18,
    viruses: 0,
    fungi: 0,
    aliens: 0,
    sugar: 13,
    pickups: [{ type: "bleach", distance: 360 }, { type: "flame", distance: 850 }],
    tanks: [{ type: "bleach", count: 6 }, { type: "flame", count: 5 }],
    aggression: 0.78
  },
  {
    dish: 5,
    name: "Viral Bloom",
    radius: 1820,
    plants: 16,
    animals: 11,
    bacteria: 14,
    viruses: 12,
    fungi: 0,
    aliens: 0,
    sugar: 14,
    pickups: [{ type: "flame", distance: 330 }, { type: "bleach", distance: 930 }],
    tanks: [{ type: "bleach", count: 6 }, { type: "flame", count: 7 }],
    aggression: 0.9
  },
  {
    dish: 6,
    name: "Spore Lattice",
    radius: 1830,
    plants: 14,
    animals: 12,
    bacteria: 12,
    viruses: 10,
    fungi: 10,
    aliens: 1,
    sugar: 16,
    pickups: [{ type: "flame", distance: 340 }, { type: "bleach", distance: 760 }],
    tanks: [{ type: "bleach", count: 7 }, { type: "flame", count: 8 }],
    aggression: 1.0
  },
  {
    dish: 7,
    name: "Alien Dragnet",
    radius: 1840,
    plants: 10,
    animals: 12,
    bacteria: 14,
    viruses: 12,
    fungi: 8,
    aliens: 2,
    sugar: 17,
    pickups: [{ type: "flame", distance: 310 }, { type: "bleach", distance: 780 }],
    tanks: [{ type: "bleach", count: 7 }, { type: "flame", count: 10 }],
    aggression: 1.12
  }
];

export class LevelGenerator {
  create(levelNumber) {
    const definition = LEVELS[Math.min(levelNumber - 1, LEVELS.length - 1)];
    const scale = Math.max(0, levelNumber - LEVELS.length);
    const rng = mulberry32(0xB10 + levelNumber * 971);
    const radius = definition.radius;
    const lifeforms = [];
    const sugarCubes = [];
    const weaponPickups = [];
    const tankPickups = [];
    const background = this.createBackground(rng, radius);

    for (let i = 0; i < definition.plants + scale * 5; i += 1) {
      const p = randomPoint(rng, radius * 0.86, 210);
      lifeforms.push(new PlantCell(p.x, p.y, rng));
    }

    for (let i = 0; i < definition.animals + scale * 4; i += 1) {
      const p = randomPoint(rng, radius * 0.84, 320);
      lifeforms.push(new AnimalCell(p.x, p.y, rng, definition.aggression + scale * 0.08));
    }

    for (let i = 0; i < definition.bacteria + scale * 5; i += 1) {
      const p = randomPoint(rng, radius * 0.84, 360);
      lifeforms.push(new Bacteria(p.x, p.y, rng, definition.aggression + scale * 0.08));
    }

    for (let i = 0; i < definition.viruses + scale * 4; i += 1) {
      const p = randomPoint(rng, radius * 0.82, 380);
      lifeforms.push(new Virus(p.x, p.y, rng, definition.aggression + scale * 0.08));
    }

    for (let i = 0; i < definition.fungi + scale * 3; i += 1) {
      const p = randomPoint(rng, radius * 0.8, 420);
      lifeforms.push(new FungalSpore(p.x, p.y, rng, definition.aggression + scale * 0.05));
    }

    for (let i = 0; i < definition.aliens + Math.floor(scale * 0.7); i += 1) {
      const p = randomPoint(rng, radius * 0.72, 560);
      lifeforms.push(new AlienLifeform(p.x, p.y, rng, definition.aggression + scale * 0.06));
    }

    for (let i = 0; i < definition.sugar + scale * 2; i += 1) {
      const p = randomPoint(rng, radius * 0.78, 250);
      sugarCubes.push(new SugarCube(p.x, p.y));
    }

    for (const pickup of definition.pickups) {
      const angle = pickup.angle ?? rng() * Math.PI * 2;
      weaponPickups.push(new WeaponPickup(
        Math.cos(angle) * pickup.distance,
        Math.sin(angle) * pickup.distance,
        pickup.type
      ));
    }

    for (const tank of definition.tanks) {
      for (let i = 0; i < tank.count + scale; i += 1) {
        const p = randomPoint(rng, radius * 0.8, 220);
        tankPickups.push(new TankPickup(p.x, p.y, tank.type, 55));
      }
    }

    return {
      definition,
      radius,
      lifeforms,
      sugarCubes,
      weaponPickups,
      tankPickups,
      background
    };
  }

  createBackground(rng, radius) {
    const bubbles = [];
    const scratches = [];
    const stains = [];
    const debris = [];

    for (let i = 0; i < 110; i += 1) {
      const p = randomPoint(rng, radius * 0.96, 0);
      bubbles.push({ ...p, radius: 6 + rng() * 38, alpha: 0.04 + rng() * 0.16, drift: rng() * Math.PI * 2 });
    }

    for (let i = 0; i < 42; i += 1) {
      const p = randomPoint(rng, radius * 0.94, 0);
      scratches.push({
        ...p,
        length: 80 + rng() * 260,
        angle: rng() * Math.PI,
        alpha: 0.05 + rng() * 0.11
      });
    }

    for (let i = 0; i < 32; i += 1) {
      const p = randomPoint(rng, radius * 0.82, 0);
      stains.push({ ...p, radius: 70 + rng() * 210, hue: rng() > 0.5 ? "green" : "rust", alpha: 0.08 + rng() * 0.13 });
    }

    for (let i = 0; i < 86; i += 1) {
      const p = randomPoint(rng, radius * 0.9, 0);
      debris.push({ ...p, radius: 3 + rng() * 11, angle: rng() * Math.PI * 2, alpha: 0.12 + rng() * 0.22 });
    }

    return { bubbles, scratches, stains, debris };
  }
}

function randomPoint(rng, radius, avoidCenter) {
  let p = { x: 0, y: 0 };
  do {
    const angle = rng() * Math.PI * 2;
    const distance = Math.sqrt(rng()) * radius;
    p = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
  } while (Math.hypot(p.x, p.y) < avoidCenter);
  return p;
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

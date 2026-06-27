const CACHE_NAME = "petri-jack-ambience-mix-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./assets/icon.svg",
  "./assets/asset-manifest.json",
  "./assets/ASSET_NOTES.md",
  "./assets/splash.png",
  "./assets/death_generic.png",
  "./assets/death_alien.png",
  "./assets/sprites/jack/idle_N.png",
  "./assets/sprites/jack/idle_NE.png",
  "./assets/sprites/jack/idle_E.png",
  "./assets/sprites/jack/idle_SE.png",
  "./assets/sprites/jack/idle_S.png",
  "./assets/sprites/jack/idle_SW.png",
  "./assets/sprites/jack/idle_W.png",
  "./assets/sprites/jack/idle_NW.png",
  "./assets/sprites/jack/run_N.png",
  "./assets/sprites/jack/run_NE.png",
  "./assets/sprites/jack/run_E.png",
  "./assets/sprites/jack/run_SE.png",
  "./assets/sprites/jack/run_S.png",
  "./assets/sprites/jack/run_SW.png",
  "./assets/sprites/jack/run_W.png",
  "./assets/sprites/jack/run_NW.png",
  "./assets/sprites/lifeforms/plant_cell.png",
  "./assets/sprites/lifeforms/animal_cell.png",
  "./assets/sprites/lifeforms/bacteria.png",
  "./assets/sprites/lifeforms/virus.png",
  "./assets/sprites/lifeforms/fungal_spore.png",
  "./assets/sprites/lifeforms/alien_biomass.png",
  "./assets/sprites/pickups/weapon_bleach.png",
  "./assets/sprites/pickups/weapon_flame.png",
  "./assets/sprites/pickups/tank_bleach.png",
  "./assets/sprites/pickups/tank_fuel.png",
  "./assets/sprites/pickups/sugar_cube.png",
  "./assets/sprites/effects/bleach_puddle.png",
  "./assets/sprites/effects/flame_cone.png",
  "./assets/sprites/effects/fungal_mat.png",
  "./assets/sprites/effects/alien_tendril_tip.png",
  "./src/main.js",
  "./src/game/Game.js",
  "./src/game/StateManager.js",
  "./src/game/LevelGenerator.js",
  "./src/game/Camera.js",
  "./src/game/Input.js",
  "./src/game/Collision.js",
  "./src/game/AudioManager.js",
  "./src/entities/Entity.js",
  "./src/entities/Jack.js",
  "./src/entities/Lifeform.js",
  "./src/entities/PlantCell.js",
  "./src/entities/AnimalCell.js",
  "./src/entities/AlienLifeform.js",
  "./src/entities/Bacteria.js",
  "./src/entities/Virus.js",
  "./src/entities/FungalSpore.js",
  "./src/entities/SugarCube.js",
  "./src/entities/TankPickup.js",
  "./src/entities/WeaponPickup.js",
  "./src/combat/Weapon.js",
  "./src/combat/NoWeapon.js",
  "./src/combat/BleachWeapon.js",
  "./src/combat/FlameWeapon.js",
  "./src/combat/DamageSystem.js",
  "./src/render/AssetManager.js",
  "./src/render/AssetTuning.js",
  "./src/render/Renderer.js",
  "./src/render/SpriteFactory.js",
  "./src/render/Effects.js",
  "./src/render/Hud.js",
  "./src/render/Minimap.js",
  "./src/pwa/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) {
            return cached;
          }
          throw new Error(`No cached response for ${event.request.url}`);
        })
      )
  );
});

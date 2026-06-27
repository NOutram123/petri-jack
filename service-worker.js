const CACHE_NAME = "petri-jack-phase-3-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./assets/icon.svg",
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

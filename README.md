# Petri Jack

**Petri Jack** is a desktop-first browser PWA game about Jack O'Reilly, a yellow-suited exterminator trapped inside a giant circular Petri dish. The current build includes Phase 1, Phase 2 ecosystem upgrades, the first Phase 3 alien introduction pass, and Phase 4 asset-pipeline support with procedural fallbacks, custom collisions, procedural audio, and offline-capable PWA wiring.

## Current Status

Implemented:

- Splash, playing, paused, level-cleared, game-over, and restart states.
- WASD movement, Shift sprint, Space weapon fire, Enter start/continue, Escape pause, R restart, M mute.
- Temporary developer key: P instantly clears the current dish and jumps to the next dish for testing.
- Jack O'Reilly with a yellow biohazard suit, visible head, long ginger hair, 8-direction facing, running animation, 3 lives, health, score, weapon tank, and camera lag.
- Jack starts unarmed and must find a bleach sprayer or flamethrower in the dish.
- Large circular Petri dish world with a hard circular boundary, procedural agar texture, stains, bubbles, scratches, debris, particles, and microscope vignette.
- Larger HUD with health, lives, current weapon, tank level, score, dish name/number, clearance, mute state, and enlarged minimap.
- Data-driven dish definitions through Dish 7.
- Plant cells, animal cells, bacteria, viruses, fungal spores, alien biomass, sugar cubes, weapon pickups, tank pickups, contact damage, lifeform feeding/growth, infection/spawning, alien tendrils, and level clear progression.
- Bleach trail weapon and flamethrower cone weapon.
- Bleach/fuel add-on tanks that refill the matching active weapon and display on the minimap.
- Procedural Web Audio sound design with master, ambience, SFX, UI, weapon-loop, soundtrack, alien, and low-health buses. No external audio samples are required.
- Asset manifest/loader for Phase 4 sprite sheets, pickups, effects, splash art, and death overlays.
- Manifest and service worker for PWA/offline basics.

## How To Run Locally

Because ES modules and service workers need HTTP, serve the folder instead of opening `index.html` directly.

```powershell
python -m http.server 4173
```

Then open:

```text
http://localhost:4173/
```

## Controls

| Input | Action |
| --- | --- |
| `WASD` | Move |
| `Shift` | Run at double speed |
| `Space` | Activate current weapon |
| `Enter` | Start / continue |
| `Escape` | Pause |
| `R` | Restart after game over |
| `M` | Mute / unmute |
| `P` | Temporary developer clear key |

Gamepad support is intentionally not part of Phase 1. Add it in Phase 5.

## Architecture

```text
/src
  main.js
  game/
    Game.js
    StateManager.js
    LevelGenerator.js
    Camera.js
    Input.js
    Collision.js
    AudioManager.js
  entities/
    Entity.js
    Jack.js
    Lifeform.js
    PlantCell.js
    AnimalCell.js
    AlienLifeform.js
    Bacteria.js
    Virus.js
    FungalSpore.js
    SugarCube.js
    TankPickup.js
    WeaponPickup.js
  combat/
    Weapon.js
    NoWeapon.js
    BleachWeapon.js
    FlameWeapon.js
    DamageSystem.js
  render/
    Renderer.js
    SpriteFactory.js
    Effects.js
    Hud.js
    Minimap.js
  pwa/
    manifest.json
    service-worker.js
/assets
  asset-manifest.json
  icon.svg
  sprites/
    jack/
    lifeforms/
    pickups/
    effects/
index.html
styles.css
service-worker.js
README.md
```

The active service worker is at the repo root so it can control the app root. `src/pwa/service-worker.js` is a source-tree note documenting that PWA shell boundary.

Simulation state lives in `Game`, entities, combat, and level modules. Rendering is in `render/*`, and the renderer reads game state rather than owning it. Input is mapped to named actions in `Input.js`. Audio is procedural and locked behind the first user gesture to satisfy browser autoplay rules.

## Audio System

`src/game/AudioManager.js` owns the procedural Web Audio graph. It exposes these game-facing calls:

- `unlock()` after the first user gesture.
- `toggleMute()`.
- `update(dt, game)` once per frame for dynamic ambience, alien drone, low-health heartbeat, and weapon loop cleanup.
- `playBleach(dt)` and `playFlame(dt)` for held weapon loops.
- `playHit()`, `playSplat()` / `playKill()`, `playJackDamage()`, `playPickup()`, `playClear()`, and `playGameOver()`.
- `playPositionalSfx(name, worldX, worldY, jackX, jackY)` for panned and distance-attenuated sounds.

Volume defaults live in the exported `AUDIO_VOLUME` constants at the top of `AudioManager.js`. Dynamic intensity is calculated from nearby lifeforms, Jack's health, and whether alien dishes/lifeforms are active. The ambience combines audible low-mid dissonant chord pads, sparse horror phrases, subdued wet texture, heartbeat pulses, and organic creaks. `getMixSnapshot()` can be used while debugging live gain levels. The system uses generated oscillators and noise buffers only; it does not require `.wav` or `.ogg` files.

## Phase 4 Asset Pipeline

The game now loads the imported art pack from `assets/asset-manifest.json` through `src/render/AssetManager.js`. Pack notes live in `assets/ASSET_NOTES.md`.

The loader is intentionally forgiving:

- If the manifest or a listed PNG is missing, the game keeps using procedural fallback art.
- If a listed asset exists, it replaces the matching procedural sprite or screen immediately after refresh.
- Sprite sheets are horizontal strips with transparent backgrounds.
- Jack uses cleaned 8-direction `idle` and `run` sheets, 96x96 frames, and a manifest foot anchor of `[0.5, 0.88]`.
- Lifeforms, pickups, bleach puddles, flame cones, fungal mats, alien tendril tips, splash art, and death art all have manifest entries.
- Per-asset alignment is read from manifest `anchor`, `drawScale`, and `drawOffset` values. `src/render/AssetTuning.js` is kept for small code-side overrides such as the longer flamethrower emission alignment.
- Sprite art never controls collision. Entity radii and custom collision checks remain the gameplay source of truth.
- The current asset pack is `0.2-cleaned`; it replaces the earlier Jack sheets that had detached orange/brown artifacts below the feet.

Expected ZIP import structure:

```text
assets/asset-manifest.json
assets/splash.png
assets/death_generic.png
assets/death_alien.png
assets/sprites/jack/*.png
assets/sprites/lifeforms/*.png
assets/sprites/pickups/*.png
assets/sprites/effects/*.png
```

After importing final art, verify the browser console for missing filenames and run a smoke test through splash, movement, weapon firing, and alien dish progression.

If a browser keeps showing old PWA art, hard refresh the page and unregister the local service worker in DevTools under Application -> Service Workers, or clear site data for `localhost:4173`. The cache version is bumped whenever shipped asset filenames or sprite contents change.

## Phase 1 Design Assumptions

- The dish size stays roughly stable across levels; difficulty rises through population and aggression.
- Weapon pickups replace the current weapon or refill if the type matches.
- When Jack swaps to a different weapon, the old weapon drops at the pickup location and can be picked up again after a brief cooldown.
- Jack starts a fresh run unarmed. The first dish places an early weapon pickup close enough to find quickly.
- Add-on tanks refill only the matching active weapon. If Jack is unarmed or holding the other weapon, the tank stays in the dish.
- Sugar cubes are visible in the main playfield but hidden on the minimap. Tank pickups are shown on the minimap.
- Procedural sprites are placeholders for later asset-driven rendering.
- `/assets/splash.png` and the rest of the Phase 4 art pack are optional. If added later, the renderer uses them automatically; otherwise it renders procedural fallback art.

## Phase 2 Notes

- Bacteria swarm toward nearby food, consume sugar/cells, and can multiply under a spawn cap.
- Viruses move erratically, infect plants/animals/bacteria, damage hosts, and can cause outbreaks.
- Fungal spores drift, consume sugar, seed fungal mats, and create area hazards.
- Non-alien lifeforms remain contact-damage only. Phase 2 does not add ranged attacks.
- Minimap colours: plant green, animal red, bacteria yellow, virus blue-purple, fungus purple, Jack yellow, tanks cyan/orange squares, weapon pickups cyan/orange rings.
- Death text now varies for bacteria, virus, and fungus.

## Phase 3 Notes

- Dish 6 introduces the first alien biomass encounter and Dish 7 escalates it.
- Alien biomass feeds on sugar and other lifeforms, grows over time, and sends tendrils that search for Jack.
- Alien tendrils can latch and drain health.
- Aliens appear as red/purple minimap blobs.
- Alien biomass resists bleach damage and takes extra flame damage.
- Alien death/game-over text describes Jack being dragged into the biomass.

## Known Limitations

- Balance is intentionally rough and arcade-readable rather than final.
- There is no settings menu or persistent high score yet.
- No gamepad, mobile controls, save games, leaderboard, or complex alien variants are included yet.
- `P` is currently a temporary developer clear key and should be removed or hidden after full testing.
- Service-worker updates are simple network-first/offline-fallback behavior and may require refresh after local changes.

## Phase Roadmap

### Phase 2 Upgrades: Ecosystem Expansion

Status: implemented in the current build.

Added:

- Bacteria lifeform.
- Virus lifeform.
- Fungal spores.
- Stronger food-chain logic.
- Clearer predator/prey hierarchy.
- Infection/spawning mechanics.
- Better death scenes for bacteria, virus, and fungus.
- More level definitions.
- Stronger minimap colour coding.
- Balancing pass.

Lifeform hierarchy:

1. Plant cells.
2. Animal cells.
3. Bacteria.
4. Virus.
5. Fungal spores.
6. Alien.

Suggested behaviours:

- Bacteria: swarm, multiply quickly, consume sugar/cells.
- Virus: fast, erratic, infects cells and causes outbreaks.
- Fungal spores: drift, seed fungal mats, create area hazards.

Only alien should have ranged attacks. Other lifeforms remain contact-only.

### Phase 3 Upgrades: Alien Introduction

Status: first pass implemented in the current build.

Added:

- Alien biomass.
- Growth over time.
- Feeding on sugar and other lifeforms.
- Tendrils that actively search for Jack.
- Tendrils can latch/drain health.
- Alien shown as pulsing red/purple minimap blob.
- Alien resistant to weak bleach.
- Alien more vulnerable to flame.
- Specific alien death scene where Jack is dragged/absorbed by tendrils.
- Escalating alien variants in later dishes.

### Phase 4 Upgrades: Asset Upgrade Pass

Status: implemented with the first-pass imported art pack and procedural fallbacks.

Replace procedural placeholders with asset-driven rendering:

- 8-direction Jack sprite sheets.
- Improved yellow biohazard suit animation.
- Visible ginger hair animation.
- Lifeform sprite sheets.
- Better splash bitmap.
- Better death scene overlays.
- Optional 3D-rendered sprite sheets generated externally and imported as 2D assets.

Keep game logic 2D even if assets are rendered from 3D models.

### Phase 5 Upgrades: Polish And Platform

Add:

- Gamepad support.
- Settings menu.
- Audio volume controls.
- Difficulty options.
- Mobile/touch controls if wanted.
- Better PWA install/offline polish.
- Save high scores locally.
- Performance optimisation.
- Particle quality settings.

## Recommended Next Steps

1. Playtest Phase 3 and tune alien health, tendril reach, flame vulnerability, and bleach resistance.
2. Add a tiny debug overlay for population counts and frame time before alien variants arrive.
3. Start Phase 4 by replacing procedural placeholders with sprite sheets and upgraded death overlays.

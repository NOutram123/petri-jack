import { AudioManager } from "./AudioManager.js";
import { Camera } from "./Camera.js";
import { DamageSystem } from "../combat/DamageSystem.js";
import { GameState, StateManager } from "./StateManager.js";
import { Input } from "./Input.js";
import { Jack } from "../entities/Jack.js";
import { LevelGenerator } from "./LevelGenerator.js";
import { Renderer } from "../render/Renderer.js";
import { constrainCircleToDish } from "./Collision.js";
import { Effects } from "../render/Effects.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new Input(window);
    this.audio = new AudioManager();
    this.state = new StateManager();
    this.camera = new Camera();
    this.levelGenerator = new LevelGenerator();
    this.damageSystem = new DamageSystem();
    this.effects = new Effects();

    this.jack = new Jack();
    this.levelNumber = 1;
    this.levelName = "";
    this.dishRadius = 1750;
    this.lifeforms = [];
    this.sugarCubes = [];
    this.weaponPickups = [];
    this.tankPickups = [];
    this.bleachPuddles = [];
    this.fungalMats = [];
    this.background = { bubbles: [], scratches: [], stains: [], debris: [] };
    this.clearance = 0;
    this.initialLifeformCount = 1;
    this.deathMessage = "Jack was consumed by the dish.";
    this.time = 0;
    this.lastTime = 0;
    this.loop = this.loop.bind(this);

    window.addEventListener("pointerdown", () => this.audio.unlock(), { once: true });
    window.addEventListener("keydown", () => this.audio.unlock(), { once: true });
    this.loadLevel(1, true);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    const dt = Math.min(0.033, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;
    this.update(dt);
    this.renderer.render(this);
    this.input.endFrame();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    this.state.update(dt);
    this.camera.resize(this.renderer.logicalWidth, this.renderer.logicalHeight);
    this.audio.update(dt, this);

    if (this.input.consume("mute")) {
      this.audio.toggleMute();
    }

    if (this.input.consume("devClear") && !this.state.is(GameState.SPLASH)) {
      this.developerClearDish();
      return;
    }

    if (this.state.is(GameState.SPLASH)) {
      if (this.input.consume("confirm")) {
        this.audio.unlock();
        this.state.set(GameState.PLAYING);
      }
      return;
    }

    if (this.state.is(GameState.GAME_OVER)) {
      if (this.input.consume("restart")) {
        this.restart();
      }
      return;
    }

    if (this.state.is(GameState.LEVEL_CLEARED)) {
      if (this.input.consume("confirm")) {
        this.loadLevel(this.levelNumber + 1);
        this.state.set(GameState.PLAYING);
      }
      return;
    }

    if (this.input.consume("pause")) {
      this.state.set(this.state.is(GameState.PAUSED) ? GameState.PLAYING : GameState.PAUSED);
    }

    if (this.state.is(GameState.PAUSED)) {
      return;
    }

    this.jack.update(dt, this.input, this.dishRadius);
    this.jack.weapon.update(dt, this, this.input.down("fire"));

    for (const lifeform of this.lifeforms) {
      lifeform.update(dt, this);
      constrainCircleToDish(lifeform, this.dishRadius);
    }
    for (const sugar of this.sugarCubes) {
      sugar.update(dt);
    }

    this.damageSystem.update(dt, this);
    this.lifeforms = this.lifeforms.filter((lifeform) => !lifeform.dead);
    this.effects.update(dt);
    this.camera.update(this.jack, dt);
    this.updateClearance();
    this.checkPlayerHealth();
    this.checkLevelClear();
  }

  loadLevel(levelNumber, keepScore = false) {
    const score = keepScore ? this.jack.score : this.jack.score;
    const lives = keepScore ? this.jack.lives : this.jack.lives;
    const weapon = this.jack.weapon;
    const level = this.levelGenerator.create(levelNumber);
    this.levelNumber = levelNumber;
    this.levelName = level.definition.name;
    this.dishRadius = level.radius;
    this.lifeforms = level.lifeforms;
    this.sugarCubes = level.sugarCubes;
    this.weaponPickups = level.weaponPickups;
    this.tankPickups = level.tankPickups;
    this.background = level.background;
    this.bleachPuddles = [];
    this.fungalMats = [];
    this.effects = new Effects();
    this.initialLifeformCount = Math.max(1, this.lifeforms.length);
    this.clearance = 0;
    this.jack = new Jack();
    this.jack.score = score;
    this.jack.lives = lives;
    this.jack.weapon = weapon;
    this.jack.respawn();
    this.camera.x = -this.renderer.logicalWidth / 2;
    this.camera.y = -this.renderer.logicalHeight / 2;
  }

  restart() {
    this.levelNumber = 1;
    this.jack = new Jack();
    this.loadLevel(1, true);
    this.state.set(GameState.SPLASH);
  }

  updateClearance() {
    this.clearance = 1 - this.lifeforms.length / this.initialLifeformCount;
  }

  checkPlayerHealth() {
    if (this.jack.health > 0) {
      return;
    }

    this.jack.lives -= 1;
    if (this.jack.lives > 0) {
      this.jack.respawn();
      return;
    }

    this.deathMessage = deathMessageFor(this.jack.lastDamageType);
    this.audio.playGameOver();
    this.state.set(GameState.GAME_OVER);
  }

  checkLevelClear() {
    if (this.lifeforms.length > 0) {
      return;
    }
    const bonus = this.levelNumber * 500;
    this.jack.score += bonus;
    this.showPickupIndicator(`+${bonus}`, this.jack.x, this.jack.y - 44);
    this.audio.playClear();
    this.state.set(GameState.LEVEL_CLEARED);
  }

  showPickupIndicator(text, x, y) {
    this.effects.addFloater(text, x, y, "#fff3a6");
  }

  developerClearDish() {
    const nextLevel = this.levelNumber + 1;
    this.jack.score += this.levelNumber * 500;
    this.audio.playClear();
    this.loadLevel(nextLevel);
    this.state.set(GameState.PLAYING);
    this.showPickupIndicator("DEV CLEAR", this.jack.x, this.jack.y - 42);
  }

  canSpawnMoreLifeforms() {
    return this.lifeforms.length < this.initialLifeformCount + 26;
  }

  spawnLifeform(lifeform) {
    constrainCircleToDish(lifeform, this.dishRadius);
    this.lifeforms.push(lifeform);
  }
}

function deathMessageFor(type) {
  if (type === "plant") {
    return "Jack was overgrown.";
  }
  if (type === "animal") {
    return "Jack was engulfed.";
  }
  if (type === "bacteria") {
    return "Jack was digested by the swarm.";
  }
  if (type === "virus") {
    return "Jack's suit became an outbreak.";
  }
  if (type === "fungus") {
    return "Jack was seeded into the lattice.";
  }
  if (type === "alien") {
    return "Jack was dragged into the alien biomass.";
  }
  return "Jack was consumed by the dish.";
}

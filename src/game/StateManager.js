export const GameState = Object.freeze({
  SPLASH: "splash",
  PLAYING: "playing",
  PAUSED: "paused",
  LEVEL_CLEARED: "level-cleared",
  GAME_OVER: "game-over"
});

export class StateManager {
  constructor(initial = GameState.SPLASH) {
    this.current = initial;
    this.previous = null;
    this.time = 0;
  }

  set(state) {
    if (this.current === state) {
      return;
    }
    this.previous = this.current;
    this.current = state;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
  }

  is(state) {
    return this.current === state;
  }
}

const KEY_BINDINGS = new Map([
  ["KeyW", "up"],
  ["ArrowUp", "up"],
  ["KeyS", "down"],
  ["ArrowDown", "down"],
  ["KeyA", "left"],
  ["ArrowLeft", "left"],
  ["KeyD", "right"],
  ["ArrowRight", "right"],
  ["Space", "fire"],
  ["Enter", "confirm"],
  ["Escape", "pause"],
  ["KeyP", "devClear"],
  ["KeyR", "restart"],
  ["KeyM", "mute"],
  ["ShiftLeft", "sprint"],
  ["ShiftRight", "sprint"]
]);

export class Input {
  constructor(target = window) {
    this.actions = new Set();
    this.pressed = new Set();
    this.justPressed = new Set();

    target.addEventListener("keydown", (event) => this.handleKey(event, true));
    target.addEventListener("keyup", (event) => this.handleKey(event, false));
    target.addEventListener("blur", () => this.clear());
  }

  handleKey(event, down) {
    const action = KEY_BINDINGS.get(event.code);
    if (!action) {
      return;
    }

    event.preventDefault();
    if (down) {
      if (!this.pressed.has(action)) {
        this.justPressed.add(action);
      }
      this.pressed.add(action);
      this.actions.add(action);
    } else {
      this.pressed.delete(action);
      this.actions.delete(action);
    }
  }

  axis() {
    const x = (this.actions.has("right") ? 1 : 0) - (this.actions.has("left") ? 1 : 0);
    const y = (this.actions.has("down") ? 1 : 0) - (this.actions.has("up") ? 1 : 0);
    if (x === 0 && y === 0) {
      return { x: 0, y: 0, magnitude: 0 };
    }
    const magnitude = Math.hypot(x, y);
    return { x: x / magnitude, y: y / magnitude, magnitude };
  }

  down(action) {
    return this.actions.has(action);
  }

  consume(action) {
    if (!this.justPressed.has(action)) {
      return false;
    }
    this.justPressed.delete(action);
    return true;
  }

  endFrame() {
    this.justPressed.clear();
  }

  clear() {
    this.actions.clear();
    this.pressed.clear();
    this.justPressed.clear();
  }
}

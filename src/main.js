import { Game } from "./game/Game.js";

const canvas = document.querySelector("#game-canvas");
const game = new Game(canvas);

document.body.classList.add("is-ready");
game.start();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

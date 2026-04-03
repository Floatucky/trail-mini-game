document.addEventListener("DOMContentLoaded", function () {
  const POPUP_ID = 65009;
  const GAME_SRC = "https://floatucky.github.io/trail-mini-game/game.js";

  let loaded = false;

  function loadGame(cb) {
    if (loaded) return cb();

    const s = document.createElement("script");
    s.src = GAME_SRC;

    s.onload = () => {
      loaded = true;
      cb();
    };

    document.body.appendChild(s);
  }

  document.querySelector(".hidden-trigger")?.addEventListener("click", () => {
    document.body.style.overflow = "hidden";

    if (window.PUM) window.PUM.open(POPUP_ID);

    loadGame(() => {
      setTimeout(() => {
        if (window.initializeGame) window.initializeGame();
      }, 100);
    });
  });

  document.addEventListener("pumAfterClose", () => {
    document.body.style.overflow = "";

    if (window.destroyGame) window.destroyGame();
  });
});

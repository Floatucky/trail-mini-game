document.addEventListener("DOMContentLoaded", function () {
  var POPUP_ID = 65009;
  var GAME_SRC = "https://floatucky.github.io/trail-mini-game/game.js";

  var scriptLoaded = false;
  var scriptLoading = false;

  function loadGameScriptOnce(callback) {
    if (scriptLoaded) { callback(); return; }
    if (scriptLoading) return;

    if (document.querySelector('script[data-floatucky-game="1"]')) {
      scriptLoaded = true;
      callback();
      return;
    }

    scriptLoading = true;
    console.log("[Floatucky Game] Loading game.js");

    var s = document.createElement("script");
    s.src = GAME_SRC;
    s.async = true;
    s.setAttribute("data-floatucky-game", "1");

    s.onload = function () {
      scriptLoaded = true;
      scriptLoading = false;
      console.log("[Floatucky Game] game.js loaded");
      callback();
    };

    s.onerror = function () {
      scriptLoading = false;
      console.error("[Floatucky Game] Failed to load game.js:", GAME_SRC);
    };

    document.body.appendChild(s);
  }

  function startGameSoon() {
    setTimeout(function () {
      var canvas = document.getElementById("gameCanvas");
      console.log("[Floatucky Game] Canvas exists:", !!canvas);

      if (window.initializeGame) {
        console.log("[Floatucky Game] Starting game");
        window.initializeGame();
      } else {
        console.error("[Floatucky Game] initializeGame not found");
      }
    }, 150);
  }

  var trigger = document.querySelector(".hidden-trigger");
  if (trigger) {
    trigger.addEventListener("click", function () {
      document.body.classList.add("popup-open");
      if (window.PUM && window.PUM.open) window.PUM.open(POPUP_ID);

      loadGameScriptOnce(function () {
        startGameSoon();
      });
    });
  }

  document.addEventListener("pumAfterClose", function () {
    document.body.classList.remove("popup-open");

    if (window.destroyGame) {
      console.log("[Floatucky Game] Stopping game");
      window.destroyGame();
    }
  });
});

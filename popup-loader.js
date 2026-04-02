document.addEventListener("DOMContentLoaded", function () {
  var POPUP_ID = 65009;
  var GAME_SRC = "https://floatucky.github.io/trail-mini-game/game.js";

  var scriptLoaded = false;
  var scriptLoading = false;
  var startTimeout = null;

  function stopGameNow() {
    document.body.classList.remove("popup-open");

    if (startTimeout) {
      clearTimeout(startTimeout);
      startTimeout = null;
    }

    if (window.destroyGame) {
      console.log("[Floatucky Game] Stopping game");
      window.destroyGame();
    }

    var audios = document.querySelectorAll("audio");
    for (var i = 0; i < audios.length; i++) {
      try {
        audios[i].pause();
        audios[i].currentTime = 0;
      } catch (e) {}
    }
  }

  function loadGameScriptOnce(callback) {
    if (scriptLoaded) {
      callback();
      return;
    }

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
    if (startTimeout) {
      clearTimeout(startTimeout);
      startTimeout = null;
    }

    startTimeout = setTimeout(function () {
      var canvas = document.getElementById("gameCanvas");
      console.log("[Floatucky Game] Canvas exists:", !!canvas);

      if (!canvas) {
        console.error("[Floatucky Game] gameCanvas not found inside popup");
        return;
      }

      if (window.initializeGame) {
        console.log("[Floatucky Game] Starting game");
        window.initializeGame();

        setTimeout(function () {
          if (
            window.__floatuckyGameInstance &&
            typeof window.__floatuckyGameInstance.resizeCanvas === "function"
          ) {
            window.__floatuckyGameInstance.resizeCanvas();
          }
        }, 120);
      } else {
        console.error("[Floatucky Game] initializeGame not found");
      }
    }, 180);
  }

  var trigger = document.querySelector(".hidden-trigger");
  if (trigger) {
    trigger.addEventListener("click", function () {
      document.body.classList.add("popup-open");

      if (window.PUM && window.PUM.open) {
        window.PUM.open(POPUP_ID);
      }

      loadGameScriptOnce(function () {
        startGameSoon();
      });
    });
  }

  // DOM event path
  document.addEventListener("pumAfterClose", function () {
    stopGameNow();
  });

  // jQuery / Popup Maker event path
  if (window.jQuery) {
    window.jQuery(document).on("pumAfterClose", function () {
      stopGameNow();
    });
  }

  // Safety: clicking the close button should stop immediately
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target) return;

    if (
      target.closest(".pum-close") ||
      target.closest(".pum-overlay") ||
      target.closest(".pum-close-pop")
    ) {
      setTimeout(function () {
        stopGameNow();
      }, 50);
    }
  });
});

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
      window.destroyGame();
    }

    // Extra safety: stop any audio elements that may still be alive
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

    var s = document.createElement("script");
    s.src = GAME_SRC;
    s.async = true;
    s.setAttribute("data-floatucky-game", "1");

    s.onload = function () {
      scriptLoaded = true;
      scriptLoading = false;
      callback();
    };

    s.onerror = function () {
      scriptLoading = false;
      console.error("Failed to load game.js:", GAME_SRC);
    };

    document.body.appendChild(s);
  }

  function startGameSoon() {
    if (startTimeout) {
      clearTimeout(startTimeout);
      startTimeout = null;
    }

    startTimeout = setTimeout(function () {
      if (window.initializeGame) {
        window.initializeGame();
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

  // Popup Maker DOM event
  document.addEventListener("pumAfterClose", function () {
    stopGameNow();
  });

  // Popup Maker jQuery event fallback
  if (window.jQuery) {
    window.jQuery(document).on("pumAfterClose", function () {
      stopGameNow();
    });
  }

  // Close button / overlay fallback
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target) return;

    var isCloseButton =
      target.closest(".pum-close") ||
      target.closest(".pum-close-pop") ||
      target.closest(".pum-overlay");

    if (isCloseButton) {
      setTimeout(function () {
        stopGameNow();
      }, 50);
    }
  });
});

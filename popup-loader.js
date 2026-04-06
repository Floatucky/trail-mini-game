<script>
document.addEventListener("DOMContentLoaded", function () {

  const trigger = document.querySelector(".hidden-trigger");
  const lightbox = document.getElementById("game-lightbox");
  const closeBtn = document.getElementById("game-close");

  let gameLoaded = false;

  function loadGame(cb) {
    if (gameLoaded) return cb();

    const s = document.createElement("script");
    s.src = "https://floatucky.github.io/trail-mini-game/game.js";
    s.onload = () => {
      gameLoaded = true;
      cb();
    };
    document.body.appendChild(s);
  }

  trigger.addEventListener("click", () => {
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";

    loadGame(() => {
      setTimeout(() => {
        if (window.initializeGame) {
          window.initializeGame();
        }
      }, 100);
    });
  });

  closeBtn.addEventListener("click", () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";

    if (window.destroyGame) {
      window.destroyGame();
    }
  });

});
</script>

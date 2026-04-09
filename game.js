const FPS_INTERVAL = 1000 / 60;
const MAX_OBSTACLES = 40;
const MAX_POWERUPS = 3;
const MIN_SPAWN_INTERVAL = 550;

class GameObject {
  constructor(x, y, width, height, image, hitbox) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
    this.hitbox = hitbox;
    this.timer = 30;
  }

  draw(ctx) {
    if (this.image && this.image.complete && this.image.naturalWidth > 0) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  getHitbox() {
    return {
      x: this.x + this.hitbox.xOffset,
      y: this.y + this.hitbox.yOffset,
      width: this.hitbox.width,
      height: this.hitbox.height
    };
  }
}

class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");

    this.loopToken = 0;
    this.running = true;
    this.gameLoopRequestId = null;

    this.setLogicalResolution();

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.backgroundMusic = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
    this.collisionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-end.mp3");
    this.pointSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/point-beep.mp3");
    this.powerUpSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/powerup-recieved.mp3");
    this.explosionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/explosion.mp3");

    this.images = {
      player: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png"),
      tree: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png"),
      rock: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png"),
      powerUp: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Chicken-Bucket.png"),
      explosion: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Explosion.png")
    };

    this.resetCoreState();

    this.player = new GameObject(
      0,
      0,
      this.isMobilePortrait ? 120 : 100,
      this.isMobilePortrait ? 48 : 40,
      this.images.player,
      this.isMobilePortrait
        ? { xOffset: 8, yOffset: 12, width: 98, height: 28 }
        : { xOffset: 5, yOffset: 10, width: 85, height: 25 }
    );

    this.initEventListeners();
    this.resizeCanvas();
    this.startGameLoop();
  }

  resetCoreState() {
    this.obstacles = [];
    this.powerUps = [];
    this.explosions = [];

    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;

    this.isFullSendMode = false;
    this.fullSendModeTimer = 0;

    this.spawnInterval = 1350;
    this.obstacleSpeed = 3;

    this.lastSpawnTime = performance.now();
    this.lastUpdateTime = 0;

    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      Space: false,
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false
    };

    this.touchStartY = null;

    this.musicStarted = false;
    this.audioEnabled = false;
    this.soundsPreloaded = false;
  }

  setLogicalResolution() {
    this.isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;

    if (this.isMobilePortrait) {
      this.baseWidth = 700;
      this.baseHeight = 900;
    } else {
      this.baseWidth = 1200;
      this.baseHeight = 900;
    }

    this.playerSpeed = this.isMobilePortrait ? 14 : 10;
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  initEventListeners() {
  this._onResize = () => {
    this.setLogicalResolution();
    this.resizeCanvas();
  };

  this._onKeyDown = (e) => {
    if (["ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();

    // 🔥 ALWAYS allow resume
    if (this.isPaused && !this.gameOver) {
      this.resumeGame();
      return;
    }

    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = true;
      this.startBackgroundMusic();
      this.startSoundPlayback();
      if (!this.audioEnabled) this.enableAudio();
    }
  };

  this._onKeyUp = (e) => {
    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = false;
    }
  };

  // 🔥 GLOBAL CLICK HANDLER (THIS IS THE FIX)
  this._onAnyClick = () => {
    if (this.gameOver) return;

    if (this.isPaused) {
      this.resumeGame();
    }
  };

  // 🔥 PAUSE ONLY when clicking OUTSIDE game-wrap
  this._onOutsideClick = (e) => {
    if (this.gameOver) return;

    const wrap = document.getElementById("game-wrap");
    if (!wrap) return;

    if (!wrap.contains(e.target)) {
      this.pauseGame();
    }
  };

  // 🔥 MOBILE SAME LOGIC
  this._onTouchStart = (e) => {
    if (this.gameOver) return;

    if (this.isPaused) {
      this.resumeGame();
      return;
    }

    this.touchStartY = e.touches[0].clientY;

    this.startBackgroundMusic();
    this.startSoundPlayback();
    if (!this.audioEnabled) this.enableAudio();
  };

  this._onTouchMove = (e) => {
    if (this.isPaused || this.gameOver) return;

    const currentTouchY = e.touches[0].clientY;

    if (this.touchStartY !== null) {
      e.preventDefault();

      const move = (currentTouchY - this.touchStartY) / this.scale;

      this.player.y = Math.max(
        0,
        Math.min(this.baseHeight - this.player.height, this.player.y + move)
      );

      this.touchStartY = currentTouchY;
    }
  };

  this._onTouchEnd = () => {
    this.touchStartY = null;
  };

  this._onVisibilityChange = () => {
    if (document.hidden && !this.gameOver) {
      this.pauseGame();
    }
  };

  window.addEventListener("resize", this._onResize);
  document.addEventListener("keydown", this._onKeyDown);
  document.addEventListener("keyup", this._onKeyUp);

  // 🔥 THIS IS THE MAGIC
  document.addEventListener("pointerdown", this._onAnyClick);
  document.addEventListener("pointerdown", this._onOutsideClick);

  this.canvas.addEventListener("touchstart", this._onTouchStart, { passive: false });
  this.canvas.addEventListener("touchmove", this._onTouchMove, { passive: false });
  this.canvas.addEventListener("touchend", this._onTouchEnd);

  document.addEventListener("visibilitychange", this._onVisibilityChange);
}
  
  resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  const container = this.canvas.parentElement;
  const rect = container.getBoundingClientRect();

  const width = rect.width;
  const height = rect.height;

  this.scale = Math.min(
    width / this.baseWidth,
    height / this.baseHeight
  );

  const cw = this.baseWidth * this.scale;
  const ch = this.baseHeight * this.scale;

  this.canvas.width = cw * dpr;
  this.canvas.height = ch * dpr;

  this.canvas.style.width = `${cw}px`;
  this.canvas.style.height = `${ch}px`;

  this.canvas.style.position = "absolute";
  this.canvas.style.left = "50%";
  this.canvas.style.top = "50%";
  this.canvas.style.transform = "translate(-50%, -50%)";

  this.player.x = this.baseWidth - this.player.width - 20;
  this.player.y = Math.max(
    0,
    Math.min(this.player.y, this.baseHeight - this.player.height)
  );
}

  startBackgroundMusic() {
    if (!this.musicStarted) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.5;
      this.backgroundMusic.play().catch(() => {});
      this.musicStarted = true;
    } else if (this.backgroundMusic.paused && !this.gameOver && !this.isPaused) {
      this.backgroundMusic.play().catch(() => {});
    }
  }

  startSoundPlayback() {
    if (!this.soundsPreloaded) {
      [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
        sound.play().catch(() => {});
        sound.pause();
      });
      this.soundsPreloaded = true;
    }
  }

  enableAudio() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
    this.audioEnabled = true;
  }

  rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  createObstacle(numObstacles = 1) {
    if (this.obstacles.length >= MAX_OBSTACLES) return;

    let created = 0;
    let attempts = 0;

    while (created < numObstacles && attempts < 30 && this.obstacles.length < MAX_OBSTACLES) {
      const type = Math.random() < 0.5 ? "tree" : "rock";
      const image = this.images[type];
      const isSmall = Math.random() < 0.5;

      let width;
      let height;

      if (type === "tree") {
        width = isSmall ? 60 : 100;
        height = isSmall ? 60 : 100;
      } else {
        width = isSmall ? 68 : 86;
        height = isSmall ? 44 : 78;
      }

      let y;

if (Math.random() < 0.3) {
  // 🎯 target player (with slight offset so it's not unfair)
  const offset = (Math.random() - 0.5) * 80;
  y = this.player.y + offset;
} else {
  // 🎲 normal random spawn
  y = Math.random() * (this.baseHeight - height);
}

// clamp inside screen
y = Math.max(0, Math.min(this.baseHeight - height, y));

      const hitbox = type === "tree"
        ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
        : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

      const newObstacle = new GameObject(-width, y, width, height, image, hitbox);

      let overlapsLane = false;
      for (let i = 0; i < this.obstacles.length; i++) {
        const other = this.obstacles[i];
        if (
          newObstacle.y < other.y + other.height + 18 &&
          newObstacle.y + newObstacle.height > other.y - 18 &&
          other.x < 180
        ) {
          overlapsLane = true;
          break;
        }
      }

      if (!overlapsLane) {
        this.obstacles.push(newObstacle);
        created++;
      }

      attempts++;
    }
  }

  createPowerUp() {
    if (this.powerUps.length >= MAX_POWERUPS) return;
    if (Math.random() >= 0.1) return;

    const size = this.isMobilePortrait ? 64 : 50;
    let attempts = 0;

    while (attempts < 20) {
      const y = Math.random() * (this.baseHeight - size);
      const powerUp = new GameObject(
        -size,
        y,
        size,
        size,
        this.images.powerUp,
        { xOffset: 0, yOffset: 0, width: size, height: size }
      );

      let overlaps = false;

      for (let i = 0; i < this.obstacles.length; i++) {
        if (this.rectsOverlap(powerUp.getHitbox(), this.obstacles[i].getHitbox())) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        this.powerUps.push(powerUp);
        return;
      }

      attempts++;
    }
  }

  activateFullSendMode() {
    this.isFullSendMode = true;
    this.fullSendModeTimer = Math.max(0, this.fullSendModeTimer) + 300;
    this.powerUpSound.currentTime = 0;
    this.powerUpSound.play().catch(() => {});
  }

  pauseGame() {
    if (this.gameOver || this.isPaused) return;

    this.isPaused = true;
    this.keys.ArrowUp = false;
    this.keys.ArrowDown = false;
    this.keys.KeyW = false;
    this.keys.KeyS = false;
    this.touchStartY = null;

    try {
      this.backgroundMusic.pause();
    } catch (e) {}
  }

  resumeGame() {
    if (!this.isPaused || this.gameOver) return;

    this.isPaused = false;
    this.lastUpdateTime = performance.now();

    if (this.musicStarted) {
      this.backgroundMusic.play().catch(() => {});
    }
  }

  update(deltaTime) {
    if (this.gameOver || this.isPaused) return;

    const currentTime = performance.now();

   if (currentTime - this.lastSpawnTime > this.spawnInterval) {

  // ===== DIFFICULTY SCALING =====
  const difficulty = 1 + (this.score / 100);

  // ===== MORE OBSTACLES OVER TIME =====
  const maxSpawn = Math.min(4, 1 + Math.floor(this.score / 120));
  const numObstacles = Math.floor(Math.random() * maxSpawn) + 1;

  this.createObstacle(numObstacles);
  this.createPowerUp();
  this.lastSpawnTime = currentTime;

  // ===== SPAWN SPEED (keeps getting faster forever) =====
  this.spawnInterval = Math.max(
    250,
    1200 - (this.score * 6)
  );

  // randomness so it doesn't feel robotic
  this.spawnInterval *= (0.85 + Math.random() * 0.3);

  // ===== OBSTACLE SPEED (NO HARD CAP ANYMORE) =====
  this.obstacleSpeed = 3 + (this.score * 0.02);
}

    if ((this.keys.ArrowUp || this.keys.KeyW) && this.player.y > 0) {
      this.player.y -= this.playerSpeed;
    }

    if ((this.keys.ArrowDown || this.keys.KeyS) && this.player.y < this.baseHeight - this.player.height) {
      this.player.y += this.playerSpeed;
    }

    this.player.y = Math.max(
      0,
      Math.min(this.baseHeight - this.player.height, this.player.y)
    );

    const playerHitbox = this.player.getHitbox();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.x += this.obstacleSpeed;

      if (obstacle.x > this.baseWidth + obstacle.width) {
        this.obstacles.splice(i, 1);
        this.score++;

        if (this.audioEnabled) {
          this.pointSound.currentTime = 0;
          this.pointSound.play().catch(() => {});
        }
        continue;
      }

      if (this.rectsOverlap(playerHitbox, obstacle.getHitbox())) {
        if (this.isFullSendMode) {
          this.explosions.push(
            new GameObject(
              obstacle.x,
              obstacle.y,
              50,
              50,
              this.images.explosion,
              { xOffset: 0, yOffset: 0, width: 50, height: 50 }
            )
          );

          this.explosionSound.currentTime = 0;
          this.explosionSound.play().catch(() => {});
          this.obstacles.splice(i, 1);
          this.score += 2;
        } else {
          this.triggerGameOver();
          return;
        }
      }
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.x += this.obstacleSpeed;

      if (powerUp.x > this.baseWidth + powerUp.width) {
        this.powerUps.splice(i, 1);
        continue;
      }

      if (this.rectsOverlap(playerHitbox, powerUp.getHitbox())) {
        this.powerUps.splice(i, 1);
        this.activateFullSendMode();
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer -= deltaTime / 16.67;
      if (this.explosions[i].timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }

    if (this.isFullSendMode) {
      this.fullSendModeTimer -= deltaTime / 16.67;
      if (this.fullSendModeTimer <= 0) {
        this.isFullSendMode = false;
      }
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.isPaused = false;

    try {
      this.backgroundMusic.pause();
    } catch (e) {}

    this.collisionSound.currentTime = 0;
    this.collisionSound.play().catch(() => {});
  }

validateInitials(name) {
  return /^[A-Z]{2,3}$/.test(name);
}
  
  drawPauseOverlay() {
    this.ctx.fillStyle = "rgba(0,0,0,0.62)";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    this.ctx.fillStyle = "#FFF";
    this.ctx.textAlign = "center";
    this.ctx.font = `700 42px "Permanent Marker", cursive`;
    this.ctx.fillText("Paused", this.baseWidth / 2, this.baseHeight / 2 - 40);

    this.ctx.font = `700 24px "Permanent Marker", cursive`;
    this.ctx.fillText("Click or tap the game to resume", this.baseWidth / 2, this.baseHeight / 2 + 8);

    this.ctx.fillStyle = "#0a70dc";
    this.ctx.fillRect(this.baseWidth / 2 - 95, this.baseHeight / 2 + 34, 190, 52);

    this.ctx.fillStyle = "#FFF";
    this.ctx.font = `700 26px "Permanent Marker", cursive`;
    this.ctx.fillText("Resume", this.baseWidth / 2, this.baseHeight / 2 + 70);
  }

  draw() {
    const dpr = window.devicePixelRatio || 1;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.scale(dpr, dpr);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = this.isFullSendMode ? "#FFEA00" : "#D2B48C";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    this.player.draw(this.ctx);
    for (let i = 0; i < this.obstacles.length; i++) this.obstacles[i].draw(this.ctx);
    for (let i = 0; i < this.powerUps.length; i++) this.powerUps[i].draw(this.ctx);
    for (let i = 0; i < this.explosions.length; i++) this.explosions[i].draw(this.ctx);

    const fontSizeScore = this.isMobilePortrait ? 34 : Math.min(this.baseWidth / 20, this.baseHeight / 20);
    this.ctx.fillStyle = this.isFullSendMode ? "#000" : "#FFF";
    this.ctx.font = `700 ${fontSizeScore}px "Permanent Marker", cursive`;
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score}`, 14, fontSizeScore + 4);

    if (this.isFullSendMode) {
      const fontSize = this.isMobilePortrait ? 34 : Math.min(this.baseWidth / 15, this.baseHeight / 15);
      this.ctx.fillStyle = "#FFF";
      this.ctx.font = `700 ${fontSize}px "Permanent Marker", cursive`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        `FULL SEND MODE! Ends in: ${Math.ceil(this.fullSendModeTimer / 60)}`,
        this.baseWidth / 2,
        this.baseHeight / 2 - fontSize / 2
      );
      this.ctx.fillText(
        "Double points awarded for hits!",
        this.baseWidth / 2,
        this.baseHeight / 2 + fontSize / 2
      );
    }

    if (this.isPaused && !this.gameOver) {
      this.drawPauseOverlay();
    }

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.55)";
      this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
      this.ctx.fillStyle = "#FFF";
      this.ctx.font = `700 40px "Permanent Marker", cursive`;
      this.ctx.textAlign = "center";
      this.ctx.fillText("Game Over!", this.baseWidth / 2, this.baseHeight / 2 - 50);
      this.ctx.fillText(`Final Score: ${this.score}`, this.baseWidth / 2, this.baseHeight / 2);
      this.createPlayAgainButton();
    }

    this.ctx.restore();
  }
 
  createPlayAgainButton() {
    var gameWrap = document.getElementById("game-wrap");
    if (!gameWrap) return;

    var existingButton = gameWrap.querySelector("#playAgainButton");
    if (existingButton) return;

// ===== NAME INPUT =====
var nameInput = document.createElement("input");
nameInput.id = "playerInitials";
nameInput.placeholder = "Enter Initials (2-3 letters)";
nameInput.maxLength = 3;

nameInput.style.cssText =
  "position:absolute; left:50%; bottom:100px; transform:translateX(-50%); padding:14px 16px; font-size:20px; width:260px; text-align:center; text-transform:uppercase; border-radius:8px; border:2px solid #0a70dc; background:#ffffff; color:#000; font-weight:bold; outline:none;";

gameWrap.appendChild(nameInput);
    
    var playAgainButton = document.createElement("button");
    playAgainButton.id = "playAgainButton";
    playAgainButton.textContent = "Play Again";
    playAgainButton.style.cssText =
      "position:absolute; left:50%; bottom:20px; transform:translateX(-50%); z-index:50; padding:12px 22px; font-size:16px; cursor:pointer; border:none; border-radius:6px; background-color:#4CAF50; color:#FFF; box-shadow:0 4px 12px rgba(0,0,0,0.35);";

    gameWrap.appendChild(playAgainButton);

playAgainButton.addEventListener("click", async () => {

  const input = document.getElementById("playerInitials");
  let name = input ? input.value.toUpperCase().trim() : "";

  if (!this.validateInitials(name)) {
    alert("Enter 2-3 letters only (A-Z)");
    return;
  }

  try {
await fetch("https://script.google.com/macros/s/AKfycbz8hdcKBk_ut0IdQPhGPt8IfPcgIvoyUNwOXVEsRL8QulPALVEsSDnofNBt47AxGcB2/exec", {
  method: "POST",
  mode: "no-cors",
  body: JSON.stringify({
    name: name,
    score: this.score
  })
});
  } catch (e) {
    console.warn("Score submit failed", e);
  }

  if (input) input.remove();

  playAgainButton.disabled = true;
  this.resetGame();
});
  }

  resetGame() {
    this.loopToken++;

    this.running = false;
    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
      this.gameLoopRequestId = null;
    }

    var oldButton = document.getElementById("playAgainButton");
    if (oldButton) oldButton.remove();

    this.resetCoreState();

    this.player = new GameObject(
      0,
      (this.baseHeight - (this.isMobilePortrait ? 48 : 40)) / 2,
      this.isMobilePortrait ? 120 : 100,
      this.isMobilePortrait ? 48 : 40,
      this.images.player,
      this.isMobilePortrait
        ? { xOffset: 8, yOffset: 12, width: 98, height: 28 }
        : { xOffset: 5, yOffset: 10, width: 85, height: 25 }
    );

    try {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
    } catch (e) {}

    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch (e) {}
    });

    this.resizeCanvas();
    this.draw();

    this.running = true;
    this.startGameLoop();
  }

  startGameLoop() {
    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
      this.gameLoopRequestId = null;
    }

    this.loopToken++;
    const myLoopToken = this.loopToken;

    const gameLoop = (timestamp) => {
      if (myLoopToken !== this.loopToken) return;

      if (!this.running) {
        this.gameLoopRequestId = null;
        return;
      }

      if (!this.lastUpdateTime) {
        this.lastUpdateTime = timestamp;
      }

      const deltaTime = timestamp - this.lastUpdateTime;

      if (deltaTime >= FPS_INTERVAL) {
        this.lastUpdateTime = timestamp;

        if (!this.gameOver && !this.isPaused) {
          this.update(deltaTime);
        }

        this.draw();
      }

      this.gameLoopRequestId = requestAnimationFrame(gameLoop);
    };

    this.gameLoopRequestId = requestAnimationFrame(gameLoop);
  }

  destroy() {
    this.loopToken++;
    this.running = false;

    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
      this.gameLoopRequestId = null;
    }

    var oldButton = document.getElementById("playAgainButton");
    if (oldButton) oldButton.remove();

    try {
      window.removeEventListener("resize", this._onResize);
      document.removeEventListener("keydown", this._onKeyDown);
      document.removeEventListener("keyup", this._onKeyUp);
      document.removeEventListener("pointerdown", this._onPointerDown, true);
      document.removeEventListener("visibilitychange", this._onVisibilityChange);

      if (this.canvas) {
        this.canvas.removeEventListener("pointerdown", this._onCanvasPointerDown);
        this.canvas.removeEventListener("touchstart", this._onTouchStart);
        this.canvas.removeEventListener("touchmove", this._onTouchMove);
        this.canvas.removeEventListener("touchend", this._onTouchEnd);
      }
    } catch (e) {}

    try {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.musicStarted = false;
    } catch (e) {}

    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch (e) {}
    });

    try {
      if (this.audioContext && this.audioContext.state !== "closed") {
        this.audioContext.close();
      }
    } catch (e) {}
  }
}

window.__floatuckyGameInstance = null;

window.initializeGame = function () {
  if (window.__floatuckyGameInstance) {
    try {
      window.__floatuckyGameInstance.destroy();
    } catch (e) {}
    window.__floatuckyGameInstance = null;
  }

  window.__floatuckyGameInstance = new Game("gameCanvas");
};

window.destroyGame = function () {
  if (!window.__floatuckyGameInstance) return;
  window.__floatuckyGameInstance.destroy();
  window.__floatuckyGameInstance = null;
};

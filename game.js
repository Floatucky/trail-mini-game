class GameObject {
  constructor(x, y, width, height, image, hitbox) {
    // Coordinates and sizes are in the game’s base coordinate system.
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
    this.hitbox = hitbox;
    this.timer = 30; // Default timer for explosions
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  getHitbox() {
    return {
      x: this.x + this.hitbox.xOffset,
      y: this.y + this.hitbox.yOffset,
      width: this.hitbox.width,
      height: this.hitbox.height,
    };
  }
}

class Game {
  constructor(canvasId) {
    // Define a base resolution for the game world.
    this.baseWidth = 1200;
    this.baseHeight = 900;

    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error("Canvas not found:", canvasId);
      return;
    }
    this.ctx = this.canvas.getContext("2d");

    // For high-DPI displays.
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Load sounds.
    this.backgroundMusic = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
    this.collisionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-end.mp3");
    this.pointSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/point-beep.mp3");
    this.powerUpSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/powerup-recieved.mp3");
    this.explosionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/explosion.mp3");

    // Load images.
    this.images = {
      player: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png"),
      tree: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png"),
      rock: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png"),
      powerUp: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Chicken-Bucket.png"),
      explosion: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Explosion.png"),
    };

    // Game state (all coordinates and sizes are in base coordinates).
    this.obstacles = [];
    this.powerUps = [];
    this.explosions = [];
    this.score = 0;
    this.gameOver = false;
    this.isFullSendMode = false;
    this.fullSendModeTimer = 0;
    this.spawnInterval = 1500;
    this.obstacleSpeed = 3;
    this.lastSpawnTime = 0;
    this.lastUpdateTime = 0;

    this.keys = {
      ArrowUp: false, ArrowDown: false,
      ArrowLeft: false, ArrowRight: false,
      Space: false, KeyW: false, KeyA: false, KeyS: false, KeyD: false
    };
    this.touchStartY = null;
    this.musicStarted = false;
    this.audioEnabled = false;

    // For controlling the game loop.
    this.running = true;
    this.gameLoopRequestId = null;

    // Initialize the player in the base coordinate system.
    // (The numbers below assume the base resolution; they will later be scaled.)
    this.player = new GameObject(
      0, // Temporary X; will be adjusted in resizeCanvas.
      0, // Temporary Y; will be adjusted in resizeCanvas.
      100,
      40,
      this.images.player,
      { xOffset: 5, yOffset: 10, width: 85, height: 25 }
    );

    // Set up the canvas to fill the viewport and compute our scale/offset.
    this.resizeCanvas();
    window.addEventListener("resize", this.resizeCanvas.bind(this));
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
    document.addEventListener("keyup", this.handleKeyUp.bind(this));
    this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
    document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
    document.addEventListener("popupclose", this.handlePopupClose.bind(this));

    console.log("Game initialized.");
    this.startGameLoop();
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  // --- RESIZING & SCALING ---
  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // Set the canvas to fill the entire viewport.
    this.canvas.width = cw * dpr;
    this.canvas.height = ch * dpr;
    this.canvas.style.width = cw + "px";
    this.canvas.style.height = ch + "px";

    // Compute a uniform scale so that the entire game (base resolution) fits inside the viewport.
    // Using Math.min prevents any scrolling.
    this.scale = Math.min(cw / this.baseWidth, ch / this.baseHeight);
    // Compute offsets to center the game within the viewport.
    this.xOffset = (cw - this.baseWidth * this.scale) / 2;
    this.yOffset = (ch - this.baseHeight * this.scale) / 2;

    // Reposition the player in base coordinates.
    this.player.x = this.baseWidth - this.player.width - Math.max(20, this.baseWidth * 0.02);
    this.player.y = Math.min(this.player.y, this.baseHeight - this.player.height);

    console.log("Canvas resized. Base resolution:", this.baseWidth, this.baseHeight,
      "Scale:", this.scale, "Offsets:", this.xOffset, this.yOffset);
  }

  // --- INPUT HANDLERS ---
  handleKeyDown(e) {
    if (e.key in this.keys) {
      this.keys[e.key] = true;
      this.startBackgroundMusic();
      this.startSoundPlayback();
      if (!this.audioEnabled) this.enableAudio();
      console.log("Key down:", e.key);
    }
  }

  handleKeyUp(e) {
    if (e.key in this.keys) {
      this.keys[e.key] = false;
      console.log("Key up:", e.key);
    }
  }

  handleTouchStart(e) {
    e.preventDefault(); // Prevent scrolling
    this.touchStartY = e.touches[0].clientY;
    this.startBackgroundMusic();
    this.startSoundPlayback();
    if (!this.audioEnabled) this.enableAudio();
    console.log("Touch start at Y:", this.touchStartY);
  }

  handleTouchMove(e) {
    e.preventDefault();
    const currentTouchY = e.touches[0].clientY;
    if (this.touchStartY !== null) {
      // Convert swipe distance from CSS pixels into base coordinate units.
      const swipeDistance = currentTouchY - this.touchStartY;
      const moveDistance = (swipeDistance * 0.6) / this.scale;
      // Clamp the new player.y between 0 and the base height.
      this.player.y = Math.max(0, Math.min(this.baseHeight - this.player.height, this.player.y + moveDistance));
      this.touchStartY = currentTouchY;
      console.log("Touch move. New player Y:", this.player.y);
    }
  }

  handleTouchEnd() {
    console.log("Touch end.");
    this.touchStartY = null;
  }

  handleVisibilityChange() {
    if (document.hidden && this.musicStarted) {
      this.backgroundMusic.pause();
      console.log("Game hidden. Background music paused.");
    } else if (!document.hidden && this.musicStarted) {
      this.backgroundMusic.play();
      console.log("Game visible. Background music resumed.");
    }
  }

  handlePopupClose() {
    // Stop all audio playback.
    if (this.musicStarted) {
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.musicStarted = false;
    }
    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    console.log("Popup closed. All sounds stopped.");

    // Stop the game loop.
    this.running = false;
    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
    }
  }

  // --- AUDIO INITIALIZATION ---
  startBackgroundMusic() {
    if (!this.musicStarted) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.5;
      this.audioContext.resume().then(() => {
        this.backgroundMusic.play().catch(error => console.error("Background music error:", error));
        this.musicStarted = true;
        console.log("Background music started.");
      });
    }
  }

  startSoundPlayback() {
    if (!this.soundsPreloaded) {
      [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
        sound.play().catch(() => {});
        sound.pause();
      });
      this.soundsPreloaded = true;
      console.log("Sounds preloaded.");
    }
  }

  enableAudio() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach(sound => {
      sound.play().catch(() => {});
      sound.pause();
    });
    this.audioEnabled = true;
    console.log("Audio enabled and preloaded.");
  }

  // --- GAME OBJECT CREATION ---
  createObstacle(numObstacles = 1, targetY = null) {
    if (this.obstacles.length >= 50) {
      console.warn("Maximum obstacle count reached. Skipping generation.");
      return;
    }

    const generatedObstacles = [];
    let attempts = 0;
    const gridSize = 100;
    const grid = {};

    // Build a spatial grid from existing obstacles.
    this.obstacles.forEach(obstacle => {
      const gridX = Math.floor(obstacle.x / gridSize);
      const gridY = Math.floor(obstacle.y / gridSize);
      const key = `${gridX},${gridY}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(obstacle);
    });

    while (generatedObstacles.length < numObstacles && attempts < 50) {
      const type = Math.random() < 0.5 ? "tree" : "rock";
      const image = this.images[type];
      const isSmall = Math.random() < 0.5;
      // Define sizes in base coordinates.
      const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
      const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
      const y = targetY !== null
        ? Math.min(Math.max(targetY - height / 2, 0), this.baseHeight - height)
        : Math.random() * (this.baseHeight - height);

      const hitbox = type === "tree"
        ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
        : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

      const newObstacle = new GameObject(-width, y, width, height, image, hitbox);

      const gridX = Math.floor(newObstacle.x / gridSize);
      const gridY = Math.floor(newObstacle.y / gridSize);
      const keysToCheck = [
        `${gridX},${gridY}`,
        `${gridX - 1},${gridY}`,
        `${gridX + 1},${gridY}`,
        `${gridX},${gridY - 1}`,
        `${gridX},${gridY + 1}`,
      ];

      const isOverlapping = keysToCheck.some(key => {
        return grid[key] && grid[key].some(obstacle =>
          newObstacle.y < obstacle.y + obstacle.height &&
          newObstacle.y + newObstacle.height > obstacle.y
        );
      });

      if (!isOverlapping) {
        generatedObstacles.push(newObstacle);
        const newKey = `${gridX},${gridY}`;
        if (!grid[newKey]) grid[newKey] = [];
        grid[newKey].push(newObstacle);
      }
      attempts++;
    }
    this.obstacles.push(...generatedObstacles);
  }

  createPowerUp() {
    if (Math.random() < 0.1) {
      const size = 50;
      let y;
      let isOverlapping;
      do {
        y = Math.random() * (this.baseHeight - size);
        isOverlapping = this.obstacles.some(obstacle =>
          y < obstacle.y + obstacle.height && y + size > obstacle.y
        );
      } while (isOverlapping);

      this.powerUps.push(new GameObject(-size, y, size, size, this.images.powerUp, { xOffset: 0, yOffset: 0, width: size, height: size }));
      console.log("Power-up created at Y:", y);
    }
  }

  activateFullSendMode() {
    if (!this.isFullSendMode) {
      this.isFullSendMode = true;
      this.fullSendModeTimer = 300;
      this.powerUpSound.play().catch(error => console.error("Power-up sound error:", error));
      console.log("Full send mode activated.");
    } else {
      console.log("Full send mode already active. Skipping reactivation.");
    }
  }

  // --- GAME UPDATE LOGIC ---
  update(deltaTime) {
    const currentTime = performance.now();
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      const numObstacles = Math.random() < 0.5 ? 1 : 2;
      this.createObstacle(numObstacles);
      this.createPowerUp();
      this.lastSpawnTime = currentTime;
      if (this.spawnInterval > 500) {
        this.spawnInterval -= 10;
      }
    }

    // Build a spatial grid for collision detection.
    const gridSize = 100;
    const grid = {};
    this.obstacles.forEach(obstacle => {
      const gridX = Math.floor(obstacle.x / gridSize);
      const gridY = Math.floor(obstacle.y / gridSize);
      const key = `${gridX},${gridY}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(obstacle);
    });

    // Move obstacles and handle collisions.
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x += this.obstacleSpeed;
      if (obstacle.x > this.baseWidth) {
        this.obstacles.splice(index, 1);
        this.score++;
        if (this.audioEnabled) {
          this.pointSound.currentTime = 0;
          this.pointSound.play().catch(() => {});
        }
      }

      const playerHitbox = this.player.getHitbox();
      const gridX = Math.floor(obstacle.x / gridSize);
      const gridY = Math.floor(obstacle.y / gridSize);
      const keysToCheck = [
        `${gridX},${gridY}`,
        `${gridX - 1},${gridY}`,
        `${gridX + 1},${gridY}`,
        `${gridX},${gridY - 1}`,
        `${gridX},${gridY + 1}`,
      ];

      const collisionDetected = keysToCheck.some(key =>
        grid[key] && grid[key].some(otherObstacle => {
          const obstacleHitbox = otherObstacle.getHitbox();
          return (
            playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
            playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
            playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
            playerHitbox.y + playerHitbox.height > obstacleHitbox.y
          );
        })
      );

      if (collisionDetected) {
        if (this.isFullSendMode) {
          this.explosions.push(
            new GameObject(obstacle.x, obstacle.y, 50, 50, this.images.explosion, { xOffset: 0, yOffset: 0, width: 50, height: 50 })
          );
          this.explosionSound.currentTime = 0;
          this.explosionSound.play().catch(() => {});
          this.obstacles.splice(index, 1);
          this.score += 2; // Double points in full-send mode.
        } else {
          this.collisionSound.currentTime = 0;
          this.collisionSound.play().catch(() => {});
          this.gameOver = true;
        }
      }
    });

    // Move power-ups.
    this.powerUps.forEach((powerUp, index) => {
      powerUp.x += this.obstacleSpeed;
      if (powerUp.x > this.baseWidth) {
        this.powerUps.splice(index, 1);
      }

      const playerHitbox = this.player.getHitbox();
      const powerUpHitbox = powerUp.getHitbox();
      if (
        playerHitbox.x < powerUpHitbox.x + powerUpHitbox.width &&
        playerHitbox.x + playerHitbox.width > powerUpHitbox.x &&
        playerHitbox.y < powerUpHitbox.y + powerUpHitbox.height &&
        playerHitbox.y + playerHitbox.height > powerUpHitbox.y
      ) {
        this.powerUps.splice(index, 1);
        this.activateFullSendMode();
      }
    });

    // Update explosions (remove when their timer expires).
    this.explosions.forEach((explosion, index) => {
      explosion.timer -= deltaTime / 16.67;
      if (explosion.timer <= 0) {
        this.explosions.splice(index, 1);
      }
    });

    // Handle player movement via keyboard.
    if ((this.keys.ArrowUp || this.keys.KeyW) && this.player.y > 0) {
      this.player.y -= 5;
    }
    if ((this.keys.ArrowDown || this.keys.KeyS) && this.player.y < this.baseHeight - this.player.height) {
      this.player.y += 5;
    }

    // Update full-send mode timer.
    if (this.isFullSendMode) {
      this.fullSendModeTimer -= deltaTime / 16.67;
      if (this.fullSendModeTimer <= 0) {
        this.isFullSendMode = false;
      }
    }
  }

  // --- DRAWING ---
  draw() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    // First, scale the drawing to account for high-DPI.
    this.ctx.scale(dpr, dpr);
    // Translate and scale to transform the base game coordinates to fit inside the canvas.
    this.ctx.translate(this.xOffset, this.yOffset);
    this.ctx.scale(this.scale, this.scale);

    // Draw the background over the entire base coordinate area.
    this.ctx.fillStyle = this.isFullSendMode ? "#FFEA00" : "#D2B48C";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Draw the game objects.
    this.player.draw(this.ctx);
    this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
    this.explosions.forEach(explosion => explosion.draw(this.ctx));

    // Draw the score.
    const fontSizeScore = Math.min(this.baseWidth / 20, this.baseHeight / 20);
    this.ctx.fillStyle = this.isFullSendMode ? "#000" : "#FFF";
    this.ctx.font = `${fontSizeScore}px Arial`;
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score}`, 10, fontSizeScore);

    // If full-send mode is active, display the timer and a double–points indicator.
    if (this.isFullSendMode) {
      this.ctx.fillStyle = "#FFF";
      const fontSize = Math.min(this.baseWidth / 15, this.baseHeight / 15);
      this.ctx.font = `${fontSize}px Arial`;
      this.ctx.textAlign = "center";
      const timerText = `FULL SEND MODE! Ends in: ${Math.ceil(this.fullSendModeTimer / 60)}`;
      this.ctx.fillText(timerText, this.baseWidth / 2, this.baseHeight / 2 - fontSize / 2);
      const indicatorText = "Double points awarded for hits!";
      this.ctx.fillText(indicatorText, this.baseWidth / 2, this.baseHeight / 2 + fontSize / 2);
    }

    // Draw game over overlay, if needed.
    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
      this.ctx.fillStyle = "#FFF";
      this.ctx.font = "40px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Game Over!", this.baseWidth / 2, this.baseHeight / 2 - 50);
      this.ctx.fillText(`Final Score: ${this.score}`, this.baseWidth / 2, this.baseHeight / 2);
      // (Your play-again button code remains as before.)
    }

    this.ctx.restore();
  }

  // --- RESET & GAME LOOP ---
  resetGame() {
    this.gameOver = false;
    this.score = 0;
    this.obstacles = [];
    this.powerUps = [];
    this.explosions = [];
    this.obstacleSpeed = 3;
    this.spawnInterval = 1500;

    this.resizeCanvas();
    this.lastSpawnTime = performance.now();
    this.musicStarted = false;
    this.running = true;
    this.startBackgroundMusic();
    this.startGameLoop();
  }

  startGameLoop() {
    const gameLoop = (timestamp) => {
      if (!this.running) return;
      const deltaTime = timestamp - this.lastUpdateTime;
      if (deltaTime >= (1000 / 60)) {
        this.lastUpdateTime = timestamp;
        if (!this.gameOver) {
          this.update(deltaTime);
          this.draw();
        } else {
          this.backgroundMusic.pause();
        }
      }
      this.gameLoopRequestId = requestAnimationFrame(gameLoop);
    };
    this.gameLoopRequestId = requestAnimationFrame(gameLoop);
  }
}

// Do not auto–initialize the game.
// Instead, expose a global function (for example, triggered by a button click) to start the game.
window.initializeGame = function () {
  new Game("gameCanvas");
};

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
    if (this.image && this.image.complete) {
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
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = true;
        this.startBackgroundMusic();
      }
    };

    this._onKeyUp = (e) => {
      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = false;
      }
    };

    window.addEventListener("resize", this._onResize);
    document.addEventListener("keydown", this._onKeyDown);
    document.addEventListener("keyup", this._onKeyUp);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const scaleX = (window.innerWidth * 0.95) / this.baseWidth;
    const scaleY = (window.innerHeight * 0.9) / this.baseHeight;

    this.scale = Math.min(scaleX, scaleY);

    const cw = this.baseWidth * this.scale;
    const ch = this.baseHeight * this.scale;

    this.canvas.width = cw * dpr;
    this.canvas.height = ch * dpr;
    this.canvas.style.width = cw + "px";
    this.canvas.style.height = ch + "px";

    this.player.x = this.baseWidth - this.player.width - 20;
    this.player.y = this.baseHeight / 2;
  }

  startBackgroundMusic() {
    if (!this.musicStarted) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume = 0.5;
      this.backgroundMusic.play().catch(() => {});
      this.musicStarted = true;
    }
  }

  rectsOverlap(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  createObstacle() {
    if (this.obstacles.length >= MAX_OBSTACLES) return;

    const width = 80;
    const height = 80;
    const y = Math.random() * (this.baseHeight - height);

    this.obstacles.push(
      new GameObject(-width, y, width, height, this.images.tree, {
        xOffset: 20,
        yOffset: 10,
        width: 40,
        height: 60
      })
    );
  }

  update(deltaTime) {
    const now = performance.now();

    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.createObstacle();
      this.lastSpawnTime = now;

      if (this.spawnInterval > MIN_SPAWN_INTERVAL) {
        this.spawnInterval -= 10;
      }
    }

    if (this.keys.ArrowUp) this.player.y -= this.playerSpeed;
    if (this.keys.ArrowDown) this.player.y += this.playerSpeed;

    const playerHitbox = this.player.getHitbox();

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x += this.obstacleSpeed;

      if (o.x > this.baseWidth) {
        this.obstacles.splice(i, 1);
        this.score++;
        continue;
      }

      if (this.rectsOverlap(playerHitbox, o.getHitbox())) {
        this.gameOver = true;
        return;
      }
    }
  }

  draw() {
    const dpr = window.devicePixelRatio || 1;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.scale(dpr, dpr);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = "#D2B48C";
    this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    this.player.draw(this.ctx);

    this.obstacles.forEach(o => o.draw(this.ctx));

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "30px Arial";
    this.ctx.fillText("Score: " + this.score, 10, 40);

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.5)";
      this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

      this.ctx.fillStyle = "#fff";
      this.ctx.fillText("Game Over", this.baseWidth / 2 - 80, this.baseHeight / 2);

      this.createPlayAgainButton();
    }
  }

  createPlayAgainButton() {
    if (document.getElementById("playAgainButton")) return;

    const btn = document.createElement("button");
    btn.id = "playAgainButton";
    btn.textContent = "Play Again";

    btn.style.position = "absolute";
    btn.style.bottom = "20px";
    btn.style.left = "50%";
    btn.style.transform = "translateX(-50%)";

    document.body.appendChild(btn);

    btn.onclick = () => this.resetGame();
  }

  resetGame() {
    this.loopToken++;
    this.running = false;

    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
    }

    const btn = document.getElementById("playAgainButton");
    if (btn) btn.remove();

    this.resetCoreState();

    this.player.y = this.baseHeight / 2;

    this.running = true;
    this.startGameLoop();
  }

  startGameLoop() {
    const token = ++this.loopToken;

    const loop = (t) => {
      if (token !== this.loopToken) return;
      if (!this.running) return;

      if (!this.lastUpdateTime) this.lastUpdateTime = t;

      const dt = t - this.lastUpdateTime;

      if (dt >= FPS_INTERVAL) {
        this.lastUpdateTime = t;
        this.update(dt);
        this.draw();
      }

      this.gameLoopRequestId = requestAnimationFrame(loop);
    };

    this.gameLoopRequestId = requestAnimationFrame(loop);
  }

  destroy() {
    this.loopToken++;
    this.running = false;

    if (this.gameLoopRequestId) {
      cancelAnimationFrame(this.gameLoopRequestId);
    }

    const btn = document.getElementById("playAgainButton");
    if (btn) btn.remove();

    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
  }
}

window.__floatuckyGameInstance = null;

window.initializeGame = function () {
  if (window.__floatuckyGameInstance) return;
  window.__floatuckyGameInstance = new Game("gameCanvas");
};

window.destroyGame = function () {
  if (!window.__floatuckyGameInstance) return;
  window.__floatuckyGameInstance.destroy();
  window.__floatuckyGameInstance = null;
};

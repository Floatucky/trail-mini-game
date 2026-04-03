const FPS_INTERVAL = 1000 / 60;
const MAX_OBSTACLES = 40;
const MIN_SPAWN_INTERVAL = 500;

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
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
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
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");

    this.baseWidth = 1200;
    this.baseHeight = 900;

    this.scale = 1;
    this.running = true;
    this.loopId = null;

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    this.backgroundMusic = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
    this.collisionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-end.mp3");
    this.pointSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/point-beep.mp3");
    this.powerUpSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/powerup-recieved.mp3");

    this.images = {
      player: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png"),
      tree: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png"),
      rock: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png"),
    };

    this.resetState();
    this.resizeCanvas();
    this.bindEvents();
    this.start();
  }

  resetState() {
    this.obstacles = [];
    this.score = 0;
    this.gameOver = false;

    this.spawnInterval = 1350;
    this.obstacleSpeed = 3;

    this.lastSpawnTime = performance.now();
    this.lastUpdateTime = 0;

    this.player = new GameObject(
      this.baseWidth - 120,
      this.baseHeight / 2,
      100,
      40,
      this.images.player,
      { xOffset: 5, yOffset: 10, width: 85, height: 25 }
    );

    this.keys = {
      ArrowUp: false,
      ArrowDown: false
    };
  }

  loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();

      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = true;
        this.backgroundMusic.play().catch(()=>{});
      }
    };

    this.keyUp = (e) => {
      if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();

      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = false;
      }
    };

    document.addEventListener("keydown", this.keyDown);
    document.addEventListener("keyup", this.keyUp);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const maxW = window.innerWidth * 0.95;
    const maxH = window.innerHeight * 0.85;

    const scale = Math.min(maxW / this.baseWidth, maxH / this.baseHeight);

    const cw = this.baseWidth * scale;
    const ch = this.baseHeight * scale;

    this.canvas.width = cw * dpr;
    this.canvas.height = ch * dpr;

    this.canvas.style.width = cw + "px";
    this.canvas.style.height = ch + "px";

    this.scale = scale;
  }

  createObstacle() {
    if (this.obstacles.length >= MAX_OBSTACLES) return;

    const type = Math.random() < 0.5 ? "tree" : "rock";
    const width = type === "tree" ? 100 : 80;
    const height = type === "tree" ? 100 : 75;

    const y = Math.random() * (this.baseHeight - height);

    const hitbox = type === "tree"
      ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
      : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

    this.obstacles.push(
      new GameObject(-width, y, width, height, this.images[type], hitbox)
    );
  }

  update(delta) {
    if (this.gameOver) return;

    const now = performance.now();

    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.createObstacle();
      this.lastSpawnTime = now;

      if (this.spawnInterval > MIN_SPAWN_INTERVAL) {
        this.spawnInterval -= 10;
      }
    }

    if (this.keys.ArrowUp) this.player.y -= 10;
    if (this.keys.ArrowDown) this.player.y += 10;

    // clamp player
    this.player.y = Math.max(0, Math.min(this.baseHeight - this.player.height, this.player.y));

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.x += this.obstacleSpeed;

      if (o.x > this.baseWidth) {
        this.obstacles.splice(i, 1);
        this.score++;
        this.pointSound.play().catch(()=>{});
        continue;
      }

      const p = this.player.getHitbox();
      const h = o.getHitbox();

      if (
        p.x < h.x + h.width &&
        p.x + p.width > h.x &&
        p.y < h.y + h.height &&
        p.y + p.height > h.y
      ) {
        this.triggerGameOver();
        return;
      }
    }
  }

  triggerGameOver() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.backgroundMusic.pause();

    this.collisionSound.currentTime = 0;
    this.collisionSound.play().catch(()=>{});
  }

  draw() {
    const dpr = window.devicePixelRatio || 1;

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    this.ctx.scale(dpr, dpr);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = "#D2B48C";
    this.ctx.fillRect(0,0,this.baseWidth,this.baseHeight);

    this.player.draw(this.ctx);
    this.obstacles.forEach(o => o.draw(this.ctx));

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "30px Arial";
    this.ctx.fillText("Score: " + this.score, 10, 40);

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.6)";
      this.ctx.fillRect(0,0,this.baseWidth,this.baseHeight);

      this.ctx.fillStyle = "#fff";
      this.ctx.fillText("Game Over", this.baseWidth/2 - 80, this.baseHeight/2);

      this.drawRestart();
    }
  }

  drawRestart() {
    if (document.getElementById("restartBtn")) return;

    const btn = document.createElement("button");
    btn.id = "restartBtn";
    btn.innerText = "Play Again";

    btn.style.position = "absolute";
    btn.style.bottom = "20px";
    btn.style.left = "50%";
    btn.style.transform = "translateX(-50%)";

    document.body.appendChild(btn);

    btn.onclick = () => {
      btn.remove();
      this.resetState();
    };
  }

  loop = (t) => {
    if (!this.running) return;

    if (!this.lastUpdateTime) this.lastUpdateTime = t;

    const delta = t - this.lastUpdateTime;

    if (delta >= FPS_INTERVAL) {
      this.lastUpdateTime = t;
      this.update(delta);
      this.draw();
    }

    this.loopId = requestAnimationFrame(this.loop);
  };

  start() {
    this.loopId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.loopId);

    document.removeEventListener("keydown", this.keyDown);
    document.removeEventListener("keyup", this.keyUp);

    this.backgroundMusic.pause();
  }
}

window.__floatuckyGameInstance = null;

window.initializeGame = function () {
  if (!window.__floatuckyGameInstance) {
    window.__floatuckyGameInstance = new Game("gameCanvas");
  }
};

window.destroyGame = function () {
  if (window.__floatuckyGameInstance) {
    window.__floatuckyGameInstance.destroy();
    window.__floatuckyGameInstance = null;
  }
};

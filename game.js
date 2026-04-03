const FPS_INTERVAL = 1000 / 60;

class Game {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext("2d");

    this.baseWidth = 1200;
    this.baseHeight = 900;

    this.running = true;
    this.loopId = null;

    this.player = {
      x: 1000,
      y: 400,
      width: 100,
      height: 40
    };

    this.keys = {
      ArrowUp: false,
      ArrowDown: false
    };

    this.obstacles = [];
    this.score = 0;
    this.gameOver = false;

    this.music = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
    this.music.loop = true;

    this.resizeCanvas();
    this.bindEvents();
    this.start();
  }

  bindEvents() {
    this.keyDown = (e) => {
      if (["ArrowUp","ArrowDown"].includes(e.key)) e.preventDefault();

      if (this.keys.hasOwnProperty(e.key)) {
        this.keys[e.key] = true;
        this.music.play().catch(()=>{});
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

    const w = window.innerWidth * 0.9;
    const h = window.innerHeight * 0.75;

    const scale = Math.min(w / this.baseWidth, h / this.baseHeight);

    const cw = this.baseWidth * scale;
    const ch = this.baseHeight * scale;

    this.canvas.width = cw * dpr;
    this.canvas.height = ch * dpr;

    this.canvas.style.width = cw + "px";
    this.canvas.style.height = ch + "px";

    this.scale = scale;
  }

  spawnObstacle() {
    this.obstacles.push({
      x: -100,
      y: Math.random() * (this.baseHeight - 80),
      width: 80,
      height: 80
    });
  }

  update() {
    if (this.keys.ArrowUp) this.player.y -= 10;
    if (this.keys.ArrowDown) this.player.y += 10;

    // clamp
    this.player.y = Math.max(0, Math.min(this.baseHeight - this.player.height, this.player.y));

    this.obstacles.forEach(o => o.x += 5);

    this.obstacles = this.obstacles.filter(o => {
      if (o.x > this.baseWidth) {
        this.score++;
        return false;
      }

      if (
        this.player.x < o.x + o.width &&
        this.player.x + this.player.width > o.x &&
        this.player.y < o.y + o.height &&
        this.player.y + this.player.height > o.y
      ) {
        this.gameOver = true;
      }

      return true;
    });

    if (Math.random() < 0.02) this.spawnObstacle();
  }

  draw() {
    const dpr = window.devicePixelRatio || 1;

    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

    this.ctx.scale(dpr, dpr);
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = "#D2B48C";
    this.ctx.fillRect(0,0,this.baseWidth,this.baseHeight);

    this.ctx.fillStyle = "blue";
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    this.ctx.fillStyle = "green";
    this.obstacles.forEach(o => {
      this.ctx.fillRect(o.x,o.y,o.width,o.height);
    });

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "30px Arial";
    this.ctx.fillText("Score: " + this.score, 20, 40);

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.5)";
      this.ctx.fillRect(0,0,this.baseWidth,this.baseHeight);

      this.ctx.fillStyle = "#fff";
      this.ctx.fillText("Game Over", this.baseWidth/2 - 80, this.baseHeight/2);

      this.showRestart();
    }
  }

  showRestart() {
    if (document.getElementById("restartBtn")) return;

    const btn = document.createElement("button");
    btn.id = "restartBtn";
    btn.innerText = "Play Again";

    btn.style.position = "absolute";
    btn.style.bottom = "20px";
    btn.style.left = "50%";
    btn.style.transform = "translateX(-50%)";

    document.body.appendChild(btn);

    btn.onclick = () => location.reload();
  }

  loop = (t) => {
    if (!this.running) return;

    if (!this.last) this.last = t;

    const dt = t - this.last;

    if (dt >= FPS_INTERVAL) {
      this.last = t;

      if (!this.gameOver) this.update();
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

    this.music.pause();
    this.music.currentTime = 0;
  }
}

window.gameInstance = null;

window.initializeGame = function () {
  if (!window.gameInstance) {
    window.gameInstance = new Game("gameCanvas");
  }
};

window.destroyGame = function () {
  if (window.gameInstance) {
    window.gameInstance.destroy();
    window.gameInstance = null;
  }
};

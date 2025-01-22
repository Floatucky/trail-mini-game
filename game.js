// Updated Game Code with Improvements
class GameObject {
    constructor(x, y, width, height, image, hitbox) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.hitbox = hitbox;
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
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
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
            explosion: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Explosion.png"),
        };

        this.player = new GameObject(
            this.canvas.width - 150,
            this.canvas.height / 2 - 20,
            100,
            40,
            this.images.player,
            { xOffset: 5, yOffset: 10, width: 85, height: 25 }
        );

        this.obstacles = [];
        this.powerUps = [];
        this.explosions = [];

        this.score = 0;
        this.gameOver = false;
        this.isFullSendMode = false;
        this.fullSendModeTimer = 0;
        this.spawnInterval = 1500;
        this.obstacleSpeed = 3;
        this.keys = { ArrowUp: false, ArrowDown: false };
        this.touchStartY = null;

        this.musicStarted = false;
        this.audioEnabled = false;

        this.lastSpawnTime = 0;
        this.lastUpdateTime = 0;

        this.resizeCanvas();
        window.addEventListener("resize", this.resizeCanvas.bind(this));
        document.addEventListener("keydown", this.handleKeyDown.bind(this));
        document.addEventListener("keyup", this.handleKeyUp.bind(this));
        this.canvas.addEventListener("touchstart", this.handleTouchStart.bind(this));
        this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this));
        this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));

        this.startGameLoop();
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }

    resizeCanvas() {
        const maxWidth = 800;
        const maxHeight = 600;
        this.canvas.width = Math.min(window.innerWidth * 0.9, maxWidth);
        this.canvas.height = Math.min(window.innerHeight * 0.7, maxHeight);

        this.player.x = Math.min(this.player.x, this.canvas.width - this.player.width);
        this.player.y = Math.min(this.player.y, this.canvas.height - this.player.height);
    }

    handleKeyDown(e) {
        if (e.key in this.keys) {
            this.keys[e.key] = true;
            this.startBackgroundMusic();
            if (!this.audioEnabled) this.enableAudio();
        }
    }

    handleKeyUp(e) {
        if (e.key in this.keys) this.keys[e.key] = false;
    }

    handleTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
        this.startBackgroundMusic();
        if (!this.audioEnabled) this.enableAudio();
    }

    handleTouchMove(e) {
        const currentTouchY = e.touches[0].clientY;
        if (this.touchStartY !== null) {
            const swipeDistance = currentTouchY - this.touchStartY;
            const moveDistance = swipeDistance * 0.6;
            this.player.y = Math.max(
                0,
                Math.min(this.canvas.height - this.player.height, this.player.y + moveDistance)
            );
            this.touchStartY = currentTouchY;
        }
    }

    handleTouchEnd() {
        this.touchStartY = null;
    }

    startBackgroundMusic() {
        if (!this.musicStarted) {
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.5;
            this.audioContext.resume().then(() => {
                this.backgroundMusic.play().catch((error) => console.error("Background music error:", error));
                this.musicStarted = true;
            });
        }
    }

    enableAudio() {
        if (this.audioContext.state === "suspended") {
            this.audioContext.resume();
        }
        this.audioEnabled = true;
    }

    createObstacle() {
        const type = Math.random() < 0.5 ? "tree" : "rock";
        const image = this.images[type];
        const isSmall = Math.random() < 0.5;
        const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
        const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
        const y = Math.random() * (this.canvas.height - height);

        const hitbox = type === "tree"
            ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
            : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

        this.obstacles.push(
            new GameObject(-width, y, width, height, image, hitbox)
        );
    }

    createPowerUp() {
        if (Math.random() < 0.1) {
            const size = 50;
            const y = Math.random() * (this.canvas.height - size);
            this.powerUps.push(new GameObject(-size, y, size, size, this.images.powerUp, { xOffset: 0, yOffset: 0, width: size, height: size }));
        }
    }

    activateFullSendMode() {
        this.isFullSendMode = true;
        this.fullSendModeTimer = 300;
        this.canvas.style.transition = "background-color 0.5s";
        this.canvas.style.backgroundColor = "#FF4500";
        this.powerUpSound.play().catch((error) => console.error("Power-up sound error:", error));
    }

    update(deltaTime) {
        if (this.keys.ArrowUp && this.player.y > 0) this.player.y -= 5;
        if (this.keys.ArrowDown && this.player.y < this.canvas.height - this.player.height) this.player.y += 5;

        if (this.isFullSendMode) {
            this.fullSendModeTimer -= deltaTime / 16.67; // Normalize to 60 FPS
            if (this.fullSendModeTimer <= 0) {
                this.isFullSendMode = false;
                this.canvas.style.backgroundColor = "#D2B48C";
            }
        }

        this.obstacles.forEach((obstacle, index) => {
            obstacle.x += obstacle.speed;
            if (obstacle.x > this.canvas.width) {
                this.obstacles.splice(index, 1);
                this.score++;
                if (this.audioEnabled) {
                    this.pointSound.currentTime = 0;
                    this.pointSound.play().catch((error) => console.error("Point sound error:", error));
                }
            }

            const playerHitbox = this.player.getHitbox();
            const obstacleHitbox = obstacle.getHitbox();

            if (
                playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
                playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
                playerHitbox.y + playerHitbox.height > obstacleHitbox.y
            ) {
                if (this.isFullSendMode) {
                    this.explosions.push(new GameObject(obstacle.x, obstacle.y, 50, 50, this.images.explosion, { xOffset: 0, yOffset: 0, width: 50, height: 50 }));
                    this.explosionSound.currentTime = 0;
                    this.explosionSound.play().catch((error) => console.error("Explosion sound error:", error));
                    this.obstacles.splice(index, 1);
                    this.score += 2;
                } else {
                    this.collisionSound.currentTime = 0;
                    this.collisionSound.play().catch((error) => console.error("Collision sound error:", error));
                    this.gameOver = true;
                }
            }
        });

        this.powerUps.forEach((powerUp, index) => {
            powerUp.x += this.obstacleSpeed;
            if (powerUp.x > this.canvas.width) {
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

        this.explosions.forEach((explosion, index) => {
            explosion.timer -= deltaTime / 16.67;
            if (explosion.timer <= 0) {
                this.explosions.splice(index, 1);
            }
        });
    }

    draw() {
        this.ctx.fillStyle = "#D2B48C";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.player.draw(this.ctx);

        this.obstacles.forEach((obstacle) => obstacle.draw(this.ctx));
        this.powerUps.forEach((powerUp) => powerUp.draw(this.ctx));
        this.explosions.forEach((explosion) => explosion.draw(this.ctx));

        this.ctx.fillStyle = "#000";
        this.ctx.font = "20px Arial";
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);

        if (this.isFullSendMode) {
            this.ctx.fillStyle = "#FFF";
            this.ctx.font = "30px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText(
                `FULL SEND MODE! Ends in: ${Math.ceil(this.fullSendModeTimer / 60)}`,
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }

        if (this.gameOver) {
            this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#FFF";
            this.ctx.font = "40px Arial";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Game Over!", this.canvas.width / 2, this.canvas.height / 2 - 50);
            this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - this.lastUpdateTime;
            this.lastUpdateTime = timestamp;

            if (!this.gameOver) {
                this.update(deltaTime);
                this.draw();
                requestAnimationFrame(gameLoop);
            }
        };

        requestAnimationFrame(gameLoop);
    }
}

// Initialize the game
window.onload = () => new Game("gameCanvas");

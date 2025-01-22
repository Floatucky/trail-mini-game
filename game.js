class GameObject {
    constructor(x, y, width, height, image, hitbox) {
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
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.backgroundMusic = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
        this.collisionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-end.mp3");
        this.pointSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/point-beep.mp3");
        this.powerUpSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/powerup-recieved.mp3");
        this.explosionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/explosion.mp3");
        this.stationaryTime = 0; // Time player has stayed in the same position
        this.lastPlayerY = this.player.y; // Track the player's last position

        this.images = {
            player: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png"),
            tree: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png"),
            rock: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png"),
            powerUp: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Chicken-Bucket.png"),
            explosion: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Explosion.png"),
        };

this.player = new GameObject(
    this.canvas.width - 125, // Dynamic padding from the right
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
        this.lastSpawnTime = 0;
        this.lastUpdateTime = 0;

        this.keys = { ArrowUp: false, ArrowDown: false };
        this.touchStartY = null;

        this.musicStarted = false;
        this.audioEnabled = false;

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

resizeCanvas() {
    const maxWidth = 800;
    const maxHeight = 600;
    this.canvas.width = Math.min(window.innerWidth * 0.9, maxWidth);
    this.canvas.height = Math.min(window.innerHeight * 0.7, maxHeight);

    // Calculate dynamic position based on canvas width
    this.player.x = this.canvas.width - 125; // Adjust as needed
    this.player.y = Math.min(this.player.y, this.canvas.height - this.player.height);

    console.log("Canvas resized. Player position:", this.player.x, this.player.y);
}

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
        this.touchStartY = e.touches[0].clientY;
        this.startBackgroundMusic();
        this.startSoundPlayback();
        if (!this.audioEnabled) this.enableAudio();
        console.log("Touch start at Y:", this.touchStartY);
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
    if (this.musicStarted) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0; // Reset music to the start
        this.musicStarted = false;
    }

    // Stop all other sounds
    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach((sound) => {
        sound.pause();
        sound.currentTime = 0; // Reset sound to the start
    });

    console.log("Popup closed. All sounds stopped.");
}

    startBackgroundMusic() {
        if (!this.musicStarted) {
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.5;
            this.audioContext.resume().then(() => {
                this.backgroundMusic.play().catch((error) => console.error("Background music error:", error));
                this.musicStarted = true;
                console.log("Background music started.");
            });
        }
    }

    startSoundPlayback() {
    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach((sound) => {
        sound.play().catch((err) => console.error(`Error playing sound: ${err}`));
        sound.pause();
    });
}

enableAudio() {
    if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
    }
    // Ensure sounds are preloaded and ready to play
    [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach((sound) => {
        sound.play().catch(() => {}); // Attempt to pre-play the sounds to unlock them
        sound.pause();
    });
    this.audioEnabled = true;
    console.log("Audio enabled and preloaded.");
}

createObstacle(numObstacles = 1, targetY = null) {
    if (this.obstacles.length >= 50) { // Limit to 50 obstacles
        console.warn("Maximum obstacle count reached. Skipping generation.");
        return;
    }

    const generatedObstacles = [];
    let attempts = 0;

    while (generatedObstacles.length < numObstacles && attempts < 50) {
        const type = Math.random() < 0.5 ? "tree" : "rock";
        const image = this.images[type];
        const isSmall = Math.random() < 0.5;
        const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
        const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
        const y = targetY !== null
            ? Math.min(Math.max(targetY - height / 2, 0), this.canvas.height - height)
            : Math.random() * (this.canvas.height - height);

        const hitbox = type === "tree"
            ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
            : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

        const newObstacle = new GameObject(-width, y, width, height, image, hitbox);

        // Check for overlap
        const isOverlapping = this.obstacles.concat(generatedObstacles).some(obstacle => {
            return (
                newObstacle.y < obstacle.y + obstacle.height &&
                newObstacle.y + newObstacle.height > obstacle.y
            );
        });

        if (!isOverlapping) {
            generatedObstacles.push(newObstacle);
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
                y = Math.random() * (this.canvas.height - size);
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
        this.powerUpSound.play().catch((error) => console.error("Power-up sound error:", error));
        console.log("Full send mode activated.");
    } else {
        console.log("Full send mode already active. Skipping reactivation.");
    }
}

update(deltaTime) {
    const currentTime = performance.now();

    // Check if the player is stationary
    if (this.player.y === this.lastPlayerY) {
        this.stationaryTime += deltaTime / 16.67; // Increment time if stationary
    } else {
        this.stationaryTime = 0; // Reset timer if player moves
        this.lastPlayerY = this.player.y; // Update last position
    }

    // Spawn targeted obstacles if stationary too long
    if (this.stationaryTime > 120) { // 2 seconds of stationary time
        this.createObstacle(1, this.player.y); // Spawn obstacle near player
        this.stationaryTime = 0; // Reset timer
    }

    // Adjust for regular spawning
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
        const numObstacles = Math.random() < 0.5 ? 1 : (this.score > 100 ? 3 : 2);
        this.createObstacle(numObstacles);
        this.createPowerUp();
        this.lastSpawnTime = currentTime;

        if (this.spawnInterval > 500) {
            this.spawnInterval -= 10;
            console.log("Spawn interval decreased to:", this.spawnInterval);
        }
    }

        if (this.keys.ArrowUp && this.player.y > 0) {
            this.player.y -= 5;
            console.log("Player moved up. New Y:", this.player.y);
        }
        if (this.keys.ArrowDown && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += 5;
            console.log("Player moved down. New Y:", this.player.y);
        }

        if (this.isFullSendMode) {
            this.fullSendModeTimer -= deltaTime / 16.67;
            console.log("Full send mode timer:", this.fullSendModeTimer);
            if (this.fullSendModeTimer <= 0) {
                this.isFullSendMode = false;
                console.log("Full send mode ended.");
            }
        }

    this.obstacles.forEach((obstacle, index) => {
        obstacle.x += this.obstacleSpeed;
        if (obstacle.x > this.canvas.width) {
            this.obstacles.splice(index, 1);
            this.score++;
            if (this.audioEnabled) {
                this.pointSound.currentTime = 0;
                this.pointSound.play().catch(() => {});
            }
        }
    });

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
                    console.log("Obstacle hit during full send mode. Explosion added. Score updated to:", this.score);
                } else {
                    this.collisionSound.currentTime = 0;
                    this.collisionSound.play().catch((error) => console.error("Collision sound error:", error));
                    this.gameOver = true;
                    console.log("Collision detected. Game over.");
                }
            }
        });

        this.powerUps.forEach((powerUp, index) => {
            powerUp.x += this.obstacleSpeed;
            if (powerUp.x > this.canvas.width) {
                this.powerUps.splice(index, 1);
                console.log("Power-up removed after crossing screen.");
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
                console.log("Power-up collected. Full send mode activated.");
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
    this.ctx.fillStyle = this.isFullSendMode ? "#FFEA00" : "#D2B48C";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw player
    this.player.draw(this.ctx);

    // Draw obstacles
    this.obstacles.forEach((obstacle) => obstacle.draw(this.ctx));

    // Draw power-ups
    this.powerUps.forEach((powerUp) => powerUp.draw(this.ctx));

    // Draw explosions
    this.explosions.forEach((explosion) => explosion.draw(this.ctx));

    // Draw score
    this.ctx.fillStyle = this.isFullSendMode ? "#000" : "#FFF";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    // Display full send mode timer if active
if (this.isFullSendMode) {
    this.ctx.fillStyle = "#FFF";
    const fontSize = Math.min(20, this.canvas.width / 20); // Resize font dynamically for mobile
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = "center";

    const text = `FULL SEND MODE! Ends in: ${Math.ceil(this.fullSendModeTimer / 60)}`;
    const lines = text.split("! ");

    lines.forEach((line, index) => {
        this.ctx.fillText(line, this.canvas.width / 2, this.canvas.height / 2 + fontSize * index - fontSize);
    });
}

    // Display game over screen if applicable
    if (this.gameOver) {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#FFF";
        this.ctx.font = "40px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Game Over!", this.canvas.width / 2, this.canvas.height / 2 - 50);
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2);

        const popupContent = document.querySelector(".pum-content.popmake-content");
        if (popupContent && !document.getElementById("playAgainButton")) {
            const playAgainButton = document.createElement("button");
            playAgainButton.id = "playAgainButton";
            playAgainButton.textContent = "Play Again";
            playAgainButton.style.cssText =
                "position: relative; display: block; margin: 20px auto; padding: 10px 20px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px; background-color: #4CAF50; color: #FFF;";
            popupContent.appendChild(playAgainButton);

            playAgainButton.addEventListener("click", () => {
                playAgainButton.remove();
                this.resetGame();
            });
        }
    }
}

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
        this.startBackgroundMusic();
        this.startGameLoop();
    }

    startGameLoop() {
        const gameLoop = (timestamp) => {
            const deltaTime = timestamp - this.lastUpdateTime;
            this.lastUpdateTime = timestamp;

            if (!this.gameOver) {
                this.update(deltaTime);
                this.draw();
                requestAnimationFrame(gameLoop);
            } else {
                this.backgroundMusic.pause();
            }
        };

        requestAnimationFrame(gameLoop);
    }
}

window.onload = () => new Game("gameCanvas");


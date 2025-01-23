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

        this.images = {
            player: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png"),
            tree: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png"),
            rock: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png"),
            powerUp: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Chicken-Bucket.png"),
            explosion: this.loadImage("https://floatuckytrailderby.com/wp-content/uploads/2025/01/Explosion.png"),
        };

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

        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false, KeyW: false, KeyA: false,
        this.touchStartY = null;
        this.musicStarted = false;
        this.audioEnabled = false;

        // Initialize the player object BEFORE resizing the canvas
        this.player = new GameObject(
            0, // Temporary X position; will be adjusted in `resizeCanvas`
            0, // Temporary Y position; will be adjusted in `resizeCanvas`
            100,
            40,
            this.images.player,
            { xOffset: 5, yOffset: 10, width: 85, height: 25 }
        );

        this.resizeCanvas(); // Now safe to call after player initialization
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
        const aspectRatio = maxWidth / maxHeight;
        const isPortrait = window.innerHeight > window.innerWidth;

        if (isPortrait) {
            this.canvas.width = Math.min(window.innerWidth * 0.9, maxWidth);
            this.canvas.height = Math.min(window.innerHeight * 0.8, maxHeight);
        } else {
            this.canvas.width = Math.min(window.innerWidth * 0.9, maxWidth);
            this.canvas.height = Math.min(window.innerHeight * 0.7, maxHeight);
        }

        // Adjust player position dynamically
        this.player.x = this.canvas.width - 125; // Keeps the player on the right side
        this.player.y = Math.min(this.player.y, this.canvas.height - this.player.height);

        console.log("Canvas resized. Player position:", this.player.x, this.player.y);
    }

handleKeyDown(e) {
    // Check if the pressed key is in the keys object
    if (e.key in this.keys) {
        this.keys[e.key] = true; // Mark the key as pressed
        this.startBackgroundMusic(); // Start background music if not already playing
        this.startSoundPlayback(); // Preload and start sound playback
        if (!this.audioEnabled) this.enableAudio(); // Enable audio if not already enabled
        console.log("Key down:", e.key);
    }
}

handleKeyUp(e) {
    // Check if the released key is in the keys object
    if (e.key in this.keys) {
        this.keys[e.key] = false; // Mark the key as released
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
        // Preload sounds once during initialization
        if (!this.soundsPreloaded) {
            [this.collisionSound, this.pointSound, this.explosionSound, this.powerUpSound].forEach((sound) => {
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

    // Create a spatial partition grid
    const gridSize = 100;
    const grid = {};

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
        const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
        const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
        const y = targetY !== null
            ? Math.min(Math.max(targetY - height / 2, 0), this.canvas.height - height)
            : Math.random() * (this.canvas.height - height);

        const hitbox = type === "tree"
            ? { xOffset: width * 0.35, yOffset: height * 0.15, width: width * 0.3, height: height * 0.7 }
            : { xOffset: width * 0.15, yOffset: height * 0.2, width: width * 0.7, height: height * 0.6 };

        const newObstacle = new GameObject(-width, y, width, height, image, hitbox);

        // Get grid cells to check
        const gridX = Math.floor(newObstacle.x / gridSize);
        const gridY = Math.floor(newObstacle.y / gridSize);
        const keysToCheck = [
            `${gridX},${gridY}`,
            `${gridX - 1},${gridY}`,
            `${gridX + 1},${gridY}`,
            `${gridX},${gridY - 1}`,
            `${gridX},${gridY + 1}`,
        ];

        // Check overlap within relevant grid cells
        const isOverlapping = keysToCheck.some(key => {
            return grid[key]?.some(obstacle =>
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

    // Spawn obstacles and power-ups at regular intervals
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
        const numObstacles = Math.random() < 0.5 ? 1 : 2;
        this.createObstacle(numObstacles);
        this.createPowerUp();
        this.lastSpawnTime = currentTime;

        // Gradually decrease spawn interval for increased difficulty
        if (this.spawnInterval > 500) {
            this.spawnInterval -= 10;
        }
    }

    // Move obstacles
    this.obstacles.forEach((obstacle, index) => {
        obstacle.x += this.obstacleSpeed;
        if (obstacle.x > this.canvas.width) {
            this.obstacles.splice(index, 1); // Remove obstacle if it leaves the screen
            this.score++; // Increment score
            if (this.audioEnabled) {
                this.pointSound.currentTime = 0;
                this.pointSound.play().catch(() => {});
            }
        }

        // Collision detection with player
        const playerHitbox = this.player.getHitbox();
        const obstacleHitbox = obstacle.getHitbox();
        if (
            playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
            playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
            playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
            playerHitbox.y + playerHitbox.height > obstacleHitbox.y
        ) {
            if (this.isFullSendMode) {
                this.explosions.push(new GameObject(
                    obstacle.x, obstacle.y, 50, 50, this.images.explosion, { xOffset: 0, yOffset: 0, width: 50, height: 50 }
                ));
                this.explosionSound.currentTime = 0;
                this.explosionSound.play().catch(() => {});
                this.obstacles.splice(index, 1); // Remove obstacle
                this.score += 2; // Bonus score in full-send mode
            } else {
                this.collisionSound.currentTime = 0;
                this.collisionSound.play().catch(() => {});
                this.gameOver = true; // End the game
            }
        }
    });

    // Move power-ups
    this.powerUps.forEach((powerUp, index) => {
        powerUp.x += this.obstacleSpeed;
        if (powerUp.x > this.canvas.width) {
            this.powerUps.splice(index, 1); // Remove power-up if it leaves the screen
        }

        // Collision detection with player
        const playerHitbox = this.player.getHitbox();
        const powerUpHitbox = powerUp.getHitbox();
        if (
            playerHitbox.x < powerUpHitbox.x + powerUpHitbox.width &&
            playerHitbox.x + playerHitbox.width > powerUpHitbox.x &&
            playerHitbox.y < powerUpHitbox.y + powerUpHitbox.height &&
            playerHitbox.y + playerHitbox.height > powerUpHitbox.y
        ) {
            this.powerUps.splice(index, 1); // Remove collected power-up
            this.activateFullSendMode(); // Activate full-send mode
        }
    });

    // Update explosions (timed removal)
    this.explosions.forEach((explosion, index) => {
        explosion.timer -= deltaTime / 16.67; // Update timer
        if (explosion.timer <= 0) {
            this.explosions.splice(index, 1); // Remove explosion
        }
    });

    // Handle player movement
    if ((this.keys.ArrowUp || this.keys.KeyW) && this.player.y > 0) {
        this.player.y -= 5;
    }
    if ((this.keys.ArrowDown || this.keys.KeyS) && this.player.y < this.canvas.height - this.player.height) {
        this.player.y += 5;
    }

    // Handle full-send mode timer
    if (this.isFullSendMode) {
        this.fullSendModeTimer -= deltaTime / 16.67;
        if (this.fullSendModeTimer <= 0) {
            this.isFullSendMode = false;
        }
    }
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
    if (deltaTime >= (1000 / 60)) { // 60 FPS cap
        this.lastUpdateTime = timestamp;
        if (!this.gameOver) {
            this.update(deltaTime);
            this.draw();
        } else {
            this.backgroundMusic.pause();
        }
    }
    requestAnimationFrame(gameLoop);
};
requestAnimationFrame(gameLoop);
    }
}

window.onload = () => new Game("gameCanvas");

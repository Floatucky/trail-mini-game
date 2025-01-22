function initializeGame() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Audio setup using AudioContext
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const backgroundMusic = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-music.mp3");
    const collisionSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/game-end.mp3");
    const pointSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/point-beep.mp3");
    const powerUpSound = new Audio("https://floatuckytrailderby.com/wp-content/uploads/2025/01/powerup-recieved.mp3");

    let musicStarted = false;
    let audioEnabled = false;

    const powerUpImage = new Image();
    powerUpImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/Chicken-Bucket.png";

    // Game state variables
    let obstacles = [];
    let powerUps = [];
    let gameOver = false;
    let score = 0;
    let obstacleSpeed = 3;
    let spawnInterval = 1500;
    let spawnIntervalId;
    let isFullSendMode = false;
    let fullSendModeTimer = 0;

    const keys = { ArrowUp: false, ArrowDown: false };
    let touchStartY = null;

    const player = {
        x: canvas.width - 150,
        y: canvas.height / 2 - 20,
        width: 100,
        height: 40,
        hitbox: {
            xOffset: 5,
            yOffset: 10,
            width: 85,
            height: 25,
        },
        image: new Image(),
    };
    player.image.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png";

    const treeImage = new Image();
    treeImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png";

    const rockImage = new Image();
    rockImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png";

    function startBackgroundMusic() {
        if (!musicStarted) {
            backgroundMusic.loop = true;
            backgroundMusic.volume = 0.5;
            audioContext.resume().then(() => {
                backgroundMusic.play().then(() => {
                    console.log("Background music started");
                    musicStarted = true;
                }).catch((error) => console.error("Background music error:", error));
            });
        }
    }

    function stopAllSounds() {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        collisionSound.pause();
        collisionSound.currentTime = 0;
        pointSound.pause();
        pointSound.currentTime = 0;
        powerUpSound.pause();
        powerUpSound.currentTime = 0;
        audioContext.suspend().then(() => console.log("Audio context suspended."));
        musicStarted = false;
        audioEnabled = false;
    }

    function enableAudio() {
        if (audioContext.state === "suspended") {
            audioContext.resume().then(() => console.log("Audio context resumed."));
        }
        audioEnabled = true;
    }

    function createPowerUp() {
        if (Math.random() < 0.1) { // 10% chance to spawn a power-up
            const size = 50;
            const x = Math.random() * (canvas.width - size);
            const y = Math.random() * (canvas.height - size);

            powerUps.push({ x, y, size });
        }
    }

    function createObstacle() {
        const type = Math.random() < 0.5 ? "tree" : "rock";
        const image = type === "tree" ? treeImage : rockImage;

        const isSmall = Math.random() < 0.5;
        const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
        const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);

        // Occasionally target the player
        let y;
        if (Math.random() < 0.3) { // 30% chance to target player
            const offset = Math.random() * 40 - 20; // Small random offset
            y = Math.max(0, Math.min(canvas.height - height, player.y + offset));
        } else {
            y = Math.random() * (canvas.height - height);
        }

        const hitbox = type === "tree"
            ? {
                  xOffset: width * 0.35,
                  yOffset: height * 0.15,
                  width: width * 0.3,
                  height: height * 0.7,
              }
            : {
                  xOffset: width * 0.15,
                  yOffset: height * 0.2,
                  width: width * 0.7,
                  height: height * 0.6,
              };

        obstacles.push({
            x: -width,
            y: y,
            width: width,
            height: height,
            image: image,
            hitbox: hitbox,
            speed: obstacleSpeed,
        });

        // Additional obstacles occasionally
        const spawnChance = score > 100 ? 0.4 : 0.2;
        const additionalObstacles = score > 100 ? 2 : 1;

        for (let i = 0; i < additionalObstacles; i++) {
            if (Math.random() < spawnChance) {
                const type2 = Math.random() < 0.5 ? "tree" : "rock";
                const image2 = type2 === "tree" ? treeImage : rockImage;
                const width2 = isSmall ? (type2 === "tree" ? 50 : 60) : (type2 === "tree" ? 100 : 80);
                const height2 = isSmall ? (type2 === "tree" ? 50 : 40) : (type2 === "tree" ? 100 : 75);

                let y2 = Math.random() * (canvas.height - height2);
                obstacles.push({
                    x: -width2,
                    y: y2,
                    width: width2,
                    height: height2,
                    image: image2,
                    hitbox: type2 === "tree"
                        ? {
                              xOffset: width2 * 0.35,
                              yOffset: height2 * 0.15,
                              width: width2 * 0.3,
                              height: height2 * 0.7,
                          }
                        : {
                              xOffset: width2 * 0.15,
                              yOffset: height2 * 0.2,
                              width: width2 * 0.7,
                              height: height2 * 0.6,
                          },
                    speed: obstacleSpeed,
                });
            }
        }
    }

    function activateFullSendMode() {
        console.log("Activating Full Send Mode!");
        isFullSendMode = true;
        fullSendModeTimer = 300; // Full Send Mode lasts for 5 seconds (300 frames at 60 FPS)
        canvas.style.backgroundColor = "#FF4500"; // Change background to indicate Full Send Mode
        powerUpSound.play().catch((error) => console.error("Power-up sound error:", error));
    }

    function update() {
        if (gameOver) return;

        if (keys.ArrowUp && player.y > 0) player.y -= 5;
        if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += 5;

        if (isFullSendMode) {
            fullSendModeTimer--;
            if (fullSendModeTimer <= 0) {
                isFullSendMode = false;
                canvas.style.backgroundColor = "#D2B48C"; // Reset to default background
            }
        }

        obstacles.forEach((obstacle, index) => {
            obstacle.x += obstacle.speed;

            if (obstacle.x > canvas.width) {
                obstacles.splice(index, 1);
                score++;
                if (audioEnabled && !gameOver) {
                    pointSound.currentTime = 0;
                    pointSound.play().catch((error) => console.error("Point sound error:", error));
                }
            }

            const playerHitbox = {
                x: player.x + player.hitbox.xOffset,
                y: player.y + player.hitbox.yOffset,
                width: player.hitbox.width,
                height: player.hitbox.height,
            };

            const obstacleHitbox = {
                x: obstacle.x + obstacle.hitbox.xOffset,
                y: obstacle.y + obstacle.hitbox.yOffset,
                width: obstacle.hitbox.width,
                height: obstacle.hitbox.height,
            };

            if (
                playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
                playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                playerHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
                playerHitbox.y + playerHitbox.height > obstacleHitbox.y
            ) {
                if (isFullSendMode) {
                    obstacles.splice(index, 1);
                    score += 2;
                } else {
                    if (audioEnabled && !gameOver) {
                        collisionSound.currentTime = 0;
                        collisionSound.play().catch((error) => console.error("Collision sound error:", error));
                    }
                    gameOver = true;
                }
            }
        });

        powerUps.forEach((powerUp, index) => {
            const powerUpHitbox = { x: powerUp.x, y: powerUp.y, size: powerUp.size };
            if (
                player.x < powerUp.x + powerUp.size &&
                player.x + player.width > powerUp.x &&
                player.y < powerUp.y + powerUp.size &&
                player.y + player.height > powerUp.y
            ) {
                powerUps.splice(index, 1);
                activateFullSendMode();
            }
        });
    }

    function draw() {
        ctx.fillStyle = "#D2B48C";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

        obstacles.forEach((obstacle) => {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        powerUps.forEach((powerUp) => {
            ctx.drawImage(powerUpImage, powerUp.x, powerUp.y, powerUp.size, powerUp.size);
        });

        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 30);

        if (isFullSendMode) {
            ctx.fillStyle = "#FFF";
            ctx.font = "30px Arial";
            ctx.fillText(`FULL SEND MODE! Ends in: ${Math.ceil(fullSendModeTimer / 60)}`, canvas.width / 2, 50);
        }
    }

    function gameLoop() {
        if (!gameOver) {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        } else {
            stopAllSounds();
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

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
                    resetGame();
                });
            }
        }
    }

    function resetGame() {
        gameOver = false;
        score = 0;
        obstacles = [];
        powerUps = [];
        obstacleSpeed = 3;
        spawnInterval = 1500;

        if (!musicStarted) {
            startBackgroundMusic();
        }

        resizeCanvas();
        clearInterval(spawnIntervalId);
        startSpawnLoop();
        gameLoop();
    }

    function startSpawnLoop() {
        if (spawnIntervalId) clearInterval(spawnIntervalId);
        spawnIntervalId = setInterval(() => {
            createObstacle();
            createPowerUp();
        }, Math.max(500, spawnInterval));
    }

    // Popup Maker Close Event Handling
    window.addEventListener("popmakeClose", () => {
        stopAllSounds();
    });

    document.addEventListener("click", (e) => {
        if (e.target.matches(".pum-close, .pum-overlay, .pum-overlay-close")) {
            stopAllSounds();
        }
    });

    startSpawnLoop();
    gameLoop();
}

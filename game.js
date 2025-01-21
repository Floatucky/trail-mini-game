function initializeGame() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Dynamically resize canvas for mobile
    function resizeCanvas() {
        const maxWidth = 800;
        const maxHeight = 600;
        canvas.width = Math.min(window.innerWidth * 0.9, maxWidth);
        canvas.height = Math.min(window.innerHeight * 0.7, maxHeight);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

const player = {
    x: canvas.width - 150, // Position near the right edge
    y: canvas.height / 2 - 20, // Center vertically (adjusted for 40px height)
    width: 100, // Full logo width
    height: 40, // Full logo height
    hitbox: {
        xOffset: 5,   // Align closely to the left edge
        yOffset: 10,  // Adjust down slightly to avoid the top-right empty space
        width: 85,    // Cover most of the left and middle portions, excluding the top-right
        height: 25,   // Reduced to avoid the empty top-right and align with the bottom-right
    },
    image: new Image(),
};
player.image.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/Blue-wheel.png";

    const treeImage = new Image();
    treeImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png";

    const rockImage = new Image();
    rockImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png";

    let obstacles = [];
    let gameOver = false;
    let score = 0;
    let obstacleSpeed = 3;
    let spawnInterval = 1500;
    let difficultyIncrement = 0;
    let spawnIntervalId;

    const keys = { ArrowUp: false, ArrowDown: false };
    let touchStartY = null;

    // Event listeners for PC controls
    document.addEventListener("keydown", (e) => {
        if (e.key in keys) keys[e.key] = true;
    });

    document.addEventListener("keyup", (e) => {
        if (e.key in keys) keys[e.key] = false;
    });

    // Event listeners for mobile controls
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        canvas.addEventListener("touchstart", (e) => {
            touchStartY = e.touches[0].clientY;
        });

        canvas.addEventListener("touchmove", (e) => {
            const currentTouchY = e.touches[0].clientY;
            if (touchStartY !== null) {
                const swipeDistance = currentTouchY - touchStartY;

                if (Math.abs(swipeDistance) > 10) {
                    const moveDistance = swipeDistance * 0.6;
                    if (swipeDistance > 0) {
                        player.y = Math.min(player.y + moveDistance, canvas.height - player.height);
                    } else {
                        player.y = Math.max(player.y + moveDistance, 0);
                    }

                    touchStartY = currentTouchY;
                }
            }
        });

        canvas.addEventListener("touchend", () => {
            touchStartY = null;
        });
    }

function createObstacle() {
    // Randomly decide obstacle type (tree or rock)
    const type = Math.random() < 0.5 ? "tree" : "rock";
    const image = type === "tree" ? treeImage : rockImage;

    // Randomize size
    const isSmall = Math.random() < 0.5;
    const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
    const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
    const y = Math.random() * (canvas.height - height);

    // Define hitbox based on type
    const hitbox = type === "tree"
        ? {
              xOffset: width * 0.35, // Exclude the empty left and right space for trees
              yOffset: height * 0.15, // Start below the empty top corners
              width: width * 0.3, // Narrow to the trunk and circular leaf area
              height: height * 0.7, // Cover the trunk and lower part
          }
        : {
              xOffset: 10, // Placeholder hitbox for rocks
              yOffset: 10,
              width: width - 20,
              height: height - 20,
          };

    // Push the first obstacle into the obstacles array
    obstacles.push({
        x: -width, // Start off-screen
        y: y,
        width: width,
        height: height,
        image: image,
        hitbox: hitbox,
        speed: obstacleSpeed,
    });

    // Random chance to spawn a second obstacle
    if (Math.random() < 0.3) { // 30% chance to spawn a second obstacle
        const type2 = Math.random() < 0.5 ? "tree" : "rock";
        const image2 = type2 === "tree" ? treeImage : rockImage;

        const isSmall2 = Math.random() < 0.5;
        const width2 = isSmall2 ? (type2 === "tree" ? 50 : 60) : (type2 === "tree" ? 100 : 80);
        const height2 = isSmall2 ? (type2 === "tree" ? 50 : 40) : (type2 === "tree" ? 100 : 75);

        // Ensure the second obstacle doesn’t overlap the first
        let y2;
        if (y < canvas.height / 2) {
            y2 = Math.random() * ((canvas.height - height2) / 2) + canvas.height / 2; // Place in bottom half
        } else {
            y2 = Math.random() * ((canvas.height - height2) / 2); // Place in top half
        }

        // Push the second obstacle into the obstacles array
        obstacles.push({
            x: -width2, // Start off-screen
            y: y2,
            width: width2,
            height: height2,
            image: image2,
            hitbox: {
                xOffset: 10,
                yOffset: 10,
                width: width2 - 20,
                height: height2 - 20,
            },
            speed: obstacleSpeed,
        });
    }
}

    // Random chance to spawn a second obstacle
    if (Math.random() < 0.3) { // 30% chance to spawn two obstacles
        const type2 = Math.random() < 0.5 ? "tree" : "rock";
        const image2 = type2 === "tree" ? treeImage : rockImage;

        const isSmall2 = Math.random() < 0.5;
        const width2 = isSmall2 ? 50 : 100;
        const height2 = isSmall2 ? (type2 === "tree" ? 50 : 40) : (type2 === "tree" ? 100 : 75);

        // Ensure the second obstacle doesn’t overlap the first
        let y2;
        if (y1 < canvas.height / 2) {
            y2 = Math.random() * ((canvas.height - height2) / 2) + canvas.height / 2; // Place in bottom half
        } else {
            y2 = Math.random() * ((canvas.height - height2) / 2); // Place in top half
        }

        obstacles.push({
            x: -width2, // Start off-screen
            y: y2,
            width: width2,
            height: height2,
            image: image2,
            hitbox: {
                xOffset: 10,
                yOffset: 10,
                width: width2 - 20,
                height: height2 - 20,
            },
            speed: obstacleSpeed,
        });
    }
}

    function update() {
        if (gameOver) return;

        if (keys.ArrowUp && player.y > 0) player.y -= 5;
        if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += 5;

        obstacles.forEach((obstacle, index) => {
            obstacle.x += obstacle.speed; // Move right towards the player

            if (obstacle.x > canvas.width) {
                obstacles.splice(index, 1);
                score++;
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
                gameOver = true;
            }
        });
    }

function draw() {
    // Clear canvas with the new background color
    ctx.fillStyle = "#D2B48C"; // Trail-like tan
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

    // Draw obstacles
    obstacles.forEach((obstacle) => {
        ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw score
    ctx.fillStyle = "#000";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
}

    function increaseDifficulty() {
        difficultyIncrement++;
        if (difficultyIncrement % 5 === 0) {
            obstacleSpeed += 0.2;
        }
        if (difficultyIncrement % 10 === 0 && spawnInterval > 800) {
            spawnInterval -= 100;
            clearInterval(spawnIntervalId);
            startSpawnLoop();
        }
    }

function gameLoop() {
    if (!gameOver) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else {
        // Display "Game Over" screen
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFF";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

        // Find the popup container using the updated selector
        const popupContent = document.querySelector('.pum-content.popmake-content');

        if (!popupContent) {
            console.warn("Popup content not found. Ensure the popup is active.");
            return;
        }

        // Ensure the "Play Again" button is created and appended inside the popup
        let playAgainButton = document.getElementById("playAgainButton");
        if (!playAgainButton) {
            console.log("Creating 'Play Again' button...");
            playAgainButton = document.createElement("button");
            playAgainButton.id = "playAgainButton";
            playAgainButton.textContent = "Play Again";
            playAgainButton.style.position = "relative";
            playAgainButton.style.display = "block";
            playAgainButton.style.margin = "20px auto";
            playAgainButton.style.padding = "10px 20px";
            playAgainButton.style.fontSize = "16px";
            playAgainButton.style.cursor = "pointer";
            playAgainButton.style.border = "none";
            playAgainButton.style.borderRadius = "5px";
            playAgainButton.style.backgroundColor = "#4CAF50";
            playAgainButton.style.color = "#FFF";

            popupContent.appendChild(playAgainButton);

            // Restart the game when the button is clicked
playAgainButton.addEventListener("click", () => {
    console.log("'Play Again' clicked. Restarting game...");
    // Remove the button
    playAgainButton.remove();

    // Reset game variables
    gameOver = false;
    score = 0;
    obstacles = [];
    obstacleSpeed = 3;
    spawnInterval = 1500;

    // Force canvas to resize
    resizeCanvas();

    // Restart the spawn loop and game loop
    clearInterval(spawnIntervalId);
    startSpawnLoop();
    gameLoop();
});

        } else {
            console.log("'Play Again' button already exists.");
        }
    }
}

function startSpawnLoop() {
    spawnIntervalId = setInterval(() => {
        createObstacle();
        increaseDifficulty();
    }, spawnInterval);
}

    startSpawnLoop();
    gameLoop();
}

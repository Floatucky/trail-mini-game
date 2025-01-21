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

    let obstacles = [];
    let gameOver = false;
    let score = 0;
    let obstacleSpeed = 3;
    let spawnInterval = 1500;
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
                const moveDistance = swipeDistance * 0.6;
                player.y = Math.max(
                    0,
                    Math.min(canvas.height - player.height, player.y + moveDistance)
                );
                touchStartY = currentTouchY;
            }
        });

        canvas.addEventListener("touchend", () => {
            touchStartY = null;
        });
    }

    function createObstacle() {
    const type = Math.random() < 0.5 ? "tree" : "rock";
    const image = type === "tree" ? treeImage : rockImage;

    const isSmall = Math.random() < 0.5;
    const width = isSmall ? (type === "tree" ? 50 : 60) : (type === "tree" ? 100 : 80);
    const height = isSmall ? (type === "tree" ? 50 : 40) : (type === "tree" ? 100 : 75);
    const y = Math.random() * (canvas.height - height);

    const hitbox = type === "tree"
        ? {
              xOffset: width * 0.35, // Exclude the empty left/right space for trees
              yOffset: height * 0.15, // Start below the empty top corners
              width: width * 0.3, // Narrow to the trunk and circular leaf area
              height: height * 0.7, // Cover the trunk and lower part
          }
        : {
              xOffset: width * 0.15, // Exclude the top-left and top-right corners
              yOffset: height * 0.2, // Start below the top-middle rounded area
              width: width * 0.7, // Cover the central bulk of the rock
              height: height * 0.6, // Exclude the rounded bottom-left and bottom-right
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

    // Random chance to spawn a second obstacle
    if (Math.random() < 0.3) {
        const type2 = Math.random() < 0.5 ? "tree" : "rock";
        const image2 = type2 === "tree" ? treeImage : rockImage;

        const isSmall2 = Math.random() < 0.5;
        const width2 = isSmall2 ? (type2 === "tree" ? 50 : 60) : (type2 === "tree" ? 100 : 80);
        const height2 = isSmall2 ? (type2 === "tree" ? 50 : 40) : (type2 === "tree" ? 100 : 75);

        let y2;
        if (y < canvas.height / 2) {
            y2 = Math.random() * ((canvas.height - height2) / 2) + canvas.height / 2;
        } else {
            y2 = Math.random() * ((canvas.height - height2) / 2);
        }

        obstacles.push({
            x: -width2,
            y: y2,
            width: width2,
            height: height2,
            image: image2,
            hitbox: {
                xOffset: type2 === "tree" ? width2 * 0.35 : width2 * 0.15,
                yOffset: type2 === "tree" ? height2 * 0.15 : height2 * 0.2,
                width: type2 === "tree" ? width2 * 0.3 : width2 * 0.7,
                height: type2 === "tree" ? height2 * 0.7 : height2 * 0.6,
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
            obstacle.x += obstacle.speed;

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
        ctx.fillStyle = "#D2B48C";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

        obstacles.forEach((obstacle) => {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        ctx.fillStyle = "#000";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 30);
    }

    function gameLoop() {
        if (!gameOver) {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);

            const popupContent = document.querySelector('.pum-content.popmake-content');

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
        obstacleSpeed = 3;
        spawnInterval = 1500;
        resizeCanvas();
        clearInterval(spawnIntervalId);
        startSpawnLoop();
        gameLoop();
    }

    function startSpawnLoop() {
        spawnIntervalId = setInterval(() => {
            createObstacle();
        }, spawnInterval);
    }

    startSpawnLoop();
    gameLoop();
}

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
        x: canvas.width - 110, // Start near the right edge
        y: canvas.height / 2 - 30,
        width: 60,
        height: 60,
        hitbox: {
            xOffset: 10,
            yOffset: 10,
            width: 40,
            height: 40,
        },
        image: new Image(),
    };
    player.image.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/blue-wheel-with-crown.png";

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
        const type = Math.random() < 0.5 ? "tree" : "rock";
        const image = type === "tree" ? treeImage : rockImage;
        const width = 100;
        const height = type === "tree" ? 100 : 75;
        const hitbox = {
            xOffset: type === "tree" ? 25 : 10,
            yOffset: type === "tree" ? 25 : 10,
            width: type === "tree" ? 50 : 80,
            height: type === "tree" ? 50 : 55,
        };
        const y = Math.random() * (canvas.height - height);

        obstacles.push({
            x: -width, // Start on the left, off-screen
            y: y,
            width: width,
            height: height,
            hitbox: hitbox,
            image: image,
            speed: obstacleSpeed,
        });
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

        obstacles.forEach((obstacle) => {
            ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

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
            clearInterval(spawnIntervalId);
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
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

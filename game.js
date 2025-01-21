function initializeGame() {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Dynamically resize canvas for mobile
    function resizeCanvas() {
        const maxWidth = 800; // Max width for larger screens
        const maxHeight = 600; // Max height for larger screens
        canvas.width = Math.min(window.innerWidth * 0.9, maxWidth); // 90% of the screen width or maxWidth
        canvas.height = Math.min(window.innerHeight * 0.7, maxHeight); // 70% of the screen height or maxHeight
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas(); // Initial resize

    // Player setup
    const player = {
        x: 50,
        y: canvas.height / 2 - 30,
        width: 60, // Adjusted size for logo
        height: 60, // Adjusted size for logo
        hitbox: {
            xOffset: 10, // Offset to account for transparency
            yOffset: 10,
            width: 40, // Smaller hitbox width
            height: 40, // Smaller hitbox height
        },
        image: new Image(),
    };
    player.image.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/blue-wheel-with-crown.png";

    // Obstacle images
    const treeImage = new Image();
    treeImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png";

    const rockImage = new Image();
    rockImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png";

    let obstacles = [];
    let gameOver = false;
    let score = 0;

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
        const width = 100; // Full image width
        const height = type === "tree" ? 100 : 75; // Tree and rock heights
        const hitbox = {
            xOffset: type === "tree" ? 25 : 10, // Adjusted for transparency
            yOffset: type === "tree" ? 25 : 10,
            width: type === "tree" ? 50 : 80, // Adjusted hitbox width
            height: type === "tree" ? 50 : 55, // Adjusted hitbox height
        };
        const y = Math.random() * (canvas.height - height);

        obstacles.push({
            x: canvas.width,
            y: y,
            width: width,
            height: height,
            hitbox: hitbox,
            image: image,
            type: type,
            speed: 3 + Math.random() * 2,
        });
    }

    function update() {
        if (gameOver) return;

        // Move player (PC controls)
        if (keys.ArrowUp && player.y > 0) player.y -= 5;
        if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += 5;

        // Move obstacles
        obstacles.forEach((obstacle, index) => {
            obstacle.x -= obstacle.speed;

            // Remove obstacles that leave the screen
            if (obstacle.x + obstacle.width < 0) {
                obstacles.splice(index, 1);
                score++;
            }

            // Check for collisions using hitboxes
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
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
        }
    }

    setInterval(createObstacle, 2000);
    gameLoop();
}

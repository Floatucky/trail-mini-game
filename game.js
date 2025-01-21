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

    function createObstacle() {
        const type = Math.random() < 0.5 ? "tree" : "rock"; // Randomly choose obstacle type
        const image = type === "tree" ? treeImage : rockImage;
        const width = type === "tree" ? 100 : 100; // Tree and rock widths
        const height = type === "tree" ? 100 : 75; // Tree and rock heights
        const y = Math.random() * (canvas.height - height);

        obstacles.push({
            x: canvas.width,
            y: y,
            width: width,
            height: height,
            image: image,
            speed: 3 + Math.random() * 2,
        });
    }

    function update() {
        if (gameOver) return;

        // Move obstacles
        obstacles.forEach((obstacle, index) => {
            obstacle.x -= obstacle.speed;

            // Remove obstacles that leave the screen
            if (obstacle.x + obstacle.width < 0) {
                obstacles.splice(index, 1);
                score++;
            }

            // Check for collisions
            if (
                player.x < obstacle.x + obstacle.width &&
                player.x + player.width > obstacle.x &&
                player.y < obstacle.y + obstacle.height &&
                player.y + player.height > obstacle.y
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

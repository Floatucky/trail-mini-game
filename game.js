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
        x: canvas.width - 110,
        y: canvas.height / 2 - 30,
        width: 60,
        height: 60,
        image: new Image(),
    };
    player.image.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/blue-wheel-with-crown.png";

    const treeImage = new Image();
    treeImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/tree.png";

    const rockImage = new Image();
    rockImage.src = "https://floatuckytrailderby.com/wp-content/uploads/2025/01/rock.png";

    // Background settings
    const trailColor = "#D2B48C"; // Tan trail color
    const skyColor = "#87CEEB"; // Blue sky color

    // Background for image-based scrolling
    const trailImage = new Image();
    trailImage.src = "URL_TO_TRAIL_IMAGE"; // Replace with the trail image URL
    let backgroundX = 0;

    let obstacles = [];
    let gameOver = false;
    let score = 0;
    let obstacleSpeed = 3;
    let spawnInterval = 1500;
    let spawnIntervalId;

    const keys = { ArrowUp: false, ArrowDown: false };

    document.addEventListener("keydown", (e) => {
        if (e.key in keys) keys[e.key] = true;
    });

    document.addEventListener("keyup", (e) => {
        if (e.key in keys) keys[e.key] = false;
    });

    // Create obstacle
    function createObstacle() {
        const type = Math.random() < 0.5 ? "tree" : "rock";
        const image = type === "tree" ? treeImage : rockImage;
        const width = 100;
        const height = type === "tree" ? 100 : 75;
        const y = Math.random() * (canvas.height - height);

        obstacles.push({
            x: -width,
            y: y,
            width: width,
            height: height,
            image: image,
            speed: obstacleSpeed,
        });
    }

    function update() {
        if (gameOver) return;

        // Update background scroll
        backgroundX -= 2; // Adjust scrolling speed
        if (backgroundX <= -canvas.width) backgroundX = 0;

        // Move obstacles
        obstacles.forEach((obstacle, index) => {
            obstacle.x += obstacle.speed;

            if (obstacle.x > canvas.width) {
                obstacles.splice(index, 1);
                score++;
            }

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
        // Draw background (Choose one option below)

        // Option 1: Color-based background
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = trailColor;
        ctx.fillRect(0, canvas.height - 150, canvas.width, 150); // Brown trail at the bottom

        // Option 2: Image-based background
        // Uncomment this to use an image
        // ctx.drawImage(trailImage, backgroundX, 0, canvas.width, canvas.height);
        // ctx.drawImage(trailImage, backgroundX + canvas.width, 0, canvas.width, canvas.height);

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
            obstacleSpeed += 0.1; // Gradually increase speed
        }, spawnInterval);
    }

    startSpawnLoop();
    gameLoop();
}

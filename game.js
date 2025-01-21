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

    const player = {
        x: 50,
        y: canvas.height / 2 - 15,
        width: 30,
        height: 30,
        color: "#4CAF50",
        speed: 5
    };

    let obstacles = [];
    let gameOver = false;
    let score = 0;

    const keys = {
        ArrowUp: false,
        ArrowDown: false
    };

    // Touch Controls for Mobile
    let touchStartY = null;
    let touchEndY = null;

    canvas.addEventListener("touchstart", (e) => {
        touchStartY = e.touches[0].clientY;
    });

    canvas.addEventListener("touchmove", (e) => {
        touchEndY = e.touches[0].clientY;

        if (touchStartY && touchEndY) {
            const swipeDistance = touchEndY - touchStartY;
            if (swipeDistance > 30) {
                // Swipe Down
                if (player.y < canvas.height - player.height) player.y += player.speed;
                touchStartY = touchEndY; // Reset for continuous swipe
            } else if (swipeDistance < -30) {
                // Swipe Up
                if (player.y > 0) player.y -= player.speed;
                touchStartY = touchEndY; // Reset for continuous swipe
            }
        }
    });

    function createObstacle() {
        const size = Math.random() * 50 + 20;
        const y = Math.random() * (canvas.height - size);
        obstacles.push({
            x: canvas.width,
            y: y,
            width: size,
            height: size,
            color: "#FF5733",
            speed: 3 + Math.random() * 2
        });
    }

    function update() {
        if (gameOver) return;

        // Move player
        if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
        if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;

        obstacles.forEach((obstacle, index) => {
            obstacle.x -= obstacle.speed;

            if (obstacle.x + obstacle.width < 0) {
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        obstacles.forEach((obstacle) => {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
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
            ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2);
            ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50);
        }
    }

    setInterval(createObstacle, 2000);
    gameLoop();
}

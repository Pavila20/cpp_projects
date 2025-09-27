// --- Canvas Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const modal = document.getElementById('gameOverModal');
const startButton = document.getElementById('startButton');

// --- Game Constants ---
// MODIFIED: Reduced width to match the tighter CSS container max-width (e.g., 450px)
const GAME_WIDTH = 450; 
const GAME_HEIGHT = canvas.height; // Still 400
const GRAVITY = 0.5;
const JUMP_VELOCITY = -9;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 50;
const PIPE_GAP = 130; 
const PIPE_SPACING = 200;
const BIRD_SIZE = 30; 

// Set the canvas element's attributes to match the new constant
canvas.width = GAME_WIDTH;


// --- Game State ---
let gameState = {
    birdY: GAME_HEIGHT / 2,
    birdVelocity: 0,
    pipes: [],
    score: 0,
    isGameOver: false,
    isGameStarted: false,
    selectedAvatar: '🐦'
};

// --- Utility Functions ---

/**
 * Resets the game state and prepares for a new game.
 */
function resetGame() {
    gameState = {
        birdY: GAME_HEIGHT / 2,
        birdVelocity: 0,
        pipes: [],
        score: 0,
        isGameOver: false,
        isGameStarted: true,
        selectedAvatar: gameState.selectedAvatar 
    };
    modal.classList.add('hidden');
    startButton.textContent = 'RESTART (SPACE)';
    startButton.style.backgroundColor = 'var(--color-neon-red)';
    
    // Add the first pipe
    generatePipe();
    requestAnimationFrame(gameLoop);
}

/**
 * Starts the game or restarts if necessary.
 */
function startGame() {
    if (!gameState.isGameStarted || gameState.isGameOver) {
        resetGame();
    }
}

/**
 * Generates a new pipe with a random vertical position.
 */
function generatePipe() {
    const minHeight = 50;
    const maxOffset = GAME_HEIGHT - PIPE_GAP - minHeight * 2;
    const topPipeHeight = Math.floor(Math.random() * maxOffset) + minHeight;

    gameState.pipes.push({
        x: GAME_WIDTH,
        topHeight: topPipeHeight,
        bottomY: topPipeHeight + PIPE_GAP,
        passed: false
    });
}

/**
 * Allows the user to select their avatar and updates the UI.
 * @param {HTMLElement} button - The button element that was clicked.
 * @param {string} emoji - The emoji to use as the avatar.
 */
function selectAvatar(button, emoji) {
    gameState.selectedAvatar = emoji;
    
    // Update the visual selection
    document.querySelectorAll('.avatar-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    button.classList.add('selected');
}

/**
 * Handles the 'flap' action (jump).
 */
function flap() {
    if (gameState.isGameStarted && !gameState.isGameOver) {
        gameState.birdVelocity = JUMP_VELOCITY;
        
        // ADDED: Visual Flap Effect (Flashes the canvas border blue)
        canvas.style.boxShadow = '0 0 25px var(--color-neon-blue)';
        setTimeout(() => {
            // Restore the original glow after a short delay
            canvas.style.boxShadow = '0 0 10px rgba(0, 191, 255, 0.5)'; 
        }, 100); 

    } else if (!gameState.isGameStarted) {
        startGame();
    }
}

// --- Drawing Functions ---

/**
 * Draws the main game elements.
 */
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Pipes (Neon Blue)
    ctx.fillStyle = 'var(--color-neon-blue)';
    ctx.shadowColor = 'var(--color-neon-blue)';
    ctx.shadowBlur = 8;

    gameState.pipes.forEach(p => {
        // Draw top pipe
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        
        // Draw bottom pipe
        ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, GAME_HEIGHT - p.bottomY);
    });

    // Reset shadow for the bird
    ctx.shadowBlur = 0;

    // Draw the Bird (Avatar)
    ctx.font = `${BIRD_SIZE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameState.selectedAvatar, 
                 // X position: Center of the new GAME_WIDTH
                 GAME_WIDTH / 2, 
                 gameState.birdY); 
    
    // Update score display
    scoreDisplay.textContent = gameState.score;
}

// --- Game Logic ---

/**
 * Checks for collisions between the bird and the pipes or ground/ceiling.
 * @returns {boolean} True if a collision occurred.
 */
function checkCollision() {
    // X position of the bird's left edge (fixed at center)
    // NOTE: Because textAlign is 'center', birdLeft and birdRight are calculated 
    // relative to the center (GAME_WIDTH / 2)
    const birdLeft = GAME_WIDTH / 2 - BIRD_SIZE / 2;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = gameState.birdY - BIRD_SIZE / 2;
    const birdBottom = gameState.birdY + BIRD_SIZE / 2;
    
    // 1. Ceiling and Ground collision
    if (birdTop < 0 || birdBottom > GAME_HEIGHT) {
        return true;
    }

    // 2. Pipe collision
    for (const p of gameState.pipes) {
        // Check if bird is horizontally aligned with the pipe
        if (birdRight > p.x && birdLeft < p.x + PIPE_WIDTH) {
            // Check collision with top pipe OR bottom pipe
            const hitTop = birdTop < p.topHeight;
            const hitBottom = birdBottom > p.bottomY;
            
            if (hitTop || hitBottom) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Updates the game state (movement, physics, pipes, scoring).
 */
function update() {
    if (gameState.isGameOver) return;
    
    // 1. Apply Gravity and update Bird position
    gameState.birdVelocity += GRAVITY;
    gameState.birdY += gameState.birdVelocity;
    
    // 2. Move and Clean Pipes
    gameState.pipes.forEach(p => {
        p.x -= PIPE_SPEED;
        
        // Scoring check (when the pipe passes the center of the bird)
        if (p.x + PIPE_WIDTH < GAME_WIDTH / 2 && !p.passed) {
            gameState.score++;
            p.passed = true;
        }
    });

    // Remove pipes that are off-screen
    gameState.pipes = gameState.pipes.filter(p => p.x + PIPE_WIDTH > 0);
    
    // 3. Generate new pipes
    if (gameState.pipes.length === 0 || gameState.pipes[gameState.pipes.length - 1].x < GAME_WIDTH - PIPE_SPACING) {
       generatePipe();
    }
    
    // 4. Check Collision
    if (checkCollision()) {
        gameState.isGameOver = true;
        document.getElementById('finalScore').textContent = gameState.score;
        modal.classList.remove('hidden');
        startButton.textContent = 'GAME OVER! (RESTART)';
    }
}

// --- Game Loop ---

let lastFrameTime = 0;
const frameDuration = 1000 / 60; // Target 60 FPS

function gameLoop(timestamp) {
    if (!gameState.isGameStarted || gameState.isGameOver) {
        draw();
        return;
    }

    // Simple frame rate limiter
    if (timestamp < lastFrameTime + frameDuration) {
         requestAnimationFrame(gameLoop);
         return;
    }
    lastFrameTime = timestamp;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---

// Flap on mouse click/touch
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    flap();
});

// Flap on Spacebar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    }
});

// Initial setup on load
window.onload = function() {
    // Initial draw to show the canvas and bird
    draw();
}
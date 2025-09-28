// 🌟 Welcome to Star Catcher JS!
// Everything here controls your falling stars, bucket, score, and game flow

// ====== Canvas & DOM Elements ======
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const startButton = document.getElementById('startButton');

// 🎭 Modals
const regModal = document.getElementById('registrationModal');
const regNameInput = document.getElementById('playerNameInput');
const regSubmitButton = document.getElementById('registerSubmitButton');
const regHighScoreDisplay = document.getElementById('regHighScore');
const regHighScoreNameDisplay = document.getElementById('regHighScoreName');

const gameOverModal = document.getElementById('gameOverModal');
const finalPlayerNameDisplay = document.getElementById('finalPlayerName');
const finalScoreDisplay = document.getElementById('finalScore');
const newHighScoreMessage = document.getElementById('newHighScoreMessage');
const gameOverRestartButton = document.getElementById('gameOverRestartButton');

const highScoreDisplay = document.getElementById('highScore');
const highScoreNameDisplay = document.getElementById('highScoreName');

// ====== Game Constants ======
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const STAR_SIZE = 40;
const STAR_SPEED = 3;
const BUCKET_WIDTH = 120;
const BUCKET_HEIGHT = 50;
const MAX_LIVES = 3;
const MAX_NAME_LENGTH = 15;
const STAR_COLORS = ['#fffb00', '#00ffff', '#ff33cc', '#ff6600', '#00ff66', '#ff0066', '#0088ff', '#ffffff'];

// ====== Game State ======
let gameState = {
  score: 0,
  lives: MAX_LIVES,
  stars: [],
  bucketX: GAME_WIDTH / 2 - BUCKET_WIDTH / 2,
  isGameOver: false,
  isGameStarted: false,
  starSpawnTimer: 0,
  starSpawnRate: 60,
  highScore: 0,
  highScoreName: 'N/A',
  playerName: 'Player'
};

// ====== HIGH SCORE FUNCTIONS ======
function updateHighScoreDisplay() {
  scoreDisplay.textContent = gameState.score;
  livesDisplay.textContent = gameState.lives;
  highScoreDisplay.textContent = gameState.highScore;
  highScoreNameDisplay.textContent = gameState.highScoreName;
  regHighScoreDisplay.textContent = gameState.highScore;
  regHighScoreNameDisplay.textContent = gameState.highScoreName;
}

function loadHighScore() {
  const savedScore = localStorage.getItem('starCatcherHighScore');
  const savedName = localStorage.getItem('starCatcherHighScoreName');
  if (savedScore) {
    gameState.highScore = parseInt(savedScore);
    gameState.highScoreName = savedName || 'N/A';
  }
}

function checkAndSaveHighScore() {
  const isNew = gameState.score > gameState.highScore;
  if (isNew) {
    gameState.highScore = gameState.score;
    gameState.highScoreName = gameState.playerName;
    localStorage.setItem('starCatcherHighScore', gameState.highScore.toString());
    localStorage.setItem('starCatcherHighScoreName', gameState.playerName);
  }
  return isNew;
}

// ====== MODAL FUNCTIONS ======
function showRegistrationModal() {
  updateHighScoreDisplay();
  regModal.classList.remove('hidden');
  regNameInput.value = gameState.playerName === 'Player' ? '' : gameState.playerName;
  regNameInput.focus();
}

function handleRegistration() {
  let name = regNameInput.value.trim();
  gameState.playerName = name === "" ? "Player" : name.substring(0, MAX_NAME_LENGTH);
  regModal.classList.add('hidden');
  startButton.textContent = `Start Game as ${gameState.playerName}`;
  resetGame();
}

// ====== GAME RESET & END ======
function resetGame() {
  gameState.score = 0;
  gameState.lives = MAX_LIVES;
  gameState.stars = [];
  gameState.bucketX = GAME_WIDTH / 2 - BUCKET_WIDTH / 2;
  gameState.isGameOver = false;
  gameState.isGameStarted = true;
  gameState.starSpawnRate = 60;
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameState.isGameOver = true;
  gameState.isGameStarted = false;
  const isNew = checkAndSaveHighScore();
  finalPlayerNameDisplay.textContent = gameState.playerName;
  finalScoreDisplay.textContent = gameState.score;
  newHighScoreMessage.textContent = isNew 
      ? `🎉 NEW HIGH SCORE by ${gameState.playerName}!` 
      : `High Score: ${gameState.highScoreName} - ${gameState.highScore}`;
  newHighScoreMessage.style.color = isNew ? '#9370db' : '#e6a9cb';
  updateHighScoreDisplay();
  gameOverModal.classList.remove('hidden');
  startButton.textContent = 'Game Over (Restart)';
}

// ====== DRAW FUNCTIONS ======
function drawBucket() {
  ctx.fillStyle = '#a2d2ff';
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#8ec5fc';
  ctx.fillRect(gameState.bucketX, GAME_HEIGHT - BUCKET_HEIGHT, BUCKET_WIDTH, BUCKET_HEIGHT);
  ctx.shadowBlur = 0;
}

function drawStars() {
  gameState.stars.forEach(star => {
    ctx.save();
    ctx.fillStyle = star.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = star.color;
    ctx.font = `${STAR_SIZE}px Orbitron, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', star.x, star.y);
    ctx.restore();
  });
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  drawBucket();
  drawStars();
  ctx.fillStyle = '#000000';
  ctx.font = '16px Orbitron, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Player: ${gameState.playerName}`, 10, 20);
}

// ====== GAME LOGIC ======
function update() {
  if (gameState.isGameOver) return;

  // Move stars and detect collisions
  for (let i = 0; i < gameState.stars.length; i++) {
    let star = gameState.stars[i];
    star.y += STAR_SPEED;

    // Catch star
    if (star.y + STAR_SIZE/2 >= GAME_HEIGHT - BUCKET_HEIGHT &&
        star.y - STAR_SIZE/2 <= GAME_HEIGHT &&
        star.x + STAR_SIZE/2 >= gameState.bucketX &&
        star.x - STAR_SIZE/2 <= gameState.bucketX + BUCKET_WIDTH) {
      gameState.score++;
      gameState.stars.splice(i, 1);
      i--;
      continue;
    }

    // Missed star
    if (star.y - STAR_SIZE/2 > GAME_HEIGHT) {
      gameState.lives--;
      gameState.stars.splice(i, 1);
      i--;
      if (gameState.lives <= 0) endGame();
    }
  }

  // Spawn new stars
  gameState.starSpawnTimer++;
  if (gameState.starSpawnTimer >= gameState.starSpawnRate) {
    gameState.stars.push({
      x: Math.random() * (GAME_WIDTH - STAR_SIZE) + STAR_SIZE / 2,
      y: -STAR_SIZE,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    });
    gameState.starSpawnTimer = 0;
    if (gameState.starSpawnRate > 20) gameState.starSpawnRate -= 0.5; // speed up game gradually
  }

  updateHighScoreDisplay();
}

// ====== EVENTS ======
gameOverRestartButton.addEventListener('click', () => {
  gameOverModal.classList.add('hidden');
  showRegistrationModal();
});
regSubmitButton.addEventListener('click', handleRegistration);
regNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleRegistration();
});
startButton.addEventListener('click', () => {
  if (gameState.isGameOver) showRegistrationModal();
  else if (!gameState.isGameStarted) resetGame();
});

// 🖱 Move bucket with mouse
canvas.addEventListener('mousemove', e => {
  if (gameState.isGameStarted && !gameState.isGameOver) {
    const rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    gameState.bucketX = mouseX - BUCKET_WIDTH / 2;
    gameState.bucketX = Math.max(0, Math.min(GAME_WIDTH - BUCKET_WIDTH, gameState.bucketX));
  }
});

// ====== GAME LOOP ======
function gameLoop() {
  if (gameState.isGameStarted && !gameState.isGameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  } else draw();
}

// ====== INIT GAME ======
window.onload = function() {
  loadHighScore();
  updateHighScoreDisplay();
  showRegistrationModal();
  draw();
};


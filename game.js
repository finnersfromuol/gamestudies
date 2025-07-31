const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Responsive canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =====================
// Core Game Variables
// =====================
let gameRunning = false;
let keys = {};
let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
let bullets = [];
let enemies = [];
let particles = [];
let powerups = [];

let score = 0;
let health = 100;
let godMode = false;
let level = 0;
let timer = 60;
let dashCooldown = 0;
let difficultyLevels = ["Normal", "Medium", "Difficult", "Extreme"];

let damageFlash = 0;


const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 20,
  speed: 4,
  color: "#33aaff",
  angle: 0,
  dashSpeed: 12,
  dashCooldownMax: 120,
};

// =====================
// Event Listeners
// =====================
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "g") godMode = !godMode;
});
document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});
canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener("click", () => {
  shootBullet();
});

// =====================
// UI Controls
// =====================
function startGame() {
  document.getElementById("menu").classList.add("hidden");
  gameRunning = true;
  resetLevel();
  gameLoop();
}

function showInstructions() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("instructions").classList.remove("hidden");
}

function hideInstructions() {
  document.getElementById("instructions").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
}

function nextLevel() {
  document.getElementById("level-complete").classList.add("hidden");
  level++;
  resetLevel();
  gameRunning = true;
  gameLoop();
}

function endGame(win) {
  gameRunning = false;
  if (win) {
    document.getElementById("level-complete").classList.remove("hidden");
  } else {
    document.getElementById("game-over").classList.remove("hidden");
    document.getElementById("final-score").textContent = score;
  }
}

// =====================
// Utility Functions
// =====================
function resetLevel() {
  score = 0;
  health = 100;
  bullets = [];
  enemies = [];
  powerups = [];
  particles = [];
  dashCooldown = 0;
  timer = 60;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
}

function shootBullet() {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 10,
    dy: Math.sin(angle) * 10,
    radius: 5,
    color: "yellow",
  });
}

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) {
    x = Math.random() * canvas.width;
    y = 0;
  } else if (edge === 1) {
    x = canvas.width;
    y = Math.random() * canvas.height;
  } else if (edge === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height;
  } else {
    x = 0;
    y = Math.random() * canvas.height;
  }

  const type = Math.random() < 0.5 ? "melee" : "ranged";
  enemies.push({
    x,
    y,
    radius: 20,
    speed: 1 + level * 0.5,
    type,
    health: 1 + level,
  });
}

function spawnPowerup(x, y) {
  powerups.push({
    x,
    y,
    radius: 10,
    effect: "heal",
    color: "#66ff66",
    duration: 5 * 60,
lifetime: 5 * 60

  });
}

// =====================
// Game Loop
// =====================
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  updateBullets();
  updateEnemies();
  updatePowerups();
  updateUI();

  if (Math.random() < 0.02 + level * 0.01) spawnEnemy();

  // Timer logic
  if (frameCount % 60 === 0) {
    timer--;
    if (timer <= 0) endGame(true);
  }

  if (health <= 0 && !godMode) endGame(false);

  requestAnimationFrame(gameLoop);
  frameCount++;
}

function updatePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Dash mechanic
  if (keys["shift"] && dashCooldown <= 0) {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    player.x += Math.cos(angle) * player.dashSpeed;
    player.y += Math.sin(angle) * player.dashSpeed;
    dashCooldown = player.dashCooldownMax;
  }
  if (dashCooldown > 0) dashCooldown--;

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Draw player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
if (damageFlash > 0) {
  damageFlash--;
  ctx.fillStyle = "red";
} else {
  ctx.fillStyle = godMode ? "cyan" : player.color;
}

  ctx.fillStyle = godMode ? "cyan" : player.color;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -15);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function updateBullets() {
  bullets = bullets.filter((b) => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);
  bullets.forEach((b) => {
    b.x += b.dx;
    b.y += b.dy;

    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateEnemies() {
  enemies.forEach((e, i) => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (e.type === "melee" && dist > 1) {
      e.x += (dx / dist) * e.speed;
      e.y += (dy / dist) * e.speed;
    }
    // Collision with player
if (dist < e.radius + player.radius) {
  if (!godMode) {
    health -= 5;
    damageFlash = 10;
  }
  enemies.splice(i, 1);
}


    // Collision with bullets
    bullets.forEach((b, j) => {
      const d = Math.hypot(b.x - e.x, b.y - e.y);
      if (d < e.radius + b.radius) {
        e.health--;
        bullets.splice(j, 1);
        if (e.health <= 0) {
          enemies.splice(i, 1);
          score += 10;
          if (Math.random() < 0.3) spawnPowerup(e.x, e.y);
        }
      }
    });

    ctx.fillStyle = e.type === "melee" ? "#ff4444" : "#ffcc00";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updatePowerups() {
  powerups.forEach((p, i) => {
    const d = Math.hypot(p.x - player.x, p.y - player.y);
    if (d < p.radius + player.radius) {
      if (p.effect === "heal") {
        health = Math.min(health + 20, 100);
      }
      powerups.splice(i, 1);
    }

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateUI() {
  document.getElementById("timer").innerText = `🕒 ${timer}`;
  document.getElementById("score").innerText = `🏆 ${score}`;

  // Health Bar UI logic
  const healthBar = document.getElementById("health-bar");
  const percent = Math.max(0, health);
  document.getElementById("health-text").innerText = `${percent}%`;
  healthBar.style.setProperty("--health", percent);
  const bar = healthBar.querySelector("::before");

  // Dynamically update via width & color
  const barElement = healthBar;
  barElement.style.backgroundColor =
    percent > 60 ? "green" : percent > 30 ? "orange" : "red";
}

// Frame counter
let frameCount = 0;

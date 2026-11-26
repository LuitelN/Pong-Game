"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const ui = {
  score: document.querySelector("#score"),
  best: document.querySelector("#best"),
  wins: document.querySelector("#wins"),
  overlay: document.querySelector("#overlay"),
  title: document.querySelector("#endTitle"),
  text: document.querySelector("#endText"),
  again: document.querySelector("#again"),
  share: document.querySelector("#share"),
  resume: document.querySelector("#resume"),
  pauseButton: document.querySelector("#pauseButton"),
  checkpointToast: document.querySelector("#checkpointToast"),
  hint: document.querySelector("#startHint"),
  onboarding: document.querySelector("#onboarding"),
  onboardingKicker: document.querySelector("#onboardingKicker"),
  onboardingTitle: document.querySelector("#onboardingTitle"),
  onboardingText: document.querySelector("#onboardingText"),
  arrowDemo: document.querySelector("#arrowDemo"),
  onboardingNext: document.querySelector("#onboardingNext"),
};

const SAVE_KEY = "rally100_save";
const ONBOARDING_KEY = "pong_seen_onboarding_v1";
const MILESTONES = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
const state = loadSave();
let width = 0;
let height = 0;
let mode = "play";
let paused = false;
let speedMultiplier = 1;
let lastTime = 0;
let shake = 0;
let flash = 0;
let audioContext;
let pointerActive = false;
let toastTimer = 0;
const reachedMilestones = new Set();
const keys = new Set();
const particles = [];
const confetti = [];

let onboardingActive = false;
let onboardingDesktopStep = 1;

function isMobileOrTouchDevice() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const touchCapable = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(
    navigator.userAgent,
  );
  const narrowViewport = window.matchMedia?.("(max-width: 600px)").matches;
  return Boolean(
    coarsePointer || touchCapable || mobileUserAgent || narrowViewport,
  );
}

function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {}
}

function completeOnboarding() {
  if (!onboardingActive) return;
  onboardingActive = false;
  markOnboardingSeen();
  ui.onboarding.classList.remove("show");
  keys.clear();
  pointerActive = false;
  lastTime = performance.now();
}

function showDesktopArrowStep() {
  onboardingDesktopStep = 2;
  ui.onboardingKicker.textContent = "KEYBOARD CONTROLS";
  ui.onboardingTitle.textContent = "MOVE WITH ↑ AND ↓";
  ui.onboardingText.textContent =
    "Use the up and down arrow keys (or move your mouse) to guide the pink paddle, pass the ball back to the blue paddle, and reach 1000.";
  ui.arrowDemo.classList.add("show");
  ui.onboardingNext.textContent = "START PLAYING";
}

function advanceOnboarding(event) {
  if (!onboardingActive) return;
  event?.preventDefault?.();
  if (isMobileOrTouchDevice()) {
    completeOnboarding();
  } else if (onboardingDesktopStep === 1) {
    showDesktopArrowStep();
  } else {
    completeOnboarding();
  }
}

function initOnboarding() {
  let seen = false;
  try {
    seen = localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {}
  if (seen) return;

  onboardingActive = true;
  onboardingDesktopStep = 1;
  ui.onboarding.classList.add("show");

  if (isMobileOrTouchDevice()) {
    ui.onboardingKicker.textContent = "PHONE CONTROLS";
    ui.onboardingTitle.textContent = "TOUCH & MOVE";
    ui.onboardingText.textContent =
      "Touch the pink paddle/rectangle and move your finger up or down to pass the ball back to the computer paddle.";
    ui.arrowDemo.classList.remove("show");
    ui.onboardingNext.textContent = "START PLAYING";
  } else {
    ui.onboardingKicker.textContent = "HOW TO PLAY";
    ui.onboardingTitle.textContent = "CONTROL THE PADDLE";
    ui.onboardingText.textContent =
      "Use your mouse or keyboard on a computer. Move the pink paddle up and down to pass the ball back to the computer paddle and reach 1000.";
    ui.arrowDemo.classList.remove("show");
    ui.onboardingNext.textContent = "TAP / ENTER";
  }
}

const ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 8,
  baseSpeed: 480,
  speed: 480,
};
const leftPaddle = { x: 38, y: 0, width: 14, height: 110 };
const rightPaddle = { x: 0, y: 0, width: 14, height: 110, velocity: 0 };

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return {
      currentScore: Math.max(
        0,
        Math.min(1000, Number(saved?.currentScore) || 0),
      ),
      bestScore: Math.max(0, Math.min(1000, Number(saved?.bestScore) || 0)),
      wins: Math.max(0, Number(saved?.wins) || 0),
    };
  } catch {
    return { currentScore: 0, bestScore: 0, wins: 0 };
  }
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {}
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatScore(value, length = 4) {
  return String(Math.max(0, Math.min(9999, value))).padStart(length, "0");
}

function updateHud() {
  ui.score.textContent = formatScore(state.currentScore);
  ui.best.textContent = formatScore(state.bestScore);
  ui.wins.textContent = formatScore(state.wins, 2);
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  leftPaddle.x = Math.max(20, width * 0.035);
  rightPaddle.x = width - Math.max(20, width * 0.035) - rightPaddle.width;
  leftPaddle.height = rightPaddle.height = Math.max(
    68,
    Math.min(110, height * 0.14),
  );
  resetBall(Math.random() < 0.5 ? -1 : 1);
}

function resetBall(direction = -1) {
  ball.x = width * 0.5;
  ball.y = height * 0.5;
  ball.radius = Math.max(6, Math.min(9, width * 0.009));
  ball.baseSpeed = Math.max(390, Math.min(520, width * 0.55));
  ball.speed = ball.baseSpeed * speedMultiplier;
  const angle = Math.random() * 0.7 - 0.35;
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
  leftPaddle.y = height * 0.5 - leftPaddle.height * 0.5;
  rightPaddle.y = height * 0.5 - rightPaddle.height * 0.5;
}

function resetRally() {
  state.currentScore = 0;
  mode = "play";
  paused = false;
  speedMultiplier = 1;
  reachedMilestones.clear();
  ui.overlay.classList.remove("show");
  ui.resume.classList.remove("show");
  updatePauseButton();
  particles.length = 0;
  confetti.length = 0;
  rightPaddle.height = leftPaddle.height = Math.max(
    68,
    Math.min(110, height * 0.14),
  );
  resetBall(Math.random() < 0.5 ? -1 : 1);
  updateHud();
  saveGame();
}

function collides(paddle) {
  return (
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width &&
    ball.y + ball.radius >= paddle.y &&
    ball.y - ball.radius <= paddle.y + paddle.height
  );
}

function deflect(paddle, direction) {
  const paddleCenter = paddle.y + paddle.height * 0.5;
  const relative = clamp(
    (ball.y - paddleCenter) / (paddle.height * 0.5),
    -1,
    1,
  );
  const angle = relative * (Math.PI / 4);
  const maxSpeed = ball.baseSpeed * 1.8 * speedMultiplier;
  ball.speed = Math.min(ball.speed * 1.015, maxSpeed);
  ball.vx = Math.cos(angle) * ball.speed * direction;
  ball.vy = Math.sin(angle) * ball.speed;
}

function hitPaddle(paddle, direction) {
  deflect(paddle, direction);
  ball.x =
    direction > 0
      ? paddle.x - ball.radius
      : paddle.x + paddle.width + ball.radius;
  shake = Math.min(8, shake + 3.5);
  flash = 1;
  burst(ball.x, ball.y, direction > 0 ? "#64f4ff" : "#ff5baf", 10);
  playTone(direction > 0 ? 220 : 330, 0.07);
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 220;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function playTone(frequency, duration) {
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.035, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration,
    );
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {}
}

function playVictoryChime() {
  [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
    setTimeout(() => playTone(frequency, 0.42), index * 110);
  });
}

function endGame() {
  mode = "gameover";
  paused = false;
  state.currentScore = 0;
  speedMultiplier = 1;
  reachedMilestones.clear();
  saveGame();
  updateHud();
  updatePauseButton();
  ui.title.textContent = "RALLY LOST";
  ui.title.className = "loss";
  ui.text.textContent = `BEST ${formatScore(state.bestScore)} • WINS ${state.wins}`;
  ui.resume.classList.remove("show");
  ui.overlay.classList.add("show");
}

function showCheckpointToast(score) {
  clearTimeout(toastTimer);
  ui.checkpointToast.textContent = `CHECKPOINT ${score}! +1.25% SPEED`;
  ui.checkpointToast.classList.add("show");
  toastTimer = setTimeout(
    () => ui.checkpointToast.classList.remove("show"),
    2200,
  );
}

function milestoneFireworks(score) {
  const tier = MILESTONES.indexOf(score);
  if (tier < 0 || reachedMilestones.has(score)) return;
  reachedMilestones.add(score);
  speedMultiplier *= 1.0125;
  ball.vx *= 1.0125;
  ball.vy *= 1.0125;
  const scale = 1 + tier * 0.13;
  const burstCount = Math.min(28, 8 + tier * 2);
  const particleCount = Math.min(170, 24 + tier * 12);
  const spread = 180 + tier * 24;

  flash = Math.min(1.5, 0.65 + tier * 0.08);
  shake = Math.min(12, 3 + tier * 0.7);

  for (let burstIndex = 0; burstIndex < burstCount; burstIndex++) {
    const angle = (burstIndex / burstCount) * Math.PI * 2;
    const originX = width * (0.25 + Math.random() * 0.5);
    const originY = height * (0.18 + Math.random() * 0.28);
    for (let i = 0; i < particleCount / burstCount; i++) {
      const a = angle + (Math.random() - 0.5) * 0.7;
      const speed = spread * (0.45 + Math.random() * 0.75) * scale;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1,
        size: (2 + Math.random() * 3) * scale,
        color: ["#64f4ff", "#ff5baf", "#f7f7f5", "#ffe66d"][i % 4],
        gravity: 50 + tier * 4,
      });
    }
  }

  if (score === 1000) {
    for (let i = 0; i < 220; i++) {
      confetti.push({
        x: width * 0.5 + (Math.random() - 0.5) * width * 0.7,
        y: height * 0.28 + (Math.random() - 0.5) * height * 0.22,
        vx: (Math.random() - 0.5) * 800,
        vy: -350 - Math.random() * 650,
        life: 1.2 + Math.random() * 2,
        size: 4 + Math.random() * 9,
        color: ["#64f4ff", "#ff5baf", "#f7f7f5", "#ffe66d"][i % 4],
        rotation: Math.random() * 6,
      });
    }
  }

  [261.63, 329.63, 392, 523.25].forEach((frequency, index) => {
    setTimeout(
      () => playTone(frequency * (1 + tier * 0.015), 0.18 + tier * 0.012),
      index * 90,
    );
  });
  showCheckpointToast(score);
}

function winGame() {
  mode = "victory";
  state.wins += 1;
  state.bestScore = Math.max(state.bestScore, 1000);
  saveGame();
  updateHud();
  playVictoryChime();

  ui.title.textContent = "1000 VICTORY";
  ui.title.className = "";
  ui.text.textContent = `1000 VOLLEY RALLY COMPLETE • WINS ${state.wins}`;
  ui.resume.classList.remove("show");
  setTimeout(() => ui.overlay.classList.add("show"), 420);
}

function updatePauseButton() {
  ui.pauseButton.textContent = paused ? "▶ RESUME" : "Ⅱ PAUSE";
  ui.pauseButton.setAttribute("aria-pressed", String(paused));
  ui.pauseButton.setAttribute(
    "aria-label",
    paused ? "Resume game" : "Pause game",
  );
}

function togglePause() {
  if (mode === "gameover" || mode === "victory") return;
  paused = !paused;
  keys.clear();
  pointerActive = false;
  lastTime = performance.now();
  updatePauseButton();
  if (paused) {
    ui.title.textContent = "PAUSED";
    ui.title.className = "";
    ui.text.textContent = `VOLLEY ${formatScore(state.currentScore)} • P / ESC TO RESUME`;
    ui.resume.classList.add("show");
    ui.overlay.classList.add("show");
  } else {
    ui.overlay.classList.remove("show");
    ui.resume.classList.remove("show");
  }
}

function updateEffects(dt) {
  const scale = Math.min(dt, 1 / 30);
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx * scale;
    particle.y += particle.vy * scale;
    particle.vy += (particle.gravity || 0) * scale;
    particle.vx *= Math.pow(0.08, scale);
    particle.vy *= Math.pow(0.995, scale);
    particle.life -= scale * 1.35;
    if (particle.life <= 0) particles.splice(i, 1);
  }
  if (particles.length > 500) particles.splice(0, particles.length - 500);

  for (let i = confetti.length - 1; i >= 0; i--) {
    const piece = confetti[i];
    piece.x += piece.vx * scale;
    piece.y += piece.vy * scale;
    piece.vy += 600 * scale;
    piece.rotation += 0.05;
    piece.life -= scale * 0.45;
    if (piece.life <= 0) confetti.splice(i, 1);
  }
  if (confetti.length > 220) confetti.splice(0, confetti.length - 220);
}

function update(dt) {
  if (onboardingActive || paused) return;

  if (mode !== "play") {
    updateEffects(dt);
    return;
  }

  const scale = Math.min(dt, 1 / 30);
  ui.hint.style.opacity = state.currentScore > 0 ? "0" : "1";

  let desiredDirection = 0;
  if (keys.has("ArrowUp") || keys.has("KeyW")) desiredDirection -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) desiredDirection += 1;
  rightPaddle.velocity +=
    (desiredDirection * Math.min(height * 0.85, 720) - rightPaddle.velocity) *
    Math.min(1, scale * 15);
  rightPaddle.y += rightPaddle.velocity * scale;

  const topLimit = height * 0.12;
  const bottomLimit = height - rightPaddle.height - height * 0.04;
  rightPaddle.y = clamp(rightPaddle.y, topLimit, bottomLimit);

  const targetY = clamp(
    ball.y - leftPaddle.height * 0.5,
    topLimit,
    height - leftPaddle.height - height * 0.04,
  );
  const aiSpeed = Math.min(height * 0.72, 410 + state.currentScore * 2.2);
  const aiMove = clamp((targetY - leftPaddle.y) * 8, -aiSpeed, aiSpeed);
  leftPaddle.y = clamp(
    leftPaddle.y + aiMove * scale,
    topLimit,
    height - leftPaddle.height - height * 0.04,
  );

  ball.x += ball.vx * scale;
  ball.y += ball.vy * scale;

  if (ball.y - ball.radius <= height * 0.09) {
    ball.y = height * 0.09 + ball.radius;
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.y + ball.radius >= height - height * 0.035) {
    ball.y = height - height * 0.035 - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }

  if (ball.vx < 0 && collides(leftPaddle)) hitPaddle(leftPaddle, 1);
  if (ball.vx > 0 && collides(rightPaddle)) {
    hitPaddle(rightPaddle, -1);
    state.currentScore = Math.min(1000, state.currentScore + 1);
    state.bestScore = Math.max(state.bestScore, state.currentScore);
    rightPaddle.height = Math.max(
      62,
      Math.min(110, height * 0.14) * (1 - state.currentScore * 0.0019),
    );
    rightPaddle.y = clamp(
      rightPaddle.y,
      topLimit,
      height - rightPaddle.height - height * 0.04,
    );
    if (MILESTONES.includes(state.currentScore))
      milestoneFireworks(state.currentScore);
    updateHud();
    saveGame();
    if (state.currentScore === 1000) winGame();
  }

  if (ball.x > width + ball.radius * 3) endGame();
  if (ball.x < -ball.radius * 3) resetBall(-1);

  shake *= Math.pow(0.04, scale);
  flash *= Math.pow(0.01, scale);
  updateEffects(dt);
}

function draw() {
  ctx.save();
  if (shake > 0)
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(-10, -10, width + 20, height + 20);

  ctx.setLineDash([12, 14]);
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.09);
  ctx.lineTo(width * 0.5, height - height * 0.035);
  ctx.strokeStyle = "rgba(247,247,245,.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#64f4ff";
  ctx.fillRect(
    Math.round(leftPaddle.x),
    Math.round(leftPaddle.y),
    leftPaddle.width,
    Math.round(leftPaddle.height),
  );
  ctx.fillStyle = "#ff5baf";
  ctx.fillRect(
    Math.round(rightPaddle.x),
    Math.round(rightPaddle.y),
    rightPaddle.width,
    Math.round(rightPaddle.height),
  );
  ctx.fillStyle = "#f7f7f5";
  ctx.fillRect(
    Math.round(ball.x - ball.radius),
    Math.round(ball.y - ball.radius),
    Math.round(ball.radius * 2),
    Math.round(ball.radius * 2),
  );

  if (flash > 0.01) {
    ctx.fillStyle = `rgba(247,247,245,${flash * 0.08})`;
    ctx.fillRect(0, 0, width, height);
  }

  for (const particle of particles) {
    ctx.globalAlpha = particle.life;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  ctx.globalAlpha = 1;

  for (const piece of confetti) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.size * 0.5, -piece.size * 0.5, piece.size, piece.size);
    ctx.restore();
  }
  ctx.restore();
}

function loop(time) {
  if (!lastTime) lastTime = time;
  const dt = (time - lastTime) / 1000 || 0;
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  if (onboardingActive) {
    if (event.code === "Enter") {
      event.preventDefault();
      advanceOnboarding(event);
    }
    return;
  }
  if (event.code === "KeyP" || event.code === "Escape") {
    event.preventDefault();
    togglePause();
    return;
  }
  if (["ArrowUp", "ArrowDown", "KeyW", "KeyS"].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});
window.addEventListener("keyup", (event) => keys.delete(event.code));

canvas.addEventListener("pointerdown", (event) => {
  if (onboardingActive) return;
  pointerActive = true;
  canvas.setPointerCapture?.(event.pointerId);
  rightPaddle.y +=
    (event.clientY - rightPaddle.height * 0.5 - rightPaddle.y) * 0.32;
});
canvas.addEventListener("pointermove", (event) => {
  if (pointerActive) {
    rightPaddle.y +=
      (event.clientY - rightPaddle.height * 0.5 - rightPaddle.y) * 0.32;
  }
});
canvas.addEventListener("pointerup", () => {
  pointerActive = false;
});
canvas.addEventListener("pointercancel", () => {
  pointerActive = false;
});

ui.onboardingNext.addEventListener("click", advanceOnboarding);
ui.onboarding.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (event.target === ui.onboardingNext) return;
  advanceOnboarding(event);
});

ui.again.addEventListener("click", resetRally);
ui.resume.addEventListener("click", togglePause);
ui.pauseButton.addEventListener("click", togglePause);
ui.share.addEventListener("click", async () => {
  const text = `I reached ${state.bestScore}-volleys in RALLY 100! 🏓\nBest: ${state.bestScore} • Wins: ${state.wins}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "RALLY 100", text });
    } else {
      await navigator.clipboard.writeText(text);
      ui.share.textContent = "COPIED";
      setTimeout(() => {
        ui.share.textContent = "SHARE";
      }, 1200);
    }
  } catch {}
});

resize();
updateHud();
initOnboarding();
requestAnimationFrame(loop);

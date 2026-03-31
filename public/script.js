const cameraPreview = document.getElementById("cameraPreview");
const snapshotCanvas = document.getElementById("snapshotCanvas");
const snapshotImage = document.getElementById("snapshotImage");
const cameraStartButton = document.getElementById("cameraStartButton");
const takePhotoButton = document.getElementById("takePhotoButton");
const retakePhotoButton = document.getElementById("retakePhotoButton");
const actionButton = document.getElementById("actionButton");
const gameCanvas = document.getElementById("gameCanvas");
const scoreValue = document.getElementById("scoreValue");
const missValue = document.getElementById("missValue");
const statusValue = document.getElementById("statusValue");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const finalScore = document.getElementById("finalScore");
const finalMessage = document.getElementById("finalMessage");
const scoreForm = document.getElementById("scoreForm");
const formStatus = document.getElementById("formStatus");
const nameInput = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const adminResetButton = document.getElementById("adminResetButton");
const adminResetStatus = document.getElementById("adminResetStatus");

const ctx = gameCanvas.getContext("2d");
const snapshotContext = snapshotCanvas.getContext("2d");

const game = {
  state: "idle",
  score: 0,
  misses: 0,
  animationFrame: 0,
  speed: 7.5,
  playerX: 280,
  playerY: 0,
  doors: [],
  latestTapTime: 0,
  headImage: null,
  photoDataUrl: "",
  activeStream: null,
  lastDoorSpawnAt: 0,
  endMessage: "",
};

function syncLayoutMode() {
  const shouldFocusGame = game.state === "ready" || game.state === "running" || game.state === "gameover" || game.state === "submitting";
  document.body.classList.toggle("game-focus", shouldFocusGame);
}

function updateHud() {
  scoreValue.textContent = String(game.score);
  missValue.textContent = `${game.misses} / 3`;

  const labels = {
    idle: "Ta ett foto for att borja",
    ready: "Tryck start och knacka pa dorrar",
    running: "Tryck pa skarmen vid dorren",
    gameover: "Rundan ar slut",
    submitting: "Skickar in resultat",
  };

  statusValue.textContent = labels[game.state] || "";
  syncLayoutMode();
}

function resetDoors() {
  game.doors = [];
  for (let index = 0; index < 4; index += 1) {
    spawnDoor(900 + index * 280);
  }
}

function spawnDoor(x = gameCanvas.width + Math.random() * 240) {
  const width = 88 + Math.random() * 28;
  const height = 160 + Math.random() * 220;
  const hasVisibleSosse = game.doors.some((door) => door.isSosse && !door.missed && !door.knocked);
  const isSosse = !hasVisibleSosse && Math.random() < 0.12;
  game.doors.push({
    id: crypto.randomUUID(),
    x,
    width,
    height,
    knocked: false,
    missed: false,
    isSosse,
  });
}

function getGroundY() {
  return gameCanvas.height - 130;
}

function drawBackground() {
  const groundY = getGroundY();

  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  ctx.fillStyle = "#dff2ff";
  ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

  ctx.fillStyle = "#c0e4ff";
  ctx.fillRect(0, groundY - 18, gameCanvas.width, 18);

  ctx.fillStyle = "#3d6e4d";
  ctx.fillRect(0, groundY, gameCanvas.width, gameCanvas.height - groundY);

  for (let stripeX = -(performance.now() * 0.08) % 80; stripeX < gameCanvas.width + 80; stripeX += 80) {
    ctx.fillStyle = "#87b999";
    ctx.fillRect(stripeX, groundY + 34, 42, 12);
  }
}

function drawDoor(door) {
  const groundY = getGroundY();
  const topY = groundY - door.height;

  ctx.save();
  ctx.translate(door.x, topY);

  ctx.fillStyle = door.knocked ? "#64b5f6" : "#915f3d";
  ctx.fillRect(0, 0, door.width, door.height);

  ctx.fillStyle = door.knocked ? "#e9f6ff" : "#c98b57";
  ctx.fillRect(10, 12, door.width - 20, door.height - 24);

  ctx.fillStyle = "#102b45";
  ctx.beginPath();
  ctx.arc(door.width - 18, door.height / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  if (door.isSosse && !door.knocked && !door.missed) {
    ctx.fillStyle = "#d93d34";
    ctx.fillRect(14, 16, door.width - 28, 18);

    ctx.fillStyle = "#ffe0cc";
    ctx.beginPath();
    ctx.arc(door.width / 2, 52, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#13324d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(door.width / 2 - 8, 50);
    ctx.lineTo(door.width / 2 - 2, 50);
    ctx.moveTo(door.width / 2 + 2, 50);
    ctx.lineTo(door.width / 2 + 8, 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(door.width / 2, 60, 8, 0.2, Math.PI - 0.2, true);
    ctx.stroke();

    ctx.fillStyle = "#fff0f0";
    ctx.font = '700 16px "IBM Plex Mono", monospace';
    ctx.fillText("SOSSE", 14, 30);
  }

  if (door.knocked) {
    ctx.fillStyle = "#ffffff";
    ctx.font = '700 24px "IBM Plex Mono", monospace';
    ctx.fillText(`+${Math.round(door.height / 12)}`, 12, -12);
  }

  ctx.restore();
}

function drawPlayer() {
  const groundY = getGroundY();
  const bodyTop = groundY - 180;
  const tapping = performance.now() - game.latestTapTime < 220;

  ctx.strokeStyle = "#11304e";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(game.playerX, bodyTop + 90);
  ctx.lineTo(game.playerX, bodyTop + 180);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(game.playerX, bodyTop + 114);
  ctx.lineTo(game.playerX - 44, bodyTop + 146);
  ctx.moveTo(game.playerX, bodyTop + 114);
  ctx.lineTo(game.playerX + (tapping ? 68 : 44), bodyTop + (tapping ? 102 : 146));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(game.playerX, bodyTop + 180);
  ctx.lineTo(game.playerX - 36, bodyTop + 250);
  ctx.moveTo(game.playerX, bodyTop + 180);
  ctx.lineTo(game.playerX + 36, bodyTop + 250);
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(game.playerX, bodyTop + 48, 44, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (game.headImage) {
    ctx.drawImage(game.headImage, game.playerX - 44, bodyTop + 4, 88, 88);
  } else {
    ctx.fillStyle = "#ffe6cc";
    ctx.fillRect(game.playerX - 44, bodyTop + 4, 88, 88);
  }
  ctx.restore();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(game.playerX, bodyTop + 48, 44, 0, Math.PI * 2);
  ctx.stroke();
}

function render() {
  drawBackground();
  game.doors.forEach(drawDoor);
  drawPlayer();
}

function markMiss(door) {
  if (door.knocked || door.missed) {
    return;
  }

  door.missed = true;

  if (door.isSosse) {
    return;
  }

  game.misses += 1;
  updateHud();

  if (game.misses >= 3) {
    endGame("Tre missade dorrar. Fyll i dina uppgifter for att komma med pa highscore-listan.");
  }
}

function gameLoop() {
  if (game.state !== "running") {
    render();
    return;
  }

  for (const door of game.doors) {
    door.x -= game.speed;

    if (!door.knocked && !door.missed && door.x + door.width < game.playerX - 26) {
      markMiss(door);
    }
  }

  game.doors = game.doors.filter((door) => door.x + door.width > -120);

  if (game.doors.length < 5) {
    const furthestDoor = game.doors.reduce((max, door) => Math.max(max, door.x), 0);
    spawnDoor(Math.max(gameCanvas.width + 120, furthestDoor + 250 + Math.random() * 140));
  }

  render();
  game.animationFrame = requestAnimationFrame(gameLoop);
}

function handleTap() {
  if (game.state === "ready") {
    startGame();
    return;
  }

  if (game.state !== "running") {
    return;
  }

  game.latestTapTime = performance.now();

  const targetDoor = game.doors.find((door) => {
    const distance = door.x - (game.playerX + 40);
    return !door.knocked && !door.missed && distance > -15 && distance < 80;
  });

  if (!targetDoor) {
    return;
  }

  if (targetDoor.isSosse) {
    targetDoor.knocked = true;
    endGame("Aj da! Du knackade pa en Sosse och akte ut direkt.");
    return;
  }

  targetDoor.knocked = true;
  game.score += Math.round(targetDoor.height / 12);
  updateHud();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 720 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    game.activeStream = stream;
    cameraPreview.srcObject = stream;
    takePhotoButton.disabled = false;
    statusValue.textContent = "Ta en bild nar du ar redo";
  } catch (error) {
    statusValue.textContent = "Kameran kunde inte starta";
    console.error(error);
  }
}

function stopCamera() {
  if (!game.activeStream) {
    return;
  }

  game.activeStream.getTracks().forEach((track) => track.stop());
  game.activeStream = null;
}

function takePhoto() {
  const sourceWidth = cameraPreview.videoWidth || 720;
  const sourceHeight = cameraPreview.videoHeight || 720;

  // Crop tighter around the center so the player head becomes a clearer portrait.
  const cropWidth = sourceWidth * 0.54;
  const cropHeight = sourceHeight * 0.72;
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = Math.max(0, sourceHeight * 0.08);

  snapshotContext.clearRect(0, 0, snapshotCanvas.width, snapshotCanvas.height);
  snapshotContext.save();
  snapshotContext.translate(snapshotCanvas.width, 0);
  snapshotContext.scale(-1, 1);
  snapshotContext.drawImage(
    cameraPreview,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    snapshotCanvas.width,
    snapshotCanvas.height,
  );
  snapshotContext.restore();

  const dataUrl = snapshotCanvas.toDataURL("image/png");
  game.photoDataUrl = dataUrl;
  snapshotImage.src = dataUrl;
  snapshotImage.hidden = false;
  cameraPreview.hidden = true;
  retakePhotoButton.hidden = false;
  actionButton.disabled = false;
  game.state = "ready";
  updateHud();

  const image = new Image();
  image.onload = () => {
    game.headImage = image;
    render();
  };
  image.src = dataUrl;

  stopCamera();
}

function retakePhoto() {
  game.photoDataUrl = "";
  game.headImage = null;
  snapshotImage.hidden = true;
  cameraPreview.hidden = false;
  retakePhotoButton.hidden = true;
  actionButton.disabled = true;
  game.state = "idle";
  updateHud();
  startCamera();
  render();
}

function startGame() {
  if (!game.photoDataUrl) {
    return;
  }

  game.score = 0;
  game.misses = 0;
  game.state = "running";
  updateHud();
  actionButton.textContent = "Tryck pa skarmen for att knacka";
  actionButton.disabled = true;
  resetDoors();
  cancelAnimationFrame(game.animationFrame);
  game.animationFrame = requestAnimationFrame(gameLoop);
}

function endGame(message = "Fyll i dina uppgifter for att komma med pa highscore-listan.") {
  game.state = "gameover";
  game.endMessage = message;
  updateHud();
  cancelAnimationFrame(game.animationFrame);
  finalScore.textContent = String(game.score);
  finalMessage.textContent = game.endMessage;
  gameOverOverlay.classList.remove("hidden");
  gameOverOverlay.setAttribute("aria-hidden", "false");
}

async function submitScore(event) {
  event.preventDefault();

  formStatus.textContent = "Skickar in...";
  game.state = "submitting";
  updateHud();

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput.value,
        email: emailInput.value,
        score: game.score,
        photoDataUrl: game.photoDataUrl,
      }),
    });

    if (!response.ok) {
      throw new Error("Kunde inte skicka in resultatet.");
    }

    const result = await response.json();
    formStatus.textContent = result.emailStatus.delivered
      ? "Tack! Du ar nu med pa topplistan."
      : "Tack! Resultatet sparades, men e-post ar inte konfigurerad an.";

    setTimeout(resetExperience, 1800);
  } catch (error) {
    formStatus.textContent = error.message;
    game.state = "gameover";
    updateHud();
  }
}

function resetExperience() {
  stopCamera();
  cancelAnimationFrame(game.animationFrame);
  game.score = 0;
  game.misses = 0;
  game.state = "idle";
  game.photoDataUrl = "";
  game.headImage = null;
  snapshotImage.hidden = true;
  cameraPreview.hidden = false;
  retakePhotoButton.hidden = true;
  takePhotoButton.disabled = true;
  actionButton.textContent = "Starta spel";
  actionButton.disabled = true;
  scoreForm.reset();
  formStatus.textContent = "";
  finalMessage.textContent = "Fyll i dina uppgifter for att komma med pa highscore-listan.";
  gameOverOverlay.classList.add("hidden");
  gameOverOverlay.setAttribute("aria-hidden", "true");
  resetDoors();
  updateHud();
  render();
  startCamera();
}

async function resetScoresFromKiosk() {
  const confirmed = window.confirm("Ar du saker pa att du vill nollstalla highscore-listan?");

  if (!confirmed) {
    return;
  }

  adminResetButton.disabled = true;
  adminResetStatus.textContent = "Nollstaller highscore...";

  try {
    const response = await fetch("/api/scores/reset", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Kunde inte nollstalla highscore-listan.");
    }

    adminResetStatus.textContent = "Highscore-listan ar nollstalld.";
  } catch (error) {
    adminResetStatus.textContent = error.message;
  } finally {
    setTimeout(() => {
      adminResetStatus.textContent = "";
    }, 3000);
    adminResetButton.disabled = false;
  }
}

cameraStartButton.addEventListener("click", startCamera);
takePhotoButton.addEventListener("click", takePhoto);
retakePhotoButton.addEventListener("click", retakePhoto);
actionButton.addEventListener("click", handleTap);
scoreForm.addEventListener("submit", submitScore);
adminResetButton.addEventListener("click", resetScoresFromKiosk);
gameCanvas.addEventListener("pointerdown", handleTap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    handleTap();
  }
});

resetDoors();
updateHud();
render();

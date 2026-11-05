/* =========================================
   CYBERPULSE TETRIS — app.js
   ========================================= */

// ---- CONSTANTES ------------------------------------------------

const COLS   = 10;
const ROWS   = 20;
const BLOCK  = 30; // px por célula

// Cores das peças (estilo neon)
const COLORS = [
  null,
  '#00f0ff', // I — ciano
  '#7c3aed', // O — roxo
  '#f59e0b', // T — âmbar
  '#22c55e', // S — verde
  '#ef4444', // Z — vermelho
  '#3b82f6', // J — azul
  '#f97316', // L — laranja
];

// Tetrominós: cada peça é uma matriz 2D (rotação base)
const PIECES = [
  null,
  // I
  [[0,0,0,0],
   [1,1,1,1],
   [0,0,0,0],
   [0,0,0,0]],
  // O
  [[2,2],
   [2,2]],
  // T
  [[0,3,0],
   [3,3,3],
   [0,0,0]],
  // S
  [[0,4,4],
   [4,4,0],
   [0,0,0]],
  // Z
  [[5,5,0],
   [0,5,5],
   [0,0,0]],
  // J
  [[6,0,0],
   [6,6,6],
   [0,0,0]],
  // L
  [[0,0,7],
   [7,7,7],
   [0,0,0]],
];

// Pontuação por número de linhas limpas de uma vez
const LINE_POINTS = [0, 100, 300, 500, 800];

// ---- ESTADO DO JOGO --------------------------------------------

const canvas     = document.getElementById('board');
const ctx        = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx    = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg   = document.getElementById('overlay-msg');
const overlayScore = document.getElementById('overlay-score');

let board, piece, nextPiece, score, level, lines, dropInterval, lastTime, animId, running;

// ---- INICIALIZAÇÃO ---------------------------------------------

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const id = Math.floor(Math.random() * 7) + 1;
  const matrix = PIECES[id].map(row => [...row]);
  return {
    id,
    matrix,
    x: Math.floor(COLS / 2) - Math.floor(matrix[0].length / 2),
    y: 0,
  };
}

function init() {
  board        = createBoard();
  score        = 0;
  level        = 1;
  lines        = 0;
  dropInterval = 800;
  lastTime     = 0;
  piece        = randomPiece();
  nextPiece    = randomPiece();
  updateHUD();
}

// ---- HUD -------------------------------------------------------

function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

// ---- COLISÃO ---------------------------------------------------

function collides(p, dx, dy, mat) {
  const matrix = mat || p.matrix;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (!matrix[r][c]) continue;
      const nx = p.x + c + dx;
      const ny = p.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

// ---- ROTAÇÃO (SRS simplificado) --------------------------------

function rotate(matrix) {
  const n = matrix.length;
  const m = matrix[0].length;
  const result = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function rotatePiece() {
  const rotated = rotate(piece.matrix);
  // Tenta rotacionar; se colide, tenta wall kicks ±1
  const kicks = [0, 1, -1, 2, -2];
  for (const kick of kicks) {
    if (!collides(piece, kick, 0, rotated)) {
      piece.matrix = rotated;
      piece.x += kick;
      return;
    }
  }
}

// ---- MOVIMENTO -------------------------------------------------

function moveLeft()  { if (!collides(piece, -1, 0)) piece.x--; }
function moveRight() { if (!collides(piece,  1, 0)) piece.x++; }

function moveDown() {
  if (!collides(piece, 0, 1)) {
    piece.y++;
    return true;
  }
  lock();
  return false;
}

// ---- LOCK & LINHAS ---------------------------------------------

function lock() {
  // Fixa a peça no board
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const ny = piece.y + r;
      if (ny < 0) { gameOver(); return; }
      board[ny][piece.x + c] = piece.matrix[r][c];
    }
  }
  clearLines();
  spawnNext();
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++; // recheck same index
    }
  }
  if (cleared > 0) {
    lines  += cleared;
    score  += LINE_POINTS[cleared] * level;
    level   = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 800 - (level - 1) * 70);
    updateHUD();
  }
}

function spawnNext() {
  piece     = nextPiece;
  nextPiece = randomPiece();
  if (collides(piece, 0, 0)) { gameOver(); }
}

// ---- GAME OVER -------------------------------------------------

function gameOver() {
  running = false;
  cancelAnimationFrame(animId);
  overlayTitle.innerHTML = 'GAME<br/><span>OVER</span>';
  overlayMsg.innerHTML   = 'Pressione <kbd>Enter</kbd> para jogar novamente';
  overlayScore.innerHTML = `Pontuação: <strong>${score}</strong> &nbsp;|&nbsp; Nível: <strong>${level}</strong> &nbsp;|&nbsp; Linhas: <strong>${lines}</strong>`;
  overlay.classList.remove('hidden');
}

// ---- RENDER ----------------------------------------------------

function drawBlock(context, x, y, colorId, size) {
  const color = COLORS[colorId];
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // brilho no topo/esquerda
  context.fillStyle = 'rgba(255,255,255,0.18)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 3);
  context.fillRect(x * size + 1, y * size + 1, 3, size - 2);
}

function drawBoard() {
  // Limpa
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Grid sutil
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, canvas.height); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(canvas.width, r * BLOCK); ctx.stroke();
  }

  // Board fixo
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) drawBlock(ctx, c, r, board[r][c], BLOCK);
    }
  }

  // Ghost piece (sombra de onde vai cair)
  let ghostY = piece.y;
  while (!collides(piece, 0, ghostY - piece.y + 1)) ghostY++;
  if (ghostY !== piece.y) {
    ctx.globalAlpha = 0.2;
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c])
          drawBlock(ctx, piece.x + c, ghostY + r, piece.matrix[r][c], BLOCK);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Peça ativa
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (piece.matrix[r][c])
        drawBlock(ctx, piece.x + c, piece.y + r, piece.matrix[r][c], BLOCK);
    }
  }
}

function drawNext() {
  const NBLOCK = 20;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const m = nextPiece.matrix;
  const offsetX = Math.floor((nextCanvas.width  / NBLOCK - m[0].length) / 2);
  const offsetY = Math.floor((nextCanvas.height / NBLOCK - m.length)    / 2);
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) drawBlock(nextCtx, offsetX + c, offsetY + r, m[r][c], NBLOCK);
    }
  }
}

// ---- GAME LOOP -------------------------------------------------

function loop(timestamp) {
  if (!running) return;
  const delta = timestamp - lastTime;
  if (delta >= dropInterval) {
    moveDown();
    lastTime = timestamp;
  }
  drawBoard();
  drawNext();
  animId = requestAnimationFrame(loop);
}

// ---- CONTROLES -------------------------------------------------

document.addEventListener('keydown', e => {
  if (!running) {
    if (e.code === 'Enter') startGame();
    return;
  }
  switch (e.code) {
    case 'ArrowLeft':  e.preventDefault(); moveLeft();   break;
    case 'ArrowRight': e.preventDefault(); moveRight();  break;
    case 'ArrowDown':  e.preventDefault(); moveDown();   break;
    case 'Space':      e.preventDefault(); rotatePiece(); break;
    case 'ArrowUp':    e.preventDefault(); rotatePiece(); break;
  }
});

// Suporte a toque mobile (swipe básico)
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!running) { startGame(); return; }
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx >  20) moveRight();
    if (dx < -20) moveLeft();
  } else {
    if (dy >  20) moveDown();
    if (dy < -20) rotatePiece();
  }
}, { passive: true });

// ---- START -----------------------------------------------------

function startGame() {
  overlay.classList.add('hidden');
  init();
  running  = true;
  lastTime = 0;
  animId   = requestAnimationFrame(loop);
}

// Tela inicial
overlayTitle.innerHTML = 'Cyber<span>Pulse</span>';
overlayMsg.innerHTML   = 'Pressione <kbd>Enter</kbd> para começar';
overlayScore.innerHTML = '';

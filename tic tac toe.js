// DOM references
const boardEl     = document.getElementById("board");
const statusEl    = document.getElementById("status");
const btnPVP      = document.getElementById("btn-pvp");
const btnPVC      = document.getElementById("btn-pvc");
const btnRestart  = document.getElementById("btn-restart");
const btnClear    = document.getElementById("btn-clear");

// Game state
let cells = [];
let state = Array(9).fill("");
let currentPlayer = "X";
let gameActive = false;
let vsComputer = false;

// Winning patterns
const WIN_PATTERNS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

// Build board cells
function createBoard(){
  boardEl.innerHTML = "";
  cells = [];

  for (let i = 0; i < 9; i++){
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.type = "button";
    cell.setAttribute("aria-label", `Cell ${i+1}`);
    cell.dataset.index = i;
    cell.addEventListener("click", onCellClick);
    boardEl.appendChild(cell);
    cells.push(cell);
  }
}

function startGame(vsCPU){
  vsComputer   = vsCPU;
  currentPlayer = "X";
  state        = Array(9).fill("");
  gameActive   = true;

  clearWinnerLines();
  createBoard();

  statusEl.textContent = "X's Turn";
  btnRestart.classList.remove("d-none");
  btnClear.classList.add("d-none"); // only show after a game ends
}

function onCellClick(e){
  const idx = +e.currentTarget.dataset.index;
  if (!gameActive || state[idx] !== "") return;

  makeMove(idx, currentPlayer);

  // after player's move, if vs computer and still active, let CPU play
  if (gameActive && vsComputer && currentPlayer === "O"){
    setTimeout(cpuMove, 450);
  }
}

function makeMove(index, player){
  state[index] = player;
  const cellEl = cells[index];
  cellEl.textContent = player;
  cellEl.classList.add("taken");

  const winPattern = getWinningPattern(player);
  if (winPattern){
    endWithWinner(player, winPattern);
    return;
  }

  if (isDraw()){
    endWithDraw();
    return;
  }

  // Switch turn
  currentPlayer = (player === "X") ? "O" : "X";
  statusEl.textContent = `${currentPlayer}'s Turn`;
}

function cpuMove(){
  // Simple CPU: random available move
  const emptyIndices = state.map((v,i)=> v==="" ? i : null).filter(v=>v!==null);
  if (emptyIndices.length === 0) return;

  const pick = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  makeMove(pick, "O");
}

function getWinningPattern(player){
  for (const p of WIN_PATTERNS){
    if (p.every(i => state[i] === player)) return p;
  }
  return null;
}

function isDraw(){
  return state.every(v => v !== "");
}

function endWithWinner(player, pattern){
  gameActive = false;
  statusEl.textContent = `${player} Wins! 🎉`;

  // highlight winning cells
  pattern.forEach(i => cells[i].classList.add("win"));

  // draw animated line
  drawAnimatedLine(pattern);

  // show controls
  btnClear.classList.remove("d-none");
}

function endWithDraw(){
  gameActive = false;
  statusEl.textContent = "It's a Draw!";
  btnClear.classList.remove("d-none");
}

function clearBoardKeepMode(){
  // Clears marks but keeps current mode & active state
  state.fill("");
  cells.forEach(c => {
    c.textContent = "";
    c.classList.remove("taken","win");
  });
  clearWinnerLines();
  currentPlayer = "X";
  statusEl.textContent = "X's Turn";
  gameActive = true;
}

/* ---------- Winning Line (animated) ---------- */
function drawAnimatedLine(pattern){
  const line = document.createElement("div");
  line.className = "winner-line";
  // compute endpoints using centers of first and last winning cells
  const rectBoard = boardEl.getBoundingClientRect();
  const rectA = cells[pattern[0]].getBoundingClientRect();
  const rectC = cells[pattern[2]].getBoundingClientRect();

  const x1 = rectA.left + rectA.width/2 - rectBoard.left;
  const y1 = rectA.top  + rectA.height/2 - rectBoard.top;
  const x2 = rectC.left + rectC.width/2 - rectBoard.left;
  const y2 = rectC.top  + rectC.height/2 - rectBoard.top;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const angleDeg = Math.atan2(y2 - y1, x2 - x1) * 180/Math.PI;

  // place line starting at (x1,y1) with full width set,
  // but animate from scaleX(0) -> scaleX(1)
  line.style.left = `${x1}px`;
  line.style.top  = `${y1 - 4}px`; // offset by half thickness (approx)
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angleDeg}deg) scaleX(0)`;

  boardEl.parentElement.appendChild(line); // inside board-wrapper

  // Force reflow then animate
  requestAnimationFrame(() => {
    line.classList.add("animate");
    line.style.transform = `rotate(${angleDeg}deg) scaleX(1)`;
  });
}

function clearWinnerLines(){
  document.querySelectorAll(".winner-line").forEach(el => el.remove());
}

/* ---------- Buttons ---------- */
btnPVP.addEventListener("click", () => startGame(false));
btnPVC.addEventListener("click", () => startGame(true));

btnRestart.addEventListener("click", () => {
  // restart entire game (keep mode)
  startGame(vsComputer);
});

btnClear.addEventListener("click", () => {
  // clear board but keep mode & keep the match going
  clearBoardKeepMode();
});

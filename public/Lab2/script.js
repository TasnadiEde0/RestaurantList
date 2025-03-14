let turnOfX = true;
let table;
let myCanvas;
let n = 3;
let m = 3;
let gameOn;

function resetTable() {
  n = document.getElementById('myDropDownListN').value;
  m = document.getElementById('myDropDownListM').value;

  table = [];
  for (let i = 0; i < n; i++) {
    table[i] = [];
    for (let j = 0; j < n; j++) {
      table[i][j] = '';
    }
  }

  myCanvas.width = 100 * n + 40;
  myCanvas.height = 100 * n + 40;

  for (let i = 0; i <= n; i++) {
    let line = myCanvas.getContext('2d');
    line.moveTo(20 + 100 * i, 20);
    line.lineTo(20 + 100 * i, n * 100 + 20);
    line.stroke();
    line = myCanvas.getContext('2d');
    line.moveTo(20, 20 + 100 * i);
    line.lineTo(n * 100 + 20, 20 + 100 * i);
    line.stroke();
  }

  gameOn = true;
  document.getElementById('myDisplay').textContent = 'Turn of : X';
}

function checkVictoryLoop(x, y, dirX, dirY, currentChar) {
  let k = 0;
  for (let i = 1; i < n; i++) {
    if (
      dirX * i + x >= 0 &&
      dirX * i + x <= n - 1 &&
      dirY * i + y >= 0 &&
      dirY * i + y <= n - 1 &&
      table[dirX * i + x][dirY * i + y] === currentChar
    ) {
      k++;
    } else {
      break;
    }
  }
  return k;
}

function checkVictory(x, y) {
  const dirs = [
    [1, 1],
    [-1, 1],
    [0, 1],
    [1, 0],
  ];
  const currentChar = turnOfX ? 'X' : 'O';

  for (let i = 0; i < 4; i++) {
    let k = 1;
    const dirX = dirs[i][0];
    const dirY = dirs[i][1];

    k += checkVictoryLoop(x, y, dirX, dirY, currentChar);

    k += checkVictoryLoop(x, y, -dirX, -dirY, currentChar);

    if (k >= m) {
      console.log('Victory');
      gameOn = false;
      document.getElementById('myDisplay').textContent = `${turnOfX ? 'X' : 'O'} has won the game`;
    }
  }
}

function checkTie() {
  let noMoreFreeSpaces = true;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (table[i][j] === '') {
        noMoreFreeSpaces = false;
      }
    }
  }
  if (noMoreFreeSpaces) {
    gameOn = false;
    document.getElementById('myDisplay').textContent = 'Tie';
  }
}

function squareClicked(event) {
  const x = Math.ceil((event.clientX - myCanvas.getBoundingClientRect().left - 20) / 100) - 1;
  const y = Math.ceil((event.clientY - myCanvas.getBoundingClientRect().top - 20) / 100) - 1;

  if (x >= 0 && x <= n - 1 && y >= 0 && y <= n - 1 && table[x][y] === '' && gameOn) {
    const letter = myCanvas.getContext('2d');
    letter.font = '100px Arial';
    if (turnOfX) {
      table[x][y] = 'X';
      letter.fillText('X', 20 + x * 100 + 15, 20 + y * 100 + 85);
    } else {
      table[x][y] = 'O';
      letter.fillText('O', 20 + x * 100 + 15, 20 + y * 100 + 85);
    }

    checkVictory(x, y);

    if (gameOn) {
      turnOfX = !turnOfX;
      document.getElementById('myDisplay').textContent = `Turn of : ${turnOfX ? 'X' : 'O'}`;
      checkTie();
    }
  }
}

window.onload = () => {
  myCanvas = document.getElementById('myCanvas');
  document.getElementById('myButton').addEventListener('click', resetTable);
  myCanvas.addEventListener('mousedown', squareClicked);
  resetTable();
};

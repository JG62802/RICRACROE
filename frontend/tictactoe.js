let cells = document.querySelectorAll(".cell");
let status = document.getElementById("status");
let timerDisplay = document.getElementById("timer"); // Timer display element
let currentPlayer = "X";
let timer; // Timer for the turn system
let countdown; // Countdown interval
let gameOver = false; // Track if the game is over

const socket = new WebSocket('ws://localhost:8080');
let playerId;

// Handle messages from the server
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'assignPlayer') {
        playerId = data.player;
        status.textContent = `You are Player ${playerId}`;
    } else if (data.type === 'updateGame') {
        data.gameState.forEach((mark, index) => {
            const cell = cells[index];
            if (mark && !cell.classList.contains('marked')) {
                cell.classList.add('marked');
                cell.style.backgroundImage = mark === 'X' ? "url('x.png')" : "url('o.png')";
                cell.style.backgroundSize = "cover";
            }
        });

        currentPlayer = data.currentPlayer; // Update the current player
        status.textContent = `Player ${currentPlayer}'s Turn`;

        if (data.winner) {
            endGame(data.winner); // End the game if a winner is detected
        } else if (data.draw) {
            endGame("Draw"); // End the game if it's a draw
        }
    }
};

function startTurnTimer() {
    if (gameOver) return; // Stop the timer if the game is over

    clearTimeout(timer); // Clear any existing timer
    clearInterval(countdown); // Clear any existing countdown interval

    let timeRemaining = 20; // Set the countdown duration
    timerDisplay.textContent = `Time Remaining: ${timeRemaining} seconds`;

    countdown = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = `Time Remaining: ${timeRemaining} seconds`;

        if (timeRemaining <= 0) {
            clearInterval(countdown); // Stop the countdown
            currentPlayer = currentPlayer === "X" ? "O" : "X"; // Switch player
            status.textContent = `Player ${currentPlayer}'s Turn (Auto-switched)`;
            startTurnTimer(); // Restart the timer for the next turn
        }
    }, 1000); // Update every second

    timer = setTimeout(() => {
        clearInterval(countdown); // Stop the countdown
        currentPlayer = currentPlayer === "X" ? "O" : "X"; // Switch player
        status.textContent = `Player ${currentPlayer}'s Turn (Auto-switched)`;
        startTurnTimer(); // Restart the timer for the next turn
    }, 20000); // 20 seconds
}

function endGame(winner) {
    gameOver = true; // Mark the game as over
    if (winner === "Draw") {
        status.textContent = "It's a Draw!";
    } else {
        status.textContent = `Player ${winner} Wins!`;
    }
    timerDisplay.textContent = ""; // Clear the timer display
    cells.forEach(cell => cell.removeEventListener("click", handleCellClick)); // Disable further clicks
    clearTimeout(timer); // Stop the timer
    clearInterval(countdown); // Stop the countdown
}

function handleCellClick(event) {
    if (gameOver) return; // Prevent clicks if the game is over

    const cell = event.target;
    const cellIndex = Array.from(cells).indexOf(cell);

    // Ensure the cell is not already marked and it's the player's turn
    if (!cell.classList.contains("marked") && currentPlayer === playerId) {
        socket.send(JSON.stringify({ type: 'updateGame', cellIndex, player: playerId }));
    }
}

function checkWinner() {
    const winningCombinations = [
        [0, 1, 2], // Row 1
        [3, 4, 5], // Row 2
        [6, 7, 8], // Row 3
        [0, 3, 6], // Column 1
        [1, 4, 7], // Column 2
        [2, 5, 8], // Column 3
        [0, 4, 8], // Diagonal 1
        [2, 4, 6]  // Diagonal 2
    ];

    return winningCombinations.some(combination => {
        const [a, b, c] = combination;
        return (
            cells[a].style.backgroundImage === cells[b].style.backgroundImage &&
            cells[b].style.backgroundImage === cells[c].style.backgroundImage &&
            cells[a].style.backgroundImage !== ""
        );
    });
}

// Attach event listeners to all cells
cells.forEach(cell => cell.addEventListener("click", handleCellClick));

// Start the timer for the first turn
startTurnTimer();
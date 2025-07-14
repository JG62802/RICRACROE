let cells = document.querySelectorAll(".cell");
let status = document.getElementById("status");
let timerDisplay = document.getElementById("timer"); // Timer display element
let currentPlayer = "X";
let timer; // Timer for the turn system
let countdown; // Countdown interval

function startTurnTimer() {
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
    status.textContent = `Player ${winner} Wins!`;
    timerDisplay.textContent = ""; // Clear the timer display
    cells.forEach(cell => cell.removeEventListener("click", handleCellClick)); // Disable further clicks
    clearTimeout(timer); // Stop the timer
    clearInterval(countdown); // Stop the countdown
}

function handleCellClick(event) {
    const cell = event.target;
    if (!cell.classList.contains("marked")) { // Ensure the cell is not already marked
        cell.classList.add("marked"); // Mark the cell to prevent further changes
        cell.style.backgroundImage = currentPlayer === "X" ? "url('x.png')" : "url('o.png')"; // Set background image
        cell.style.backgroundSize = "cover"; // Ensure the image covers the cell
        if (checkWinner()) {
            endGame(currentPlayer); // End the game if there's a winner
        } else {
            currentPlayer = currentPlayer === "X" ? "O" : "X"; // Switch player
            status.textContent = `Player ${currentPlayer}'s Turn`;
            startTurnTimer(); // Restart the timer for the next turn
        }
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
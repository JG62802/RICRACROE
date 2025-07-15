let cells = document.querySelectorAll(".cell");
let status = document.getElementById("status");
let timerDisplay = document.getElementById("timer"); // Timer display element
let currentPlayer = "X";
let timer; // Timer for the turn system
let countdown; // Countdown interval
let gameOver = false; // Track if the game is over
let playerId = null; // Initialize playerId as null
let socket = null; // Declare socket globally

const mainMenu = document.getElementById("main-menu");
const gameScreen = document.getElementById("game-screen");
const findMatchBtn = document.getElementById("find-match-btn");

// Event listener for "Find a Match" button
findMatchBtn.addEventListener("click", () => {
    mainMenu.style.display = "none"; // Hide the main menu
    gameScreen.style.display = "block"; // Show the game screen

    // Connect to the WebSocket server and start the game logic
    connectToServer();
});

function connectToServer() {
    socket = new WebSocket('ws://localhost:8080'); // Assign socket globally

    socket.onopen = () => {
        console.log('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(`Received message:`, data);

        if (data.type === 'assignPlayer') {
            playerId = data.player; // Assign the player ID (X or O)
            status.textContent = `You are Player ${playerId}`;
            console.log(`Assigned as Player ${playerId}`);
        } else if (data.type === 'updateGame') {
            // Update the game state on the client
            data.gameState.forEach((mark, index) => {
                const cell = cells[index];
                if (mark && !cell.classList.contains('marked')) {
                    cell.classList.add('marked');
                    cell.style.backgroundImage = mark === 'X' ? "url('x.png')" : "url('o.png')";
                    cell.style.backgroundSize = "cover";
                }
            });

            // Update the current player and game status
            currentPlayer = data.currentPlayer;
            status.textContent = `Player ${currentPlayer}'s Turn`;

            if (data.winner) {
                endGame(data.winner);
            } else if (data.draw) {
                endGame("Draw");
            }
        } else if (data.type === 'chatMessage') {
            // Display chat messages
            const chatBox = document.getElementById("chat-box");
            const messageElement = document.createElement("div");
            messageElement.textContent = `${data.player}: ${data.message}`;
            chatBox.appendChild(messageElement);
            chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
        console.log('Disconnected from WebSocket server');
    };

    cells.forEach(cell => cell.addEventListener("click", handleCellClick));

    // Add event listener for chat
    const chatInput = document.getElementById("chat-input");
    const sendChatBtn = document.getElementById("send-chat-btn");

    sendChatBtn.addEventListener("click", () => {
        const message = chatInput.value.trim();
        if (message) {
            socket.send(JSON.stringify({ type: 'chatMessage', player: playerId, message }));
            chatInput.value = ""; // Clear the input field
        }
    });
}

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

    // Show game options
    const gameOptions = document.getElementById("game-options");
    gameOptions.style.display = "block";

    // Disable further clicks on cells
    cells.forEach(cell => cell.removeEventListener("click", handleCellClick));
}

function handleCellClick(event) {
    if (gameOver) return; // Prevent clicks if the game is over

    if (!playerId) {
        console.error("Player ID is not assigned yet.");
        return; // Exit the function if playerId is not assigned
    }

    const cell = event.target;
    const cellIndex = Array.from(cells).indexOf(cell);

    // Ensure the cell is not already marked and it's the player's turn
    if (!cell.classList.contains("marked") && currentPlayer === playerId) {
        // Mark the cell locally
        cell.classList.add("marked");
        cell.style.backgroundImage = currentPlayer === "X" ? "url('x.png')" : "url('o.png')";
        cell.style.backgroundSize = "cover";

        // Send the move to the server
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

const newGameBtn = document.getElementById("new-game-btn");
const rematchBtn = document.getElementById("rematch-btn");

newGameBtn.addEventListener("click", () => {
    // Reset the game state and start a new game with a new player
    socket.close(); // Disconnect from the current WebSocket
    location.reload(); // Reload the page to start a new game
});

rematchBtn.addEventListener("click", () => {
    // Reset the game state and start a rematch with the current player
    resetGameState();
    socket.send(JSON.stringify({ type: 'rematch' })); // Notify the server about the rematch
});

function resetGameState() {
    gameOver = false;
    gameState = Array(9).fill(null); // Reset the game state
    currentPlayer = "X"; // Reset the current player
    status.textContent = `Player ${currentPlayer}'s Turn`;
    const gameOptions = document.getElementById("game-options");
    gameOptions.style.display = "none"; // Hide game options

    // Clear the grid
    cells.forEach(cell => {
        cell.classList.remove("marked");
        cell.style.backgroundImage = "";
        cell.addEventListener("click", handleCellClick); // Re-enable cell clicks
    });

    console.log(`Broadcasting update:`, {
        gameState,
        currentPlayer,
        winner: null,
        draw: false
    });
}
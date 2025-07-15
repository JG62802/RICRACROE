const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = Array(9).fill(null); // Initialize empty game state
let currentPlayer = 'X'; // Start with Player X

server.on('connection', (socket) => {
    if (players.length < 2) {
        players.push(socket);
        const playerId = players.length === 1 ? 'X' : 'O';
        socket.send(JSON.stringify({ type: 'assignPlayer', player: playerId }));
        console.log(`Player ${playerId} connected`);

        socket.on('message', (message) => {
            const data = JSON.parse(message);
            console.log(`Received message:`, data);

            if (data.type === 'updateGame') {
                // Update the game state only if the cell is unmarked and it's the correct player's turn
                if (gameState[data.cellIndex] === null && data.player === currentPlayer) {
                    gameState[data.cellIndex] = data.player;
                    console.log(`Game state updated:`, gameState);

                    // Check for a winner or draw
                    const winner = checkWinner(gameState);
                    const draw = gameState.every(cell => cell !== null);

                    // Switch the current player
                    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
                    console.log(`Current player switched to: ${currentPlayer}`);

                    // Broadcast the updated game state and current player to all players
                    console.log(`Broadcasting update:`, {
                        gameState,
                        currentPlayer,
                        winner,
                        draw
                    });
                    players.forEach((player) => {
                        player.send(JSON.stringify({
                            type: 'updateGame',
                            gameState,
                            currentPlayer,
                            winner,
                            draw
                        }));
                    });
                } else {
                    console.log(`Invalid move by Player ${data.player}`);
                }
            } else if (data.type === 'chatMessage') {
                // Broadcast chat messages to all players
                players.forEach((player) => {
                    player.send(JSON.stringify({
                        type: 'chatMessage',
                        player: data.player,
                        message: data.message
                    }));
                });
            } else if (data.type === 'rematch') {
                // Reset the game state for a rematch
                gameState = Array(9).fill(null);
                currentPlayer = 'X';
                console.log('Rematch started');

                // Notify both players about the rematch
                players.forEach((player) => {
                    player.send(JSON.stringify({
                        type: 'rematch',
                        gameState,
                        currentPlayer
                    }));
                });
            }
        });

        socket.on('close', () => {
            players = players.filter((player) => player !== socket);
            console.log(`Player ${playerId} disconnected`);
        });
    } else {
        socket.send(JSON.stringify({ type: 'error', message: 'Game is full!' }));
        socket.close();
    }
});

// Function to check for a winner
function checkWinner(gameState) {
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

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (gameState[a] && gameState[a] === gameState[b] && gameState[a] === gameState[c]) {
            return gameState[a]; // Return the winner ('X' or 'O')
        }
    }
    return null; // No winner
}
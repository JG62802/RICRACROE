const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

let players = [];
let gameState = Array(9).fill(null); // Initialize empty game state

server.on('connection', (socket) => {
    if (players.length < 2) {
        players.push(socket);
        const playerId = players.length === 1 ? 'X' : 'O';
        socket.send(JSON.stringify({ type: 'assignPlayer', player: playerId }));

        socket.on('message', (message) => {
            const data = JSON.parse(message);

            if (data.type === 'updateGame') {
                gameState[data.cellIndex] = data.player;
                players.forEach((player) => {
                    player.send(JSON.stringify({ type: 'updateGame', gameState }));
                });
            }
        });

        socket.on('close', () => {
            players = players.filter((player) => player !== socket);
        });
    } else {
        socket.send(JSON.stringify({ type: 'error', message: 'Game is full!' }));
        socket.close();
    }
});
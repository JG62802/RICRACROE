let cells = document.querySelectorAll(".cell");
let status = document.getElementById("status");
let currentPlayer = "X";

cells.forEach(cell => {
    cell.addEventListener("click", function() {
        if (cell.textContent === "") {
            cell.textContent = currentPlayer;
            checkWinner();
        }
    });
});

function checkWinner() {
    // implement game-winning logic here
    // update the status and switch players accordingly
}

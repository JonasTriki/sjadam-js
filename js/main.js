window.addEventListener("load", init);
let divWhite, divBlack, divGameList;
let btnQuitGame, btnResetBoard, btnResign;

function init() {

    // Load DOM-elements, top game-info.
    divWhite = document.querySelector("#white-turn");
    divBlack = document.querySelector("#black-turn");

    // Game history/sjadammatt list
    divGameList = document.querySelector("#list");
    sjadam.setListDiv(divGameList);

    // Game info footer buttons
    btnQuitGame = document.querySelector("#quit-game");
    btnQuitGame.addEventListener("click", quitGame);
    btnResetBoard = document.querySelector("#reset-board");
    btnResetBoard.addEventListener("click", () => {
        sjadam.reset(true);
    });
    btnResign = document.querySelector("#resign");
    btnResign.addEventListener("click", () => {
        sjadam.resign(false);
    });
}

function resignFooter(show) {
    if (show) {
        btnResetBoard.classList.add("hidden");
        btnResign.classList.remove("hidden");
    } else {
        btnResign.classList.add("hidden");
        btnResetBoard.classList.remove("hidden");
    }
}

function quitGame() {
    if (sjadam.isOnline) sjadam.resign(true);
    sjadam.clearGame();
    gameContainer.classList.add("hidden");
    menuMain.classList.add("active");
}

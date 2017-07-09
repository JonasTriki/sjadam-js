window.addEventListener("load", init);
let divWhite, divBlack, divGameList;

function init() {

    // Load DOM-elements, top game-info.
    divWhite = document.querySelector("#white-turn");
    divBlack = document.querySelector("#black-turn");

    // Game history/sjadammatt list
    divGameList = document.querySelector("#list");
    sjadam.setListDiv(divGameList);

    // Game info footer buttons
    document.querySelector("#quit-game").addEventListener("click", () => {
        sjadam.clearGame();
        gameContainer.classList.add("hidden");
        menuMain.classList.add("active");
    });
    document.querySelector("#reset-board").addEventListener("click", () => {
        sjadam.reset();
    });
}

window.addEventListener("load", init);
let divYou, divOpponent, divGameList;

function init() {

    // Load DOM-elements, top game-info.
    divYou = document.querySelector("#you");
    divOpponent = document.querySelector("#opponent");

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

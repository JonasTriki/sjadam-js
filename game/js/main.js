window.addEventListener("load", init);
let divPlayer, divOpponent, divGameList;

function generatePlayerId() {
    let d = new Date().getTime();
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function init() {

    // Load DOM-elements, top game-info.
    divPlayer = document.querySelector("#player");
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

    // Generate player id if it doesn't exist
    if (!localStorage.playerId) localStorage.playerId = generatePlayerId();
}

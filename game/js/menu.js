let sjadam = new Sjadam();

window.addEventListener("load", () => FEN.loadSjadammatts(initMenu));

let menuMain, menuStartGame, gameContainer, gameDiv, gameInfo;
let btnNewGame, btnDailyChallenges, btnPlayVsFriend;
let btnWhite, btnBlack, btnStartGame;

function initMenu(sjadammatts) {
    sjadam.setSjadammatts(sjadammatts); // Load sjadammatts for future references.

    // Load DOM elements
    menuMain = document.querySelector("#main-menu");
    menuStartGame = document.querySelector("#start-game-menu");
    gameContainer = document.querySelector("#game-container");
    gameDiv = document.querySelector("#game");
    gameInfo = document.querySelector("#game-info");
    btnNewGame = document.querySelector("#new-game");
    btnNewGame.addEventListener("click", function() {
        menuMain.classList.remove("active");
        menuStartGame.classList.add("active");
    });
    btnDailyChallenges = document.querySelector("#daily-challenges");
    btnDailyChallenges.addEventListener("click", function() {

        // Load last sjadammatt
        let last = sjadam.sjadammatts[0];
        let isWhite = last.startingColor == "w";
        divPlayer.innerHTML = isWhite ? "White" : "Black";
        divOpponent.innerHTML = isWhite ? "Black" : "White";
        sjadam.setBlockSize(document.querySelector("#main-menu").offsetWidth);
        sjadam.setGameDiv(gameDiv);
        menuMain.classList.remove("active");

        // Load game and view game.
        sjadam.setIsListHistory(false);
        sjadam.addSjadammattDays();
        sjadam.loadCurrentSjadammatt(() => {
            gameContainer.classList.remove("hidden");
        });
    });
    btnPlayVsFriend = document.querySelector("#play-vs-friend");

    // Start game menu
    btnWhite = document.querySelector("#white");
    btnWhite.addEventListener("click", function() {
        btnBlack.classList.remove("checked");
        btnWhite.classList.add("checked");
    });
    btnBlack = document.querySelector("#black");
    btnBlack.addEventListener("click", function() {
        btnWhite.classList.remove("checked");
        btnBlack.classList.add("checked");
    });
    btnStartGame = document.querySelector("#start-game");
    btnStartGame.addEventListener("click", function() {

        // Set starting color, block size and game div.
        let isWhite = btnWhite.classList.contains("checked");
        sjadam.setStartingColor(isWhite ? "w" : "b");
        divPlayer.innerHTML = isWhite ? "White" : "Black";
        divOpponent.innerHTML = isWhite ? "Black" : "White";
        sjadam.setBlockSize(document.querySelector("#start-game-menu").offsetWidth);
        sjadam.setGameDiv(gameDiv);
        menuStartGame.classList.remove("active");

        // Init board and we're ready to play.
        sjadam.initChessBoard(function() {
            gameContainer.classList.remove("hidden");
            sjadam.setIsListHistory(true);
            sjadam.isPlaying = true;
        });
    });
}

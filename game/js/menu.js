let sjadam = new Sjadam();

window.addEventListener("load", () => FEN.loadSjadammatts(initMenu));

let menuMain, menuStartGame, gameContainer, gameDiv, gameInfo;
let btnNewGame, btnDailyChallenges, btnPlayVsFriend;
let btnWhite, btnBlack, btnStartGame;
let modal, copyUrlBox, txtGameUrl, btnCopyToClipboard, btnCancelGame;

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
        sjadam.setIsOnlineGame(false);
        menuMain.classList.remove("active");

        // Load game and view game.
        sjadam.setIsListHistory(false);
        sjadam.addSjadammattDays();
        sjadam.loadCurrentSjadammatt(() => {
            gameContainer.classList.remove("hidden");
        });
    });

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
        sjadam.setIsOnlineGame(false);
        menuStartGame.classList.remove("active");

        // Init board and we're ready to play.
        sjadam.initChessBoard(function() {
            gameContainer.classList.remove("hidden");
            sjadam.setIsListHistory(true);
            sjadam.isPlaying = true;
        });
    });
    btnPlayVsFriend = document.querySelector("#play-vs-friend");
    btnPlayVsFriend.addEventListener("click", function() {

        // Create a post request and create the game lobby
        let req;
        let color = btnWhite.classList.contains("checked") ? "w" : "b";
        if (window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            req = new ActiveXObject("Microsoft.XMLHTTP");
        }
        req.open("POST", "/game", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status == 200) {
                let res = JSON.parse(req.responseText);
                if (res.status == "ok") {

                    // Creating game for host
                    sjadam.setStartingColor(color);
                    divPlayer.innerHTML = color == "w" ? "White" : "Black";
                    divOpponent.innerHTML = color == "w" ? "Black" : "White";
                    sjadam.setBlockSize(document.querySelector("#start-game-menu").offsetWidth);
                    sjadam.setGameDiv(gameDiv);
                    sjadam.setIsOnlineGame(true);
                    menuStartGame.classList.remove("active");

                    // Init board and we're ready to play.
                    sjadam.initChessBoard(function() {
                        gameContainer.classList.remove("hidden");
                        sjadam.setIsListHistory(true);
                        sjadam.isPlaying = false;
                    });

                    // Connect to socket
                    let socket = io.connect();
                    socket.on("connect", (data) => {
                        socket.emit("join", "Hello from client");
                    });

                    // Show modal (copy game url popup)
                    showModal(res.data.url);

                    // TODO: Connect to socket and wait for opponent to join game.
                }
            }
        };
        req.send("color=" + color + "&player_id=" + localStorage.playerId);
    });
    modal = document.querySelector(".modal");
    copyGameUrlBox = document.querySelector("#copy-game-url");
    txtGameUrl = document.querySelector("#game-url");
    btnCopyToClipboard = document.querySelector("#copy-url");
    btnCopyToClipboard.addEventListener("click", () => {
        txtGameUrl.select();
        document.execCommand("copy");
    });
    btnCancelGame = document.querySelector("#cancel-game");
    btnCancelGame.addEventListener("click", hideModal);
}

function showModal(gameUrl) {
    txtGameUrl.value = gameUrl;
    modal.classList.remove("fadeout");
    modal.classList.add("fadein");
    copyGameUrlBox.classList.remove("to-top");
    copyGameUrlBox.classList.add("from-top");
}

function hideModal() {
    copyGameUrlBox.classList.add("to-top");
    copyGameUrlBox.classList.remove("from-top");
    modal.classList.add("fadeout");
    modal.classList.remove("fadein");
}

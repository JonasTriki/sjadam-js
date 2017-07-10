window.addEventListener("load", () => FEN.loadSjadammatts(initMenu));

function generatePlayerId() {
    let d = new Date().getTime();
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        let r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

// Generate player id if it doesn't exist
if (!localStorage.playerId) localStorage.playerId = generatePlayerId();

let menuMain, menuStartGame, gameContainer, gameDiv, gameInfo;
let btnNewGame, btnDailyChallenges, btnPlayVsFriend;
let btnWhite, btnBlack, btnStartGame;
let modal, txtNewGameUrl;
let gameOverTitle, gameOverSpan, txtGameUrl, btnRequestRematch;

// Create sjadam instance
let sjadam = new Sjadam();

// Socket.IO game socket.
let socket;

function connectSocket(gameId, readyState) {
    socket = io.connect(API_LINK);
    socket.on("connect", (data) => {
        sjadam.setSocket(socket);
        socket.emit("join", gameId);
    });
    socket.on("message", (data) => {
        switch (data.type) {
            case "state":
                if (data.msg == "ready") {
                    readyState();
                }
                break;
            default:
                sjadam.socketData(data);
                break;
        }
    });
}

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
        sjadam.setBlockSize(document.querySelector("#main-menu").offsetWidth);
        sjadam.setGameDiv(gameDiv);
        sjadam.setIsOnlineGame(false);
        sjadam.setGameOverCallback(null);
        menuMain.classList.remove("active");

        // Load game and view game.
        sjadam.setIsListHistory(false);
        sjadam.addSjadammattDays();
        sjadam.loadCurrentSjadammatt(() => {
            gameContainer.classList.remove("hidden");
        });
    });
    document.querySelector("#how-to-play").addEventListener("click", function() {
        window.open("https://github.com/JonasTriki/sjadam-js#game-rules", "_blank");
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
        sjadam.setPlayerColor(isWhite ? "w" : "b");
        sjadam.setBlockSize(document.querySelector("#start-game-menu").offsetWidth);
        sjadam.setGameDiv(gameDiv);
        sjadam.setIsOnlineGame(false);
        sjadam.setGameOverCallback(null);
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
        req.open("POST", API_LINK + "/game", true);
        req.setRequestHeader("Access-Control-Allow-Credentials", "true");
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status == 200) {
                let res = JSON.parse(req.responseText);
                if (res.status == "ok") {

                    // Creating game for host
                    startOnlineGame(color, document.querySelector("#start-game-menu"), false);

                    // Connect to socket and send gameId
                    connectSocket(res.data.gameId, () => {

                        // Ready state
                        hideModal("copy-game-url", false);
                        sjadam.isPlaying = true;
                    });

                    // Show modal (copy game url popup)
                    txtNewGameUrl.value = res.data.url;
                    showModal("copy-game-url");
                }
            }
        };
        req.send("color=" + color + "&player_id=" + localStorage.playerId);
    });
    modal = document.querySelector(".modal");

    // New game modal
    txtNewGameUrl = document.querySelector("#new-game-url");
    document.querySelector("#copy-new-url").addEventListener("click", () => {
        txtNewGameUrl.select();
        document.execCommand("copy");
    });
    document.querySelector("#cancel-game").addEventListener("click", () => {
        hideModal("copy-game-url", true);
        quitGame();
    });

    // Game over modal
    gameOverTitle = document.querySelector("#game-over .title");
    gameOverSpan = document.querySelector("#game-over #won-lost");
    txtGameUrl = document.querySelector("#game-url");
    btnRequestRematch = document.querySelector("#request-rematch");
    btnRequestRematch.addEventListener("click", () => {

        // TODO: Send rematch request to opponent.
    });
    document.querySelector("#copy-url").addEventListener("click", () => {
        txtGameUrl.select();
        document.execCommand("copy");
    });
    document.querySelector(".close").addEventListener("click", () => {
        hideModal("game-over", false);
    });

    checkUrlParamter();
}

function checkUrlParamter() {

    // Check url parameter and determine wether we should join gameId
    if (location.search.indexOf("game") > -1) {
        let params = location.search.substring(1).split("&");
        let gameId = "";
        for (let i = 0; i < params.length; i++) {
            let split = params[i].split("=");
            if (split[0] == "game") {
                gameId = split[1];
                break;
            }
        }
        if (gameId != "") {
            let regex = /^[0-9a-z]{10}$/;
            if (regex.test(gameId)) {

                // Create a post request and check if we can join game.
                let req;
                if (window.XMLHttpRequest) {
                    req = new XMLHttpRequest();
                } else if (window.ActiveXObject) {
                    req = new ActiveXObject("Microsoft.XMLHTTP");
                }
                req.open("POST", API_LINK + "/" + gameId, true);
                req.setRequestHeader("Access-Control-Allow-Credentials", "true");
                req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                req.onreadystatechange = function() {
                    if (req.readyState === 4 && req.status == 200) {
                        let res = JSON.parse(req.responseText);
                        if (res.status == "ok") {

                            // We're in! Connect to socket, start playing.
                            connectSocket(gameId, () => {

                                // Ready state
                                startOnlineGame(res.data.color, menuMain, true);
                            });
                        }
                    }
                };
                req.send("player_id=" + localStorage.playerId);
            }
        }
    }
}

function showModal(id) {

    // Add hidden to other modal-boxes and remove from this.
    let modalBox;
    let modalBoxes = document.querySelectorAll(".modal-box");
    for (let i = 0; i < modalBoxes.length; i++) {
        let mb = modalBoxes[i];
        if (mb.id == id) {
            modalBox = mb;
            modalBox.classList.remove("hidden");
        } else {
            mb.classList.add("hidden");
        }
    }
    modal.classList.remove("fadeout");
    modal.classList.add("fadein");
    modalBox.classList.remove("to-top");
    modalBox.classList.add("from-top");
}

function hideModal(id, dc) {
    if (dc && socket != undefined && socket.connected) socket.disconnect();
    let modalBox = document.querySelector("#" + id);
    modalBox.classList.add("to-top");
    modalBox.classList.remove("from-top");
    modal.classList.add("fadeout");
    modal.classList.remove("fadein");
}

function startOnlineGame(color, curDiv, isPlaying) {

    // Creating game for opponent
    sjadam.setPlayerColor(color);
    sjadam.setBlockSize(curDiv.offsetWidth);
    sjadam.setGameDiv(gameDiv);
    sjadam.setIsOnlineGame(true);
    sjadam.setGameOverCallback((dc) => {

        // Set modal info
        let won = sjadam.colorWon == color;
        gameOverTitle.innerHTML = (dc ? "Opponent left the game. " : "") + won ? "Victory!" : "Defeat!";
        gameOverSpan.innerHTML = won ? "won" : "lost";
        // TODO: txtGameUrl.value = "";
        showModal("game-over");
    });
    curDiv.classList.remove("active");

    // Init board and we're ready to play.
    sjadam.initChessBoard(function() {
        gameContainer.classList.remove("hidden");
        sjadam.setIsListHistory(true);
        sjadam.isPlaying = isPlaying;
    });
}

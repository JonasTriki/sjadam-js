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
let modal, copyUrlBox, txtGameUrl, btnCopyToClipboard, btnCancelGame;

// Create sjadam instance
let sjadam = new Sjadam();

// Socket.IO game socket.
let socket;

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
                    sjadam.setPlayerColor(color);
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

                    // Connect to socket and send gameId
                    socket = io.connect();
                    socket.on("connect", (data) => {
                        sjadam.setSocket(socket);
                        socket.emit("join", res.data.gameId);
                    });
                    socket.on("message", (data) => {
                        switch (data.type) {
                            case "state":
                                if (data.msg == "ready") {
                                    hideModal(false);
                                    sjadam.isPlaying = true;
                                }
                                break;
                            default:
                                break;
                        }
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
    btnCancelGame.addEventListener("click", () => {
        hideModal(true);
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
                req.open("POST", "/" + gameId, true);
                req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                req.onreadystatechange = function() {
                    if (req.readyState === 4 && req.status == 200) {
                        let res = JSON.parse(req.responseText);
                        if (res.status == "ok") {

                            // We're in! Connect to socket, start playing.
                            socket = io.connect();
                            socket.on("connect", (data) => {
                                sjadam.setSocket(socket);
                                socket.emit("join", gameId);
                            });
                            socket.on("message", (data) => {
                                switch (data.type) {
                                    case "state":
                                        if (data.msg == "ready") {
                                            startOnlineGame(res.data);
                                            // TODO: start game
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            });
                        }
                    }
                };
                req.send("player_id=" + localStorage.playerId);
            }
        }
    }
}

function showModal(gameUrl) {
    txtGameUrl.value = gameUrl;
    modal.classList.remove("fadeout");
    modal.classList.add("fadein");
    copyGameUrlBox.classList.remove("to-top");
    copyGameUrlBox.classList.add("from-top");
}

function hideModal(dc) {
    if (dc && socket != undefined && socket.connected) socket.disconnect();
    copyGameUrlBox.classList.add("to-top");
    copyGameUrlBox.classList.remove("from-top");
    modal.classList.add("fadeout");
    modal.classList.remove("fadein");
}

function startOnlineGame(color) {

    // Creating game for opponent
    sjadam.setPlayerColor(color);
    divPlayer.innerHTML = color == "w" ? "White" : "Black";
    divOpponent.innerHTML = color == "w" ? "Black" : "White";
    sjadam.setBlockSize(menuMain.offsetWidth);
    sjadam.setGameDiv(gameDiv);
    sjadam.setIsOnlineGame(true);
    menuMain.classList.remove("active");

    // Init board and we're ready to play.
    sjadam.initChessBoard(function() {
        gameContainer.classList.remove("hidden");
        sjadam.setIsListHistory(true);
        sjadam.isPlaying = true;
    });
}

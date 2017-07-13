window.addEventListener("load", init);
let divWhite, divBlack;
let btnQuitGame, btnResetBoard, btnResign;
let gameInfoTabHeaders, gameInfoTabPages;
let chatMsgs, chatMsgBox;

function init() {

    // Load DOM-elements, top game-info.
    divWhite = document.querySelector("#white-turn");
    divBlack = document.querySelector("#black-turn");

    // Game history/sjadammatt list
    sjadam.setHistoryDiv(document.querySelector("#history"));
    sjadam.setSjadammattsDiv(document.querySelector("#sjadammatts"));
    sjadam.setChatDiv(document.querySelector("#chat"));
    sjadam.setOnChatMsgRecieved((msg) => addChatDiv(msg, true));

    // Game info tab header click
    gameInfoTabHeaders = document.querySelectorAll(".headers > .header");
    gameInfoTabPages = document.querySelectorAll(".page");
    for (let i = 0; i < gameInfoTabHeaders.length; i++) {
        gameInfoTabHeaders[i].addEventListener("click", () => headerClick(i));
    }

    // Chat stuff
    chatMsgs = document.querySelector("#chat");
    chatMsgBox = document.querySelector("#chat-msg");
    chatMsgBox.addEventListener("keypress", (e) => {
        if (e.keyCode == 13) sendChatMsg();
    });
    document.querySelector("#send-msg").addEventListener("click", () => sendChatMsg());

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

function headerClick(index) {
    for (let i = 0; i < gameInfoTabHeaders.length; i++) {
        if (i == index) {
            gameInfoTabHeaders[i].classList.add("light");
            gameInfoTabPages[i].classList.remove("hidden");
        } else {
            gameInfoTabPages[i].classList.add("hidden");
            gameInfoTabHeaders[i].classList.remove("light");
        }
    }
}

/*
    i = 0 => History
    i = 1 => Sjadmmatts
    i = 2 => Chat
*/
function showTabHeader(i, show) {
    if (show) {
        gameInfoTabHeaders[i].classList.remove("hidden");
    } else {
        gameInfoTabHeaders[i].classList.add("hidden");
    }
}

function showTabHeaderOnly(i) {
    for (let j = 0; j < gameInfoTabHeaders.length; j++) {
        showTabHeader(j, j == i);
    }
}

function sendChatMsg() {

    // We only want to send non-empty messages.
    if (chatMsgBox.value == "") return;
    sjadam.emitData({type: "chat", msg: chatMsgBox.value});
    addChatDiv(chatMsgBox.value, false);
    chatMsgBox.value = "";
}

function addChatDiv(msg, opponent) {
    let ele = document.createElement("div");
    ele.className = "message" + (opponent ? " left" : "");
    ele.appendChild(document.createTextNode(msg));
    chatMsgs.appendChild(ele);

    // Scroll to bottom of chat if possible/needed.
    scrollChat();
}

function scrollChat() {
    let isScrolledToBottom = chatMsgs.scrollHeight - chatMsgs.clientHeight <= chatMsgs.scrollTop + 1;
    if (!isScrolledToBottom) {
        chatMsgs.scrollTop = chatMsgs.scrollHeight - chatMsgs.clientHeight;
    }
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
    headerClick(0); // Reset to history tab
}

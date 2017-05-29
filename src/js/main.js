window.addEventListener("load", init);

let boardColors = ["#ffce9e", "#d18b47"];

// This is needed to setup the board and also to draw the correct pieces.
let boardPieces = {rW: "r", knW: "h", bW: "b", qW: "q", kW: "k", pW: "p",
                   rB: "t", knB: "j", bB: "n", qB: "w", kB: "l", pB: "o"};
let whitePieces = ["rW", "knW", "bW", "qW", "kW", "bW", "knW", "rW"];
let blackPieces = ["rB", "knB", "bB", "kB", "qB", "bB", "knB", "rB"];
let board;
let canvas, blockSize, ctx;
let isWhitePlaying = true;
let hoverPos = {x: -1, y: -1};
let clickedPos = {x: -1, y: -1};

function init() {

    // Load elements.
    canvas = document.querySelector("#game");
    canvas.addEventListener("mousemove", canvasMouseMove);
    canvas.addEventListener("mouseup", canvasMouseUp);
    canvas.addEventListener("mouseleave", canvasMouseLeave);
    blockSize = canvas.width / 8;
    ctx = canvas.getContext("2d");
    initChessBoard();
    draw();
}

function canvasMouseMove(e) {
    let newX = ~~(e.x / blockSize);
    let newY = ~~(e.y / blockSize);
    if (newX != hoverPos.x || newY != hoverPos.y) {
        hoverPos.x = newX;
        hoverPos.y = newY;
        draw();
    }
}

function canvasMouseUp(e) {
    clickedPos.x = hoverPos.x;
    clickedPos.y = hoverPos.y;
    draw();
}

function canvasMouseLeave() {
    hoverPos.x = -1;
    hoverPos.y = -1;
    draw();
}

function initChessBoard() {
    chessBoard = [];
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (chessBoard[y] === undefined) chessBoard[y] = [];
            let piece;
            switch (y) {
                case 0:
                    piece = isWhitePlaying ? blackPieces[x] : whitePieces[x];
                    break;
                case 1:
                    piece = isWhitePlaying ? "pB" : "pW";
                    break;
                case 6:
                    piece = isWhitePlaying ? "pW" : "pB";
                    break;
                case 7:
                    piece = isWhitePlaying ? whitePieces[x] : blackPieces[x];
                    break;
                default:
                    piece = "";
                    break;
            }
            chessBoard[y].push(piece);
        }
    }
}

function drawBoardBackground() {
    ctx.save();
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            ctx.beginPath();
            ctx.rect(blockSize * i, blockSize * j, blockSize, blockSize);
            ctx.fillStyle = boardColors[j % 2 == 0 ? i % 2 : (i + 1) % 2];
            ctx.fill();
            ctx.closePath();
        }
    }
    ctx.restore();
}

function draw() {
    drawBoardBackground();
    ctx.save();
    ctx.font = blockSize + "px Chess";
    ctx.fillStyle = "#000";
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let pieceToDraw = chessBoard[y][x];

            // Hover/Clicked rectangle drawings
            if (hoverPos.x != -1 && hoverPos.y != -1 && (hoverPos.x != clickedPos.x || hoverPos.y != clickedPos.y)) {
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillRect(hoverPos.x * blockSize, hoverPos.y * blockSize, blockSize, blockSize);
                ctx.restore();
            }
            if (clickedPos.x == x && clickedPos.y == y) {
                ctx.save();
                ctx.fillStyle = "rgb(220, 0, 0)";
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                ctx.restore();
            }

            // Check if we can draw piece
            if (pieceToDraw != "") {
                let txt = boardPieces[pieceToDraw];
                let textWidth = ctx.measureText(txt).width;

                // Draw piece as text
                ctx.fillText(txt,
                    x * blockSize + (blockSize - textWidth) / 2,
                    (y + 1) * blockSize + (blockSize - textWidth) / 2);
            }
        }
    }
    ctx.restore();
}

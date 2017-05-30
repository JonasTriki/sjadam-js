window.addEventListener("load", init);

let pieces = ["r", "kn", "b", "q", "k", "b", "kn", "r", "p"];
let imgPieces = {};
let boardColors = ["#eceed4", "#749654"];
let chessboard;
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
    ctx = canvas.getContext("2d");
    blockSize = canvas.width / 8;
	
	// Load images
	loadImage(0, "w", function() {
		initChessBoard();
		draw();
	});
}

function loadImage(pieceIndex, color, cb) {
	let piece = pieces[pieceIndex % pieces.length] + color;
	let img = new Image();
	img.onload = function() {
		pieceIndex++;
		if (pieceIndex == 19) cb();
		imgPieces[piece] = img;
		loadImage(pieceIndex, pieceIndex <= 8 ? "w" : "b", cb)
	};
	img.src = "img/" + piece + ".png";
}

function canvasMouseMove(e) {
    let newX = ~~(e.offsetX / blockSize);
    let newY = ~~(e.offsetY / blockSize);
    if (newX != hoverPos.x || newY != hoverPos.y) {
        hoverPos.x = newX;
        hoverPos.y = newY;
        draw();
    }
}

function canvasMouseUp(e) {
	console.log(e);
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
    chessboard = [];
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            if (chessboard[y] === undefined) chessboard[y] = [];
            let piece;
            switch (y) {
                case 0:
                    piece = pieces[x] + (isWhitePlaying ? "b" : "w");
                    break;
                case 1:
                    piece = pieces[pieces.length - 1] + (isWhitePlaying ? "b" : "w");
                    break;
                case 6:
                    piece = pieces[pieces.length - 1] + (isWhitePlaying ? "w" : "b");
                    break;
                case 7:
                    piece = pieces[x] + (isWhitePlaying ? "w" : "b");
                    break;
                default:
                    piece = "";
                    break;
            }
            chessboard[y].push(piece);
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
	if (chessboard == undefined) return;
    ctx.save();
    ctx.font = blockSize + "px Chess";
    ctx.fillStyle = "#000";
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let pieceToDraw = chessboard[y][x];

            // Hover/Clicked rectangle drawings
            if (hoverPos.x != -1 && hoverPos.y != -1 && (hoverPos.x != clickedPos.x || hoverPos.y != clickedPos.y)) {
                ctx.save();
                ctx.globalAlpha = 0.02;
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
				ctx.drawImage(imgPieces[pieceToDraw], x * blockSize, y * blockSize); // Draw image
			}
        }
    }
    ctx.restore();
}

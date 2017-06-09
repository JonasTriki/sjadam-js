window.addEventListener("load", init);

let pieces = ["r", "n", "b", "q", "k", "b", "n", "r", "p"];
let imgPieces = {};
let boardColors = ["#eceed4", "#749654"];
let selectedColor = "#dc0000", sjadamMoveColor = "#0068dc", chessMoveColor= "#a100dc", castlingMoveColor = "#dc6a00";
let chessboard;
let canvas, blockSize, ctx;
let turnSpan;
let sjadammattsList;
let btnLoadSjadammatt, btnReset;
let isPlaying = true;
let colorWon;
let isWhitePlaying = true;
let isWhiteTurn = true;
let hoverPos = {x: -1, y: -1};
let clickedPos = {x: -1, y: -1};
let chessMoves = [], sjadamMoves = [];
let sjadamPiece = {x: -1, y: -1, dX: -1, dY: -1, hasJumpedOpponent: false, prevJump: null, piece: ""};
let sjadammatts;

function init() {

    // Load elements.
    turnSpan = document.querySelector("#turn");
    canvas = document.querySelector("#game");
    sjadammattsList = document.querySelector("#sjadammatts");
    btnLoadSjadammatt = document.querySelector("#loadSjadammatt");
    btnLoadSjadammatt.addEventListener("click", function() {
        let game = sjadammatts[sjadammattsList.selectedIndex];
        chessboard = game.board;
        isWhiteTurn = game.whitesTurn;
        updateTurn();
        clearPiece();
        draw();
    });
    btnReset = document.querySelector("#reset");
    btnReset.addEventListener("click", function () {
        initChessBoard();
        clearPiece();
        isWhiteTurn = true;
        updateTurn();
    });
    canvas.addEventListener("mousemove", canvasMouseMove);
    canvas.addEventListener("mouseup", canvasMouseUp);
    canvas.addEventListener("mouseleave", canvasMouseLeave);
    ctx = canvas.getContext("2d");
    blockSize = canvas.width / 8;

	// Load images
	loadImage(0, "w", function() {

        // Load sjadammatts
        loadSjadamatts(initChessBoard);
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

function isValidLine(line) {
    if (line == "") return false;
    if (line.indexOf("/") == -1) return false;
    if (line.indexOf(" ") == -1) return false;
    return true;
}

function loadSjadamatts(cb) {
    sjadammatts = [];
    sjadammattsList.innerHTML = "";
    readFile("misc/sjadammatts.txt", function(content) {
        let lines = content.split("\n");
        for (let i = lines.length -1; i >= 0; i--) {
            let line = lines[i];
            if (!isValidLine(line)) continue;
            sjadammatts.push(importGame(lines[i]));
            sjadammattsList.innerHTML += "<option>Day " + (i + 1) + "</option>";
        }
        cb();
    });
}

function canvasMouseMove(e) {
    let newX = ~~(e.offsetX / blockSize);
    let newY = ~~(e.offsetY / blockSize);
    if (newX != hoverPos.x || newY != hoverPos.y) {
        document.title = "(" + newX + "," + newY + ")";
        hoverPos.x = newX;
        hoverPos.y = newY;
        draw();
    }
}

function checkPos(a) {
    return a.x == hoverPos.x && a.y == hoverPos.y;
}

function hasSjadamPieceMoved() {
    return sjadamPiece.x != sjadamPiece.dX || sjadamPiece.y != sjadamPiece.dY;
}

function clearPiece() {
    chessMoves = [];
    sjadamMoves = [];
    clickedPos = {x: -1, y: -1};
    sjadamPiece = {x: -1, y: -1, dX: -1, dY: -1, hasJumpedOpponent: false, prevJump: null, piece: ""};
}

function updateTurn() {
    turnSpan.innerHTML = (isWhiteTurn ? "White" : "Black") + "'s turn.";
}

function switchTurn() {
    isWhiteTurn = !isWhiteTurn;
    updateTurn();
    clearPiece();
    draw();
}

function isPieceOpponent(piece) {
    let color = piece.slice(-1);
    return color != "" && ((isWhiteTurn && color != "w") || (!isWhiteTurn && color != "b"));
}

function canvasMouseUp(e) {
    if (!isPlaying) return;
    if (hoverPos.x == -1 && hoverPos.y == -1) return;

    // Check if we are clicking the same piece as we selected and piece not moved
    // ==> We deselect the piece.
    if (clickedPos.x == hoverPos.x && clickedPos.y == hoverPos.y && !hasSjadamPieceMoved()) {
        clearPiece();
        draw();
        return;
    }

    // Check if we can select the piece (right color).
    let piece = chessboard[hoverPos.y][hoverPos.x].piece;
    let isOpponent = isPieceOpponent(piece);

    // Check if we are clicking on a move, and move if possible.
    let canDoChessMove = chessMoves.filter(checkPos).length;
    let canDoSjadamMove = sjadamMoves.filter(checkPos).length;
    let canChangePiece = (sjadamPiece.x == -1 && sjadamPiece.y == -1) || !hasSjadamPieceMoved();
    if (canDoChessMove || canDoSjadamMove)  {
        movePiece(clickedPos.x, clickedPos.y, hoverPos.x, hoverPos.y);
        if (!isPlaying) return;
        if (e.button == 2 || canDoChessMove) {
            if (canDoChessMove) {
                let chessMove = chessMoves.filter(checkPos)[0];
                if (chessMove.castling) {
                    let cast = chessMove.castling;

                    // Move rook
                    movePiece(cast.rookX, cast.rookY, cast.dX, cast.rookY);
                }
            }
            checkQueen(hoverPos.x, hoverPos.y);
            switchTurn();
            return;
        }

        // Check if we have jumped over an opponent piece.
        if (canDoSjadamMove) {
            let sjadamMove = sjadamMoves.filter(checkPos)[0];
            sjadamPiece.prevJump = {x: clickedPos.x, y: clickedPos.y};
            sjadamPiece.hasJumpedOpponent = sjadamMove.isOpponent;
        }
    } else {

        // Check if we can select a piece. We cannot change the piece if it is
        // an opponent or if we have moved the current one.
        if (isOpponent || !canChangePiece) return;

        // Change sjadam piece.
        sjadamPiece.x = hoverPos.x;
        sjadamPiece.y = hoverPos.y;
        sjadamPiece.piece = piece;
    }

    // Set clicked position to draw and sjadam piece destination position.
    clickedPos.x = hoverPos.x;
    clickedPos.y = hoverPos.y;
    sjadamPiece.dX = clickedPos.x;
    sjadamPiece.dY = clickedPos.y;

    // Find chess and sjadammoves (if possible; can only find previous if we have jumped an opponent.)
    chessMoves = findChessMoves(sjadamPiece.dX, sjadamPiece.dY);
    if (!sjadamPiece.hasJumpedOpponent) {
        sjadamMoves = findSjadamMoves(sjadamPiece.dX, sjadamPiece.dY);
    } else {
        sjadamMoves = [sjadamPiece.prevJump];
    }

    draw();
}

function canvasMouseLeave() {
    hoverPos.x = -1;
    hoverPos.y = -1;
    draw();
}

function printBoard() {
    for (let y = 0; y < 8; y++) {
        console.log("-".repeat(32));
        let str = "";
        for (let x = 0; x < 8; x++) {
            str += (chessboard[y][x].piece == "" ? "   " : ("   " + chessboard[y][x].piece).slice(-3)) + "|";
        }
        console.log(str);
    }
}

function readFile(file, cb) {
    let xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status == 200) {
            cb(xhr.responseText);
        }
    };
    xhr.open("GET", file);
    xhr.send();
}

function importGame(game) {
    // Example game: r2q2n1/p5pp/2p3k1/1p1R4/8/5P2/P1P1P3/2B3K1 w - - 0 1
    let board = [];

    // Split by spaces, we're only using the first 2 parts
    let spaceParts = game.split(" ");
    let parts =  spaceParts[0].split("/");
    let whitesTurn = spaceParts[1] == "w";

    // Go through all the parts and load em!
    for (let y = 0; y < parts.length; y++) {
        if (board[y] === undefined) board[y] = [];
        let part = parts[y];

        // Loop through all the fields
        for (let j = 0; j < part.length; j++) {
            let char = part[j];
            if (isNaN(char)) {
                let color = char.toUpperCase() == char ? "w" : "b";
                board[y].push({piece: char.toLowerCase() + color, hasMoved: false});
            } else {
                for (let i = 0; i < char; i++) {
                    board[y].push({piece: "", hasMoved: false});
                }
            }
        }
    }
    return {whitesTurn: whitesTurn, board: board};
}

function exportGame() {

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
            chessboard[y].push({piece: piece, hasMoved: false});
        }
    }
    draw();
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

function drawFinishScreen() {
    if (isPlaying) return;
    ctx.save();

    // Draw faded background
    ctx.fillStyle = "#000";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "25px Open Sans";
    let str = colorWon + " won the match!";
    let strW = ctx.measureText(str).width;
    let strH = ctx.measureText("W").width;
    ctx.fillText(colorWon + " won the match!", ~~((canvas.width - strW) / 2), strH + ~~((canvas.height - strH) / 2));
    ctx.restore();
}

function draw() {
    drawBoardBackground();
	if (chessboard == undefined) return;
    ctx.save();
    ctx.font = blockSize + "px Open Sans";
    ctx.fillStyle = "#000";
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let pieceToDraw = chessboard[y][x].piece;

            // Hover/Clicked rectangle drawings
            if (hoverPos.x != -1 && hoverPos.y != -1 && (hoverPos.x != clickedPos.x || hoverPos.y != clickedPos.y)) {
                ctx.save();
                ctx.globalAlpha = 0.02;
                ctx.fillRect(hoverPos.x * blockSize, hoverPos.y * blockSize, blockSize, blockSize);
                ctx.restore();
            }
            if (clickedPos.x == x && clickedPos.y == y) {
                ctx.save();
                ctx.fillStyle = selectedColor;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                ctx.restore();
            }
            if (sjadamMoves.length > 0) {
                for (let i = 0; i < sjadamMoves.length; i++) {
                    let move = sjadamMoves[i];
                    ctx.save();
                    ctx.globalAlpha = 0.02;
                    ctx.fillStyle = sjadamMoveColor;
                    ctx.fillRect(move.x * blockSize, move.y * blockSize, blockSize, blockSize);
                    ctx.restore();
                }
            }
            if (chessMoves.length > 0) {
                for (let i = 0; i < chessMoves.length; i++) {
                    let move = chessMoves[i];
                    ctx.save();
                    ctx.globalAlpha = 0.02;
                    ctx.fillStyle = move.castling ? castlingMoveColor : chessMoveColor;
                    ctx.fillRect(move.x * blockSize, move.y * blockSize, blockSize, blockSize);
                    ctx.restore();
                }
            }

            // Check if we can draw piece
            if (pieceToDraw != "") {
				ctx.drawImage(imgPieces[pieceToDraw], x * blockSize, y * blockSize); // Draw image
			}
        }
    }
    ctx.restore();
    drawFinishScreen();
}

function getPiece(x, y) {
    let piece = chessboard[y][x].piece.slice(0, -1);
    if (piece != "") return piece;
    if (sjadamPiece.piece != "" && sjadamPiece.x == x && sjadamPiece.y == y) return sjadamPiece.piece;
    return "";
}

function checkKing(moveX, moveY) {
    let destPiece = chessboard[moveY][moveX].piece;
    if (destPiece.length == 2 && destPiece.charAt(0) == "k") {
        isPlaying = false;
        colorWon = destPiece.slice(-1) == "w" ? "Black" : "White";
        switchTurn();
    }
}

function checkQueen(moveX, moveY) {
    let piece = chessboard[moveY][moveX].piece;
    if (piece.charAt(0) == "q" || (piece.charAt(0) == "k" && piece.length == 2)) return;

    // Find color and check if we should convert to queen
    let color = piece.slice(-1);
    let convertToQueen = (isWhiteTurn && moveY == 0) || (!isWhiteTurn && moveY == 7);
    if (!convertToQueen) return;

    // Convert piece to queen
    chessboard[moveY][moveX].piece = "q" + color;
}

function movePiece(x, y, dX, dY) {
    if (!isValidPos(x, y) || !isValidPos(dX, dY)) return;

    // Check if we are taking the king => winning.
    checkKing(dX, dY);

    // Move piece
    chessboard[dY][dX].piece = chessboard[y][x].piece;
    chessboard[dY][dX].hasMoved = (sjadamPiece.x != dX || sjadamPiece.y != dY);
    chessboard[y][x].piece = "";
    chessboard[y][x].hasMoved = false;

    // Redraw new stuff
    draw();
}

function isValidPos(x, y) {
    return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function canAttackPiece(x, y) {
    let color = chessboard[y][x].piece.slice(-1);
    return color == "" || (isWhiteTurn ? color == "b" : color == "w");
}

function findMoves(x, y, directions, once) {
    let moves = [];
    let piece = chessboard[y][x];
    for (let i = 0; i < directions.length; i++) {
        let dir = directions[i];
        let hitPiece = false;
        let nextPos = {x: x + dir.x, y: y + dir.y};
        while (!hitPiece && isValidPos(nextPos.x, nextPos.y) && canAttackPiece(nextPos.x, nextPos.y)) {
            let castling;
            if (dir.condition != null) {
                if (dir.condition.hasMoved != null) {
                    if (dir.condition.hasMoved != piece.hasMoved) break;
                }
                if (dir.condition.castling) {

                    // Check if king has moved
                    let rookY = isWhiteTurn ? 7 : 0;
                    if (x != 4 || y != rookY) break;

                    // Check if rook exists/has moved
                    let rookX = dir.condition.rookX;
                    if (chessboard[rookY][rookX].piece.charAt(0) != "r" || chessboard[rookY][rookX].hasMoved) break;

                    // Check for empty fields
                    let empty = true;
                    let incr = (dir.x > 0 ? 1 : -1);
                    for (let j = x + incr; j != rookX; j += incr) {
                        if (chessboard[rookY][j].piece != "") {
                            empty = false;
                            break;
                        }
                    }
                    if (!empty) break;

                    // Set castling info for move.
                    castling = {rookX: rookX, rookY: rookY, dX: x + incr};
                }
                if (dir.condition.pieceExists != null) {
                    let nextPiece = chessboard[nextPos.y][nextPos.x].piece;
                    if (dir.condition.pieceExists) {
                        if (nextPiece == "") break;
                    } else {
                        let prevPieceCond = false;
                        if (dir.condition.prevPieceExists != null) {
                            let onePieceBack = chessboard[nextPos.y + (isWhiteTurn ? 1 : -1)][nextPos.x].piece;
                            if (dir.condition.prevPieceExists) {
                                prevPieceCond = onePieceBack == "";
                            } else {
                                prevPieceCond = onePieceBack != "";
                            }
                        }
                        if (nextPiece != "" || prevPieceCond) return moves;
                    }
                }
            }
            if (!castling) {
                moves.push({x: nextPos.x, y: nextPos.y});
            } else {
                moves.push({x: nextPos.x, y: nextPos.y, castling: castling});
            }
            hitPiece = chessboard[nextPos.y][nextPos.x].piece != "";
            nextPos.x += dir.x;
            nextPos.y += dir.y;
            if (once) break;
        }
    }
    return moves;
}

function rookMoves(x, y) {
    return findMoves(x, y, [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}], false);
}

function knightMoves(x, y) {
    return findMoves(x, y, [{x: 1, y: -2}, {x: 2, y: -1},
                            {x: 2, y: 1}, {x: 1, y: 2},
                            {x: -1, y: 2}, {x: -2, y: 1},
                            {x: -2, y: -1}, {x: -1, y: -2}], true);
}

function bishopMoves(x, y) {
    return findMoves(x, y, [{x: -1, y: -1}, {x: 1, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}], false);
}

function queenMoves(x, y) {
    return rookMoves(x, y).concat(bishopMoves(x, y));
}

function kingMoves(x, y) {
    return findMoves(x, y, [{x: 0, y: -1}, {x: 1, y: -1}, {x: 1, y: 0},
                            {x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 1},
                            {x: -1, y: 0}, {x: -1, y: -1},
                            {x: 2, y: 0, condition: {hasMoved: false, castling: true, rookX: 7}},
                            {x: -2, y: 0, condition: {hasMoved: false, castling: true, rookX: 0}}], true);
}

function pawnMoves(x, y) {
    let move = isWhiteTurn ? -1 : 1;
    return findMoves(x, y, [{x: -1, y: move, condition: {pieceExists: true}},
                            {x: 1, y: move, condition: {pieceExists: true}},
                            {x: 0, y: move, condition: {pieceExists: false}},
                            {x: 0, y: 2 * move, condition: {pieceExists: false, prevPieceExists: false, hasMoved: false}}], true);
}

function findChessMoves(x, y) {
	let piece = getPiece(x, y);
	if (piece == "") return [];

    switch (piece) {
        case "r":
            return rookMoves(x, y);
        case "n":
            return knightMoves(x, y);
        case "b":
            return bishopMoves(x, y);
        case "q":
            return queenMoves(x, y);
        case "k":
            return kingMoves(x, y);
        case "p":
            return pawnMoves(x, y);
    }
}

function findSjadamMoves(x, y) {
	let piece = getPiece(x, y);
	if (piece == "") return [];

    // Check neighbours and search for valid sjadam jumps.
    let moves = [];
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            let nPos = {x: x + i, y: y + j};
            if ((i != 0 || j != 0) && isValidPos(nPos.x, nPos.y) && chessboard[nPos.y][nPos.x].piece != "") {
                let moveTo = {x: nPos.x + i, y: nPos.y + j,
                    isOpponent: isPieceOpponent(chessboard[nPos.y][nPos.x].piece)};
                if (!isValidPos(moveTo.x, moveTo.y)) continue;
                if (chessboard[moveTo.y][moveTo.x].piece == "") moves.push(moveTo);
            }
        }
    }
	return moves;
}

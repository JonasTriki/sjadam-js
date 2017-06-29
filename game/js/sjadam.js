class Sjadam {

    constructor() {
        this.isPlaying = true;
        this.defaultLocations = ["r", "n", "b", "q", "k", "b", "n", "r"];
        this.pawn = "p";
        this.pawnTwoSteps = false;
        this.hoverPos = {x: -1, y: -1};
        this.clearPiece();
    }

    mouseMove(e) {
        let newX = ~~((e.clientX - this.gameDiv.offsetLeft) / this.blockSize);
        let newY = ~~((e.clientY - this.gameDiv.offsetTop) / this.blockSize);
        if (newX != this.hoverPos.x || newY != this.hoverPos.y) {
            document.title = "(" + newX + "," + newY + ")";
            this.hoverPos.x = newX;
            this.hoverPos.y = newY;
        }
    }

    getSelectedDay() {
        let sel = document.querySelector(".item.day.selected");
        if (sel == null) return -1;
        let children = Array.prototype.slice.call(document.querySelector("#list").children);
        return children.indexOf(sel);
    }

    loadCurrentSjadammatt(cb) {
        let matt = this.sjadammatts[this.getSelectedDay()];
        this.loadGame(matt, () => {
            let isWhite = matt.playerColor == "w";
            this.isPlaying = true;
            if (cb != undefined) cb();
        });
    }

    dayItemClicked(item) {
        let sel = document.querySelector(".item.day.selected");
        if (sel != null && sel != item) {
            sel.classList.remove("selected");
        }
        item.classList.add("selected");
        this.loadCurrentSjadammatt();
    }

    addSjadammattDays() {
        this.clearListDivs();
        for (let i = 0; i < this.sjadammatts.length; i++) {
            let day = this.sjadammatts.length - i;
            let item = document.createElement("div");
            item.className = "item day";
            if (i == 0) item.classList.add("selected"); // Select last day
            item.innerHTML = "Day " + day;
            item.addEventListener("click", () => {this.dayItemClicked(item)});
            this.listDiv.appendChild(item);
        }
    }

    toAN(opts) {
        if (opts.castling) {
            return opts.castling.isKingside ? "0-0-0" : "0-0";
        }
        let originPiece = this.chessboard[opts.fromPos.y][opts.fromPos.x].piece.charAt(0);
        let destPiece = this.chessboard[opts.toPos.y][opts.toPos.x].piece.charAt(0);
        let taking = (destPiece != "" || opts.enPassant) ? "x" : "";
        let letter = opts.enPassant ? "P" : ((originPiece != "p" || taking != "") ? originPiece.toUpperCase() : "");
        let x = String.fromCharCode(97 + opts.toPos.x);
        let y = 8 - opts.toPos.y;
        let epSuffix = opts.enPassant ? "e.p." : "";
        return letter + taking + x + y + epSuffix;
    }

    appendHistoryDiv(player, opponent) {
        this.history.push({player: player, opponent: opponent});
        let item = document.createElement("div");
        item.className = "item";
        let turnNo = document.createElement("div");
        turnNo.className = "turn-no";
        turnNo.innerHTML = this.history.length + ".";
        let playerTurn = document.createElement("div");
        playerTurn.className = "turn";
        playerTurn.innerHTML = player;
        let opponentTurn = document.createElement("div");
        opponentTurn.className = "turn";
        opponentTurn.innerHTML = opponent;
        item.appendChild(turnNo);
        item.appendChild(playerTurn);
        item.appendChild(opponentTurn);
        this.listDiv.appendChild(item);
    }

    addHistory(notation, emit) {
        if (!this.isListHistory) return; // Check if we should add to history
        if (this.turn == "w") {
            this.appendHistoryDiv(notation, "");
        } else {
            let i = this.history.length - 1;
            this.history[i].opponent = notation;

            // Get children at pos i and its children at pos 2 (aka opponent turn).
            this.listDiv.children[i].children[2].innerHTML = notation;
        }
        if (this.colorWon) {
            let whiteWon = this.colorWon == "w" ? 1 : 0;
            let blackWon = 1 - whiteWon;
            let i = this.history.length - 1;
            this.listDiv.children[i].children[1].innerHTML = whiteWon;
            this.listDiv.children[i].children[2].innerHTML = blackWon;
            //this.colorWon = undefined;
        }
        if (emit) this.emitData({type: "history", notation: notation});
    }

    mouseUp(e) {
        if (!this.isPlaying) return;
        if (this.hoverPos.x == -1 && this.hoverPos.y == -1) return;

        // Check if we are clicking the same piece as we selected and piece not moved
        // ==> We deselect the piece.
        if (this.selectedPos.x == this.hoverPos.x && this.selectedPos.y == this.hoverPos.y && !this.hasSjadamPieceMoved()) {
            this.clearPiece();
            return;
        }

        // Check if we're online and our turn
        if (this.isOnline && this.turn != this.playerColor) return;

        // Check if we can select the piece (right color).
        let piece = this.chessboard[this.hoverPos.y][this.hoverPos.x].piece;
        let isOpponent = this.isPieceOpponent(piece);

        // Check if we are clicking on a move, and move if possible.
        let canDoChessMove = this.chessMoves.filter((a) => this.checkPos(a)).length;
        let canDoSjadamMove = this.sjadamMoves.filter((a) => this.checkPos(a)).length;
        let canChangePiece = (this.sjadamPiece.x == -1 && this.sjadamPiece.y == -1) || !this.hasSjadamPieceMoved();
        if (canDoChessMove || canDoSjadamMove)  {
            let anOpts = {fromPos: {x: this.selectedPos.x, y: this.selectedPos.y}, toPos: {x: this.hoverPos.x, y: this.hoverPos.y}};
            let an = this.toAN(anOpts);
            this.movePiece(this.selectedPos.x, this.selectedPos.y, this.hoverPos.x, this.hoverPos.y);
            if (!this.isPlaying) {
                this.addHistory(an, true); // Add last move to history.
                return;
            }
            if (e.button == 2 || canDoChessMove) {
                if (canDoChessMove) {
                    let chessMove = this.chessMoves.filter((a) => this.checkPos(a))[0];
                    if (chessMove.castling) {
                        anOpts.castling = chessMove.castling;
                        an = this.toAN(anOpts);

                        // Move rook
                        this.movePiece(cast.rookX, cast.rookY, cast.dX, cast.rookY);
                        this.emitData({type: "move", x: cast.rookX, y: cast.rookY, dX: cast.dX, dY: cast.rookY});
                    } else if (chessMove.enPassant) {
                        anOpts.enPassant = true; // Make sure we add the en passant suffix on the notation!
                        an = this.toAN(anOpts);

                        // We're performing an en passant, remove the piece as we take it!
                        this.removePiece(chessMove.enPassant.x, chessMove.enPassant.y);
                        this.emitData({type: "remove", x: chessMove.enPassant.x, y: chessMove.enPassant.y});
                    }
                    this.pawnTwoSteps = chessMove.pawnTwoSteps ? {x: chessMove.x, y: chessMove.y} : false;
                } else {
                    this.pawnTwoSteps = false;
                }
                this.checkQueen(this.hoverPos.x, this.hoverPos.y);

                // Add to history if possible
                this.addHistory(an, true);

                // Emit data to socket if needed.
                this.emitData({type: "move", x: this.sjadamPiece.x, y: this.sjadamPiece.y, dX: this.hoverPos.x, dY: this.hoverPos.y});
                this.switchTurn();
                this.emitData({type: "turn"});
                return;
            }

            // Check if we have jumped over an opponent piece.
            if (canDoSjadamMove) {
                let sjadamMove = this.sjadamMoves.filter((a) => this.checkPos(a))[0];
                this.sjadamPiece.prevJump = {x: this.selectedPos.x, y: this.selectedPos.y};
                this.sjadamPiece.hasJumpedOpponent = sjadamMove.isOpponent;
            }
        } else {

            // Check if we can select a piece. We cannot change the piece if it is
            // an opponent or if we have moved the current one.
            if (isOpponent || !canChangePiece) return;

            // Change sjadam piece.
            this.sjadamPiece.x = this.hoverPos.x;
            this.sjadamPiece.y = this.hoverPos.y;
            this.sjadamPiece.piece = piece;
        }

        // Set clicked position to draw and sjadam piece destination position.
        this.selectedPos.x = this.hoverPos.x;
        this.selectedPos.y = this.hoverPos.y;
        this.setSelectedPos();
        this.sjadamPiece.dX = this.selectedPos.x;
        this.sjadamPiece.dY = this.selectedPos.y;

        // Find chess and sjadammoves (if possible; can only find previous if we have jumped an opponent.)
        this.chessMoves = this.findChessMoves(this.sjadamPiece.dX, this.sjadamPiece.dY);
        if (!this.sjadamPiece.hasJumpedOpponent) {
            this.sjadamMoves = this.findSjadamMoves(this.sjadamPiece.dX, this.sjadamPiece.dY);
        } else {
            this.sjadamMoves = [this.sjadamPiece.prevJump];
        }

        // Add DOM-elements
        this.clearOverlay();
        for (let i = 0; i < this.chessMoves.length; i++) {
            this.addOverlay(this.chessMoves[i], this.chessMoves[i].castling ? "castling-move" : "chess-move");
        }
        for (let i = 0; i < this.sjadamMoves.length; i++) {
            this.addOverlay(this.sjadamMoves[i], "sjadam-move");
        }
    }

    mouseLeave() {
        this.hoverPos.x = -1;
        this.hoverPos.y = -1;
    }

    clearOverlay() {
        let moves = document.querySelectorAll(".overlay");
        for (let i = 0; i < moves.length; i++) {
            moves[i].remove();
        }
    }

    addOverlay(pos, className) {
        let moveDiv = document.createElement("div");
        moveDiv.className = "square overlay " + className;
        moveDiv.style.left = (this.blockSize * pos.x) + "px";
        moveDiv.style.top = (this.blockSize * pos.y) + "px";
        this.gameDiv.appendChild(moveDiv);
    }

    removeSelected() {
        if (document.querySelector(".piece.selected") != null) {
            document.querySelector(".piece.selected").classList.remove("selected");
        }
    }

    setSelectedPos() {
        this.removeSelected();

        // Set new pos
        this.chessboard[this.selectedPos.y][this.selectedPos.x].elem.classList.add("selected");
    }

    getPiece(x, y) {
        let piece = this.chessboard[y][x].piece.slice(0, -1);
        if (piece != "") return piece;
        if (this.sjadamPiece.piece != "" && this.sjadamPiece.x == x && this.sjadamPiece.y == y) return this.sjadamPiece.piece;
        return "";
    }

    checkKing(moveX, moveY) {
        let destPiece = this.chessboard[moveY][moveX].piece;
        if (destPiece.length == 2 && destPiece.charAt(0) == "k") {
            this.isPlaying = false;
            this.colorWon = destPiece.slice(-1) == "w" ? "b" : "w";
            this.clearPiece();
        }
    }

    checkQueen(moveX, moveY) {
        let piece = this.chessboard[moveY][moveX].piece;
        if (piece.charAt(0) == "q" || (piece.charAt(0) == "k" && piece.length == 2)) return;

        // Find color and check if we should convert to queen
        let color = piece.slice(-1);
        let convertToQueen = (this.turn == this.playerColor && moveY == 0) || (this.turn != this.playerColor && moveY == 7);
        if (!convertToQueen) return;

        // Convert piece to queen
        let newPiece = "q" + color;
        this.chessboard[moveY][moveX].piece = newPiece;
        this.chessboard[moveY][moveX].elem.classList.remove(piece);
        this.chessboard[moveY][moveX].elem.classList.add(newPiece);
    }

    emitData(data) {
        if (!this.isOnline || this.socket == undefined) return;

        // Send data to socket
        this.socket.emit("data", data);
    }

    socketData(data) {
        if (data.type == "move") {
            this.movePiece(data.x, data.y, data.dX, data.dY);
        } else if (data.type == "remove") {
            this.removePiece(data.x, data.y);
        } else if (data.type == "turn") {
            this.switchTurn();
        } else if (data.type == "history") {
            this.addHistory(data.notation, false);
        }
    }

    removePiece(x, y) {
        if (!this.isValidPos(x, y)) return;

        // Remove piece
        this.chessboard[y][x].piece = "";
        this.chessboard[y][x].hasMoved = false;
        this.chessboard[y][x].elem.className = "square piece";
    }

    movePiece(x, y, dX, dY) {
        if (!this.isValidPos(x, y) || !this.isValidPos(dX, dY)) return;

        // Check if we are taking the king => winning.
        this.checkKing(dX, dY);

        // Move piece
        this.chessboard[dY][dX].piece = this.chessboard[y][x].piece;
        this.chessboard[dY][dX].hasMoved = (this.sjadamPiece.x != dX || this.sjadamPiece.y != dY);
        this.chessboard[y][x].piece = "";
        this.chessboard[y][x].hasMoved = false;

        // Move DOM-element
        this.chessboard[dY][dX].elem.className = this.chessboard[y][x].elem.className;
        this.chessboard[dY][dX].elem.style.left = (dX * this.blockSize) + "px";
        this.chessboard[dY][dX].elem.style.top = (dY * this.blockSize) + "px";
        this.chessboard[y][x].elem.className = "square piece";
    }

    isValidPos(x, y) {
        return x >= 0 && x < 8 && y >= 0 && y < 8;
    }

    canAttackPiece(x, y) {
        let color = this.chessboard[y][x].piece.slice(-1);
        return color == "" || (this.turn == "w" ? color == "b" : color == "w");
    }

    findMoves(x, y, directions, once) {
        let moves = [];
        let piece = this.chessboard[y][x];
        for (let i = 0; i < directions.length; i++) {
            let dir = directions[i];
            let hitPiece = false;
            let nextPos = {x: x + dir.x, y: y + dir.y};
            while (!hitPiece && this.isValidPos(nextPos.x, nextPos.y) && this.canAttackPiece(nextPos.x, nextPos.y)) {
                let move = {x: nextPos.x, y: nextPos.y};
                if (dir.condition != null) {
                    if (dir.condition.initPos) {
                        if (piece.piece.charAt(0) == "p") {
                            let color = piece.piece.charAt(1);
                            if (color == this.playerColor && y != 6) break;
                            if (color != this.playerColor && y != 1) break;
                        }
                    }
                    if (dir.condition.hasMoved != null) {
                        if (dir.condition.hasMoved != piece.hasMoved) break;
                    }
                    if (dir.condition.castling) {

                        // Check if king has moved
                        let rookY = this.turn == this.playerColor ? 7 : 0;
                        if (x != (this.playerColor == "w" ? 4 : 3) || y != rookY) break;

                        // Check if rook exists/has moved
                        let rookX = dir.condition.rookX;
                        if (this.chessboard[rookY][rookX].piece.charAt(0) != "r" || this.chessboard[rookY][rookX].hasMoved) break;

                        // Check for empty fields
                        let empty = true;
                        let incr = (dir.x > 0 ? 1 : -1);
                        for (let j = x + incr; j != rookX; j += incr) {
                            if (this.chessboard[rookY][j].piece != "") {
                                empty = false;
                                break;
                            }
                        }
                        if (!empty) break;

                        // Set castling info for move.
                        let dX = x + incr;
                        move.castling = {rookX: rookX, rookY: rookY, dX: dX, isKingside: dX - rookX == 2};
                    }
                    if (dir.condition.enPassant && this.pawnTwoSteps) {

                        // Check if we are at the same row and to the left/right of the pawn we're taking.
                        let sameRow = y == this.pawnTwoSteps.y;
                        let correctX = x == this.pawnTwoSteps.x - dir.x;

                        if (sameRow && correctX) {

                            // Add en passant move
                            move.enPassant = {x: this.pawnTwoSteps.x, y: this.pawnTwoSteps.y};
                        }
                    }
                    if (dir.condition.pieceExists != null && !move.enPassant) {
                        let nextPiece = this.chessboard[nextPos.y][nextPos.x].piece;
                        if (dir.condition.pieceExists) {
                            if (nextPiece == "") break;
                        } else {
                            let prevPieceCond = false;
                            if (dir.condition.prevPieceExists != null) {
                                let onePieceBack = this.chessboard[nextPos.y + (this.turn == this.playerColor ? 1 : -1)][nextPos.x].piece;
                                if (dir.condition.prevPieceExists) {
                                    prevPieceCond = onePieceBack == "";
                                } else {
                                    prevPieceCond = onePieceBack != "";
                                    if (!prevPieceCond && nextPiece == "") move.pawnTwoSteps = true;
                                }
                            }
                            if (nextPiece != "" || prevPieceCond) return moves;
                        }
                    }
                }
                moves.push(move);

                hitPiece = this.chessboard[nextPos.y][nextPos.x].piece != "";
                nextPos.x += dir.x;
                nextPos.y += dir.y;
                if (once) break;
            }
        }
        return moves;
    }

    rookMoves(x, y) {
        return this.findMoves(x, y, [{x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}], false);
    }

    knightMoves(x, y) {
        return this.findMoves(x, y, [{x: 1, y: -2}, {x: 2, y: -1},
                                     {x: 2, y: 1}, {x: 1, y: 2},
                                     {x: -1, y: 2}, {x: -2, y: 1},
                                     {x: -2, y: -1}, {x: -1, y: -2}], true);
    }

    bishopMoves(x, y) {
        return this.findMoves(x, y, [{x: -1, y: -1}, {x: 1, y: -1}, {x: 1, y: 1}, {x: -1, y: 1}], false);
    }

    queenMoves(x, y) {
        return this.rookMoves(x, y).concat(this.bishopMoves(x, y));
    }

    kingMoves(x, y) {
        return this.findMoves(x, y, [{x: 0, y: -1}, {x: 1, y: -1}, {x: 1, y: 0},
                                     {x: 1, y: 1}, {x: 0, y: 1}, {x: -1, y: 1},
                                     {x: -1, y: 0}, {x: -1, y: -1},
                                     {x: 2, y: 0, condition: {hasMoved: false, castling: true, rookX: 7}},
                                     {x: -2, y: 0, condition: {hasMoved: false, castling: true, rookX: 0}}], true);
    }

    pawnYMove() {
        return this.turn == this.playerColor ? -1 : 1;
    }

    pawnMoves(x, y) {
        let move = this.pawnYMove();
        return this.findMoves(x, y, [{x: -1, y: move, condition: {pieceExists: true, enPassant: true}},
                                     {x: 1, y: move, condition: {pieceExists: true, enPassant: true}},
                                     {x: 0, y: move, condition: {pieceExists: false}},
                                     {x: 0, y: 2 * move, condition: {pieceExists: false, prevPieceExists: false, hasMoved: false, initPos: true}}], true);
    }

    findChessMoves(x, y) {
    	let piece = this.getPiece(x, y);
    	if (piece == "") return [];

        switch (piece) {
            case "r":
                return this.rookMoves(x, y);
            case "n":
                return this.knightMoves(x, y);
            case "b":
                return this.bishopMoves(x, y);
            case "q":
                return this.queenMoves(x, y);
            case "k":
                return this.kingMoves(x, y);
            case "p":
                return this.pawnMoves(x, y);
        }
    }

    findSjadamMoves(x, y) {
    	let piece = this.getPiece(x, y);
    	if (piece == "") return [];

        // Check neighbours and search for valid sjadam jumps.
        let moves = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                let nPos = {x: x + i, y: y + j};
                if ((i != 0 || j != 0) && this.isValidPos(nPos.x, nPos.y) && this.chessboard[nPos.y][nPos.x].piece != "") {
                    let moveTo = {x: nPos.x + i, y: nPos.y + j,
                        isOpponent: this.isPieceOpponent(this.chessboard[nPos.y][nPos.x].piece)};
                    if (!this.isValidPos(moveTo.x, moveTo.y)) continue;
                    if (this.chessboard[moveTo.y][moveTo.x].piece == "") moves.push(moveTo);
                }
            }
        }
    	return moves;
    }

    setSjadammatts(sjadammatts) {
        this.sjadammatts = sjadammatts;
    }

    setBlockSize(width) {
        this.blockSize = width / 8;
    }

    setGameDiv(gameDiv) {
        this.gameDiv = gameDiv;
        this.gameDiv.addEventListener("mousemove", (e) => this.mouseMove(e));
        //this.gameDiv.addEventListener("mouseup", (e) => this.mouseUp(e));
        this.gameDiv.addEventListener("mouseleave", (e) => this.mouseLeave());
    }

    setPlayerColor(color) {
        this.playerColor = color;
        this.turn = "w";
    }

    setIsOnlineGame(isOnline) {
        this.isOnline = isOnline;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    setListDiv(listDiv) {
        this.listDiv = listDiv;
    }

    setIsListHistory(isHistory) {
        this.isListHistory = isHistory;
        if (this.isListHistory) this.history = [];
    }

    clearListDivs() {
        while (this.listDiv.firstChild) {
            this.listDiv.removeChild(this.listDiv.firstChild);
        }
        if (this.isListHistory) this.history = [];
    }

    clearBoardDivs() {
        while (this.gameDiv.firstChild) {
            this.gameDiv.removeChild(this.gameDiv.firstChild);
        }
    }

    addPiece(piece, x, y) {
        let pieceDiv = document.createElement("div");
        pieceDiv.className = "square piece " + piece;
        pieceDiv.style.top = y + "px";
        pieceDiv.style.left = x + "px";
        pieceDiv.addEventListener("mouseup", (e) => this.mouseUp(e));
        this.gameDiv.appendChild(pieceDiv);
        return pieceDiv;
    }

    initChessBoard(cb) {
        this.clearBoardDivs();
        this.chessboard = [];
        for (let y = 0; y < 8; y++) {
            if (this.chessboard[y] === undefined) this.chessboard[y] = [];
            for (let x = 0; x < 8; x++) {
                let piece;
                let isWhitePlaying = this.playerColor == "w";
                switch (y) {
                    case 0:
                        piece = this.defaultLocations[isWhitePlaying ? x : 7 - x] + (isWhitePlaying ? "b" : "w");
                        break;
                    case 1:
                        piece = this.pawn + (isWhitePlaying ? "b" : "w");
                        break;
                    case 6:
                        piece = this.pawn + (isWhitePlaying ? "w" : "b");
                        break;
                    case 7:
                        piece = this.defaultLocations[isWhitePlaying ? x : 7 - x] + (isWhitePlaying ? "w" : "b");
                        break;
                    default:
                        piece = "";
                        break;
                }
                this.chessboard[y].push({piece: piece, hasMoved: false, elem: this.addPiece(piece, x * this.blockSize, y * this.blockSize)});
            }
        }
        cb();
    }

    loadGame(game, cb) {
        this.clearBoardDivs();
        this.chessboard = [];
        this.setPlayerColor(game.playerColor);
        for (let y = 0; y < 8; y++) {
            if (this.chessboard[y] === undefined) this.chessboard[y] = [];
            for (let x = 0; x < 8; x++) {
                let newPiece = game.board[y][x];
                this.chessboard[y].push({piece: newPiece.piece, hasMoved: newPiece.hasMoved, elem: this.addPiece(newPiece.piece, x * this.blockSize, y * this.blockSize)});
            }
        }
        if (cb != undefined) cb();
    }

    checkPos(a) {
        return a.x == this.hoverPos.x && a.y == this.hoverPos.y;
    }

    hasSjadamPieceMoved() {
        return this.sjadamPiece.x != this.sjadamPiece.dX || this. sjadamPiece.y != this.sjadamPiece.dY;
    }

    reset() {
        // TODO: fix/remove reset for when this.isOnline == true.
        this.pawnTwoSteps = false;
        if (this.isListHistory) {
            this.initChessBoard(() => {
                this.clearPiece();
                this.turn = this.playerColor;
                this.updateTurn();
                this.isPlaying = true;
                this.clearListDivs();
            });
        } else {
            this.loadCurrentSjadammatt();
        }
    }

    clearGame() {
        this.clearPiece();
        this.clearBoardDivs();
        this.clearListDivs();
    }

    clearPiece() {
        this.selectedPos = {x: -1, y: -1};
        this.chessMoves = []
        this.sjadamMoves = [];
        this.sjadamPiece = {x: -1, y: -1, dX: -1, dY: -1, hasJumpedOpponent: false, prevJump: null, piece: ""};
        this.clearOverlay();
        this.removeSelected();
    }

    updateTurn() {
        if (this.turn == "w") {
            divWhite.classList.add("turn");
            divBlack.classList.remove("turn");
        } else {
            divWhite.classList.remove("turn");
            divBlack.classList.add("turn");
        }
    }

    switchTurn() {
        this.turn = this.turn == "w" ? "b" : "w";
        this.updateTurn();
        this.clearPiece();
    }

    isPieceOpponent(piece) {
        let color = piece.slice(-1);
        return color != "" && color != this.turn;
    }

    printBoard() {
        for (let y = 0; y < 8; y++) {
            console.log("-".repeat(32));
            let str = "";
            for (let x = 0; x < 8; x++) {
                str += (this.chessboard[y][x].piece == "" ? "   " : ("   " + this.chessboard[y][x].piece).slice(-3)) + "|";
            }
            console.log(str);
        }
    }
}

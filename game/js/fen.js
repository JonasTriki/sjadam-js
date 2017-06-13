class FEN {

    static getSjadammattsPath() {
        return "misc/sjadammatts.txt";
    }

    static readFile(file, cb) {
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

    static parseGame(game) {
        // Example game: r2q2n1/p5pp/2p3k1/1p1R4/8/5P2/P1P1P3/2B3K1 w - - 0 1
        let board = [];

        // Split by spaces, we're only using the first 2 parts (atm)
        // TODO: Check if we have en passant.
        let spaceParts = game.split(" ");
        let parts = spaceParts[0];
        let startingColor = spaceParts[1];

        // We need to flip the board if color is black.
        if (startingColor == "b") parts = parts.split("").reverse().join("");
        parts = parts.split("/");

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
        return {startingColor: startingColor, board: board};
    }

    static exportGame(board) {

        // TODO: something.
        return "";
    }

    static isValidLine(line) {
        if (line == "") return false;
        if (line.indexOf("/") == -1) return false;
        if (line.indexOf(" ") == -1) return false;
        return true;
    }

    static loadSjadammatts(cb) {
        let sjadammatts = [];
        let _this = this;
        this.readFile(this.getSjadammattsPath(), function(content) {
            let lines = content.split("\n");
            for (let i = lines.length - 1; i >= 0; i--) {
                let line = lines[i];
                if (!_this.isValidLine(line)) continue;
                sjadammatts.push(_this.parseGame(lines[i]));
            }
            cb(sjadammatts);
        });
    }
}

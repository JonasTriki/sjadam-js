const path = require("path");
const express = require("express");
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const MongoClient = require("mongodb").MongoClient;
const mongoUrl = "mongodb://localhost:27017/sjadam";

const game = require("./routes/game");
const join = require("./routes/join");

const app = express();
const http = require("http");
const https = require("https");
const server = http.Server(app).listen(80);
console.log("Server started.");

// Socket.io set-up
const io = require("socket.io").listen(server);
let games = {}, sockets = [];
io.on("connection", (socket) => {
    console.log("Client connected...", socket.id);

    socket.on('error', function (err) {
        if (err.description) throw err.description;
        else throw err; // Or whatever you want to do
    });

    socket.on("join", (gameId) => {
        sockets.push({socket: socket, gameId: gameId});
        if (games[gameId] == undefined) games[gameId] = 0;
        games[gameId]++;

        // Check if both players are connected; if so emit message
        if (games[gameId] == 2) {
            for (let i = 0; i < sockets.length; i++) {
                if (sockets[i].gameId == gameId) {
                    io.to(sockets[i].socket.id).emit("message", {type: "state", msg: "ready"});
                }
            }
        }
        console.log("Joined game " + gameId, "Count: " + games[gameId]);
    });

    socket.on("data", (data) => {
        
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected.", socket.id);

        // Find socket from array
        let i = 0;
        for (;i < sockets.length; i++) {
            if (sockets[i].socket.id === socket.id) break;
            i++;
        }

        // Reduce game participant count
        let gameId = sockets[i].gameId;
        games[gameId]--;
        console.log("Disconnected", gameId, games[gameId]);
        if (games[gameId] == 1) {
            // TODO: Send message to other socket
        } else if (games[gameId] == 0) {
            delete games[gameId];
        }

        // Remove from sockets
        sockets.splice(i, 1);
    });
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator({
    customValidators: {
        isColor: function(color) {
            if (color === undefined) {
                return false;
            }
            return color === "w" || color === "b";
        },
        isUuidV4: function(uuid) {
            if (uuid === undefined) {
                return false;
            }
            let regex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
            return regex.test(uuid);
        },
        isGameId: function(id) {
            if (id === undefined) {
                return false;
            }
            let regex = /^[0-9a-z]{10}$/;
            return regex.test(id);
        }
    }
}));
app.use(cookieParser());

app.use(express.static("./"));
app.use("/game", game);
app.use("/", join);

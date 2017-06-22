const path = require("path");
const express = require("express");
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');

const game = require("./routes/game");
const join = require("./routes/join");

const app = express();
const http = require("http");
const https = require("https");
const server = http.Server(app).listen(80);
console.log("Server started.");

// Socket.io set-up
const io = require("socket.io").listen(server);
io.on("connection", (client) => {
    console.log("Client connected...");

    client.on("join", (data) => {
        console.log(data);
    });

    client.on("disconnect", () => {
        console.log("Client disconnected.");
    });
});

//app.use(logger('dev'));
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
            let regex = /^\d{5}$/;
            return regex.test(id);
        }
    }
}));
app.use(cookieParser());

app.use(express.static("./"));
app.use("/game", game);
app.use("/", join);

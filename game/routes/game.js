const express = require('express');
const router = express.Router();
const crypto = require("crypto");
const MongoClient = require("mongodb").MongoClient;
const mongoUrl = "mongodb://localhost:27017/sjadam";
//const io = require("socket.io")(80);

function generateGameId() {
    return Math.random().toString(36).substr(2, 10);
    //return ~~(Math.random() * 90000) + 10000;
}

// Temp for dev
router.get("/", function(req, res, next) {

    // Connect to MongoDB Server
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) console.log("Unable to connect to the server", err);

        let collection = db.collection("games");
        collection.find({}).toArray((err, result) => {
            if (err) {
                res.send(err);
            } else {
                res.send(result);
            }
            db.close();
        });
    });
});

router.post('/', function(req, res, next) {
    let gameId = generateGameId();

    // Validate post data
    req.checkBody("color", "Color has to be (w)hite/(b)lack").isColor();
    req.checkBody("player_id", "Player ID has to be valid").isUuidV4();

    let errors = req.validationErrors();
    if (errors) {
        console.log("Validation errors: ", errors);
        res.send(errors);
        return;
    }
    let color = req.body.color;
    let playerId = req.body.player_id;

    // Connect to MongoDB Server
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            let error = "Unable to connect to the server";
            console.log(err, error);
            res.send({status: "error", data: error});
            return;
        }

        let collection = db.collection("games");
        let gameId = generateGameId();
        collection.insert({
            "_id": gameId,
            "status": 0,
            "players": [{
                "_id": playerId,
                "color": color
            }]
        });

        res.send({status: "ok", data: {url: "localhost/?game=" + gameId, gameId: gameId}});
        // TEMP ^ use: https://sjadam.no
        db.close();
    });
});

module.exports = router;

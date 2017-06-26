const express = require("express");
const router = express.Router();
const MongoClient = require("mongodb").MongoClient;
const mongoUrl = "mongodb://localhost:27017/sjadam";

router.post("/:gameId", function(req, res, next) {

    // Validate game id param and post data
    req.checkParams("gameId", "Invalid game id").isGameId();
    req.checkBody("player_id", "Player ID has to be valid").isUuidV4();

    let errors = req.validationErrors();
    if (errors) {
        console.log("Validation errors: ", errors);
        res.send("Game not found.");
        return;
    }
    let gameId = req.params.gameId;
    let playerId = req.body.player_id;

    // Connect to MongoDB Server
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) console.log("Unable to connect to the server", err);

        // Check if game exists
        let collection = db.collection("games");
        collection.find({"_id": gameId}).toArray((err, games) => {
            if (err) {
                res.send(err);
                db.close();
            } else {

                // Checks if we have exactly one game with that ID
                if (games.length === 1) {
                    if (!games[0].status) {
                        // Find what color we're going to be
                        let color = games[0].players[0].color === "w" ? "b" : "w";

                        // Append player (you) to the db and set the game started status to true
                        collection.update({"_id": gameId}, {
                            $push: {
                                players: {
                                    "_id": playerId,
                                    "color": color
                                }
                            }, $set: {
                                status: 1
                            }
                        });
                        res.send({status: "ok", data: {color: color}});
                    } else {
                        res.send({status: "error", data: "Game has already started."});
                    }
                } else {
                    res.send({status: "error", data: "Game with ID '" + gameId + "' not found."});
                }
            }
            db.close();
        });
    });
});

module.exports = router;

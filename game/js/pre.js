
// Set player id in local storage
if (!localStorage.playerId) localStorage.playerId = generatePlayerId();

// Check url parameter and determine wether we should join gameId
if (location.hash != "") {
    let regex = /^#\d{5}$/;
    if (regex.test(location.hash)) {
        let gameId = +location.hash.substring(1);

        // Create a post request and check if we can join game.
        let req;
        if (window.XMLHttpRequest) {
            req = new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            req = new ActiveXObject("Microsoft.XMLHTTP");
        }
        req.open("POST", "/" + gameId, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status == 200) {
                let data = JSON.parse(req.responseText);
                console.log(data);
                if (data.status == "ok") {

                    // We're in!
                    // TODO: Join game, connect to socket, start playing.
                }
            }
        };
        req.send("player_id=" + localStorage.playerId);
    }
}

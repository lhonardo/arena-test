const express = require(`express`);
//const bodyParser = require(`body-parser`);
const WebSocketServer = require('websocket').server;
const _ = require('lodash');
const fs = require('fs');

const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'white', 'grey', 'orange', 'brown'];

const app = express();
const PORT = process.env.PORT || 3000;

// local external files
app.use(express.static('public'));

// Sets up the Express app to handle data parsing
/*app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));*/

// Starts the server to begin listening
// =============================================================
const server = app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});


const wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

// Maps privateId => publicId
const privateIdMap = {};
// Maps publicId => playerObject
const players = {};
// Maps privateId => web socket connection (used for broadcasting to all players).
const connections = {};

function broadcast(data) {
    for (let id in connections) {
        connections[id].sendUTF(JSON.stringify(data));
    }
}

function updatePlayer(playerId, playerData) {
    players[playerId] = {
        ...players[playerId],
        ...playerData,
    };
};

function randomKey() {
    return [...new Array(30)].map(() =>
        String.fromCharCode(65 + Math.floor(Math.random() * 58))
    ).join('');
}

function onPlayerJoin(connection, action, privateId, publicId) {
    const usedColors = _.values(players).map(player => player.color);

    players[publicId] = {
        id: publicId,
        name: action.player.name || 'Incognito' + publicId.substring(0, 6),
        x: action.player.x || 200,
        y: action.player.y || 800,
        vx: action.player.vx || 0,
        vy: action.player.vy || 0,
        color: _.sample(_.difference(colors, usedColors)),
    };
    // console.log("Added player");
    // console.log(players);
    // When a player first logs in we send them their public/private ids and the full list of player data.
    connection.sendUTF(JSON.stringify({
        type: 'joined',
        privateId,
        publicId,
        color: players[publicId].color,
        players,
    }));
    // Broadcast to all other players that the new player has joined.
    broadcast({
        type: 'playerJoined',
        player: players[publicId],
    });
    connections[privateId] = connection;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }
    let privateId = null, publicId = null;

    const connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        // We only handle utf8 encoded json messages.
        if (message.type !== 'utf8') return;
        let action;
        console.log('Received Message: ' + message.utf8Data);
        try {
            action = JSON.parse(message.utf8Data);
        } catch (e) {
            connection.sendUTF(JSON.stringify({errorMessage: 'Could not parse json'}));
            return;
        }
        // Create a new private/public pair id for clients that do not yet have a private id
        // and send them back their initial player data.
        if (action.type === 'join') {
            do {
                privateId = randomKey();
            } while (privateIdMap[privateId]);
            do {
                publicId = randomKey();
            } while (players[publicId]);
            privateIdMap[privateId] = publicId;
            onPlayerJoin(connection, action, privateId, publicId);
            return;
        }
        // All actions except for join require the user to have joined and send their privateId.
        privateId = action.privateId;
        publicId = privateIdMap[action.privateId];
        if (!publicId) {
            connection.sendUTF(JSON.stringify({errorMessage: `Player id ${action.privateId} not found.`}));
            return;
        }
        const player = players[publicId];
        // If a new connection is opened for an existing player, close the
        // old connection and store the new one.
        if (connections[privateId] !== connection) {
            // Close the previous connection if it exists.
            if (connections[privateId]) connections[privateId].close();
            connections[privateId] = connection;
        }
        if (action.type === 'move') {
            updatePlayer(publicId, action.player);
            broadcast({
                type: 'updatePlayer',
                player: players[publicId],
            });
            return;
        }
        connection.sendUTF(JSON.stringify({errorMessage: `Unhandled action type '${action.type}'.`}));
        return;
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        // If the most recent connection for a private id closes, purge it from memory
        if (connections[privateId] === connection) {
            const player = players[publicId];
            delete connections[privateId];
            delete players[publicId];
            delete privateIdMap[privateId];
            broadcast({
                type: 'playerLeft',
                id: publicId,
            });
        }
    });
});

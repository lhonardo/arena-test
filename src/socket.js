const _ = require('lodash');

const state = require('state');

module.exports = {
    sendPlayerJoined,
    sendPlayerMoved,
};

// Create WebSocket connection.
const socket = new WebSocket(`ws://${window.location.host}`);

// Listen for messages
socket.addEventListener('message', event => {
    console.log('Message from server ', event.data);
    const action = JSON.parse(event.data);
    if (action.errorMessage) {
        console.log(new Error(action.errorMessage));
        return;
    }
    if (action.type === 'joined') {
        state.privateId = action.privateId;
        state.publicId = action.publicId;
        state.player.id = state.publicId;
        state.player.color = action.color;
        state.players = action.players;
        return;
    }
    // Don't process any messages from the server until we have the character data.
    if (!state.privateId) {
        return;
    }
    if (action.type === 'playerJoined') {
        state.players[action.players.id] = action.players;
        return;
    }
    if (action.type === 'playerLeft') {
        delete state.players[action.id];
        return;
    }
    if (action.type === 'updatePlayer') {
        state.players[action.player.id] = {
            ...state.players[action.player.id],
            ...action.player,
        }
    }
});

function sendData(action, force = false) {
    // Unless force is set, don't send any messages until this client has received its private id.
    if (!force && !state.privateId) {
        return false;
    }
    // We can't send message if the socket is open (either because this is too early, or maybe the connection broke)
    if (socket.readyState !== socket.OPEN) {
        return false;
    }
    // Include privateId on all messages once it is available.
    if (state.privateId) {
        action.privateId = state.privateId;
    }
    socket.send(JSON.stringify(action));
    return true;
}
// Serialize properties from player that should be sent to the server for updates.
function serializePlayer(player) {
    return _.pick(player, ['x', 'y']);
}
function sendPlayerJoined() {
    return sendData({
        type: 'join',
        player: serializePlayer(state.player),
    }, true);
}
function sendPlayerMoved() {
    return sendData({
        type: 'move',
        player: serializePlayer(state.player)
    });
}

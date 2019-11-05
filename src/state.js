
// Assign this to window.state for debugging purposes.
window.state = module.exports = {
    // Object storing the current player's properties.
    player: {
        name: null,
        x: Math.floor(Math.random() * 200) - 100,
        y: Math.floor(Math.random() * 200) - 100,
    },
    // Array of object storing the public information for all players
    players: [],
    // Id for the current player that is secret and can be used to identify them if they have to
    // reconnect to the server.
    privateId: null,

    // Id for the current player that is known to all clients
    publicId: null,
    joining: false,
};

import {
    isKeyDown,
    KEY_LEFT,
    KEY_RIGHT,
    KEY_UP,
    KEY_DOWN,
} from 'utils/keyboard';
import {
    validatePlayer
} from 'utils/validate';

import {
    sendPlayerJoined,
    sendPlayerMoved,
} from 'socket';

export function update(state) {
    // Send join request if we haven't joined yet.
    if (!state.privateId && !state.joining) {
        // This will return false until the socket is available.
        if (sendPlayerJoined()) {
            state.joining = true;
        }
    }
    let dx = 0, dy = 0;
    dx -= isKeyDown(KEY_LEFT);
    dx += isKeyDown(KEY_RIGHT);
    dy -= isKeyDown(KEY_UP);
    dy += isKeyDown(KEY_DOWN);
    if (dx || dy) {
        state.player.x += dx * 5;
        state.player.y += dy * 5;
        state.player = validatePlayer(state.player);

        sendPlayerMoved();
    }
}

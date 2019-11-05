
import { drawImage, requireImage } from 'utils/images.js';

const urchinFrame = {
    image: requireImage('gfx/urchin.png'),
    w: 100,
    h: 100
};


export function render(context, state) {
    const { privateId, player, players } = state;
    if (!privateId) {
        return renderConnecting(context, state);
    }

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.save();
    context.translate(
        context.canvas.width / 2 -player.x,
        context.canvas.height / 2 - player.y
    );
    renderBackground(context, state);
    for (const playerId in players) {
        // Rendering the main player is done separately so they always
        // render on top when overlapping.
        if (playerId === player.id) {
            continue;
        }
        renderPlayer(context, state, players[playerId]);
    }
    renderPlayer(context, state, player);
    context.restore();
}

function renderBackground(context, state) {
    // Draw a hash so players can see themselves moving against something.
    context.strokeStyle = 'black';
    context.beginPath();
    for (let i = -100; i <= 100; i += 40) {
        context.moveTo(-100, i);
        context.lineTo(100, i);
        context.moveTo(i, -100);
        context.lineTo(i, 100);
    }
    context.stroke();
}

const PLAYER_SIZE = 40;
function renderPlayer(context, state, player) {
    context.save();
    context.translate(player.x - PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2 );
    context.fillStyle = player.color;
    context.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
    drawImage(context, urchinFrame.image, urchinFrame, {w: PLAYER_SIZE, h: PLAYER_SIZE});
    context.restore();
}

function renderConnecting(context, state) {
    context.fillStyle = 'black';
    console.log(0, 0, context.canvas.width, context.canvas.height);
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('Connecting...', context.canvas.width / 2, context.canvas.height / 2)
}

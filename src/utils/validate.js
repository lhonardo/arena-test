export function validatePlayer(player) {
    let { x, y } = player;
    // validate as a square for now
    let edge = window.canvas.width / 10;

    player.x = validateBoundary(x, edge)
    player.y = validateBoundary(y, edge)

    return player;
}

function validateBoundary(point, edge) {
    if (Math.abs(point) > edge) {
        point = point > 0 
            ? edge 
            : edge * -1;
    }

    return point;
}


import { render } from 'render';
import state from 'state';
import { update } from 'update';

// Create the game canvas
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 550;
const context = canvas.getContext('2d');
document.body.appendChild(canvas);
context.fillStyle = 'red';
context.fillRect(100, 100, 100, 200);

function updateCanvasSize() {
    let scale = window.innerWidth / 800;
    // Canvas is always 800px wide
    canvas.width = 800;
    // Canvas is tall enough to fill the screen, and at least 300px tall
    canvas.height = Math.max(300, Math.ceil(window.innerHeight / scale));
    canvas.style.transformOrigin = '0 0'; //scale from top left
    canvas.style.transform = 'scale(' + scale + ')';
    canvas.scale = scale;
    window.canvas = canvas;
    // It seems we have to set this any time we resize the canvas.
    context.imageSmoothingEnabled = false;
}
updateCanvasSize();
window.onresize = updateCanvasSize;

// Create and start the render loop.
function renderLoop() {
    render(context, state);
    window.requestAnimationFrame(renderLoop);
}
renderLoop();

// Create and start the update loop.
const FRAME_LENGTH = 20;
function updateLoop() {
    update(state);
}
setInterval(updateLoop, FRAME_LENGTH);


/* global navigator */
export const KEY_LEFT = 37;
export const KEY_RIGHT = 39;
export const KEY_UP = 38;
export const KEY_DOWN = 40;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_ENTER = 13;
export const KEY_BACK_SPACE = 8;
export const KEY_CONTROL = 17;
export const KEY_E = 'E'.charCodeAt(0);
export const KEY_G = 'G'.charCodeAt(0);
export const KEY_R = 'R'.charCodeAt(0);
export const KEY_X = 'X'.charCodeAt(0);
export const KEY_C = 'C'.charCodeAt(0);
export const KEY_V = 'V'.charCodeAt(0);
export const KEY_T = 'T'.charCodeAt(0);
// Under this threshold, the analog buttons are considered "released" for the sake of
// actions that are only taken once per button push (like moving a menu cursor).
export const ANALOG_THRESHOLD = 0.3;

const KEY_MAPPINGS = {
    ['A'.charCodeAt(0)]: KEY_LEFT,
    ['D'.charCodeAt(0)]: KEY_RIGHT,
    ['W'.charCodeAt(0)]: KEY_UP,
    ['S'.charCodeAt(0)]: KEY_DOWN,
};

// This mapping assumes a canonical gamepad setup as seen in:
// https://w3c.github.io/gamepad/#remapping
// Which seems to work well with my xbox 360 controller.
// I based this code on examples from:
// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API
// Easy to find mappings at: http://html5gamepad.com/
const GAME_PAD_MAPPINGS = {
    [KEY_C]: 0, // A (bottom button)
    [KEY_V]: 1, // B (right button)
    [KEY_SPACE]: 2, // X (left button)
    [KEY_X]: 3, // Y (top button)
    [KEY_ENTER]: 9, // START
    [KEY_UP]: 12,
    [KEY_DOWN]: 13,
    [KEY_LEFT]: 14,
    [KEY_RIGHT]: 15,
    [KEY_R]: 4, // L Front Bumper
    [KEY_SHIFT]: 5,  // R Front bumper
};

const LEFT_ANALOG_Y_AXIS = 1;
const LEFT_ANALOG_X_AXIS = 0;
// These two are currently unused, but would be used for aiming instead of the mouse.
const RIGHT_ANALOG_Y_AXIS = 3;
const RIGHT_ANALOG_X_AXIS = 2;
const GAME_PAD_AXIS_MAPPINGS = {
    // Map the negative y axis of the left stick to the up key.
    [KEY_UP]: [LEFT_ANALOG_Y_AXIS, -1],
    // Map the positive y axis of the left stick to the down key.
    [KEY_DOWN]: [LEFT_ANALOG_Y_AXIS, 1],
    // Map the negative x axis of the left stick to the up key.
    [KEY_LEFT]: [LEFT_ANALOG_X_AXIS, -1],
    // Map the positive x axis of the left stick to the down key.
    [KEY_RIGHT]: [LEFT_ANALOG_X_AXIS, 1],
};

const physicalKeysDown = {};
const keysDown = {};


// Apparently, depending on the button type, either button.pressed or button == 1.0 indicates the button is pressed.
function buttonIsPressed(button) {
  if (typeof(button) == "object") return button.pressed;
  return button == 1.0;
}

window.document.onkeydown = function (event) {
    //console.log(event.which);
    // Don't process this if the key is already down.
    if (physicalKeysDown[event.which]) return;
    physicalKeysDown[event.which] = true;
    const mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = (keysDown[mappedKeyCode] || 0) + 1;
    //console.log(keysDown[mappedKeyCode]);
};

window.document.onkeyup = function (event) {
    physicalKeysDown[event.which] = false;
    const mappedKeyCode = KEY_MAPPINGS[event.which] || event.which;
    keysDown[mappedKeyCode] = Math.max(0, (keysDown[mappedKeyCode] || 0) - 1);
    //console.log(keysDown[mappedKeyCode]);
};

const lastButtonsPressed = {};
// Release can be set to true to pretend the key is released after reading it.
// This only works for keyboard keys.
export function isKeyDown(keyCode, releaseThreshold = false) {
    if (keysDown[keyCode]) {
        if (releaseThreshold) {
            keysDown[keyCode] = 0;
        }
        return 1;
    }
    // If a mapping exists for the current key code to a gamepad button,
    // check if that gamepad button is pressed.
    const buttonIndex = GAME_PAD_MAPPINGS[keyCode], axisIndex = GAME_PAD_AXIS_MAPPINGS[keyCode];
    if (typeof(buttonIndex) !== 'undefined' || typeof(axisIndex) !== 'undefined') {
        // There can be multiple game pads connected. For now, let's just check all of them for the button.
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
        for (const gamepad of gamepads) {
            if (!gamepad) continue;
            let value = 0;
            if (typeof(buttonIndex) !== 'undefined' && buttonIsPressed(gamepad.buttons[buttonIndex])) {
                value = 1;
            } else if (typeof(axisIndex) !== 'undefined' && gamepad.axes[axisIndex[0]] * axisIndex[1] > 0) {
                value = gamepad.axes[axisIndex[0]] * axisIndex[1];
            }
            if (value) {
                const wasLastPressed = lastButtonsPressed[buttonIndex] || 0;
                const now = Date.now();
                if (value > ANALOG_THRESHOLD) {
                    lastButtonsPressed[buttonIndex] = now;
                }
                if (!releaseThreshold || (now - wasLastPressed >= releaseThreshold)) {
                    return value;
                }
            }
        }
    }
    return 0;
}

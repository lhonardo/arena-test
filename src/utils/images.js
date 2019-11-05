/* globals Image */
const images = {};
export function requireImage(source) {
    if (images[source]) return images[source];
    const image = new Image();
    image.src = source;
    image.originalSource = source;
    images[source] = image;
    return image;
}

export function drawImage(context, image,
    {x: sx = 0, y: sy = 0, w: sw, h: sh},
    {x: tx = 0, y: ty = 0, w: tw, h: th}
) {
    context.drawImage(image, sx, sy, sw, sh, tx, ty, tw, th);
}

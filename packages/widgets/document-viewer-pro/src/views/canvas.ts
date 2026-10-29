/** Draws an image into a canvas at a scale and a rotation of 0, 90, 180 or 270 degrees. */
export function drawRotated(
    source: CanvasImageSource,
    width: number,
    height: number,
    canvas: HTMLCanvasElement,
    scale: number,
    rotation: number,
    pixelRatio = window.devicePixelRatio || 1
): void {
    const quarter = ((rotation % 360) + 360) % 360;
    const swap = quarter === 90 || quarter === 270;
    const cssWidth = Math.round((swap ? height : width) * scale);
    const cssHeight = Math.round((swap ? width : height) * scale);
    canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    const context = canvas.getContext("2d");
    if (!context) {
        return;
    }
    context.save();
    context.scale(pixelRatio * scale, pixelRatio * scale);
    if (quarter === 90) {
        context.translate(height, 0);
    } else if (quarter === 180) {
        context.translate(width, height);
    } else if (quarter === 270) {
        context.translate(0, width);
    }
    context.rotate((quarter * Math.PI) / 180);
    context.drawImage(source, 0, 0, width, height);
    context.restore();
}

export function canvasToObjectUrl(canvas: HTMLCanvasElement, type = "image/png"): Promise<string | undefined> {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob ? URL.createObjectURL(blob) : undefined), type);
    });
}

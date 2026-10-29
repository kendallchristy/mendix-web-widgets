import type { Rect } from "./markup";

/** A signature the user made: a transparent PNG and its height divided by its width. */
export interface Signature {
    image: string;
    aspect: number;
}

/** A signature put on a page. The rectangle is in page fractions, like markup. */
export interface PlacedSignature extends Signature {
    id: string;
    page: number;
    rect: Rect;
    /** The PDF signature field it fills, if any. */
    field?: string;
}

/** An empty signature field in the PDF. */
export interface SignatureField {
    key: string;
    page: number;
    rect: Rect;
}

const DEFAULT_WIDTH = 0.28;

function clampRect([x, y, w, h]: Rect): Rect {
    const width = Math.min(w, 1);
    const height = Math.min(h, 1);
    return [Math.min(Math.max(0, x), 1 - width), Math.min(Math.max(0, y), 1 - height), width, height];
}

/**
 * A signature centered on a point of the page. `pageAspect` is the page's height divided by its width, which turns
 * the image's shape into page fractions.
 */
export function placeAt(x: number, y: number, signature: Signature, pageAspect: number): Rect {
    const width = DEFAULT_WIDTH;
    const height = (width * signature.aspect) / pageAspect;
    return clampRect([x - width / 2, y - height / 2, width, height]);
}

/** The largest rectangle with the signature's shape that fits in a field, centered in it. */
export function fitInto(field: Rect, signature: Signature, pageAspect: number): Rect {
    const [fx, fy, fw, fh] = field;
    let width = fw;
    let height = (width * signature.aspect) / pageAspect;
    if (height > fh) {
        height = fh;
        width = (height * pageAspect) / signature.aspect;
    }
    return [fx + (fw - width) / 2, fy + (fh - height) / 2, width, height];
}

export function moveRect(rect: Rect, dx: number, dy: number): Rect {
    return clampRect([rect[0] + dx, rect[1] + dy, rect[2], rect[3]]);
}

export function dataUrlBytes(url: string): Uint8Array {
    const base64 = url.slice(url.indexOf(",") + 1);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/** Crops a canvas to its drawn pixels, with a little margin, and returns it as a signature. */
export function trimCanvas(source: HTMLCanvasElement, margin = 4): Signature | null {
    const context = source.getContext("2d");
    if (!context) {
        return null;
    }
    const { width, height } = source;
    const pixels = context.getImageData(0, 0, width, height).data;
    let top = height;
    let left = width;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (pixels[(y * width + x) * 4 + 3] > 8) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
            }
        }
    }
    if (right < 0) {
        return null;
    }
    left = Math.max(0, left - margin);
    top = Math.max(0, top - margin);
    right = Math.min(width - 1, right + margin);
    bottom = Math.min(height - 1, bottom + margin);
    const cropped = document.createElement("canvas");
    cropped.width = right - left + 1;
    cropped.height = bottom - top + 1;
    cropped
        .getContext("2d")
        ?.drawImage(source, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    return { image: cropped.toDataURL("image/png"), aspect: cropped.height / cropped.width };
}

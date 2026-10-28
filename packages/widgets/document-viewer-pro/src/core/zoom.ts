export type ZoomMode = "fitWidth" | "fitPage" | "actual" | "custom";

export interface Zoom {
    mode: ZoomMode;
    /** Used when mode is custom; 1 is 100%. */
    scale: number;
}

export const MIN_SCALE = 0.25;
export const MAX_SCALE = 5;
const STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];

export function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Next preset in the given direction, so zooming always lands on round percentages. */
export function stepScale(current: number, direction: 1 | -1): number {
    if (direction > 0) {
        return STEPS.find(step => step > current + 0.001) ?? MAX_SCALE;
    }
    return [...STEPS].reverse().find(step => step < current - 0.001) ?? MIN_SCALE;
}

// Room around a page so its shadow and the scrollbar don't touch the edges.
const GUTTER = 32;

/**
 * The scale a paged view draws at. Page sizes are in CSS pixels at 100%, already swapped for 90° rotations.
 */
export function resolveScale(
    zoom: Zoom,
    page: { width: number; height: number } | undefined,
    viewport: { width: number; height: number },
    /** Largest scale a fit mode may pick, so small images aren't blown up. */
    maxFit = MAX_SCALE
): number {
    if (zoom.mode === "custom") {
        return clampScale(zoom.scale);
    }
    if (zoom.mode === "actual" || !page || page.width <= 0 || viewport.width <= 0) {
        return 1;
    }
    const widthScale = (viewport.width - GUTTER) / page.width;
    if (zoom.mode === "fitWidth") {
        return clampScale(Math.min(widthScale, maxFit));
    }
    const heightScale = (viewport.height - GUTTER) / page.height;
    return clampScale(Math.min(widthScale, heightScale, maxFit));
}

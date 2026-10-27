import { toastStack, type ToastStack } from "./stack";
import type { Position } from "./types";

// Toasts render through a portal into one fixed region per position on <body>, so a transformed or
// scrolling container on the page can't clip them. The region is sized to its stack so hovering the gaps
// between toasts keeps the stack expanded.

const regions = new Map<Position, HTMLElement>();

export function getViewport(position: Position, stack: ToastStack = toastStack): HTMLElement {
    const existing = regions.get(position);
    if (existing && existing.isConnected) {
        return existing;
    }
    const region = document.createElement("section");
    region.className = `widget-toast-pro-viewport tp-viewport tp-viewport--${position}`;
    region.setAttribute("aria-label", "Notifications");
    region.tabIndex = -1;
    region.addEventListener("pointerenter", () => stack.setHovered(position, true));
    region.addEventListener("pointerleave", () => stack.setHovered(position, false));
    document.body.appendChild(region);
    regions.set(position, region);

    const resize = (): void => {
        const { count, width, height } = stack.bounds(position);
        // An empty region keeps its last width so a toast that is still animating out doesn't shrink.
        if (count > 0) {
            region.style.setProperty("--tp-width", `${width}px`);
        }
        region.style.height = `${height}px`;
        region.toggleAttribute("data-empty", count === 0);
        if (count === 0) {
            stack.setHovered(position, false);
        }
    };
    stack.subscribe(resize);
    resize();
    return region;
}

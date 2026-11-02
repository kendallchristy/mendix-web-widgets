/**
 * Scrolls containers while an item is dragged near their edges.
 *
 * Built in rather than taken from Pragmatic drag and drop's auto-scroll package: that package looks up the
 * element under the pointer every frame, which makes the browser lay the page out again after each scroll step.
 * Here, container positions are read once (and again only after something scrolls), and each frame only
 * sets the scroll position it keeps track of, so scrolling stays smooth on slow devices.
 */

interface Target {
    element: Element;
    vertical: boolean;
    horizontal: boolean;
    rect?: { left: number; top: number; right: number; bottom: number; maxX: number; maxY: number };
    /**
     * Scroll position as last read here plus the steps taken since, so frames don't read it back (a read forces
     * a layout). Steps are relative, so if something else scrolls the container this only drifts the room check.
     */
    x: number;
    y: number;
    /** When the pointer entered an edge zone, per axis; scrolling ramps up from there. */
    enteredY?: number;
    enteredX?: number;
    carryX: number;
    carryY: number;
}

/** Distance from an edge, in px, where scrolling starts. Capped to a quarter of the container. */
const ZONE = 72;
/** Fastest scroll, in px per frame at 60 frames per second. */
const MAX_SPEED = 24;
/** Time to reach full speed after entering a zone, so a drag that starts near an edge doesn't lurch. */
const RAMP_MS = 350;

function scrollable(element: Element): { vertical: boolean; horizontal: boolean } {
    const style = getComputedStyle(element);
    const can = (value: string): boolean => /(auto|scroll|overlay)/.test(value);
    return { vertical: can(style.overflowY), horizontal: can(style.overflowX) };
}

/** Every scrollable ancestor of an element, innermost first, ending with the page itself. */
export function scrollContainers(
    start: Element | null
): Array<{ element: Element; vertical: boolean; horizontal: boolean }> {
    const found: Array<{ element: Element; vertical: boolean; horizontal: boolean }> = [];
    let node: Element | null = start;
    while (node && node !== document.body && node !== document.documentElement) {
        const axes = scrollable(node);
        if (axes.vertical || axes.horizontal) {
            found.push({ element: node, ...axes });
        }
        node = node.parentElement;
    }
    const page = document.scrollingElement ?? document.documentElement;
    found.push({ element: page, vertical: true, horizontal: true });
    return found;
}

class AutoScroller {
    private targets: Target[] = [];
    private pointer: { x: number; y: number } | undefined;
    private frame: number | undefined;
    private last = 0;
    /** A scroll moves the containers inside the one that scrolled; their positions are read again. */
    private readonly invalidate = (event: Event): void => {
        const scrolled =
            event.target instanceof Document ? event.target.documentElement : (event.target as Element | null);
        this.targets.forEach(target => {
            if (!scrolled || (target.element !== scrolled && scrolled.contains(target.element))) {
                target.rect = undefined;
            }
        });
    };
    private readonly resized = (): void => {
        this.targets.forEach(target => {
            target.rect = undefined;
        });
    };

    /** Starts watching these containers. Safe to call again with more during the same drag. */
    add(containers: Array<{ element: Element; vertical: boolean; horizontal: boolean }>): void {
        containers.forEach(container => {
            if (!this.targets.some(target => target.element === container.element)) {
                this.targets.push({
                    ...container,
                    carryX: 0,
                    carryY: 0,
                    x: container.element.scrollLeft,
                    y: container.element.scrollTop
                });
            }
        });
        if (this.frame === undefined && this.targets.length > 0) {
            document.addEventListener("scroll", this.invalidate, { capture: true, passive: true });
            window.addEventListener("resize", this.resized, { passive: true });
            this.last = performance.now();
            this.frame = requestAnimationFrame(this.tick);
        }
    }

    move(x: number, y: number): void {
        this.pointer = { x, y };
    }

    stop(): void {
        if (this.frame !== undefined) {
            cancelAnimationFrame(this.frame);
        }
        this.frame = undefined;
        this.targets = [];
        this.pointer = undefined;
        document.removeEventListener("scroll", this.invalidate, { capture: true });
        window.removeEventListener("resize", this.resized);
    }

    private readonly tick = (now: number): void => {
        const elapsed = Math.min(now - this.last, 50);
        this.last = now;
        const pointer = this.pointer;
        if (pointer) {
            // Innermost container first: once one scrolls on an axis, outer ones leave that axis alone.
            let usedX = false;
            let usedY = false;
            for (const target of this.targets) {
                const rect = this.rectOf(target);
                const inside =
                    pointer.x >= rect.left &&
                    pointer.x <= rect.right &&
                    pointer.y >= rect.top &&
                    pointer.y <= rect.bottom;
                if (!inside) {
                    target.enteredX = target.enteredY = undefined;
                    continue;
                }
                const element = target.element;
                if (target.vertical && !usedY) {
                    const dy = this.speed(target, "y", pointer.y, rect.top, rect.bottom, now, elapsed);
                    if (dy !== 0 && this.room(target, "y", dy, rect.maxY)) {
                        target.carryY += dy;
                        const step = Math.trunc(target.carryY);
                        target.carryY -= step;
                        if (step !== 0) {
                            target.y = Math.min(rect.maxY, Math.max(0, target.y + step));
                            element.scrollBy(0, step);
                        }
                        usedY = true;
                    }
                }
                if (target.horizontal && !usedX) {
                    const dx = this.speed(target, "x", pointer.x, rect.left, rect.right, now, elapsed);
                    if (dx !== 0 && this.room(target, "x", dx, rect.maxX)) {
                        target.carryX += dx;
                        const step = Math.trunc(target.carryX);
                        target.carryX -= step;
                        if (step !== 0) {
                            target.x = Math.min(rect.maxX, Math.max(0, target.x + step));
                            element.scrollBy(step, 0);
                        }
                        usedX = true;
                    }
                }
            }
        }
        this.frame = requestAnimationFrame(this.tick);
    };

    /**
     * Whether there is room to scroll this way. Trusts the tracked position while it says yes; at an end it
     * reads the real position once, in case something else scrolled the container (a mouse wheel, a load).
     */
    private room(target: Target, axis: "x" | "y", delta: number, max: number): boolean {
        const has = (position: number): boolean => (delta < 0 ? position > 0 : position < max - 1);
        if (has(target[axis])) {
            return true;
        }
        target[axis] = axis === "y" ? target.element.scrollTop : target.element.scrollLeft;
        return has(target[axis]);
    }

    private rectOf(target: Target): NonNullable<Target["rect"]> {
        if (!target.rect) {
            const element = target.element;
            const page = element === (document.scrollingElement ?? document.documentElement);
            const box = page
                ? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
                : element.getBoundingClientRect();
            target.rect = {
                left: box.left,
                top: box.top,
                right: box.right,
                bottom: box.bottom,
                maxX: element.scrollWidth - element.clientWidth,
                maxY: element.scrollHeight - element.clientHeight
            };
        }
        return target.rect;
    }

    /** Signed px to scroll this frame on one axis. */
    private speed(
        target: Target,
        axis: "x" | "y",
        position: number,
        start: number,
        end: number,
        now: number,
        elapsed: number
    ): number {
        const zone = Math.min(ZONE, (end - start) / 4);
        const fromStart = position - start;
        const fromEnd = end - position;
        const key = axis === "x" ? "enteredX" : "enteredY";
        let direction = 0;
        let depth = 0;
        if (fromStart < zone) {
            direction = -1;
            depth = 1 - Math.max(0, fromStart) / zone;
        } else if (fromEnd < zone) {
            direction = 1;
            depth = 1 - Math.max(0, fromEnd) / zone;
        }
        if (direction === 0) {
            target[key] = undefined;
            return 0;
        }
        target[key] ??= now;
        const ramp = Math.min(1, (now - target[key]!) / RAMP_MS);
        // Ease in: slow at the zone's inner edge, fast at the container's edge.
        return direction * MAX_SPEED * depth * depth * ramp * (elapsed / (1000 / 60));
    }
}

export const autoScroller = new AutoScroller();

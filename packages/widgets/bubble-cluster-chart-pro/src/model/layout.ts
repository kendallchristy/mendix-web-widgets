import type { Circle } from "./pack";
import { packSiblings, spread } from "./pack";

export interface ClusterLayoutOptions {
    width: number;
    height: number;
    /** Pixels between neighbouring bubbles. */
    gap: number;
    /** Pixels between groups. */
    groupGap: number;
    /** Draws a circle around each group, with room inside it around the bubbles. */
    outlines: boolean;
    /** Pixels above each group's outline for its name. */
    labelRoom: number;
}

export interface ClusterLayout {
    /** Every bubble's centre and radius in pixels, per group, in the order given. */
    bubbles: Circle[][];
    /** Each group's outline in pixels. */
    groups: Circle[];
}

/** Room inside a group's outline around its bubbles, in pixels. */
const OUTLINE_PADDING = 6;

/**
 * Places bubbles whose areas show their values, packed together and grouped, to fill a box. Values must be
 * positive. One group packs its bubbles straight into the box; several pack each group first, then the groups.
 */
export function layoutCluster(values: number[][], options: ClusterLayoutOptions): ClusterLayout {
    const { width, height } = options;
    const grouped = values.length > 1;
    const aspect = Math.max(0.4, Math.min(3, width / Math.max(1, height)));
    let scale = 1;
    let result: ClusterLayout = { bubbles: values.map(() => []), groups: [] };
    // Gaps are in pixels, but the packing works in the bubbles' own units before they are scaled to fit, so the
    // scale from one pass sets the gaps for the next.
    for (let pass = 0; pass < 3; pass++) {
        const gap = options.gap / scale;
        const groupGap = options.groupGap / scale;
        const padding = grouped && options.outlines ? OUTLINE_PADDING / scale : 0;
        const labelRoom = grouped && options.outlines ? options.labelRoom / scale : 0;

        const bubbles = values.map(group => group.map(value => ({ x: 0, y: 0, r: Math.sqrt(value) })));
        const groups = bubbles.map(group => {
            // Largest first packs tightest, with the big bubbles in the middle.
            const order = group.map((_, i) => i).sort((a, b) => group[b].r - group[a].r);
            const padded = order.map(i => ({ ...group[i], r: group[i].r + gap / 2 }));
            const r = packSiblings(padded);
            order.forEach((i, k) => {
                group[i].x = padded[k].x;
                group[i].y = padded[k].y;
            });
            return { x: 0, y: 0, r: r - gap / 2 + padding };
        });
        if (grouped) {
            // A group's name only needs room above it, so it widens the gap by less than its height.
            const spaced = groups.map(g => ({ ...g, r: g.r + groupGap / 2 + labelRoom / 3 }));
            packSiblings(spaced);
            if (options.outlines) {
                spread(spaced, aspect, 0);
            }
            groups.forEach((g, i) => {
                g.x = spaced[i].x;
                // Each group's name sits above it, so the group moves down by half the room it takes.
                g.y = spaced[i].y + labelRoom / 2;
            });
            bubbles.forEach((group, i) =>
                group.forEach(c => {
                    c.x += groups[i].x;
                    c.y += groups[i].y;
                })
            );
            if (!options.outlines) {
                // Without outlines the groups can change shape, so the bubbles themselves spread to fill the box.
                const of = bubbles.flatMap((group, i) => group.map(() => i));
                spread(bubbles.flat(), aspect, gap, { of, gap: groupGap });
            }
        } else {
            spread(bubbles[0], aspect, gap);
        }

        const extent = (cs: Circle[], above = 0): number[] => [
            Math.min(...cs.map(c => c.x - c.r)),
            Math.min(...cs.map(c => c.y - c.r - above)),
            Math.max(...cs.map(c => c.x + c.r)),
            Math.max(...cs.map(c => c.y + c.r))
        ];
        const all = bubbles.flat();
        if (all.length === 0) {
            return result;
        }
        const boxes = [extent(all), ...(grouped && options.outlines ? [extent(groups, labelRoom)] : [])];
        const [x0, y0, x1, y1] = [
            Math.min(...boxes.map(b => b[0])),
            Math.min(...boxes.map(b => b[1])),
            Math.max(...boxes.map(b => b[2])),
            Math.max(...boxes.map(b => b[3]))
        ];
        scale = Math.min(width / Math.max(1e-9, x1 - x0), height / Math.max(1e-9, y1 - y0));
        const dx = width / 2 - ((x0 + x1) / 2) * scale;
        const dy = height / 2 - ((y0 + y1) / 2) * scale;
        const toPixels = (c: Circle): Circle => ({ x: c.x * scale + dx, y: c.y * scale + dy, r: c.r * scale });
        result = { bubbles: bubbles.map(group => group.map(toPixels)), groups: grouped ? groups.map(toPixels) : [] };
    }
    return result;
}

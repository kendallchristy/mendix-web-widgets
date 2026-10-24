import { layoutCluster } from "../model/layout";
import type { Circle } from "../model/pack";
import { encloseCircles, packSiblings } from "../model/pack";

const overlap = (a: Circle, b: Circle, gap = 0): boolean => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + gap - 1e-6;

function anyOverlap(circles: Circle[], gap = 0): boolean {
    return circles.some((a, i) => circles.slice(i + 1).some(b => overlap(a, b, gap)));
}

describe("packSiblings", () => {
    it("packs circles without overlap, inside an enclosing circle centred on the origin", () => {
        const circles = [30, 25, 20, 18, 12, 10, 9, 6, 5, 3].map(r => ({ x: 0, y: 0, r }));
        const r = packSiblings(circles);
        expect(anyOverlap(circles)).toBe(false);
        for (const c of circles) {
            expect(Math.hypot(c.x, c.y) + c.r).toBeLessThanOrEqual(r + 1e-6);
        }
        // Tight: the circles fill a good share of the enclosing circle.
        const area = circles.reduce((sum, c) => sum + c.r * c.r, 0);
        expect(area / (r * r)).toBeGreaterThan(0.55);
    });

    it("handles one and two circles", () => {
        expect(packSiblings([])).toBe(0);
        expect(packSiblings([{ x: 5, y: 5, r: 4 }])).toBe(4);
        const two = [
            { x: 0, y: 0, r: 3 },
            { x: 0, y: 0, r: 1 }
        ];
        expect(packSiblings(two)).toBe(4);
        // Side by side, touching, with their enclosing circle on the origin.
        expect([two[0].x, two[1].x]).toEqual([-1, 3]);
    });
});

describe("encloseCircles", () => {
    it("finds the smallest circle around others", () => {
        const e = encloseCircles([
            { x: -10, y: 0, r: 2 },
            { x: 10, y: 0, r: 2 },
            { x: 0, y: 3, r: 1 }
        ]);
        expect(e.x).toBeCloseTo(0);
        expect(e.y).toBeCloseTo(0);
        expect(e.r).toBeCloseTo(12);
    });
});

describe("layoutCluster", () => {
    const values = [4200, 3600, 3100, 2600, 2000, 1800, 1400, 1200, 900, 800, 640, 520, 450, 260];

    it("fills a wide box with bubbles whose areas show their values, gap apart", () => {
        const { bubbles } = layoutCluster([values], {
            width: 500,
            height: 220,
            gap: 3,
            groupGap: 12,
            outlines: false,
            labelRoom: 18
        });
        const all = bubbles[0];
        expect(anyOverlap(all, 2.5)).toBe(false);
        for (const c of all) {
            expect(c.x - c.r).toBeGreaterThanOrEqual(-0.5);
            expect(c.x + c.r).toBeLessThanOrEqual(500.5);
            expect(c.y - c.r).toBeGreaterThanOrEqual(-0.5);
            expect(c.y + c.r).toBeLessThanOrEqual(220.5);
        }
        expect((all[0].r / all[13].r) ** 2).toBeCloseTo(4200 / 260, 1);
        // Spread across the width rather than a round cluster in the middle.
        const left = Math.min(...all.map(c => c.x - c.r));
        const right = Math.max(...all.map(c => c.x + c.r));
        expect(right - left).toBeGreaterThan(400);
    });

    it("keeps groups apart, each inside its outline", () => {
        const groups = [values.slice(0, 6), values.slice(6, 10), values.slice(10)];
        const { bubbles, groups: outlines } = layoutCluster(groups, {
            width: 400,
            height: 240,
            gap: 3,
            groupGap: 12,
            outlines: true,
            labelRoom: 18
        });
        expect(outlines).toHaveLength(3);
        expect(anyOverlap(outlines, 11)).toBe(false);
        bubbles.forEach((group, g) => {
            for (const c of group) {
                expect(Math.hypot(c.x - outlines[g].x, c.y - outlines[g].y) + c.r).toBeLessThanOrEqual(outlines[g].r);
            }
        });
        for (const o of outlines) {
            // Room above each outline for the group's name.
            expect(o.y - o.r).toBeGreaterThanOrEqual(17);
        }
    });

    it("keeps groups without outlines apart by the group gap", () => {
        const groups = [values.slice(0, 7), values.slice(7)];
        const { bubbles } = layoutCluster(groups, {
            width: 400,
            height: 240,
            gap: 3,
            groupGap: 12,
            outlines: false,
            labelRoom: 18
        });
        for (const a of bubbles[0]) {
            for (const b of bubbles[1]) {
                expect(overlap(a, b, 11)).toBe(false);
            }
        }
    });
});

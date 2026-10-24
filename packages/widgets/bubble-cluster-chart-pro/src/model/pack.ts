// Circle packing for the bubble cluster. ECharts has no packed-bubble layout, so the widget places the bubbles
// itself and draws them with a custom series. The sibling packing and smallest enclosing circle follow d3-hierarchy
// (ISC licence, https://github.com/d3/d3-hierarchy): Wang et al.'s front-chain packing, and Welzl's algorithm with a
// seeded shuffle so a chart always packs the same way.

export interface Circle {
    x: number;
    y: number;
    r: number;
}

interface ChainNode {
    circle: Circle;
    next: ChainNode;
    previous: ChainNode;
}

/** Places c tangent to both a and b. */
function place(b: Circle, a: Circle, c: Circle): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) {
        c.x = a.x + c.r;
        c.y = a.y;
        return;
    }
    const a2 = (a.r + c.r) ** 2;
    const b2 = (b.r + c.r) ** 2;
    if (a2 > b2) {
        const x = (d2 + b2 - a2) / (2 * d2);
        const y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
        c.x = b.x - x * dx - y * dy;
        c.y = b.y - x * dy + y * dx;
    } else {
        const x = (d2 + a2 - b2) / (2 * d2);
        const y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
        c.x = a.x + x * dx - y * dy;
        c.y = a.y + x * dy + y * dx;
    }
}

function intersects(a: Circle, b: Circle): boolean {
    const dr = a.r + b.r - 1e-6;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr > 0 && dr * dr > dx * dx + dy * dy;
}

/** How far the weighted middle of a pair on the front chain is from the origin. */
function score(node: ChainNode): number {
    const a = node.circle;
    const b = node.next.circle;
    const ab = a.r + b.r;
    const dx = (a.x * b.r + b.x * a.r) / ab;
    const dy = (a.y * b.r + b.y * a.r) / ab;
    return dx * dx + dy * dy;
}

function chainNode(circle: Circle): ChainNode {
    const node = { circle } as ChainNode;
    node.next = node;
    node.previous = node;
    return node;
}

/**
 * Packs circles tightly around the origin, in order, by moving them; their radii stay. Returns the radius of the
 * circle that encloses them all, which is centred on the origin.
 */
export function packSiblings(circles: Circle[]): number {
    const n = circles.length;
    if (n === 0) {
        return 0;
    }
    const a = circles[0];
    a.x = 0;
    a.y = 0;
    if (n === 1) {
        return a.r;
    }
    const b = circles[1];
    a.x = -b.r;
    b.x = a.r;
    b.y = 0;
    if (n === 2) {
        // Side by side, already centred on the origin.
        return a.r + b.r;
    }
    place(b, a, circles[2]);

    let na = chainNode(a);
    let nb = chainNode(b);
    let nc = chainNode(circles[2]);
    na.next = nc.previous = nb;
    nb.next = na.previous = nc;
    nc.next = nb.previous = na;

    pack: for (let i = 3; i < n; ++i) {
        place(na.circle, nb.circle, circles[i]);
        nc = chainNode(circles[i]);
        // Find the closest circle on the front chain that the new one overlaps, if any, by distance along the chain.
        let j = nb.next;
        let k = na.previous;
        let sj = nb.circle.r;
        let sk = na.circle.r;
        do {
            if (sj <= sk) {
                if (intersects(j.circle, nc.circle)) {
                    nb = j;
                    na.next = nb;
                    nb.previous = na;
                    --i;
                    continue pack;
                }
                sj += j.circle.r;
                j = j.next;
            } else {
                if (intersects(k.circle, nc.circle)) {
                    na = k;
                    na.next = nb;
                    nb.previous = na;
                    --i;
                    continue pack;
                }
                sk += k.circle.r;
                k = k.previous;
            }
        } while (j !== k.next);

        // It fits between a and b.
        nc.previous = na;
        nc.next = nb;
        na.next = nb.previous = nb = nc;

        // The pair closest to the middle is where the next circle goes.
        let best = score(na);
        while ((nc = nc.next) !== nb) {
            const s = score(nc);
            if (s < best) {
                na = nc;
                best = s;
            }
        }
        nb = na.next;
    }

    const chain: Circle[] = [nb.circle];
    for (let node = nb.next; node !== nb; node = node.next) {
        chain.push(node.circle);
    }
    const e = encloseCircles(chain);
    enclose(circles, e);
    return e.r;
}

/** Moves circles so that their enclosing circle e is centred on the origin. */
function enclose(circles: Circle[], e: Circle): void {
    for (const c of circles) {
        c.x -= e.x;
        c.y -= e.y;
    }
}

/** A seeded random number generator, so the enclosing circle comes out the same every time. */
function lcg(): () => number {
    let s = 1;
    return () => {
        s = (1664525 * s + 1013904223) % 4294967296;
        return s / 4294967296;
    };
}

function shuffle<T>(items: T[]): T[] {
    const random = lcg();
    let m = items.length;
    while (m) {
        const i = Math.floor(random() * m--);
        [items[m], items[i]] = [items[i], items[m]];
    }
    return items;
}

/** The smallest circle that encloses all the circles. */
export function encloseCircles(circles: Circle[]): Circle {
    const shuffled = shuffle([...circles]);
    let basis: Circle[] = [];
    let e: Circle | undefined;
    let i = 0;
    while (i < shuffled.length) {
        const p = shuffled[i];
        if (e && enclosesWeak(e, p)) {
            ++i;
        } else {
            basis = extendBasis(basis, p);
            e = encloseBasis(basis);
            i = 0;
        }
    }
    return e ?? { x: 0, y: 0, r: 0 };
}

function extendBasis(basis: Circle[], p: Circle): Circle[] {
    if (enclosesWeakAll(p, basis)) {
        return [p];
    }
    for (const b of basis) {
        if (enclosesNot(p, b) && enclosesWeakAll(encloseBasis2(b, p), basis)) {
            return [b, p];
        }
    }
    for (let i = 0; i < basis.length - 1; ++i) {
        for (let j = i + 1; j < basis.length; ++j) {
            if (
                enclosesNot(encloseBasis2(basis[i], basis[j]), p) &&
                enclosesNot(encloseBasis2(basis[i], p), basis[j]) &&
                enclosesNot(encloseBasis2(basis[j], p), basis[i]) &&
                enclosesWeakAll(encloseBasis3(basis[i], basis[j], p), basis)
            ) {
                return [basis[i], basis[j], p];
            }
        }
    }
    // Only reachable through rounding errors; the circle itself is a safe basis to restart from.
    return [p];
}

function enclosesNot(a: Circle, b: Circle): boolean {
    const dr = a.r - b.r;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeak(a: Circle, b: Circle): boolean {
    const dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesWeakAll(a: Circle, basis: Circle[]): boolean {
    return basis.every(b => enclosesWeak(a, b));
}

function encloseBasis(basis: Circle[]): Circle {
    switch (basis.length) {
        case 1:
            return { x: basis[0].x, y: basis[0].y, r: basis[0].r };
        case 2:
            return encloseBasis2(basis[0], basis[1]);
        default:
            return encloseBasis3(basis[0], basis[1], basis[2]);
    }
}

function encloseBasis2(a: Circle, b: Circle): Circle {
    const x21 = b.x - a.x;
    const y21 = b.y - a.y;
    const r21 = b.r - a.r;
    const l = Math.sqrt(x21 * x21 + y21 * y21);
    return {
        x: (a.x + b.x + (x21 / l) * r21) / 2,
        y: (a.y + b.y + (y21 / l) * r21) / 2,
        r: (l + a.r + b.r) / 2
    };
}

function encloseBasis3(a: Circle, b: Circle, c: Circle): Circle {
    const { x: x1, y: y1, r: r1 } = a;
    const { x: x2, y: y2, r: r2 } = b;
    const { x: x3, y: y3, r: r3 } = c;
    const a2 = x1 - x2;
    const a3 = x1 - x3;
    const b2 = y1 - y2;
    const b3 = y1 - y3;
    const c2 = r2 - r1;
    const c3 = r3 - r1;
    const d1 = x1 * x1 + y1 * y1 - r1 * r1;
    const d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2;
    const d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3;
    const ab = a3 * b2 - a2 * b3;
    const xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1;
    const xb = (b3 * c2 - b2 * c3) / ab;
    const ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1;
    const yb = (a2 * c3 - a3 * c2) / ab;
    const qa = xb * xb + yb * yb - 1;
    const qb = 2 * (r1 + xa * xb + ya * yb);
    const qc = xa * xa + ya * ya - r1 * r1;
    const r = -(Math.abs(qa) > 1e-6 ? (qb + Math.sqrt(qb * qb - 4 * qa * qc)) / (2 * qa) : qc / qb);
    return { x: x1 + xa + xb * r, y: y1 + ya + yb * r, r };
}

/**
 * Spreads packed circles into a box wider or taller than it is high, so a wide chart isn't a round cluster with
 * empty sides. Circles drift toward an ellipse of the box's shape and push apart where they overlap, keeping at
 * least `gap` between them. With groups, each circle also keeps close to the rest of its group, and circles of
 * different groups keep `groupGap` apart. Large clusters keep their round packing, which is already tight.
 */
export function spread(circles: Circle[], aspect: number, gap: number, groups?: { of: number[]; gap: number }): void {
    const n = circles.length;
    if (n < 3 || n > 150 || Math.abs(Math.log(aspect)) < 0.15) {
        return;
    }
    const stretch = Math.sqrt(aspect);
    for (const c of circles) {
        c.x *= stretch;
        c.y /= stretch;
    }
    // Pulling harder up and down than across shapes the cluster like the box.
    const pullX = 0.02 / (aspect * aspect);
    const pullY = 0.02 * aspect * aspect;
    const groupCount = groups ? Math.max(...groups.of) + 1 : 0;
    const iterations = 160;
    for (let step = 0; step < iterations; step++) {
        // The last steps only separate, so no overlap is left behind.
        if (step < iterations - 30) {
            for (const c of circles) {
                c.x -= c.x * pullX;
                c.y -= c.y * pullY;
            }
            if (groups) {
                const sums = Array.from({ length: groupCount }, () => ({ x: 0, y: 0, w: 0 }));
                circles.forEach((c, i) => {
                    const sum = sums[groups.of[i]];
                    const w = c.r * c.r;
                    sum.x += c.x * w;
                    sum.y += c.y * w;
                    sum.w += w;
                });
                circles.forEach((c, i) => {
                    const sum = sums[groups.of[i]];
                    c.x += (sum.x / sum.w - c.x) * 0.06;
                    c.y += (sum.y / sum.w - c.y) * 0.06;
                });
            }
        }
        for (let i = 0; i < n; i++) {
            const a = circles[i];
            for (let j = i + 1; j < n; j++) {
                const b = circles[j];
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                const apart = groups && groups.of[i] !== groups.of[j] ? groups.gap : gap;
                const min = a.r + b.r + apart;
                const d2 = dx * dx + dy * dy;
                if (d2 >= min * min) {
                    continue;
                }
                let d = Math.sqrt(d2);
                if (d < 1e-9) {
                    dx = 1e-3 * (i - j);
                    dy = 1e-3;
                    d = Math.hypot(dx, dy);
                }
                // The smaller circle moves more, so big bubbles stay put near the middle.
                const push = (min - d) / d;
                const share = (b.r * b.r) / (a.r * a.r + b.r * b.r);
                a.x -= dx * push * share;
                a.y -= dy * push * share;
                b.x += dx * push * (1 - share);
                b.y += dy * push * (1 - share);
            }
        }
    }
}

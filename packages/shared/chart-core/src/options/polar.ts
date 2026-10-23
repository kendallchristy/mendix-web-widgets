export interface ArcFit {
    /** Centre, from the top left of the space. */
    x: number;
    y: number;
    radius: number;
}

/**
 * The largest rings that fit a space, and where their centre goes. The rings run clockwise from the start angle
 * (ECharts degrees: 0 is three o'clock, 90 is the top) over the sweep. Names sit left of the start when it is near
 * the top, so they get room there.
 */
export function fitArc(
    startAngle: number,
    sweep: number,
    hole: number,
    width: number,
    height: number,
    labelWidth: number
): ArcFit {
    const points: Array<[number, number]> = [];
    const add = (degrees: number, r: number): void => {
        const rad = (degrees * Math.PI) / 180;
        points.push([Math.cos(rad) * r, Math.sin(rad) * r]);
    };
    const end = startAngle - sweep;
    for (const r of [1, hole]) {
        add(startAngle, r);
        add(end, r);
    }
    for (let quarter = Math.ceil(end / 90) * 90; quarter <= startAngle; quarter += 90) {
        add(quarter, 1);
    }
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const minY = Math.min(...ys);
    const arcMinX = Math.min(...xs);
    const labelsLeft = labelWidth > 0 && startAngle >= 45 && startAngle <= 135;

    let radius = Math.min(width / Math.max(0.01, maxX - arcMinX), height / Math.max(0.01, maxY - minY));
    let minX = arcMinX;
    for (let i = 0; i < 4 && labelsLeft; i++) {
        minX = Math.min(arcMinX, -labelWidth / radius);
        radius = Math.min(width / Math.max(0.01, maxX - minX), height / Math.max(0.01, maxY - minY));
    }
    radius = Math.max(10, radius - 2);
    return {
        x: -minX * radius + (width - radius * (maxX - minX)) / 2,
        y: maxY * radius + (height - radius * (maxY - minY)) / 2,
        radius
    };
}

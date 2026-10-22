import type { SeriesKind, SeriesInput } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Smooth, believable shapes so the design-mode preview looks like a real chart.
const SHAPES = [
    [42, 48, 45, 60, 72, 66, 80, 92, 85, 96, 110, 104],
    [30, 34, 40, 38, 44, 52, 50, 58, 64, 61, 70, 76],
    [60, 55, 58, 50, 46, 52, 48, 44, 50, 56, 54, 62],
    [20, 26, 22, 30, 35, 32, 40, 38, 45, 50, 47, 55]
];

export interface SampleSeriesConfig {
    name?: string;
    kind: SeriesKind;
    color?: string;
    stack?: string;
    yAxisSide?: "left" | "right";
}

/** Sample series for Studio Pro's design mode, one per configured series. */
export function sampleSeries(configs: SampleSeriesConfig[]): SeriesInput[] {
    const list: SampleSeriesConfig[] = configs.length > 0 ? configs : [{ kind: "area" }];
    return list.map((config, index) => {
        const shape = SHAPES[index % SHAPES.length];
        return {
            key: `sample-${index}`,
            name: config.name || `Series ${index + 1}`,
            kind: config.kind,
            color: config.color || undefined,
            stack: config.stack || undefined,
            yAxisSide: config.yAxisSide ?? "left",
            aggregation: "none",
            points: MONTHS.map((month, i) => ({
                x: month,
                y: shape[i],
                size: config.kind === "bubble" ? shape[(i + 3) % shape.length] : undefined,
                drill: []
            }))
        };
    });
}

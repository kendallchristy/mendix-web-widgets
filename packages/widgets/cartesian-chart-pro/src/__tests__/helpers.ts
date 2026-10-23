import { defaultChartStyle } from "@kendallchristy/chart-core";

import type { ChartSettings, InputPoint, SeriesInput } from "../model/types";

export function settings(overrides: Partial<ChartSettings> = {}): ChartSettings {
    return {
        titleAlign: "left",
        orientation: "vertical",
        showXAxis: true,
        showYAxis: false,
        yAxisScale: "linear",
        numberFormat: { decimals: -1, thousandsSeparator: true, compact: false },
        drill: { kind: "none" },
        topLabel: "All",
        zoom: "none",
        ...overrides,
        style: { ...defaultChartStyle, ...overrides.style }
    };
}

export function series(
    name: string,
    points: Array<Partial<InputPoint> & Pick<InputPoint, "x">>,
    overrides: Partial<SeriesInput> = {}
): SeriesInput {
    return {
        key: name,
        name,
        kind: "line",
        yAxisSide: "left",
        aggregation: "none",
        points: points.map(p => ({ drill: [], ...p })),
        ...overrides
    };
}

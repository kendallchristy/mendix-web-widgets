import type { BuiltChart, ChartTokens, TooltipParam } from "@kendallchristy/chart-core";
import {
    baseOption,
    combineValues,
    createNumberFormatter,
    createTooltipFormatter,
    figuresFontFamily,
    legendOption,
    legendPlacement,
    pillStyle,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { RadarSeries, RadarSettings } from "./types";

/** The smallest round number at or above `value`: 1, 2, 2.5 or 5 times a power of ten. */
export function niceCeiling(value: number): number {
    if (!(value > 0)) {
        return 1;
    }
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const step = [1, 2, 2.5, 5, 10].find(s => s * magnitude >= value * (1 - 1e-9)) ?? 10;
    return step * magnitude;
}

/** Each series' value per measure, aggregated, and the measures in order. */
export function radarValues(
    series: RadarSeries[],
    order: RadarSettings["indicatorOrder"]
): { indicators: string[]; values: Array<Array<number | undefined>> } {
    const names: string[] = [];
    const seen = new Set<string>();
    for (const s of series) {
        for (const point of s.points) {
            if (!seen.has(point.indicator)) {
                seen.add(point.indicator);
                names.push(point.indicator);
            }
        }
    }
    const indicators =
        order === "name" ? [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })) : names;
    const values = series.map(s =>
        indicators.map(indicator => {
            const points = s.points.filter(p => p.indicator === indicator);
            if (points.length === 0) {
                return undefined;
            }
            const numbers = points.map(p => p.value).filter((v): v is number => v !== undefined && Number.isFinite(v));
            return combineValues(numbers, s.aggregation, points.length);
        })
    );
    return { indicators, values };
}

export function buildRadar(
    series: RadarSeries[],
    settings: RadarSettings,
    tokens: ChartTokens,
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const figures = figuresFontFamily(tokens, style);
    const { indicators, values } = radarValues(series, settings.indicatorOrder);
    const colors = series.map((s, i) => s.color ?? tokens.palette[i % tokens.palette.length]);
    const pointCount = series.reduce((total, s) => total + s.points.length, 0);

    const indicator = indicators.map((name, i) => {
        const largest = Math.max(0, ...values.map(row => row[i] ?? 0));
        const smallest = Math.min(0, ...values.map(row => row[i] ?? 0));
        return { name, min: smallest, max: settings.maxValue ?? niceCeiling(largest) };
    });

    const placement = legendPlacement(style, series.length);
    const center =
        placement === "top"
            ? ["50%", "56%"]
            : placement === "bottom"
              ? ["50%", "46%"]
              : placement === "right"
                ? ["42%", "50%"]
                : ["50%", "50%"];
    const pill = pillStyle(tokens, settings.labelStyle);
    const marker =
        settings.markers === "never"
            ? { symbol: "none" }
            : { symbol: "circle", symbolSize: Math.max(5, settings.lineWidth * 2 + 2) };

    const data = series.map((s, i) => {
        const color = colors[i];
        return {
            name: s.name,
            // Missing measures draw at the centre; the tooltip and table leave them blank.
            value: values[i].map(v => v ?? 0),
            ...marker,
            itemStyle: {
                color,
                borderColor: tokens.surface,
                borderWidth: 1.5,
                ...(settings.markers === "hover" ? { opacity: 0 } : {})
            },
            lineStyle: {
                color,
                width: settings.lineWidth,
                ...(style.glow === "soft"
                    ? { shadowBlur: 10, shadowColor: withAlpha(color, tokens.glowOpacity + 0.15) }
                    : {})
            },
            areaStyle: settings.areaFill === "solid" ? { color: withAlpha(color, 0.16) } : { opacity: 0 },
            emphasis: {
                itemStyle: { opacity: 1 },
                lineStyle: { width: settings.lineWidth + 1 },
                areaStyle: settings.areaFill === "solid" ? { color: withAlpha(color, 0.28) } : { opacity: 0 }
            },
            label: {
                show: settings.valueLabels,
                position: "top",
                distance: 6,
                fontFamily: figures,
                fontSize: 11,
                fontWeight: 600,
                color: tokens.text,
                ...pill,
                formatter: (param: { dataIndex?: number; value?: unknown }) => formatNumber(Number(param.value))
            }
        };
    });

    const rows = createTooltipFormatter({
        tokens,
        style,
        formatValue: formatNumber,
        headerOf: param => param.name ?? "",
        nameOf: param => param.seriesName ?? "",
        colorOf: param => (typeof param.color === "string" ? param.color : undefined),
        tooltipOf: () => undefined
    });
    // One row per measure of the hovered shape.
    const tooltipFormatter = (input: TooltipParam | TooltipParam[]): string => {
        const param = Array.isArray(input) ? input[0] : input;
        const index = series.findIndex(s => s.name === param?.name);
        if (index < 0) {
            return "";
        }
        return rows(
            indicators
                .map((name, i) => ({
                    name: series[index].name,
                    seriesName: name,
                    value: values[index][i],
                    color: colors[index]
                }))
                .filter(row => row.value !== undefined)
        );
    };

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        // Legend swatches stay visible when markers only show on hover.
        legend: { ...legendOption(placement), data: series.map(s => ({ name: s.name, itemStyle: { opacity: 1 } })) },
        tooltip: tooltipOption(tokens, { ...style, hoverGuide: "none" }, "item", tooltipFormatter),
        radar: {
            indicator,
            shape: settings.shape,
            splitNumber: settings.rings,
            center,
            radius: (placement === "hidden" ? 70 : 64) - (settings.valueLabels ? 6 : 0) + "%",
            axisName: { color: tokens.label, fontSize: 11 },
            // Value labels at the outer ring need room before the measure names.
            axisNameGap: settings.valueLabels ? 22 : 8,
            axisLine: { lineStyle: { color: tokens.grid } },
            splitLine: { lineStyle: { color: tokens.grid } },
            splitArea: { show: false }
        },
        series: [{ type: "radar", data }]
    };

    return {
        option,
        clickTargets: [],
        breadcrumb: [],
        table: {
            columns: ["Measure", ...series.map(s => s.name)],
            rows: indicators.map((name, i) => [
                name,
                ...values.map(row => (row[i] === undefined ? "" : formatNumber(row[i])))
            ])
        },
        pointCount
    };
}

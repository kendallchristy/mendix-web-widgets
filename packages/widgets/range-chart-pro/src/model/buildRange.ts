import type { BuiltChart, ChartTokens, ClickTarget, ElementSize } from "@kendallchristy/chart-core";
import {
    baseOption,
    createNumberFormatter,
    createTooltipFormatter,
    dateTimeFormat,
    figuresFontFamily,
    formatDateLabel,
    gridOption,
    legendOption,
    legendPlacement,
    pillStyle,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { RangePoint, RangeSettings } from "./types";

// ECharts hands custom series an untyped API; these are the parts renderItem uses.
interface RenderApi {
    value: (dimension: number) => number;
    coord: (values: number[]) => number[];
    size: (values: number[]) => number[];
}

type Element = Record<string, unknown>;

const DAY = 24 * 60 * 60 * 1000;

const num = (value: number | Date): number => (value instanceof Date ? value.getTime() : value);

const STEPS = [
    60000,
    5 * 60000,
    15 * 60000,
    30 * 60000,
    3600000,
    3 * 3600000,
    6 * 3600000,
    12 * 3600000,
    DAY,
    2 * DAY,
    7 * DAY,
    14 * DAY,
    30 * DAY,
    91 * DAY,
    182 * DAY,
    365 * DAY
];

/** The smallest of the usual date steps that keeps a span to at most `ticks` ticks. */
export function dateStep(span: number, ticks: number): number {
    return STEPS.find(step => span / step <= ticks) ?? Math.ceil(span / ticks / (365 * DAY)) * 365 * DAY;
}

/** The categories in the chosen order. */
export function orderCategories(points: RangePoint[], sortOrder: RangeSettings["sortOrder"]): string[] {
    const stats = new Map<string, { start: number; span: number }>();
    for (const point of points) {
        const low = num(point.low);
        const span = num(point.high) - low;
        const known = stats.get(point.category);
        if (known) {
            known.start = Math.min(known.start, low);
            known.span = Math.max(known.span, span);
        } else {
            stats.set(point.category, { start: low, span });
        }
    }
    const names = Array.from(stats.keys());
    switch (sortOrder) {
        case "data":
            return names;
        case "name":
            return names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        case "start":
            return names.sort((a, b) => stats.get(a)!.start - stats.get(b)!.start);
        case "span":
            return names.sort((a, b) => stats.get(b)!.span - stats.get(a)!.span);
    }
}

/** A length of time in the largest unit that keeps it readable, for example 12 days or 5 hours. */
export function formatDuration(ms: number, locale?: string): string {
    const unit = ms >= DAY ? "day" : ms >= 3600000 ? "hour" : "minute";
    const size = unit === "day" ? DAY : unit === "hour" ? 3600000 : 60000;
    return new Intl.NumberFormat(locale, {
        style: "unit",
        unit,
        unitDisplay: "long",
        maximumFractionDigits: 1
    }).format(ms / size);
}

export function buildRange(
    points: RangePoint[],
    settings: RangeSettings,
    tokens: ChartTokens,
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const horizontal = settings.orientation === "horizontal";
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const figures = figuresFontFamily(tokens, style);

    const time = points.some(p => p.low instanceof Date || p.high instanceof Date);
    const years = new Set(points.flatMap(p => [p.low, p.high]).map(v => (v instanceof Date ? v.getFullYear() : 0)));
    const withTime = points.some(p =>
        [p.low, p.high].some(v => v instanceof Date && (v.getHours() !== 0 || v.getMinutes() !== 0))
    );
    const formatEnd = (value: number): string =>
        time
            ? formatDateLabel(
                  new Date(value),
                  { template: settings.dateFormat, showYear: years.size > 1, showTime: withTime },
                  locale
              )
            : formatNumber(value);
    const formatSpan = (low: number, high: number): string =>
        time ? formatDuration(high - low, locale) : formatNumber(high - low);

    const categories = orderCategories(points, settings.sortOrder);
    const categoryIndex = new Map(categories.map((name, i) => [name, i]));
    const grouped = points.some(p => p.group !== undefined);
    const groups = grouped ? Array.from(new Set(points.map(p => p.group ?? ""))) : [""];
    const colors = groups.map((_, i) => tokens.palette[i % tokens.palette.length]);
    const seriesName = (group: string): string => (grouped ? group : (settings.title ?? "Range"));

    const verticalLines = style.gridlines === "vertical" || style.gridlines === "both";
    const horizontalLines = style.gridlines === "horizontal" || style.gridlines === "both";
    const width = Math.max(5, Math.min(100, settings.barWidth)) / 100;
    const dot = Math.max(2, settings.dotSize);
    const pill = pillStyle(tokens, settings.labelStyle);
    const gap = (settings.rangeStyle === "dumbbell" ? dot / 2 : 0) + 6;
    const labelText = (text: string): Record<string, unknown> => ({
        text,
        fill: (pill.color as string | undefined) ?? tokens.text,
        font: `600 11px ${figures}`,
        backgroundColor: pill.backgroundColor,
        padding: pill.padding,
        borderRadius: pill.borderRadius,
        shadowBlur: pill.shadowBlur,
        shadowColor: pill.shadowColor
    });

    /** Draws one range: a rounded bar, or two dots joined by a line, plus its labels. */
    const renderItem =
        (groupIndex: number) =>
        (_params: unknown, api: RenderApi): Element => {
            const category = api.value(0);
            const low = api.value(1);
            const high = api.value(2);
            const start = api.coord(horizontal ? [low, category] : [category, low]);
            const end = api.coord(horizontal ? [high, category] : [category, high]);
            const band = horizontal ? api.size([0, 1])[1] : api.size([1, 0])[0];
            const slot = (band * width) / groups.length;
            const offset = (groupIndex - (groups.length - 1) / 2) * slot;
            const thickness = Math.max(2, groups.length > 1 ? slot * 0.85 : slot);
            const color = colors[groupIndex];
            const glow =
                style.glow === "soft"
                    ? { shadowBlur: 12, shadowColor: withAlpha(color, tokens.glowOpacity + 0.15), shadowOffsetY: 3 }
                    : {};

            // Positions along the range (main) and across it (cross), in pixels.
            const mainStart = horizontal ? start[0] : start[1];
            const mainEnd = horizontal ? end[0] : end[1];
            const cross = (horizontal ? start[1] : start[0]) + offset;
            const at = (main: number, crossAt: number): [number, number] =>
                horizontal ? [main, crossAt] : [crossAt, main];
            const lo = Math.min(mainStart, mainEnd);
            const hi = Math.max(mainStart, mainEnd);

            const children: Element[] = [];
            if (settings.rangeStyle === "bars") {
                const length = Math.max(2, hi - lo);
                const radius = Math.min(Math.max(0, settings.cornerRadius), thickness / 2, length / 2);
                children.push({
                    type: "rect",
                    shape: horizontal
                        ? { x: lo, y: cross - thickness / 2, width: length, height: thickness, r: radius }
                        : { x: cross - thickness / 2, y: lo, width: thickness, height: length, r: radius },
                    style: { fill: color, ...glow }
                });
            } else {
                const [x1, y1] = at(mainStart, cross);
                const [x2, y2] = at(mainEnd, cross);
                children.push({
                    type: "line",
                    shape: { x1, y1, x2, y2 },
                    style: { stroke: withAlpha(color, 0.45), lineWidth: Math.max(2, Math.round(dot / 4)) }
                });
                for (const [cx, cy] of [
                    [x1, y1],
                    [x2, y2]
                ]) {
                    children.push({
                        type: "circle",
                        shape: { cx, cy, r: dot / 2 },
                        style: { fill: color, stroke: tokens.surface, lineWidth: 2, ...glow }
                    });
                }
            }

            // On a horizontal chart labels sit left and right of the range; on a vertical one, below and above.
            const label = (text: string, main: number, before: boolean): Element => {
                const [x, y] = at(
                    before ? main - gap * (horizontal ? 1 : -1) : main + gap * (horizontal ? 1 : -1),
                    cross
                );
                return {
                    type: "text",
                    x,
                    y,
                    style: {
                        ...labelText(text),
                        align: horizontal ? (before ? "right" : "left") : "center",
                        verticalAlign: horizontal ? "middle" : before ? "top" : "bottom"
                    }
                };
            };
            // Vertical axes grow upwards, so the low end is the larger pixel position.
            const lowPx = horizontal ? lo : hi;
            const highPx = horizontal ? hi : lo;
            if (settings.valueLabels === "ends") {
                children.push(label(formatEnd(low), lowPx, true), label(formatEnd(high), highPx, false));
            } else if (settings.valueLabels === "span") {
                children.push(label(formatSpan(low, high), highPx, false));
            }
            return { type: "group", children };
        };

    const pointsByGroup = groups.map(group => points.filter(p => (grouped ? (p.group ?? "") : "") === group));
    const series = groups.map((group, g) => ({
        type: "custom",
        name: seriesName(group),
        renderItem: renderItem(g),
        clip: true,
        dimensions: ["category", "from", "to", "index"],
        encode: horizontal ? { x: [1, 2], y: 0, tooltip: [1, 2] } : { x: 0, y: [1, 2], tooltip: [1, 2] },
        itemStyle: { color: colors[g] },
        data: pointsByGroup[g].map(p => [
            categoryIndex.get(p.category) ?? 0,
            num(p.low),
            num(p.high),
            points.indexOf(p)
        ])
    }));

    const placement = legendPlacement(style, groups.length);
    const grid = gridOption(placement);
    // Room at each end of the value axis for the labels, in pixels, so they stay inside the plot.
    const lows = points.map(p => num(p.low));
    const highs = points.map(p => num(p.high));
    const textWidth = (text: string): number => text.length * 6.8 + (pill.backgroundColor ? 12 : 0);
    const labelSize = (texts: string[]): number =>
        texts.length === 0
            ? 0
            : gap + (horizontal ? Math.max(...texts.map(textWidth)) : pill.backgroundColor ? 20 : 15);
    // Dumbbell dots reach past the ends of the range.
    const edge = settings.rangeStyle === "dumbbell" ? dot / 2 + 2 : 0;
    const roomBefore = Math.max(edge, settings.valueLabels === "ends" ? labelSize(lows.map(formatEnd)) : 0);
    const roomAfter = Math.max(
        edge,
        settings.valueLabels === "ends"
            ? labelSize(highs.map(formatEnd))
            : settings.valueLabels === "span"
              ? labelSize(points.map((_, i) => formatSpan(lows[i], highs[i])))
              : 0
    );
    const categoryRoom = settings.showCategoryAxis
        ? Math.min(120, 12 + Math.max(0, ...categories.map(c => c.length)) * 7)
        : 0;
    // The plot's length along the value axis; a guess until the chart has been measured.
    const plotLength = horizontal
        ? (size.width || 420) - categoryRoom - Number(grid.left) - Number(grid.right)
        : (size.height || 220) - Number(grid.top) - Number(grid.bottom) - 24;
    const dataMin = Math.min(...lows);
    const dataMax = Math.max(...highs);
    const dataSpan = dataMax - dataMin || (time ? DAY : 1);
    const unitsPerPixel = dataSpan / Math.max(plotLength * 0.3, plotLength - roomBefore - roomAfter);
    const axisMin = dataMin - roomBefore * unitsPerPixel;
    const axisMax = dataMax + roomAfter * unitsPerPixel;
    const tickStep = time
        ? dateStep(axisMax - axisMin, Math.max(2, Math.floor(plotLength / (horizontal ? 75 : 36))))
        : 0;
    // Steps of a month or more follow the calendar on a time axis; shorter ones are even steps on a value axis.
    const monthly = tickStep >= 30 * DAY;
    const formatTick = (value: number): string =>
        monthly && !settings.dateFormat
            ? dateTimeFormat(locale, { month: "short", ...(years.size > 1 ? { year: "numeric" } : {}) }).format(
                  new Date(value)
              )
            : formatDateLabel(
                  new Date(value),
                  { template: settings.dateFormat, showYear: years.size > 1, showTime: tickStep < DAY },
                  locale
              );
    const categoryAxis = {
        type: "category",
        data: categories,
        inverse: horizontal,
        axisLabel: { show: settings.showCategoryAxis, hideOverlap: true, width: 120, overflow: "truncate" },
        splitLine: { show: horizontal ? horizontalLines : verticalLines }
    };
    // A time axis mixes month starts into day and week ticks unevenly, so short date ranges use a value axis.
    const valueAxis = {
        type: monthly ? "time" : "value",
        ...(time
            ? { min: axisMin, max: axisMax, ...(monthly ? { minInterval: tickStep * 0.9 } : { interval: tickStep }) }
            : {
                  scale: true,
                  boundaryGap: [roomBefore, roomAfter].map(
                      room =>
                          `${((room / Math.max(plotLength * 0.3, plotLength - roomBefore - roomAfter)) * 100).toFixed(1)}%`
                  )
              }),
        name: settings.valueAxisTitle,
        nameLocation: "middle",
        nameGap: 10,
        nameMoveOverlap: true,
        axisLabel: {
            show: settings.showValueAxis,
            hideOverlap: true,
            ...(time ? { showMinLabel: false, showMaxLabel: false } : {}),
            formatter: time ? formatTick : formatNumber
        },
        splitLine: { show: horizontal ? verticalLines : horizontalLines }
    };

    const pointOf = (value: unknown): RangePoint | undefined =>
        Array.isArray(value) ? points[Number(value[3])] : undefined;
    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        pickValue: value => (Array.isArray(value) ? Number(value[3]) : undefined),
        formatValue: index => {
            const p = points[index];
            if (!p) {
                return "";
            }
            const low = num(p.low);
            const high = num(p.high);
            return `${formatEnd(low)} – ${formatEnd(high)} · ${formatSpan(low, high)}`;
        },
        headerOf: param => pointOf(param.value)?.category ?? "",
        nameOf: param => (grouped ? (param.seriesName ?? "") : ""),
        colorOf: param => colors[param.seriesIndex ?? 0],
        tooltipOf: param => pointOf(param.value)?.tooltip
    });

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: legendOption(placement),
        grid,
        tooltip: tooltipOption(tokens, { ...style, hoverGuide: "none" }, "item", tooltipFormatter),
        xAxis: horizontal ? valueAxis : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxis,
        series
    };

    const clickTargets: Array<Array<ClickTarget<string>>> = pointsByGroup.map(group =>
        group.map(p => ({
            // Read on click only.
            get action() {
                return p.action;
            }
        }))
    );

    return {
        option,
        clickTargets,
        breadcrumb: [],
        table: {
            columns: grouped ? ["Category", "Group", "From", "To", "Length"] : ["Category", "From", "To", "Length"],
            rows: categories.flatMap(category =>
                points
                    .filter(p => p.category === category)
                    .map(p => {
                        const low = num(p.low);
                        const high = num(p.high);
                        const cells = [formatEnd(low), formatEnd(high), formatSpan(low, high)];
                        return grouped ? [category, p.group ?? "", ...cells] : [category, ...cells];
                    })
            )
        },
        pointCount: points.length
    };
}

import type {
    AggregatedPoint,
    ChartTokens,
    DateBucket,
    DateLevel,
    DrillStep,
    Point,
    XKind,
    XValue
} from "@kendallchristy/chart-core";
import {
    DATE_LEVELS,
    aggregate,
    areaStyle,
    bucketDate,
    createNumberFormatter,
    createTooltipFormatter,
    detectXKind,
    formatBucket,
    glowStyle,
    gridOption,
    legendOption,
    legendPlacement,
    mixColors,
    sortByX,
    surfaceBackground,
    titleOption,
    tooltipOption,
    valueLabelStyle,
    verticalGradient
} from "@kendallchristy/chart-core";

import type { ChartSettings, ClickAction, DrillValue, InputPoint, SeriesInput } from "./types";

export interface ClickTarget {
    drill?: DrillStep<DrillValue>;
    action?: ClickAction;
}

export interface BuiltChart {
    option: Record<string, unknown>;
    /** What clicking each point does, by series index and data index. */
    clickTargets: ClickTarget[][];
    breadcrumb: string[];
    table: { columns: string[]; rows: string[][] };
    pointCount: number;
}

interface WorkingPoint extends Point<InputPoint> {
    /** The label shown on a category axis. */
    label: string;
    /** Sort key for date drilldown buckets. */
    sortKey?: string;
    bucket?: DateBucket;
}

interface DrillContext {
    /** Turns a source point into the point drawn at this level, or undefined to leave it out. */
    project: (point: InputPoint) => Omit<WorkingPoint, "y" | "size" | "source"> | undefined;
    /** Builds the next step for a clicked point, when there is a deeper level. */
    nextStep?: (point: WorkingPoint) => DrillStep<DrillValue>;
    forceAggregation: boolean;
    sortCategories: boolean;
}

function dateLevels(from: DateLevel, to: DateLevel): DateLevel[] {
    const start = DATE_LEVELS.indexOf(from);
    const end = Math.max(start, DATE_LEVELS.indexOf(to));
    return DATE_LEVELS.slice(start, end + 1);
}

function plainLabel(x: XValue, formatNumber: (n: number) => string, locale?: string): string {
    if (x instanceof Date) {
        const hasTime = x.getHours() !== 0 || x.getMinutes() !== 0;
        return new Intl.DateTimeFormat(
            locale,
            hasTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }
        ).format(x);
    }
    return typeof x === "number" ? formatNumber(x) : x;
}

function categoryKey(point: InputPoint, level: number, label: (x: XValue) => string): string | undefined {
    return level === 0 ? label(point.x) : point.drill[level - 1];
}

function drillContext(
    series: SeriesInput[],
    settings: ChartSettings,
    path: Array<DrillStep<DrillValue>>,
    label: (x: XValue) => string,
    locale?: string
): DrillContext {
    const allPoints = series.flatMap(s => s.points);
    const drill = settings.drill;

    if (drill.kind === "date" && allPoints.length > 0 && allPoints.every(p => p.x instanceof Date)) {
        const levels = dateLevels(drill.from, drill.to);
        const depth = Math.min(path.length, levels.length - 1);
        const level = levels[depth];
        const last = path[depth - 1]?.value;
        const range = last?.kind === "date" ? last : undefined;
        const inScope = allPoints.filter(
            p => !range || ((p.x as Date).getTime() >= range.start && (p.x as Date).getTime() < range.end)
        );
        const years = new Set(inScope.map(p => (p.x as Date).getFullYear()));
        const showYear = years.size > 1 || level === "year";
        return {
            project: point => {
                const time = (point.x as Date).getTime();
                if (range && (time < range.start || time >= range.end)) {
                    return undefined;
                }
                const bucket = bucketDate(point.x as Date, level);
                return {
                    x: bucket.key,
                    label: formatBucket(bucket, level, showYear, locale),
                    sortKey: bucket.key,
                    bucket
                };
            },
            nextStep:
                depth < levels.length - 1
                    ? point => ({
                          label: point.label,
                          value: {
                              kind: "date",
                              start: point.bucket!.start.getTime(),
                              end: point.bucket!.end.getTime()
                          }
                      })
                    : undefined,
            forceAggregation: true,
            sortCategories: true
        };
    }

    if (drill.kind === "category") {
        const depth = Math.min(path.length, 2);
        const matchesPath = (point: InputPoint): boolean =>
            path
                .slice(0, depth)
                .every(
                    (step, level) =>
                        step.value.kind === "category" && categoryKey(point, level, label) === step.value.value
                );
        const deeper = depth < 2 && allPoints.some(p => matchesPath(p) && p.drill[depth] !== undefined);
        return {
            project: point => {
                if (!matchesPath(point)) {
                    return undefined;
                }
                const key = categoryKey(point, depth, label);
                return key === undefined ? undefined : { x: key, label: key };
            },
            nextStep: deeper
                ? point => ({ label: point.label, value: { kind: "category", value: point.label } })
                : undefined,
            forceAggregation: depth > 0,
            sortCategories: false
        };
    }

    return {
        project: point => ({ x: point.x, label: label(point.x) }),
        forceAggregation: false,
        sortCategories: false
    };
}

interface Highlight {
    contains: (x: XValue, categoryIndex: number) => boolean;
    /** Bounds for a visualMap on the x dimension. */
    gte?: number;
    lte?: number;
}

function resolveHighlight(
    from: string | undefined,
    to: string | undefined,
    kind: XKind,
    categories: string[]
): Highlight | undefined {
    const hasFrom = Boolean(from?.trim());
    const hasTo = Boolean(to?.trim());
    if (!hasFrom && !hasTo) {
        return undefined;
    }
    let lo: number | undefined;
    let hi: number | undefined;
    if (kind === "category") {
        const find = (text: string): number => categories.findIndex(c => c.toLowerCase() === text.trim().toLowerCase());
        lo = hasFrom ? find(from!) : 0;
        hi = hasTo ? find(to!) : categories.length - 1;
        if (lo < 0 || hi < 0) {
            return undefined;
        }
    } else {
        const parse = (text: string): number => (kind === "time" ? Date.parse(text.trim()) : Number(text.trim()));
        lo = hasFrom ? parse(from!) : undefined;
        hi = hasTo ? parse(to!) : undefined;
        if ((lo !== undefined && Number.isNaN(lo)) || (hi !== undefined && Number.isNaN(hi))) {
            return undefined;
        }
    }
    const low = lo !== undefined && hi !== undefined ? Math.min(lo, hi) : lo;
    const high = lo !== undefined && hi !== undefined ? Math.max(lo, hi) : hi;
    return {
        contains: (x, index) => {
            const v = kind === "category" ? index : x instanceof Date ? x.getTime() : Number(x);
            return (low === undefined || v >= low) && (high === undefined || v <= high);
        },
        gte: low,
        lte: high
    };
}

function bubbleScale(
    series: Array<{ kind: string; points: Array<AggregatedPoint<InputPoint>> }>
): (size: number | undefined) => number {
    const sizes = series.filter(s => s.kind === "bubble").flatMap(s => s.points.map(p => p.size ?? 0));
    const min = Math.min(...sizes, 0);
    const max = Math.max(...sizes, 1);
    return size => {
        const t = max === min ? 1 : Math.sqrt(Math.max(0, ((size ?? 0) - min) / (max - min)));
        return 12 + t * 44;
    };
}

export function buildChart(
    series: SeriesInput[],
    settings: ChartSettings,
    tokens: ChartTokens,
    path: Array<DrillStep<DrillValue>>,
    locale?: string
): BuiltChart {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const label = (x: XValue): string => plainLabel(x, formatNumber, locale);
    const drill = drillContext(series, settings, path, label, locale);
    const horizontal = settings.orientation === "horizontal";

    // Project every source point onto this drilldown level, then aggregate per series.
    const projected = series.map(s => {
        const points: WorkingPoint[] = [];
        for (const point of s.points) {
            const at = drill.project(point);
            if (at) {
                points.push({ ...at, y: point.y, size: point.size, source: point });
            }
        }
        const aggregation = s.aggregation === "none" && drill.forceAggregation ? "sum" : s.aggregation;
        const byKey = new Map(points.map(p => [p.x instanceof Date ? p.x.getTime() : p.x, p]));
        const aggregated = aggregate(points, aggregation).map(p => ({
            ...p,
            meta: byKey.get(p.x instanceof Date ? p.x.getTime() : p.x)!
        }));
        return { input: s, kind: s.kind, points: aggregated };
    });

    const kind: XKind =
        drill.sortCategories || settings.drill.kind === "category"
            ? "category"
            : detectXKind(projected.flatMap(s => s.points.map(p => p.x)));

    // Category order: first seen, or sorted for date buckets.
    const categoryMap = new Map<string, string>();
    for (const s of projected) {
        for (const p of s.points) {
            const key = p.meta.sortKey ?? p.meta.label;
            if (!categoryMap.has(key)) {
                categoryMap.set(key, p.meta.label);
            }
        }
    }
    const categoryKeys = Array.from(categoryMap.keys());
    if (drill.sortCategories) {
        categoryKeys.sort();
    }
    const categories = categoryKeys.map(k => categoryMap.get(k)!);
    const categoryIndex = new Map(categoryKeys.map((k, i) => [k, i]));

    for (const s of projected) {
        if (kind !== "category") {
            s.points = sortByX(s.points);
        } else {
            s.points = [...s.points].sort(
                (a, b) =>
                    categoryIndex.get(a.meta.sortKey ?? a.meta.label)! -
                    categoryIndex.get(b.meta.sortKey ?? b.meta.label)!
            );
        }
    }

    const highlight = resolveHighlight(settings.highlightFrom, settings.highlightTo, kind, categories);
    const scaleBubble = bubbleScale(projected);
    const hasBars = projected.some(s => s.kind === "bar");
    const barGroups = new Set(projected.filter(s => s.kind === "bar").map((s, i) => s.input.stack || `#${i}`)).size;
    // Only the outermost bar of a stack gets rounded corners.
    const lastInStack = new Map<string, number>();
    projected.forEach((s, i) => {
        if (s.kind === "bar" && s.input.stack) {
            lastInStack.set(s.input.stack, i);
        }
    });
    const firstLine = projected.findIndex(s => s.kind === "line");
    const usesRightAxis = projected.some(s => s.input.yAxisSide === "right");
    const allItems = projected.length > 0 && projected.every(s => s.kind === "scatter" || s.kind === "bubble");

    const clickTargets: ClickTarget[][] = [];
    const tableRows: string[][] = [];
    const colors: string[] = [];
    const visualMaps: Array<Record<string, unknown>> = [];

    const echartsSeries = projected.map((s, seriesIndex) => {
        const color = s.input.color || tokens.palette[seriesIndex % tokens.palette.length];
        colors.push(color);
        const targets: ClickTarget[] = [];
        const inRange = s.points.map(p =>
            highlight ? highlight.contains(p.x, categoryIndex.get(p.meta.sortKey ?? p.meta.label) ?? -1) : true
        );
        const firstIn = highlight ? inRange.indexOf(true) : -1;
        const lastIn = highlight ? inRange.lastIndexOf(true) : -1;
        const lastIndex = s.points.length - 1;
        const xOuts: Array<string | number> = [];

        const data = s.points.map((p, j) => {
            const xOut = kind === "category" ? p.meta.label : p.x instanceof Date ? p.x.getTime() : p.x;
            xOuts.push(xOut);
            const value: unknown[] = horizontal ? [p.y ?? null, xOut] : [xOut, p.y ?? null];
            if (s.kind === "bubble") {
                value.push(p.size ?? 0);
            }
            const item: Record<string, unknown> = { value };
            if (p.sources.length === 1 && p.sources[0].tooltip) {
                item.hcTooltip = p.sources[0].tooltip;
            }

            const isEnd = j === firstIn || j === lastIn;
            const labelled =
                style.valueLabels !== "off" &&
                (style.valueLabelPoints === "all" ||
                    (style.valueLabelPoints === "last" && j === lastIndex) ||
                    (style.valueLabelPoints === "highlightEnds" && isEnd));
            if (labelled) {
                item.label = {
                    ...valueLabelStyle(tokens, style, formatNumber),
                    position: horizontal ? "right" : "top"
                };
            }

            if (s.kind === "line" || s.kind === "area") {
                const marked = style.markers === "always" || (style.markers === "highlighted" && (isEnd || labelled));
                if (style.markers === "highlighted" || style.markers === "always") {
                    item.symbol = marked ? "circle" : "none";
                }
                if (marked) {
                    item.itemStyle = {
                        color: tokens.surface,
                        borderColor: inRange[j] ? color : tokens.muted,
                        borderWidth: 2.5
                    };
                }
            } else if (!inRange[j]) {
                item.itemStyle = { color: tokens.muted, shadowBlur: 0 };
            }

            targets.push({
                drill: drill.nextStep?.(p.meta),
                action: p.sources[0]?.action
            });
            tableRows.push([s.input.name, p.meta.label, p.y === undefined ? "" : formatNumber(p.y)]);
            return item;
        });
        clickTargets.push(targets);

        const base = {
            id: s.input.key,
            name: s.input.name,
            color,
            data,
            yAxisIndex: horizontal ? undefined : s.input.yAxisSide === "right" ? 1 : 0,
            xAxisIndex: horizontal ? (s.input.yAxisSide === "right" ? 1 : 0) : undefined,
            stack: s.input.stack || undefined,
            emphasis: { focus: "none" }
        };

        if (s.kind === "line" || s.kind === "area") {
            if (highlight) {
                visualMaps.push({
                    type: "piecewise",
                    show: false,
                    dimension: horizontal ? 1 : 0,
                    seriesIndex,
                    pieces: [{ gte: highlight.gte, lte: highlight.lte, color }],
                    outOfRange: { color: tokens.muted }
                });
            }
            const band =
                highlight && seriesIndex === firstLine && firstIn >= 0
                    ? {
                          silent: true,
                          itemStyle: { color: verticalGradient(color, 0.14, 0.02) },
                          data: [[{ xAxis: xOuts[firstIn] }, { xAxis: xOuts[lastIn] }]]
                      }
                    : undefined;
            return {
                ...base,
                type: "line",
                smooth: style.lineCurve === "smooth" ? 0.4 : false,
                step: style.lineCurve === "step" ? "middle" : false,
                symbol: style.markers === "never" ? "none" : "circle",
                symbolSize: 9,
                showSymbol: style.markers !== "hover",
                lineStyle: { width: style.lineWidth, ...glowStyle(color, tokens, style) },
                areaStyle: s.kind === "area" ? areaStyle(color, tokens, style) : undefined,
                markArea: horizontal ? undefined : band,
                connectNulls: true
            };
        }

        if (s.kind === "bar") {
            const outermost = !s.input.stack || lastInStack.get(s.input.stack) === seriesIndex;
            const radius = outermost ? style.barRadius : 0;
            // A glow offset below a bar reads as a smudge under the baseline, so bars glow evenly and stripes don't.
            const barGlow =
                style.barStyle === "striped" ? {} : { ...glowStyle(color, tokens, style), shadowOffsetY: 0 };
            const corners = horizontal ? [0, radius, radius, 0] : [radius, radius, 0, 0];
            const width = `${Math.max(1, Math.min(100, style.barWidth)) / Math.max(1, barGroups)}%`;
            if (style.barStyle === "dots") {
                return {
                    ...base,
                    type: "pictorialBar",
                    symbol: "circle",
                    symbolRepeat: true,
                    symbolSize: [9, 9],
                    symbolMargin: 3,
                    barWidth: width,
                    itemStyle: { ...barGlow }
                };
            }
            return {
                ...base,
                type: "bar",
                barWidth: width,
                barGap: "20%",
                itemStyle: {
                    borderRadius: corners,
                    ...barGlow,
                    decal:
                        style.barStyle === "striped"
                            ? {
                                  symbol: "rect",
                                  symbolSize: 1,
                                  color: tokens.surface,
                                  dashArrayX: [1, 2],
                                  dashArrayY: [8, 0],
                                  rotation: 0
                              }
                            : undefined
                }
            };
        }

        // Scatter and bubble.
        const bubble = s.kind === "bubble";
        return {
            ...base,
            type: "scatter",
            symbolSize: bubble ? (value: number[]) => scaleBubble(value[2]) : 11,
            itemStyle: {
                color: bubble
                    ? {
                          type: "radial",
                          x: 0.35,
                          y: 0.3,
                          r: 0.85,
                          colorStops: [
                              { offset: 0, color: mixColors(color, "#ffffff", 0.55) },
                              { offset: 1, color }
                          ]
                      }
                    : color,
                opacity: bubble ? 0.92 : 1,
                ...glowStyle(color, tokens, style)
            }
        };
    });

    // Axes. Gridlines are by screen direction: vertical lines belong to the horizontal (x) axis component.
    const verticalLines = style.gridlines === "vertical" || style.gridlines === "both";
    const horizontalLines = style.gridlines === "horizontal" || style.gridlines === "both";
    const categoryAxis: Record<string, unknown> = {
        type: kind,
        data: kind === "category" ? categories : undefined,
        boundaryGap: kind === "category" ? hasBars || allItems : undefined,
        name: settings.xAxisTitle || undefined,
        nameLocation: "middle",
        nameGap: horizontal ? 56 : 30,
        inverse: horizontal && kind === "category",
        axisLabel: {
            show: settings.showXAxis,
            hideOverlap: true,
            formatter: kind === "time" ? settings.xDateFormat || undefined : kind === "value" ? formatNumber : undefined
        },
        splitLine: { show: horizontal ? horizontalLines : verticalLines }
    };
    const valueAxis = (side: "left" | "right"): Record<string, unknown> => ({
        type: settings.yAxisScale === "log" ? "log" : "value",
        min: settings.yAxisMin,
        max: settings.yAxisMax,
        position: horizontal ? (side === "left" ? "bottom" : "top") : side,
        name: side === "left" ? settings.yAxisTitle || undefined : undefined,
        nameLocation: "middle",
        nameGap: horizontal ? 30 : 48,
        axisLabel: { show: settings.showYAxis, formatter: formatNumber, hideOverlap: true },
        splitLine: { show: side === "left" && (horizontal ? verticalLines : horizontalLines) }
    });
    const valueAxes = usesRightAxis ? [valueAxis("left"), valueAxis("right")] : [valueAxis("left")];

    const placement = legendPlacement(style, projected.length);
    const hasTitle = Boolean(settings.title || settings.subtitle);
    const grid = gridOption(placement, hasTitle, Boolean(settings.subtitle));
    // Room for value labels that sit above the highest point or beyond the last one.
    if (style.valueLabels !== "off") {
        grid.top = Number(grid.top) + 22;
        grid.right = Number(grid.right) + (horizontal ? 36 : 18);
    }
    const slider = settings.zoom === "slider" || settings.zoom === "both";
    if (slider) {
        grid.bottom = Number(grid.bottom) + (horizontal ? 0 : 40);
        if (horizontal) {
            grid.right = Number(grid.right) + 40;
        }
    }
    const zoomAxis = horizontal ? { yAxisIndex: 0 } : { xAxisIndex: 0 };
    const dataZoom = [
        ...(settings.zoom === "inside" || settings.zoom === "both" ? [{ type: "inside", ...zoomAxis }] : []),
        ...(slider
            ? [{ type: "slider", ...zoomAxis, height: horizontal ? undefined : 24, bottom: horizontal ? undefined : 8 }]
            : [])
    ];

    const valueIndex = horizontal ? 0 : 1;
    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: formatNumber,
        pickValue: value => {
            const n = Array.isArray(value) ? Number(value[valueIndex]) : Number(value);
            return Number.isFinite(n) ? n : undefined;
        },
        colorOf: param => (param.seriesIndex !== undefined ? colors[param.seriesIndex] : undefined),
        headerOf: param => {
            const value = param.value;
            if (!Array.isArray(value)) {
                return param.name ?? "";
            }
            const x = value[horizontal ? 1 : 0];
            return kind === "time" ? label(new Date(Number(x))) : typeof x === "number" ? formatNumber(x) : String(x);
        }
    });

    const option: Record<string, unknown> = {
        backgroundColor: surfaceBackground(tokens, style),
        animation: style.animation,
        animationDuration: style.animationDuration,
        animationDurationUpdate: Math.round(style.animationDuration / 2),
        aria: { enabled: true },
        title: titleOption(settings.title, settings.subtitle, settings.titleAlign) ?? { show: false },
        legend: legendOption(placement, hasTitle),
        grid,
        tooltip: tooltipOption(tokens, style, allItems ? "item" : "axis", tooltipFormatter),
        xAxis: horizontal ? valueAxes : categoryAxis,
        yAxis: horizontal ? categoryAxis : valueAxes,
        dataZoom,
        visualMap: visualMaps,
        series: echartsSeries
    };

    const crumbs =
        drill.nextStep !== undefined || path.length > 0 ? [settings.topLabel, ...path.map(step => step.label)] : [];

    return {
        option,
        clickTargets,
        breadcrumb: crumbs,
        table: { columns: ["Series", settings.xAxisTitle || "X", settings.yAxisTitle || "Value"], rows: tableRows },
        pointCount: tableRows.length
    };
}

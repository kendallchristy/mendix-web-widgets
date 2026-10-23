import type { BuiltChart, ChartTokens, ClickTarget, ElementSize, XValue } from "@kendallchristy/chart-core";
import {
    baseOption,
    bucketDate,
    combineValues,
    createNumberFormatter,
    createTooltipFormatter,
    figuresFontFamily,
    formatDateLabel,
    mixColors,
    parseColorList,
    readableInk,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { HeatPoint, HeatmapSettings } from "./types";

/** Green for low, amber, coral for high: the Hyper scale. */
export const HYPER_SCALE = ["#48B840", "#F8B810", "#F86860"];

/** Smallest cell, in pixels, that still fits a value. */
const LABEL_CELL = { width: 30, height: 16 };
const SCALE_ROOM = 44;

/** One cell: its objects and their combined value. */
interface Cell {
    key: string;
    points: HeatPoint[];
    value: number;
}

/** The scale's colours, from low to high. */
export function scaleColors(settings: HeatmapSettings, tokens: ChartTokens): string[] {
    let colors: string[];
    if (settings.colorScale === "palette") {
        const base = tokens.palette[0];
        colors = [mixColors(base, tokens.surface, 0.88), base];
    } else if (settings.colorScale === "custom") {
        const custom = parseColorList(settings.customScale);
        colors = custom.length >= 2 ? custom : HYPER_SCALE;
    } else {
        colors = HYPER_SCALE;
    }
    return settings.reverseScale ? [...colors].reverse() : colors;
}

/** The scale's colour at `t`, from 0 (low) to 1 (high). */
export function colorAt(colors: string[], t: number): string {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
    const position = clamped * (colors.length - 1);
    const index = Math.min(colors.length - 2, Math.floor(position));
    return mixColors(colors[index], colors[index + 1], position - index);
}

interface AxisValues {
    keys: Array<string | number>;
    labels: string[];
    indexOf: (value: XValue) => number;
}

const keyOf = (value: XValue): string | number => (value instanceof Date ? value.getTime() : value);

/** The distinct values of one axis: dates and numbers in order, text in the order it first appears. */
export function axisValues(values: XValue[], dateFormat: string | undefined, locale?: string): AxisValues {
    const unique = new Map<string | number, XValue>();
    for (const value of values) {
        const key = keyOf(value);
        if (!unique.has(key)) {
            unique.set(key, value);
        }
    }
    const entries = Array.from(unique.values());
    if (entries.every(v => v instanceof Date)) {
        entries.sort((a, b) => (a as Date).getTime() - (b as Date).getTime());
    } else if (entries.every(v => typeof v === "number")) {
        entries.sort((a, b) => (a as number) - (b as number));
    }
    const dates = entries.filter((v): v is Date => v instanceof Date);
    const showYear = new Set(dates.map(d => d.getFullYear())).size > 1;
    const showTime = dates.some(d => d.getHours() !== 0 || d.getMinutes() !== 0);
    const keys = entries.map(keyOf);
    const index = new Map(keys.map((key, i) => [key, i]));
    return {
        keys,
        labels: entries.map(v =>
            v instanceof Date ? formatDateLabel(v, { template: dateFormat, showYear, showTime }, locale) : String(v)
        ),
        indexOf: value => index.get(keyOf(value)) ?? -1
    };
}

/** Groups objects by key and combines their values; cells without a value are left out. */
function combineCells(
    points: HeatPoint[],
    keyOfPoint: (point: HeatPoint) => string | undefined,
    aggregation: HeatmapSettings["aggregation"]
): Cell[] {
    const groups = new Map<string, HeatPoint[]>();
    for (const point of points) {
        const key = keyOfPoint(point);
        if (key === undefined) {
            continue;
        }
        const group = groups.get(key);
        if (group) {
            group.push(point);
        } else {
            groups.set(key, [point]);
        }
    }
    const cells: Cell[] = [];
    for (const [key, group] of groups) {
        const values = group.map(p => p.value).filter((v): v is number => v !== undefined && Number.isFinite(v));
        const value = combineValues(values, aggregation, group.length);
        if (value !== undefined) {
            cells.push({ key, points: group, value });
        }
    }
    return cells;
}

/** Weekday and month names for the calendar, in the user's language. ECharts starts weeks on Sunday. */
function calendarNames(locale?: string): { days: string[]; months: string[] } {
    const day = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const month = new Intl.DateTimeFormat(locale, { month: "short" });
    return {
        // 4 January 1970 was a Sunday.
        days: Array.from({ length: 7 }, (_, i) => day.format(new Date(1970, 0, 4 + i))),
        months: Array.from({ length: 12 }, (_, i) => month.format(new Date(2000, i, 1)))
    };
}

const dayKey = (date: Date): string => bucketDate(date, "day").key;
const dayOf = (key: string): Date => {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export function buildHeatmap(
    points: HeatPoint[],
    settings: HeatmapSettings,
    tokens: ChartTokens,
    size: ElementSize,
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const figures = figuresFontFamily(tokens, style);
    const colors = scaleColors(settings, tokens);
    const calendar = settings.layout === "calendar";
    const measured = size.width > 0 && size.height > 0;

    const xAxis = axisValues(
        points.map(p => p.x),
        settings.dateFormat,
        locale
    );
    const rowValues = points.map(p => p.y).filter((v): v is XValue => v !== undefined);
    const yAxis = axisValues(rowValues, settings.dateFormat, locale);
    const hasRows = yAxis.keys.length > 0;

    const cells = calendar
        ? combineCells(points, p => (p.x instanceof Date ? dayKey(p.x) : undefined), settings.aggregation)
        : combineCells(
              points,
              p => {
                  const yi = p.y === undefined ? (hasRows ? -1 : 0) : yAxis.indexOf(p.y);
                  return yi < 0 ? undefined : `${xAxis.indexOf(p.x)}|${yi}`;
              },
              settings.aggregation
          );

    const values = cells.map(c => c.value);
    const min = settings.scaleMin ?? (values.length ? Math.min(...values) : 0);
    let max = settings.scaleMax ?? (values.length ? Math.max(...values) : 1);
    if (max <= min) {
        max = min + 1;
    }
    const inkOf = (value: number): string =>
        readableInk(colorAt(colors, (value - min) / (max - min)), "#111318", "#FFFFFF");
    const labelFor = (value: number, show: boolean): Record<string, unknown> => ({
        show,
        color: inkOf(value),
        fontFamily: figures,
        fontSize: 11,
        fontWeight: 600,
        formatter: () => formatNumber(value)
    });
    const cellStyle = {
        borderColor: tokens.surface,
        borderWidth: settings.cellGap,
        borderRadius: settings.cornerRadius
    };
    const bottomRoom = settings.showScale ? SCALE_ROOM : 8;

    const visualMap = {
        type: "continuous",
        show: settings.showScale,
        min,
        max,
        dimension: calendar ? 1 : 2,
        calculable: false,
        orient: "horizontal",
        left: "center",
        bottom: 4,
        itemWidth: 10,
        itemHeight: 140,
        text: [formatNumber(max), formatNumber(min)],
        textGap: 8,
        textStyle: { color: tokens.label, fontFamily: figures, fontSize: 11 },
        inRange: { color: colors }
    };

    const cellsByKey = new Map(cells.map(c => [c.key, c]));
    const cellOf = (value: unknown): Cell | undefined => {
        if (!Array.isArray(value)) {
            return undefined;
        }
        return cellsByKey.get(calendar ? String(value[0]) : `${value[0]}|${value[1]}`);
    };
    const singleTooltip = (cell: Cell | undefined): string | undefined =>
        cell?.points.length === 1 ? cell.points[0].tooltip : undefined;
    const valueName = settings.title ?? "Value";
    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: formatNumber,
        pickValue: value => (Array.isArray(value) ? Number(value[calendar ? 1 : 2]) : undefined),
        headerOf: param => {
            const value = param.value;
            if (!Array.isArray(value)) {
                return "";
            }
            return calendar
                ? formatDateLabel(dayOf(String(value[0])), { template: settings.dateFormat, showYear: true }, locale)
                : (xAxis.labels[Number(value[0])] ?? "");
        },
        nameOf: param =>
            !calendar && hasRows && Array.isArray(param.value)
                ? (yAxis.labels[Number(param.value[1])] ?? "")
                : valueName,
        tooltipOf: param => singleTooltip(cellOf(param.value))
    });
    const tooltip = tooltipOption(tokens, { ...style, hoverGuide: "none" }, "item", tooltipFormatter);
    const target = (cell: Cell): ClickTarget<string> => ({
        // Read on click only.
        get action() {
            return cell.points[0]?.action;
        }
    });

    if (calendar) {
        const keys = cells.map(c => c.key).sort();
        const years = Array.from(new Set(keys.map(k => k.slice(0, 4))));
        const ranges = years.map(year => {
            const inYear = keys.filter(k => k.startsWith(year));
            return [inYear[0], inYear[inYear.length - 1]];
        });
        // Columns are weeks; the widest year decides the cell size so every year lines up.
        const weeks = Math.max(
            1,
            ...ranges.map(([from, to]) => {
                const start = dayOf(from);
                const days = Math.round((dayOf(to).getTime() - start.getTime()) / 86400000);
                return Math.ceil((days + ((start.getDay() + 6) % 7) + 1) / 7);
            })
        );
        const labelRoom = years.length > 1 ? 64 : 40;
        const monthRoom = 22;
        const yearGap = 12;
        const cellSize = measured
            ? Math.max(
                  6,
                  Math.min(
                      40,
                      Math.floor((size.width - labelRoom - 16) / weeks),
                      Math.floor(
                          (size.height - bottomRoom - 8 - years.length * (monthRoom + yearGap)) / (7 * years.length)
                      )
                  )
              )
            : 16;
        const names = calendarNames(locale);
        // Small cells name only Monday, Wednesday and Friday, so the day names don't crowd.
        const dayNames = cellSize < 14 ? names.days.map((name, i) => (i % 2 === 1 ? name : "")) : names.days;
        // Centred when the cells stop growing before the chart's width runs out.
        const left = measured
            ? Math.max(labelRoom, Math.round((size.width - weeks * cellSize + labelRoom) / 2))
            : labelRoom;
        const showLabels = settings.cellLabels && cellSize >= LABEL_CELL.width;
        const calendarCells = {
            ...cellStyle,
            borderWidth: Math.min(settings.cellGap, Math.round(cellSize / 5)),
            borderRadius: Math.min(settings.cornerRadius, Math.floor(cellSize / 4))
        };
        const calendars = ranges.map((range, i) => ({
            range,
            top: 8 + monthRoom + i * (7 * cellSize + monthRoom + yearGap),
            left,
            cellSize: measured ? cellSize : ["auto", cellSize],
            ...(measured ? {} : { right: 16 }),
            orient: "horizontal",
            splitLine: { show: false },
            itemStyle: {
                color: withAlpha(tokens.muted, 0.14),
                borderColor: tokens.surface,
                borderWidth: calendarCells.borderWidth
            },
            dayLabel: {
                firstDay: 1,
                nameMap: dayNames,
                color: tokens.label,
                fontSize: cellSize < 12 ? 9 : 10,
                margin: 6
            },
            monthLabel: { nameMap: names.months, color: tokens.label, fontSize: 11, margin: 6 },
            yearLabel: { show: years.length > 1, position: "left", color: tokens.label, fontSize: 11, margin: 28 }
        }));
        const byYear = years.map(year => cells.filter(c => c.key.startsWith(year)));
        const option: Record<string, unknown> = {
            ...baseOption(tokens, style),
            tooltip,
            visualMap,
            calendar: calendars,
            series: byYear.map((yearCells, i) => ({
                type: "heatmap",
                coordinateSystem: "calendar",
                calendarIndex: i,
                name: years[i],
                itemStyle: calendarCells,
                emphasis: { itemStyle: { shadowBlur: 8, shadowColor: withAlpha("#000000", 0.25) } },
                data: yearCells.map(c => ({ value: [c.key, c.value], label: labelFor(c.value, showLabels) }))
            }))
        };
        return {
            option,
            clickTargets: byYear.map(yearCells => yearCells.map(target)),
            breadcrumb: [],
            table: {
                columns: ["Date", "Value"],
                rows: [...cells]
                    .sort((a, b) => a.key.localeCompare(b.key))
                    .map(c => [
                        formatDateLabel(dayOf(c.key), { template: settings.dateFormat, showYear: true }, locale),
                        formatNumber(c.value)
                    ])
            },
            pointCount: cells.length
        };
    }

    const rowLabels = hasRows ? yAxis.labels : [""];
    const rowRoom = hasRows ? Math.min(120, 12 + Math.max(...rowLabels.map(l => l.length)) * 6.5) : 0;
    const cellWidth = measured ? (size.width - rowRoom - 24) / Math.max(1, xAxis.keys.length) : 0;
    const cellHeight = measured ? (size.height - bottomRoom - 36) / rowLabels.length : 0;
    const showLabels =
        settings.cellLabels && (!measured || (cellWidth >= LABEL_CELL.width && cellHeight >= LABEL_CELL.height));
    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        tooltip,
        visualMap,
        grid: {
            top: 12,
            bottom: bottomRoom,
            left: 8,
            right: 16,
            outerBoundsMode: "same",
            outerBoundsContain: "all"
        },
        xAxis: {
            type: "category",
            data: xAxis.labels,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { hideOverlap: true }
        },
        yAxis: {
            type: "category",
            data: rowLabels,
            inverse: true,
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: hasRows, width: 120, overflow: "truncate" }
        },
        series: [
            {
                type: "heatmap",
                name: valueName,
                itemStyle: cellStyle,
                emphasis: { itemStyle: { shadowBlur: 8, shadowColor: withAlpha("#000000", 0.25) } },
                data: cells.map(c => {
                    const [xi, yi] = c.key.split("|").map(Number);
                    return { value: [xi, yi, c.value], label: labelFor(c.value, showLabels) };
                })
            }
        ]
    };

    const ordered = [...cells].sort((a, b) => {
        const [ax, ay] = a.key.split("|").map(Number);
        const [bx, by] = b.key.split("|").map(Number);
        return ay - by || ax - bx;
    });
    return {
        option,
        clickTargets: [cells.map(target)],
        breadcrumb: [],
        table: {
            columns: hasRows ? ["Column", "Row", "Value"] : ["Column", "Value"],
            rows: ordered.map(c => {
                const [xi, yi] = c.key.split("|").map(Number);
                const column = xAxis.labels[xi];
                return hasRows ? [column, rowLabels[yi], formatNumber(c.value)] : [column, formatNumber(c.value)];
            })
        },
        pointCount: cells.length
    };
}

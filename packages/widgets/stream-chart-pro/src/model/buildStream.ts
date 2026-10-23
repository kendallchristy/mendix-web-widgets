import type { BuiltChart, ChartTokens, TooltipParam } from "@kendallchristy/chart-core";
import {
    baseOption,
    bucketDate,
    combineValues,
    createNumberFormatter,
    createTooltipFormatter,
    dateTimeFormat,
    formatDateLabel,
    gridOption,
    legendOption,
    legendPlacement,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { StreamPoint, StreamSettings } from "./types";

const num = (value: Date | number): number => (value instanceof Date ? value.getTime() : value);

/** The stream each group draws in: the largest groups keep their own, the rest share Other. */
export function streamNames(points: StreamPoint[], maxGroups: number, otherLabel: string): Map<string, string> {
    const totals = new Map<string, number>();
    for (const point of points) {
        totals.set(point.group, (totals.get(point.group) ?? 0) + Math.abs(point.value ?? 1));
    }
    const groups = Array.from(totals.keys());
    const names = new Map(groups.map(group => [group, group]));
    if (maxGroups > 0 && groups.length > maxGroups) {
        const kept = new Set(
            [...groups].sort((a, b) => totals.get(b)! - totals.get(a)!).slice(0, Math.max(1, maxGroups - 1))
        );
        for (const group of groups) {
            if (!kept.has(group)) {
                names.set(group, otherLabel);
            }
        }
    }
    return names;
}

/** A moment's label: the period it stands for, or the date itself. */
function momentLabel(
    moment: number,
    settings: StreamSettings,
    time: boolean,
    context: { showYear: boolean; showTime: boolean },
    locale?: string
): string {
    if (!time) {
        return String(moment);
    }
    const date = new Date(moment);
    switch (settings.period) {
        case "year":
            return String(date.getFullYear());
        case "quarter":
            return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
        case "month":
            return dateTimeFormat(locale, { month: "short", year: "numeric" }).format(date);
        default:
            return formatDateLabel(date, { template: settings.dateFormat, ...context }, locale);
    }
}

export function buildStream(
    points: StreamPoint[],
    settings: StreamSettings,
    tokens: ChartTokens,
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const time = points.some(p => p.date instanceof Date);
    const period = time ? settings.period : "none";
    const momentOf = (date: Date | number): number =>
        period !== "none" && date instanceof Date ? bucketDate(date, period).start.getTime() : num(date);

    const names = streamNames(points, settings.maxGroups, settings.otherLabel);
    // Streams in the order their groups first appear, with Other last.
    const streams = Array.from(new Set(names.values())).sort((a, b) =>
        a === settings.otherLabel ? 1 : b === settings.otherLabel ? -1 : 0
    );
    const folded = streams.includes(settings.otherLabel) && !names.has(settings.otherLabel);
    let paletteIndex = 0;
    const colors = streams.map(name =>
        folded && name === settings.otherLabel ? tokens.muted : tokens.palette[paletteIndex++ % tokens.palette.length]
    );

    const buckets = new Map<number, Map<string, { values: number[]; count: number }>>();
    for (const point of points) {
        const moment = momentOf(point.date);
        const stream = names.get(point.group) ?? point.group;
        const byStream = buckets.get(moment) ?? new Map<string, { values: number[]; count: number }>();
        buckets.set(moment, byStream);
        const cell = byStream.get(stream) ?? { values: [], count: 0 };
        byStream.set(stream, cell);
        cell.count += 1;
        if (point.value !== undefined && Number.isFinite(point.value)) {
            cell.values.push(point.value);
        }
    }
    const moments = Array.from(buckets.keys()).sort((a, b) => a - b);
    // ThemeRiver needs every stream at every moment, so gaps are zero.
    const table = moments.map(moment =>
        streams.map(stream => {
            const cell = buckets.get(moment)?.get(stream);
            return cell ? (combineValues(cell.values, settings.aggregation, cell.count) ?? 0) : 0;
        })
    );
    const data = moments.flatMap((moment, m) => streams.map((stream, s) => [moment, table[m][s], stream]));

    const dates = moments.map(m => new Date(m));
    const labelContext = {
        showYear: time && new Set(dates.map(d => d.getFullYear())).size > 1,
        showTime: time && period === "none" && dates.some(d => d.getHours() !== 0 || d.getMinutes() !== 0)
    };
    const labelOf = (moment: number): string => momentLabel(moment, settings, time, labelContext, locale);

    const placement = legendPlacement(style, settings.showLabels ? 1 : streams.length);
    const grid = gridOption(placement);
    const labelRoom = settings.showLabels ? Math.min(140, 12 + Math.max(...streams.map(s => s.length)) * 6.5) : 0;
    const axisRoom = settings.showAxis ? 28 : 0;

    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: formatNumber,
        pickValue: value => (Array.isArray(value) ? Number(value[1]) : undefined),
        headerOf: param => (Array.isArray(param.value) ? labelOf(Number(param.value[0])) : ""),
        nameOf: param => (Array.isArray(param.value) ? String(param.value[2]) : ""),
        colorOf: param => (Array.isArray(param.value) ? colors[streams.indexOf(String(param.value[2]))] : undefined),
        tooltipOf: () => undefined
    });
    // The axis tooltip lists every stream at the hovered moment, largest first, and leaves out empty ones.
    const formatter = (input: TooltipParam | TooltipParam[]): string => {
        const params = (Array.isArray(input) ? input : [input]).filter(
            p => Array.isArray(p.value) && Number(p.value[1]) !== 0
        );
        params.sort((a, b) => Number((b.value as unknown[])[1]) - Number((a.value as unknown[])[1]));
        return tooltipFormatter(params.map(p => ({ ...p, axisValueLabel: undefined })));
    };

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        color: colors,
        legend: { ...legendOption(placement), data: streams },
        tooltip: {
            ...tooltipOption(tokens, style, "axis", formatter),
            axisPointer: { type: "line", lineStyle: { color: tokens.grid, width: 1 } }
        },
        singleAxis: {
            type: time ? "time" : "value",
            top: grid.top,
            bottom: Number(grid.bottom) + axisRoom,
            left: Number(grid.left) + labelRoom,
            right: grid.right,
            min: "dataMin",
            max: "dataMax",
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: true, lineStyle: { color: tokens.grid } },
            axisLabel: {
                show: settings.showAxis,
                hideOverlap: true,
                formatter: time ? settings.dateFormat : formatNumber
            },
            axisPointer: { label: { show: false } }
        },
        series: [
            {
                type: "themeRiver",
                boundaryGap: ["8%", "8%"],
                // ECharts places the label at the start of each stream; right-aligned, it sits in the room left for it.
                label: {
                    show: settings.showLabels,
                    align: "right",
                    color: tokens.text,
                    fontSize: 11,
                    fontWeight: 600,
                    margin: 6
                },
                itemStyle:
                    style.glow === "soft"
                        ? { shadowBlur: 10, shadowColor: withAlpha("#000000", tokens.mode === "dark" ? 0.35 : 0.08) }
                        : {},
                emphasis: { focus: "self", label: { show: settings.showLabels } },
                data
            }
        ]
    };

    return {
        option,
        clickTargets: [],
        breadcrumb: [],
        table: {
            columns: [time ? "Date" : "Moment", ...streams],
            rows: moments.map((moment, m) => [labelOf(moment), ...table[m].map(formatNumber)])
        },
        pointCount: points.length
    };
}

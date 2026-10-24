import type { BuiltChart, CategoryPoint, ChartTokens, DrillStep, ElementSize } from "@kendallchristy/chart-core";
import {
    baseOption,
    categoryColors,
    categoryLevel,
    createNumberFormatter,
    createPercentFormatter,
    createTooltipFormatter,
    figuresFontFamily,
    fitArc,
    glowStyle,
    legendPlacement,
    pillStyle,
    tooltipOption,
    withAlpha,
    wrappingLegend
} from "@kendallchristy/chart-core";

import type { RadialBarSettings } from "./types";

export function buildRadialBar(
    points: CategoryPoint[],
    settings: RadialBarSettings,
    tokens: ChartTokens,
    path: Array<DrillStep<string>>,
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const formatPercent = createPercentFormatter(settings.percentDecimals, locale);
    const level = categoryLevel(points, { ...settings.categories, otherLabel: undefined }, path);
    const items = level.items;
    const colors = categoryColors(items, tokens.palette, tokens.muted);
    const largest = Math.max(0, ...items.map(item => item.value));
    const full = settings.maxValue !== undefined && settings.maxValue > 0 ? settings.maxValue : largest || 1;
    const share = (value: number): string => formatPercent(value / full);
    const figures = figuresFontFamily(tokens, style);
    const sweep = Math.min(360, Math.max(30, settings.sweep));

    // Names stack beside the rings' start, which needs a gap there and a start near the top or bottom. A closed
    // circle or a start at the side would overlap them, so the legend names the rings instead.
    const startOffVertical = Math.abs((((settings.startAngle % 180) + 180) % 180) - 90);
    const names = settings.showNames && sweep <= 300 && startOffVertical <= 30;
    const placement = style.legend === "auto" ? (names ? "hidden" : "bottom") : legendPlacement(style, 2);
    const legend = wrappingLegend(
        placement,
        items.map(item => item.name),
        size.width
    );
    const top = placement === "top" ? legend.height + 8 : 8;
    const bottom = placement === "bottom" ? legend.height : 8;
    const right = placement === "right" ? 140 : 8;
    const hole = Math.min(90, Math.max(0, settings.innerRadius)) / 100;

    const labelText = (index: number): string => {
        const item = items[index];
        const name = item.name.replace(/[{}|]/g, "");
        if (settings.valueLabel === "off") {
            return `{name|${name}}`;
        }
        const value = settings.valueLabel === "percent" ? share(item.value) : formatNumber(item.value);
        return `{name|${name}} {value|${value}}`;
    };
    const labelWidth = names
        ? Math.max(0, ...items.map((_, i) => labelText(i).replace(/\{\w+\||\}/g, "").length)) * 6.6 + 14
        : 0;

    // Polar layouts are sized from the whole plot, so the legend and the names are made room for by
    // fitting the rings' arc into what is left.
    let polar: Record<string, unknown>;
    if (size.width > 0) {
        const width = size.width - 8 - right;
        const height = size.height - top - bottom;
        const fit = fitArc(settings.startAngle, sweep, hole, width, height, labelWidth);
        polar = { center: [8 + fit.x, top + fit.y], radius: [Math.round(fit.radius * hole), Math.round(fit.radius)] };
    } else {
        polar = { center: ["50%", "55%"], radius: [`${Math.round(80 * hole)}%`, "80%"] };
    }

    const gap = `${Math.max(0, Math.min(95, 100 - settings.ringWidth))}%`;
    const pill = pillStyle(tokens, settings.labelStyle);

    const series: Array<Record<string, unknown>> = [
        {
            // The track: a faint full ring behind each value. Drawn as bars, not as a background, so it follows the
            // sweep instead of always closing the circle.
            type: "bar",
            name: "track",
            coordinateSystem: "polar",
            silent: true,
            tooltip: { show: false },
            barCategoryGap: gap,
            roundCap: settings.roundCaps,
            itemStyle: {
                color: settings.track ? withAlpha(tokens.muted, tokens.mode === "dark" ? 0.35 : 0.45) : "rgba(0,0,0,0)"
            },
            emphasis: { disabled: true },
            data: items.map(() => full),
            z: 1
        },
        // One series per ring, all in the same slot, so the legend can name and toggle each ring.
        ...items.map((item, i) => ({
            type: "bar",
            name: item.name,
            coordinateSystem: "polar",
            barCategoryGap: gap,
            barGap: "-100%",
            roundCap: settings.roundCaps,
            emphasis: { focus: "self" },
            data: items.map((_, j) =>
                j === i
                    ? {
                          name: item.name,
                          value: Math.min(item.value, full),
                          hcTooltip: item.tooltip,
                          itemStyle: { color: colors[i], ...glowStyle(colors[i], tokens, style), shadowOffsetY: 2 }
                      }
                    : "-"
            ),
            z: 2
        }))
    ];

    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: value => `${formatNumber(value)} · ${share(value)}`,
        pickValue: value => (typeof value === "number" ? value : undefined),
        headerOf: () => "",
        nameOf: param => param.name ?? "",
        colorOf: param => colors[(param.seriesIndex ?? 1) - 1]
    });

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: legend.option,
        tooltip: tooltipOption(tokens, style, "item", tooltipFormatter),
        polar,
        angleAxis: {
            type: "value",
            min: 0,
            max: (full * 360) / sweep,
            startAngle: settings.startAngle,
            clockwise: true,
            show: false
        },
        radiusAxis: {
            type: "category",
            data: items.map(item => item.name),
            // The first item is the outer ring.
            inverse: true,
            z: 10,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                show: names,
                interval: 0,
                margin: 8,
                align: "right",
                formatter: (_: string, index: number) => labelText(index),
                rich: {
                    name: { color: tokens.label, fontSize: 11 },
                    value: { color: tokens.text, fontFamily: figures, fontSize: 11, fontWeight: 600, ...pill }
                }
            }
        },
        series
    };

    return {
        option,
        // Ring i is series i + 1, after the track, and its value is its data item i.
        clickTargets: [[], ...items.map(item => items.map(other => (other === item ? item.target : {})))],
        breadcrumb: level.breadcrumb,
        table: {
            columns: ["Category", "Value", "Share of a full ring"],
            rows: items.map(item => [item.name, formatNumber(item.value), share(item.value)])
        },
        pointCount: items.length
    };
}

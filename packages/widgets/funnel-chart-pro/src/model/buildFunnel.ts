import type { BuiltChart, CategoryPoint, ChartTokens, DrillStep, ElementSize } from "@kendallchristy/chart-core";
import {
    baseOption,
    categoryColors,
    categoryLevel,
    createNumberFormatter,
    createPercentFormatter,
    createTooltipFormatter,
    figuresFontFamily,
    glowStyle,
    legendPlacement,
    mixColors,
    readableInk,
    tooltipOption,
    wrappingLegend
} from "@kendallchristy/chart-core";

import type { FunnelSettings } from "./types";

/** Steps of one colour, lightening towards the surface: stages are steps of one thing, not different things. */
export function shades(color: string, surface: string, count: number): string[] {
    return Array.from({ length: count }, (_, i) =>
        count < 2 ? color : mixColors(color, surface, (i / (count - 1)) * 0.6)
    );
}

export function buildFunnel(
    points: CategoryPoint[],
    settings: FunnelSettings,
    tokens: ChartTokens,
    path: Array<DrillStep<string>>,
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const formatPercent = createPercentFormatter(settings.percentDecimals, locale);
    const level = categoryLevel(points, { ...settings.categories, limit: 0 }, path);
    const items = level.items;
    const colors =
        settings.colorMode === "shades"
            ? shades(items.find(item => item.color)?.color ?? tokens.palette[0], tokens.surface, items.length)
            : categoryColors(items, tokens.palette, tokens.muted);
    const figures = figuresFontFamily(tokens, style);

    const conversion = items.map((item, i) => {
        const base = settings.conversion === "previous" ? items[i - 1]?.value : items[0]?.value;
        return settings.conversion === "off" || base === undefined || base === 0
            ? undefined
            : i === 0 && settings.conversion === "previous"
              ? undefined
              : item.value / base;
    });

    const names = items.map(item => item.name);
    const showsNames = settings.labelPosition !== "hidden" && settings.showName;
    const placement = style.legend === "auto" ? (showsNames ? "hidden" : "bottom") : legendPlacement(style, 2);
    const legend = wrappingLegend(placement, names, size.width);

    const vertical = settings.orientation === "vertical";
    const outside = settings.labelPosition === "outside";
    const box = {
        top: placement === "top" ? legend.height + 8 : 8,
        bottom: placement === "bottom" ? legend.height : 8,
        left: 8,
        right: placement === "right" ? 140 : 8
    };
    // Room for labels beside or below the stages.
    if (outside && vertical) {
        box.right += Math.round(Math.max(90, size.width * 0.3));
    } else if (outside) {
        box.bottom +=
            12 +
            16 * ((settings.showName ? 1 : 0) + (settings.showValue ? 1 : 0) + (settings.conversion === "off" ? 0 : 1));
    }

    const labelText = (index: number): string => {
        const item = items[index];
        const lines: string[] = [];
        if (settings.showName) {
            lines.push(`{name|${item.name.replace(/[{}|]/g, "")}}`);
        }
        const figuresLine = [
            settings.showValue ? `{value|${formatNumber(item.value)}}` : "",
            conversion[index] !== undefined ? `{rate|${formatPercent(conversion[index])}}` : ""
        ]
            .filter(Boolean)
            // Side by side stages are narrow, so their value and rate stack.
            .join(vertical ? " " : "\n");
        if (figuresLine) {
            lines.push(figuresLine);
        }
        return lines.join("\n");
    };
    const inside = settings.labelPosition === "inside";
    // Labels below side by side stages hang from each stage's lower edge, which slopes, so each gets a leader
    // long enough to bring all labels down to one line under the widest stage.
    const leaders = items.map((item, i) => {
        if (vertical || !outside || size.height <= 0) {
            return undefined;
        }
        const viewHeight = size.height - box.top - box.bottom;
        const largest = Math.max(...items.map(it => it.value), 0) || 1;
        const neck = Math.max(0, Math.min(100, settings.neckWidth)) / 100;
        const heightOf = (value: number): number => viewHeight * (neck + ((1 - neck) * value) / largest);
        const edge = heightOf(item.value) + heightOf(items[i + 1]?.value ?? 0);
        return Math.max(0, settings.align === "center" ? viewHeight / 2 - edge / 4 : viewHeight - edge / 2) + 2;
    });
    const insideRich = (ink: string): Record<string, unknown> => ({
        name: { color: ink, fontSize: 11, lineHeight: 15 },
        value: { color: ink, fontFamily: figures, fontSize: 12, fontWeight: 600, lineHeight: 16 },
        rate: { color: ink, opacity: 0.8, fontFamily: figures, fontSize: 11, lineHeight: 16 }
    });

    const series = [
        {
            type: "funnel",
            name: settings.title ?? "",
            ...box,
            orient: settings.orientation,
            sort: "none",
            funnelAlign: settings.align === "center" ? "center" : vertical ? "left" : "top",
            minSize: `${Math.max(0, Math.min(100, settings.neckWidth))}%`,
            maxSize: "100%",
            gap: Math.max(0, settings.stageGap),
            itemStyle: { borderWidth: 0, borderRadius: Math.max(0, settings.cornerRadius) },
            label:
                settings.labelPosition === "hidden"
                    ? { show: false }
                    : {
                          show: true,
                          position: inside ? "inside" : vertical ? "right" : "bottom",
                          formatter: (params: { dataIndex: number }) => labelText(params.dataIndex),
                          rich: inside
                              ? insideRich("#FFFFFF")
                              : {
                                    name: { color: tokens.label, fontSize: 11, lineHeight: 15 },
                                    value: {
                                        color: tokens.text,
                                        fontFamily: figures,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        lineHeight: 16
                                    },
                                    rate: { color: tokens.label, fontFamily: figures, fontSize: 11, lineHeight: 16 }
                                }
                      },
            labelLine: { show: outside && vertical, length: 12, lineStyle: { color: tokens.grid, width: 1 } },
            emphasis: { label: { show: settings.labelPosition !== "hidden" } },
            data: items.map((item, i) => ({
                name: item.name,
                value: item.value,
                hcTooltip: item.tooltip,
                // Light shades get dark text inside them.
                ...(inside ? { label: { rich: insideRich(readableInk(colors[i], "#111318", "#FFFFFF")) } } : {}),
                ...(leaders[i] !== undefined ? { labelLine: { length: leaders[i] } } : {}),
                itemStyle: { color: colors[i], ...glowStyle(colors[i], tokens, style), shadowOffsetY: 3 }
            }))
        }
    ];

    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: value => formatNumber(value),
        headerOf: () => "",
        nameOf: param => {
            const index = names.indexOf(param.name ?? "");
            const rate = conversion[index];
            return rate === undefined ? (param.name ?? "") : `${param.name ?? ""} · ${formatPercent(rate)}`;
        },
        colorOf: param => colors[names.indexOf(param.name ?? "")]
    });

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: legend.option,
        tooltip: tooltipOption(tokens, style, "item", tooltipFormatter),
        series
    };

    const rateColumn = settings.conversion === "previous" ? "Share of the previous stage" : "Share of the first stage";
    return {
        option,
        clickTargets: [items.map(item => item.target)],
        breadcrumb: level.breadcrumb,
        table: {
            columns: settings.conversion === "off" ? ["Stage", "Value"] : ["Stage", "Value", rateColumn],
            rows: items.map((item, i) => {
                const row = [item.name, formatNumber(item.value)];
                return settings.conversion === "off" ? row : [...row, formatPercent(conversion[i])];
            })
        },
        pointCount: items.length
    };
}

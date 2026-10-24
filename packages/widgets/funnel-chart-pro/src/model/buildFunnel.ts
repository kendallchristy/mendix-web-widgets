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

// Side by side stages narrower than this, in pixels, leave names to the legend.
const NARROWEST_SLOT = 44;
// From a stage's edge to its label beside it: the leader's end and the gap to the text.
const LABEL_GAP = 8 + 5;

export function buildFunnel(
    points: CategoryPoint[],
    settings: FunnelSettings,
    tokens: ChartTokens,
    path: Array<DrillStep<string>>,
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({
        ...settings.numberFormat,
        locale
    });
    const formatPercent = createPercentFormatter(settings.percentDecimals, locale);
    const level = categoryLevel(points, { ...settings.categories, limit: 0 }, path);
    const items = level.items;
    // A stage's own colour, from the Colour attribute or expression, wins; the rest follow the colour mode.
    const modeColors =
        settings.colorMode === "shades"
            ? shades(tokens.palette[0], tokens.surface, items.length)
            : categoryColors(items, tokens.palette, tokens.muted);
    const colors = items.map((item, i) => item.color ?? modeColors[i]);
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
    const vertical = settings.orientation === "vertical";
    const outside = settings.labelPosition === "outside";
    const measured = size.width > 0 && size.height > 0;
    // Side by side stages narrower than this can't hold a name below them, so the legend names them instead.
    const slotGuess = (size.width - 16) / Math.max(1, items.length);
    const cramped =
        outside && !vertical && measured && style.legend === "auto" && settings.showName && slotGuess < NARROWEST_SLOT;
    const showName = settings.showName && !cramped;
    // Values don't fit under such narrow stages either, so they keep only the share when there is one.
    const showValue = settings.showValue && !(cramped && settings.conversion !== "off");
    const showsNames = settings.labelPosition !== "hidden" && showName;
    const placement = style.legend === "auto" ? (showsNames ? "hidden" : "bottom") : legendPlacement(style, 2);
    const legend = wrappingLegend(placement, names, size.width);

    const labelText = (index: number): string => {
        const item = items[index];
        const lines: string[] = [];
        if (showName) {
            lines.push(`{name|${item.name.replace(/[{}|]/g, "")}}`);
        }
        const figuresLine = [
            showValue ? `{value|${formatNumber(item.value)}}` : "",
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
    const lineCount =
        (showName ? 1 : 0) +
        (vertical
            ? settings.showValue || settings.conversion !== "off"
                ? 1
                : 0
            : (settings.showValue ? 1 : 0) + (settings.conversion === "off" ? 0 : 1));
    const labelHeight = lineCount * 16;
    // The widest label beside the stages, estimated from its text.
    const widestLabel = items.reduce((most, item, i) => {
        const name = showName ? item.name.length * 6.2 : 0;
        const value = settings.showValue ? formatNumber(item.value).length * 7.4 : 0;
        const rate = conversion[i] !== undefined ? formatPercent(conversion[i]).length * 6.8 + 6 : 0;
        return Math.max(most, name, value + rate);
    }, 0);

    const box = {
        top: placement === "top" ? legend.height + 8 : 8,
        bottom: placement === "bottom" ? legend.height : 8,
        left: 8,
        right: placement === "right" ? 140 : 8
    };
    // Room for labels beside or below the stages: beside, as much as the widest label needs, up to 45% of the chart.
    const besideRoom = Math.round(
        measured ? Math.min(size.width * 0.45, LABEL_GAP + widestLabel + 4) : Math.max(90, size.width * 0.3)
    );
    if (outside && vertical) {
        box.right += besideRoom;
    } else if (outside) {
        box.bottom += 12 + labelHeight;
    }

    // Rounded corners: ECharts draws funnel stages as plain polygons with round joins, so each stage gets an outline
    // of its own colour as wide as twice the radius. The outline grows every stage by the radius, so the layout box
    // and the gaps make room for it. The radius is capped so thin stages keep their shape.
    const viewWidth = size.width - box.left - box.right;
    const viewHeight = size.height - box.top - box.bottom;
    const stageSize =
        ((vertical ? viewHeight : viewWidth) - settings.stageGap * (items.length - 1)) / Math.max(1, items.length);
    const radius = Math.max(
        0,
        Math.min(
            settings.cornerRadius,
            measured ? Math.floor(stageSize / 4) : 12,
            measured ? Math.floor(Math.min(viewWidth, viewHeight) / 8) : 12
        )
    );
    box.top += radius;
    box.bottom += radius;
    box.left += radius;
    box.right += radius;

    // A stage's size across the funnel, in pixels, as ECharts lays it out.
    const across = (vertical ? viewWidth : viewHeight) - 2 * radius;
    const largest = Math.max(...items.map(it => it.value), 0) || 1;
    const neck = Math.max(0, Math.min(100, settings.neckWidth)) / 100;
    const sizeOf = (value: number): number => across * (neck + ((1 - neck) * Math.max(0, value)) / largest);
    // How far the middle of each stage's outer edge is from the far side of the widest stage.
    const edgeGap = (i: number): number => {
        const middle = (sizeOf(items[i].value) + sizeOf(items[i + 1]?.value ?? 0)) / 2;
        return settings.align === "center" ? (across - middle) / 2 : across - middle;
    };
    // Each label's leader reaches past the widest stage, so labels line up clear of every stage: in a column beside
    // the stages, or in a row under side by side ones.
    const leaders = items.map((_item, i) =>
        !outside || !measured ? undefined : Math.round(edgeGap(i) + radius + (vertical ? 8 : 6 + labelHeight / 2))
    );
    // Labels are cut short with an ellipsis where they'd run past their room.
    const labelWidth =
        !outside || !measured
            ? undefined
            : vertical
              ? Math.max(30, besideRoom - LABEL_GAP)
              : Math.max(20, stageSize + settings.stageGap - 6);
    const inside = settings.labelPosition === "inside";
    const insideRich = (ink: string): Record<string, unknown> => ({
        name: { color: ink, fontSize: 11, lineHeight: 15 },
        value: {
            color: ink,
            fontFamily: figures,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 16
        },
        rate: {
            color: ink,
            opacity: 0.8,
            fontFamily: figures,
            fontSize: 11,
            lineHeight: 16
        }
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
            gap: Math.max(0, settings.stageGap) + 2 * radius,
            label:
                settings.labelPosition === "hidden"
                    ? { show: false }
                    : {
                          show: true,
                          position: inside ? "inside" : vertical ? "right" : "bottom",
                          formatter: (params: { dataIndex: number }) => labelText(params.dataIndex),
                          ...(labelWidth !== undefined ? { width: labelWidth, overflow: "truncate" } : {}),
                          rich: inside
                              ? insideRich("#FFFFFF")
                              : {
                                    name: {
                                        color: tokens.label,
                                        fontSize: 11,
                                        lineHeight: 15
                                    },
                                    value: {
                                        color: tokens.text,
                                        fontFamily: figures,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        lineHeight: 16
                                    },
                                    rate: {
                                        color: tokens.label,
                                        fontFamily: figures,
                                        fontSize: 11,
                                        lineHeight: 16
                                    }
                                }
                      },
            labelLine: {
                show: outside && vertical,
                length: 12,
                lineStyle: { color: tokens.grid, width: 1 }
            },
            emphasis: { label: { show: settings.labelPosition !== "hidden" } },
            data: items.map((item, i) => ({
                name: item.name,
                value: item.value,
                hcTooltip: item.tooltip,
                // Light shades get dark text inside them.
                ...(inside
                    ? {
                          label: {
                              rich: insideRich(readableInk(colors[i], "#111318", "#FFFFFF"))
                          }
                      }
                    : {}),
                ...(leaders[i] !== undefined ? { labelLine: { length: leaders[i] } } : {}),
                itemStyle: {
                    color: colors[i],
                    borderColor: colors[i],
                    borderWidth: 2 * radius,
                    ...glowStyle(colors[i], tokens, style),
                    shadowOffsetY: 3
                }
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

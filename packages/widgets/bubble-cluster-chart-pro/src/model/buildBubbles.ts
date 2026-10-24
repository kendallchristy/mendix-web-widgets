import type {
    BuiltChart,
    CategoryItem,
    CategoryPoint,
    ChartTokens,
    ClickTarget,
    DrillStep,
    ElementSize,
    TooltipParam
} from "@kendallchristy/chart-core";
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
    withAlpha,
    wrappingLegend
} from "@kendallchristy/chart-core";

import type { Circle } from "./pack";
import { layoutCluster } from "./layout";
import type { BubbleSettings } from "./types";

/** Without groups, each bubble is its own series so the legend can name it; past this many they share one. */
const MOST_LEGEND_BUBBLES = 40;
/** Without names on the bubbles, the automatic legend names them up to this many; past it the tooltip does. */
const MOST_AUTO_LEGEND = 10;
/** Pixels above a group's outline for its name. */
const GROUP_LABEL_ROOM = 18;
const MARGIN = 8;

const NAMED = new Set<BubbleSettings["labelContent"]>(["nameValue", "namePercent", "name"]);

interface Group {
    name: string;
    color: string;
    items: CategoryItem[];
    colors: string[];
}

/** What one bubble draws: where, in which colour, and which labels fit inside it. */
interface BubbleSpec extends Circle {
    item: CategoryItem;
    group: string;
    color: string;
    /** Width is the room across the bubble; longer names are cut short with an ellipsis. */
    name?: { text: string; y: number; width: number };
    value?: { text: string; y: number };
    fontSize: number;
}

/** A rough width of text in pixels, for deciding what fits inside a bubble. */
function textWidth(text: string, fontSize: number, figures = false): number {
    return text.length * fontSize * (figures ? 0.62 : 0.56);
}

/** The widest text that fits across a circle of radius r at height y from its centre, with a little margin. */
function widthAt(r: number, y: number): number {
    return 2 * Math.sqrt(Math.max(0, r * r - y * y)) - 4;
}

/** Fits a name and a value inside a bubble: both, then the value alone, then the name alone, or nothing. */
function fitLabels(
    r: number,
    name: string | undefined,
    value: string | undefined,
    pill: boolean
): Pick<BubbleSpec, "name" | "value" | "fontSize"> {
    const fontSize = Math.max(10, Math.min(15, Math.round(r * 0.26)));
    const valueSize = Math.max(10, fontSize - 1);
    const nameLine = Math.round(fontSize * 1.25);
    const valueLine = valueSize + (pill ? 8 : 3);
    const valueWidth = value === undefined ? 0 : textWidth(value, valueSize, true) + (pill ? 14 : 0);
    // Names may be cut short with an ellipsis, down to a few letters.
    const shortest = name === undefined ? 0 : Math.min(textWidth(name, fontSize), textWidth("Abc…", fontSize));

    if (name !== undefined && value !== undefined) {
        const height = nameLine + 2 + valueLine;
        const nameY = -height / 2 + nameLine / 2;
        const valueY = height / 2 - valueLine / 2;
        const nameRoom = widthAt(r, Math.abs(nameY) + nameLine / 2);
        if (nameRoom >= shortest && widthAt(r, valueY + valueLine / 2) >= valueWidth) {
            return {
                fontSize,
                name: { text: name, y: nameY, width: nameRoom },
                value: { text: value, y: valueY }
            };
        }
    }
    if (value !== undefined && widthAt(r, valueLine / 2) >= valueWidth) {
        return { fontSize, value: { text: value, y: 0 } };
    }
    if (name !== undefined && value === undefined) {
        const room = widthAt(r, nameLine / 2);
        if (room >= shortest) {
            return { fontSize, name: { text: name, y: 0, width: room } };
        }
    }
    return { fontSize };
}

/** Groups the items, largest group first, each with its colour. Items without a group share one. */
function groupItems(items: CategoryItem[], tokens: ChartTokens, ungroupedName: string): Group[] {
    const byName = new Map<string, CategoryItem[]>();
    for (const item of items) {
        const name = item.group ?? ungroupedName;
        const list = byName.get(name);
        if (list) {
            list.push(item);
        } else {
            byName.set(name, [item]);
        }
    }
    const total = (list: CategoryItem[]): number => list.reduce((sum, item) => sum + item.value, 0);
    const ordered = [...byName.entries()].sort((a, b) => total(b[1]) - total(a[1]));
    let next = 0;
    return ordered.map(([name, list]) => {
        const onlyOther = list.every(item => item.other);
        const color = onlyOther ? tokens.muted : tokens.palette[next++ % tokens.palette.length];
        return {
            name,
            color,
            items: list,
            colors: list.map(item => (item.other ? tokens.muted : (item.color ?? color)))
        };
    });
}

/** Builds the ECharts option for a bubble cluster at one drilldown level. */
export function buildBubbles(
    points: CategoryPoint[],
    settings: BubbleSettings,
    tokens: ChartTokens,
    path: Array<DrillStep<string>>,
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<string> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const formatPercent = createPercentFormatter(settings.percentDecimals, locale);
    const level = categoryLevel(points, settings.categories, path);
    const items = level.items.filter(item => item.value > 0);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const share = (value: number): string => formatPercent(total > 0 ? value / total : 0);
    const figures = figuresFontFamily(tokens, style);

    const grouped = items.some(item => item.group !== undefined);
    const ungroupedName = settings.categories.otherLabel ?? "Other";
    let groups: Group[];
    if (grouped) {
        groups = groupItems(items, tokens, ungroupedName);
    } else {
        groups = [
            {
                name: settings.title ?? "",
                color: tokens.palette[0],
                items,
                colors: categoryColors(items, tokens.palette, tokens.muted)
            }
        ];
    }

    // Without groups, one series per bubble lets the legend name the bubbles, when there aren't too many.
    const perBubble = !grouped && items.length <= MOST_LEGEND_BUBBLES;
    const legendNames = grouped ? groups.map(g => g.name) : perBubble ? items.map(item => item.name) : [];
    const labelsName = NAMED.has(settings.labelContent);
    const placement =
        legendNames.length === 0
            ? "hidden"
            : style.legend === "auto"
              ? (grouped ? groups.length > 1 : !labelsName && items.length > 1 && items.length <= MOST_AUTO_LEGEND)
                  ? "bottom"
                  : "hidden"
              : legendPlacement(style, 2);
    const width = size.width > 0 ? size.width : 400;
    const height = size.height > 0 ? size.height : 240;
    const legend = wrappingLegend(placement, legendNames, width);
    const box = {
        left: MARGIN,
        top: MARGIN + (placement === "top" ? legend.height : 0),
        width: width - 2 * MARGIN - (placement === "right" ? 140 : 0),
        height: height - 2 * MARGIN - (placement === "top" || placement === "bottom" ? legend.height : 0)
    };

    const outlines = grouped && settings.groupOutlines && groups.length > 1;
    const layout = layoutCluster(
        groups.map(g => g.items.map(item => item.value)),
        {
            width: Math.max(40, box.width),
            height: Math.max(40, box.height),
            gap: Math.max(0, settings.bubbleGap),
            groupGap: Math.max(0, settings.groupGap),
            outlines,
            labelRoom: GROUP_LABEL_ROOM
        }
    );

    const pill = settings.valueStyle === "pill";
    const content = settings.labelContent;
    const specs: BubbleSpec[][] = groups.map((group, g) =>
        group.items.map((item, i) => {
            const circle = layout.bubbles[g][i];
            const r = circle.r;
            const valueText =
                content === "nameValue" || content === "value"
                    ? formatNumber(item.value)
                    : content === "namePercent" || content === "percent"
                      ? share(item.value)
                      : undefined;
            const nameText = labelsName ? item.name : undefined;
            return {
                x: circle.x + box.left,
                y: circle.y + box.top,
                r,
                item,
                group: group.name,
                color: group.colors[i],
                ...(content === "hidden" ? { fontSize: 11 } : fitLabels(r, nameText, valueText, pill))
            };
        })
    );

    const tinted = settings.bubbleStyle === "tinted";
    const fill = (color: string): unknown => {
        switch (settings.bubbleStyle) {
            case "solid":
                return color;
            case "tinted":
                return withAlpha(color, tokens.mode === "dark" ? 0.24 : 0.16);
            case "gradient":
                // A soft highlight up and to the left, like light on a glossy ball.
                return {
                    type: "radial",
                    x: 0.36,
                    y: 0.3,
                    r: 0.85,
                    colorStops: [
                        { offset: 0, color: mixColors(color, "#FFFFFF", 0.38) },
                        { offset: 1, color }
                    ]
                };
        }
    };

    const drawBubble = (b: BubbleSpec): Record<string, unknown> => {
        const ink = tinted ? tokens.text : readableInk(b.color, "#111318", "#FFFFFF");
        const children: Array<Record<string, unknown>> = [
            {
                type: "circle",
                shape: { cx: 0, cy: 0, r: Math.max(0.5, b.r) },
                style: {
                    fill: fill(b.color),
                    ...(tinted ? { stroke: b.color, lineWidth: 1.5 } : {}),
                    ...(b.r > 6 ? glowStyle(b.color, tokens, style) : {})
                },
                emphasis: {
                    style: { stroke: tinted ? b.color : withAlpha(tokens.text, 0.55), lineWidth: tinted ? 2.5 : 2 }
                }
            }
        ];
        if (b.name) {
            children.push({
                type: "text",
                silent: true,
                style: {
                    text: b.name.text,
                    x: 0,
                    y: b.name.y,
                    align: "center",
                    verticalAlign: "middle",
                    width: b.name.width,
                    overflow: "truncate",
                    ellipsis: "…",
                    fill: ink,
                    fontFamily: tokens.fontFamily,
                    fontSize: b.fontSize,
                    fontWeight: 500
                }
            });
        }
        if (b.value) {
            const valuePill = pill
                ? tinted
                    ? { fill: tokens.pillText, backgroundColor: tokens.pillBackground }
                    : { fill: tokens.lightPillText, backgroundColor: tokens.lightPillBackground }
                : { fill: ink };
            children.push({
                type: "text",
                silent: true,
                style: {
                    text: b.value.text,
                    x: 0,
                    y: b.value.y,
                    align: "center",
                    verticalAlign: "middle",
                    fontFamily: figures,
                    fontSize: Math.max(10, b.fontSize - 1),
                    fontWeight: 600,
                    ...valuePill,
                    ...(pill ? { padding: [3, 7], borderRadius: 999 } : {})
                }
            });
        }
        return {
            type: "group",
            x: b.x,
            y: b.y,
            children,
            ...(style.animation ? { enterFrom: { scaleX: 0, scaleY: 0 } } : {})
        };
    };

    const seriesSpecs: BubbleSpec[][] = grouped ? specs : perBubble ? specs[0].map(b => [b]) : specs;
    const series: Array<Record<string, unknown>> = seriesSpecs.map(list => ({
        type: "custom",
        name: grouped ? list[0]?.group : perBubble ? list[0].item.name : (settings.title ?? ""),
        coordinateSystem: "none",
        clip: false,
        z: 2,
        itemStyle: { color: grouped ? groups.find(g => g.name === list[0]?.group)?.color : list[0]?.color },
        renderItem: (params: { dataIndex: number }) => drawBubble(list[params.dataIndex]),
        data: list.map(b => ({
            name: b.item.name,
            value: [Math.round(b.x), Math.round(b.y), Math.round(b.r), b.item.value],
            hcTooltip: b.item.tooltip
        }))
    }));

    if (outlines) {
        // Drawn under the bubbles, and after them in the series list so click targets keep their indexes.
        series.push({
            type: "custom",
            name: "",
            coordinateSystem: "none",
            clip: false,
            silent: true,
            z: 1,
            tooltip: { show: false },
            renderItem: (params: { dataIndex: number }) => {
                const group = groups[params.dataIndex];
                const c = layout.groups[params.dataIndex];
                return {
                    type: "group",
                    x: c.x + box.left,
                    y: c.y + box.top,
                    children: [
                        {
                            type: "circle",
                            shape: { cx: 0, cy: 0, r: c.r },
                            style: {
                                fill: withAlpha(group.color, 0.05),
                                stroke: withAlpha(group.color, 0.4),
                                lineWidth: 1,
                                lineDash: [4, 3]
                            }
                        },
                        {
                            type: "text",
                            style: {
                                text: group.name,
                                x: 0,
                                y: -c.r - 5,
                                align: "center",
                                verticalAlign: "bottom",
                                fill: tokens.label,
                                fontFamily: tokens.fontFamily,
                                fontSize: 11,
                                fontWeight: 600
                            }
                        }
                    ]
                };
            },
            data: groups.map(g => ({ name: g.name, value: 0 }))
        });
    }

    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: value => `${formatNumber(value)} · ${share(value)}`,
        pickValue: value => (Array.isArray(value) ? Number(value[3]) : undefined),
        headerOf: (param: TooltipParam) => (grouped ? (param.seriesName ?? "") : ""),
        nameOf: (param: TooltipParam) => param.name ?? "",
        colorOf: (param: TooltipParam) => seriesSpecs[param.seriesIndex ?? 0]?.[param.dataIndex ?? 0]?.color
    });

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: { ...legend.option, icon: "circle" },
        tooltip: tooltipOption(tokens, style, "item", tooltipFormatter),
        series
    };

    const clickTargets: Array<Array<ClickTarget<string>>> = seriesSpecs.map(list => list.map(b => b.item.target));
    const flat = specs.flat();
    return {
        option,
        clickTargets,
        breadcrumb: level.breadcrumb,
        table: grouped
            ? {
                  columns: ["Category", "Group", "Value", "Share"],
                  rows: flat.map(b => [b.item.name, b.group, formatNumber(b.item.value), share(b.item.value)])
              }
            : {
                  columns: ["Category", "Value", "Share"],
                  rows: flat.map(b => [b.item.name, formatNumber(b.item.value), share(b.item.value)])
              },
        pointCount: items.length
    };
}

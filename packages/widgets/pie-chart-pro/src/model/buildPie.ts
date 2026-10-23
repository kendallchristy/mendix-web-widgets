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
    tooltipOption,
    wrappingLegend
} from "@kendallchristy/chart-core";

import type { PieSettings } from "./types";

const LABEL_NAMES = new Set<PieSettings["labelContent"]>(["namePercent", "nameValue", "name"]);

interface Box {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

/** Where the pie sits: beside, above or below the legend. */
function layoutBox(placement: string, legendHeight: number): Box {
    return {
        top: placement === "top" ? legendHeight + 8 : 8,
        bottom: placement === "bottom" ? legendHeight : 8,
        left: 8,
        right: placement === "right" ? 140 : 8
    };
}

export function buildPie(
    points: CategoryPoint[],
    settings: PieSettings,
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
    const colors = categoryColors(items, tokens.palette, tokens.muted);
    const figures = figuresFontFamily(tokens, style);

    const labelsName = settings.labelPosition !== "hidden" && LABEL_NAMES.has(settings.labelContent);
    const placement =
        style.legend === "auto" ? (labelsName || items.length < 2 ? "hidden" : "bottom") : legendPlacement(style, 2);
    const names = items.map(item => item.name);
    const legend = wrappingLegend(placement, names, size.width);
    const box = layoutBox(placement, legend.height);

    const half = settings.shape === "halfDonut";
    const hole = Math.min(90, Math.max(0, settings.shape === "pie" ? 0 : settings.innerRadius)) / 100;
    const outside = settings.labelPosition === "outside";
    const angles = half ? { startAngle: 180, endAngle: 360 } : { startAngle: settings.startAngle };
    let layout: Record<string, unknown>;
    let totalSize = 22;
    if (half && size.width > 0) {
        // A half circle is twice as wide as it is tall, which percentages of the layout box can't express, so it is
        // sized from the chart's measured size instead.
        const width = size.width - box.left - box.right;
        const height = size.height - box.top - box.bottom;
        // Room under the flat edge for the centre total.
        const below = hole > 0 && settings.centerContent === "total" ? 22 : 2;
        const outer = Math.max(10, Math.min(height - below - (outside ? 24 : 4), width / 2 - (outside ? 56 : 4)));
        layout = {
            center: [box.left + width / 2, box.top + height - below],
            radius: [Math.round(outer * hole), Math.round(outer)]
        };
        totalSize = Math.max(14, Math.min(22, outer * hole * 0.36));
    } else {
        const outer = outside ? (half ? 80 : 64) : half ? 96 : 84;
        layout = {
            ...box,
            center: half ? ["50%", "88%"] : ["50%", "50%"],
            radius: [`${Math.round(outer * hole)}%`, `${outer}%`]
        };
        if (size.width > 0) {
            const inner =
                (Math.min(size.width - box.left - box.right, size.height - box.top - box.bottom) / 2) *
                (outer / 100) *
                hole;
            totalSize = Math.max(14, Math.min(26, inner * 0.36));
        }
    }

    const labelText = (name: string, value: number): string => {
        switch (settings.labelContent) {
            case "namePercent":
                return `{name|${name}}\n{value|${share(value)}}`;
            case "nameValue":
                return `{name|${name}}\n{value|${formatNumber(value)}}`;
            case "percent":
                return `{value|${share(value)}}`;
            case "value":
                return `{value|${formatNumber(value)}}`;
            case "name":
                return `{name|${name}}`;
        }
    };
    const inside = settings.labelPosition === "inside";
    const label =
        settings.labelPosition === "hidden"
            ? { show: false }
            : {
                  show: true,
                  position: inside ? "inside" : "outside",
                  overflow: "none",
                  formatter: (params: { name: string; value: number }) =>
                      labelText(params.name.replace(/[{}|]/g, ""), params.value),
                  rich: {
                      name: { color: inside ? "#FFFFFF" : tokens.label, fontSize: 11, lineHeight: 15 },
                      value: {
                          color: inside ? "#FFFFFF" : tokens.text,
                          fontFamily: figures,
                          fontSize: 12,
                          fontWeight: 600,
                          lineHeight: 16
                      }
                  },
                  ...(inside ? { textShadowColor: "rgba(0,0,0,0.25)", textShadowBlur: 2 } : {})
              };

    const data = items.map((item, i) => ({
        name: item.name,
        value: item.value,
        hcTooltip: item.tooltip,
        itemStyle: { color: colors[i], ...glowStyle(colors[i], tokens, style), shadowOffsetY: 3 }
    }));

    const series: Array<Record<string, unknown>> = [
        {
            type: "pie",
            name: settings.title ?? "",
            ...layout,
            ...angles,
            roseType: settings.rose === "off" ? undefined : settings.rose,
            avoidLabelOverlap: true,
            padAngle: 0,
            itemStyle: {
                borderColor: tokens.surface,
                borderWidth: Math.max(0, settings.sliceGap),
                borderRadius: Math.max(0, settings.cornerRadius)
            },
            label,
            labelLine: {
                show: settings.labelPosition === "outside",
                length: 8,
                length2: 12,
                smooth: 0.2,
                lineStyle: { color: tokens.grid, width: 1 }
            },
            labelLayout: { hideOverlap: true },
            emphasis: { scale: true, scaleSize: 4, label: { show: settings.labelPosition !== "hidden" } },
            data
        }
    ];

    if (hole > 0 && settings.centerContent === "total" && items.length > 0) {
        // A silent, invisible ring inside the hole whose centre label shows the total. It shares the pie's layout
        // box, so it stays centred wherever the legend goes.
        series.push({
            type: "pie",
            name: "",
            ...layout,
            radius: [0, (layout.radius as Array<string | number>)[0]],
            ...angles,
            silent: true,
            tooltip: { show: false },
            emphasis: { disabled: true },
            label: {
                show: true,
                position: "center",
                formatter: settings.centerCaption
                    ? `{total|${formatNumber(total)}}\n{caption|${settings.centerCaption.replace(/[{}|]/g, "")}}`
                    : `{total|${formatNumber(total)}}`,
                rich: {
                    total: {
                        color: tokens.text,
                        fontFamily: figures,
                        fontSize: Math.round(totalSize),
                        fontWeight: 600,
                        lineHeight: Math.round(totalSize * 1.3)
                    },
                    caption: { color: tokens.label, fontSize: 11, lineHeight: 16 }
                }
            },
            labelLine: { show: false },
            itemStyle: { color: "rgba(0,0,0,0)", borderWidth: 0 },
            data: [{ name: "", value: 1 }]
        });
    }

    const tooltipFormatter = createTooltipFormatter({
        tokens,
        style,
        formatValue: value => `${formatNumber(value)} · ${share(value)}`,
        headerOf: () => "",
        nameOf: param => param.name ?? "",
        colorOf: param => (param.seriesIndex === 0 ? colors[items.findIndex(i => i.name === param.name)] : undefined)
    });

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        legend: legend.option,
        tooltip: tooltipOption(tokens, style, "item", tooltipFormatter),
        series
    };

    return {
        option,
        clickTargets: [items.map(item => item.target)],
        breadcrumb: level.breadcrumb,
        table: {
            columns: ["Category", "Value", "Share"],
            rows: items.map(item => [item.name, formatNumber(item.value), share(item.value)])
        },
        pointCount: items.length
    };
}

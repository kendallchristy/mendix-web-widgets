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

// The label line's first part, out from the slice, for labels beside the pie. Labels above and below get a longer
// one, so they clear the pie's edge.
const LINE_OUT = 8;
// The label line's second part across, the gap to the text and the margin at the edge of the chart.
const LINE_ACROSS = 12 + 5 + 4 + 2;
// The share of its largest radius the pie keeps however wide its names are.
const SMALLEST_PIE = 0.4;
// Narrower than this, names make way for the legend.
const NARROWEST_NAME = 32;

interface OutsideLabel {
    /** Where the label sits around the pie, as the cosine and sine of its slice's middle. */
    cos: number;
    sin: number;
    /** Its estimated width in pixels. */
    width: number;
    /** The length of the first part of its label line. */
    out: number;
}

/** Where each outside label goes around the pie, and roughly how wide it is. */
function outsideLabels(
    items: Array<{ name: string; value: number }>,
    settings: PieSettings,
    content: PieSettings["labelContent"],
    labelHeight: number,
    share: (value: number) => string,
    formatNumber: (value: number) => string
): OutsideLabel[] {
    const total = items.reduce((sum, item) => sum + item.value, 0);
    const half = settings.shape === "halfDonut";
    const start = half ? 180 : settings.startAngle;
    const sweep = half ? 180 : 360;
    const value = (v: number): string =>
        content === "percent" || content === "namePercent" ? share(v) : formatNumber(v);
    let before = 0;
    return items.map(item => {
        // An area rose gives every slice the same angle.
        const part = settings.rose === "area" ? 1 / items.length : total > 0 ? item.value / total : 0;
        const middle = ((start - (before + part / 2) * sweep) * Math.PI) / 180;
        before += part;
        const name = LABEL_NAMES.has(content) ? item.name.replace(/[{}|]/g, "").length * 6.2 : 0;
        const figures = content === "name" ? 0 : value(item.value).length * 7.4;
        const sin = Math.sin(middle);
        // A label is centred on the end of its line, so straight above or below the pie it needs half its height more.
        const out = Math.round(LINE_OUT + (labelHeight / 2 + 2) * sin * sin);
        return { cos: Math.cos(middle), sin, width: Math.max(name, figures), out };
    });
}

/**
 * The largest outer radius that keeps every label, with its line, inside the chart. Each label only needs room in
 * the direction of its slice, so a wide label at the top costs the pie nothing.
 */
function fitRadius(across: number, up: number, labels: OutsideLabel[], labelHeight: number): number {
    let radius = Math.min(across, up) - 4;
    for (const label of labels) {
        const cos = Math.abs(label.cos);
        const sin = Math.abs(label.sin);
        if (cos > 0.01) {
            radius = Math.min(radius, (across - LINE_ACROSS - label.width) / cos - label.out);
        }
        if (sin > 0.01) {
            radius = Math.min(radius, (up - labelHeight / 2 - 4) / sin - label.out);
        }
    }
    return radius;
}

/** Whether a pie of the smallest size still leaves every name at least a few characters. */
function namesFit(across: number, up: number, labels: OutsideLabel[]): boolean {
    const radius = Math.min(across, up) * SMALLEST_PIE;
    return labels.every(
        label =>
            across - LINE_ACROSS - (radius + label.out) * Math.abs(label.cos) >= Math.min(NARROWEST_NAME, label.width)
    );
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

    const outside = settings.labelPosition === "outside";
    // When a chart is too narrow for names beside the pie, the automatic legend names the slices and the labels keep
    // only the share or value.
    const cramped =
        outside &&
        style.legend === "auto" &&
        size.width > 0 &&
        LABEL_NAMES.has(settings.labelContent) &&
        !namesFit(
            (size.width - 16) / 2,
            settings.shape === "halfDonut" ? size.height - 40 : (size.height - 16) / 2,
            outsideLabels(items, settings, "name", 16, share, formatNumber)
        );
    const content: PieSettings["labelContent"] = !cramped
        ? settings.labelContent
        : settings.labelContent === "nameValue"
          ? "value"
          : "percent";
    const labelsName = settings.labelPosition !== "hidden" && LABEL_NAMES.has(content);
    const placement =
        style.legend === "auto" ? (labelsName || items.length < 2 ? "hidden" : "bottom") : legendPlacement(style, 2);
    const names = items.map(item => item.name);
    const legend = wrappingLegend(placement, names, size.width);
    const box = layoutBox(placement, legend.height);

    const half = settings.shape === "halfDonut";
    const holeSize = settings.shape === "pie" ? 0 : Math.max(0, settings.innerRadius);
    const pixelHole = settings.holeUnit === "pixels";
    const hasHole = holeSize > 0;
    // The hole's radius in pixels for a pie of the given outer radius in pixels.
    const holeOf = (outer: number): number =>
        pixelHole ? Math.min(holeSize, Math.max(0, outer - 4)) : (outer * Math.min(90, holeSize)) / 100;
    const angles = half ? { startAngle: 180, endAngle: 360 } : { startAngle: settings.startAngle };
    const labelHeight = content === "namePercent" || content === "nameValue" ? 31 : 16;
    const labels = outside ? outsideLabels(items, settings, content, labelHeight, share, formatNumber) : [];
    // Names only shrink the pie so far; ECharts cuts the ones that still don't fit short with an ellipsis. Shares and
    // values are short, so they always get their room.
    const fit = (across: number, up: number): number =>
        Math.max(
            10,
            fitRadius(across, up, labels, labelHeight),
            labelsName && outside ? Math.min(across, up) * SMALLEST_PIE : 0
        );
    let layout: Record<string, unknown>;
    let totalSize = 22;
    let showCaption = Boolean(settings.centerCaption);
    if (size.width > 0) {
        // Sized from the chart's measured size, so outside labels get the room they need on every side and a hole
        // in pixels stays the same size however big the chart gets.
        const width = size.width - box.left - box.right;
        const height = size.height - box.top - box.bottom;
        let outer: number;
        let center: number[];
        if (half) {
            // Room under the flat edge for the centre total, or for the labels at the ends.
            const below = Math.max(
                hasHole && settings.centerContent === "total" ? 22 : 2,
                outside ? labelHeight / 2 + 2 : 0
            );
            outer = fit(width / 2, height - below);
            center = [width / 2, height - below];
        } else {
            outer = fit(width / 2, height / 2);
            center = [width / 2, height / 2];
        }
        const inner = holeOf(outer);
        // ECharts places a centre in pixels from the top left of the layout box.
        layout = { ...box, center, radius: [Math.round(inner), Math.round(outer)] };
        // The total fits across the hole, and the caption shows only when there is room for it under the total.
        const across = (2 * inner - 8) / (formatNumber(total).length * 0.62);
        totalSize = Math.max(10, Math.min(half ? 22 : 26, inner * 0.36, across));
        showCaption &&= inner >= 30;
    } else {
        const outer = outside ? (half ? 80 : 64) : half ? 96 : 84;
        const inner = pixelHole ? holeSize : `${Math.round((outer * Math.min(90, holeSize)) / 100)}%`;
        layout = {
            ...box,
            center: half ? ["50%", "88%"] : ["50%", "50%"],
            radius: [inner, `${outer}%`]
        };
    }

    const labelText = (name: string, value: number): string => {
        switch (content) {
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
                  // Outside, ECharts cuts labels that don't fit beside the pie short with an ellipsis.
                  overflow: inside ? "none" : "truncate",
                  bleedMargin: 4,
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
        itemStyle: { color: colors[i], ...glowStyle(colors[i], tokens, style), shadowOffsetY: 3 },
        ...(outside ? { labelLine: { length: labels[i].out } } : {})
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

    if (hasHole && settings.centerContent === "total" && items.length > 0) {
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
                formatter: showCaption
                    ? `{total|${formatNumber(total)}}\n{caption|${settings.centerCaption!.replace(/[{}|]/g, "")}}`
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

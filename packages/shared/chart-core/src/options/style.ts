import type { ChartTokens } from "../theme/tokens";
import { withAlpha } from "../theme/tokens";

/** The Chart style properties every chart widget shares. Widgets ignore the ones that don't apply to them. */
export interface ChartStyle {
    lineCurve: "straight" | "smooth" | "step";
    lineWidth: number;
    areaFill: "none" | "solid" | "gradient";
    glow: "off" | "soft";
    markers: "never" | "hover" | "highlighted" | "always";
    valueLabels: "off" | "plain" | "darkPill" | "lightPill";
    valueLabelPoints: "all" | "highlightEnds" | "last";
    barStyle: "solid" | "striped" | "dots";
    barRadius: number;
    /** Percent of the category width. */
    barWidth: number;
    gridlines: "none" | "vertical" | "horizontal" | "both";
    legend: "auto" | "top" | "bottom" | "right" | "hidden";
    tooltip: "card" | "pill" | "off";
    hoverGuide: "none" | "line" | "band";
    figuresFont: "mono" | "text";
    animation: boolean;
    animationDuration: number;
    background: "transparent" | "surface";
}

export const defaultChartStyle: ChartStyle = {
    lineCurve: "smooth",
    lineWidth: 2.5,
    areaFill: "gradient",
    glow: "soft",
    markers: "highlighted",
    valueLabels: "darkPill",
    valueLabelPoints: "highlightEnds",
    barStyle: "solid",
    barRadius: 4,
    barWidth: 60,
    gridlines: "vertical",
    legend: "auto",
    tooltip: "card",
    hoverGuide: "line",
    figuresFont: "mono",
    animation: true,
    animationDuration: 600,
    background: "transparent"
};

export function figuresFontFamily(tokens: ChartTokens, style: ChartStyle): string {
    return style.figuresFont === "mono" ? tokens.figuresFont : tokens.fontFamily;
}

/** A vertical gradient from the series colour to transparent, as ECharts expects it. */
export function verticalGradient(color: string, topAlpha: number, bottomAlpha = 0): Record<string, unknown> {
    return {
        type: "linear",
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
            { offset: 0, color: withAlpha(color, topAlpha) },
            { offset: 1, color: withAlpha(color, bottomAlpha) }
        ]
    };
}

export function areaStyle(color: string, tokens: ChartTokens, style: ChartStyle): Record<string, unknown> | undefined {
    switch (style.areaFill) {
        case "none":
            return undefined;
        case "solid":
            return { color: withAlpha(color, tokens.glowOpacity), opacity: 1 };
        case "gradient":
            return { color: verticalGradient(color, tokens.glowOpacity + 0.05), opacity: 1 };
    }
}

/** The soft coloured glow under lines, bars and arcs. */
export function glowStyle(color: string, tokens: ChartTokens, style: ChartStyle): Record<string, unknown> {
    if (style.glow === "off") {
        return {};
    }
    return { shadowBlur: 14, shadowColor: withAlpha(color, tokens.glowOpacity + 0.15), shadowOffsetY: 6 };
}

/** Value labels: plain text or a rounded pill, always in the figures font. */
export function valueLabelStyle(
    tokens: ChartTokens,
    style: ChartStyle,
    formatter: (value: number) => string
): Record<string, unknown> {
    const base = {
        show: true,
        fontFamily: figuresFontFamily(tokens, style),
        fontSize: 11,
        formatter: (params: { value: unknown; data?: unknown }) => formatter(labelValue(params.value)),
        distance: 10
    };
    switch (style.valueLabels) {
        case "off":
            return { show: false };
        case "plain":
            return { ...base, color: tokens.text };
        case "darkPill":
            return {
                ...base,
                color: tokens.pillText,
                backgroundColor: tokens.pillBackground,
                borderRadius: 999,
                padding: [5, 9]
            };
        case "lightPill":
            return {
                ...base,
                color: tokens.lightPillText,
                backgroundColor: tokens.lightPillBackground,
                borderRadius: 999,
                padding: [5, 9],
                shadowBlur: 10,
                shadowColor: "rgba(16, 24, 40, 0.16)",
                shadowOffsetY: 2
            };
    }
}

/** ECharts hands labels either a number or an [x, y] pair. */
function labelValue(value: unknown): number {
    if (Array.isArray(value)) {
        return Number(value[1]);
    }
    return Number(value);
}

export type LegendPlacement = Exclude<ChartStyle["legend"], "auto">;

export function legendPlacement(style: ChartStyle, seriesCount: number): LegendPlacement {
    if (style.legend === "auto") {
        return seriesCount > 1 ? "top" : "hidden";
    }
    return style.legend;
}

export function legendOption(placement: LegendPlacement, hasTitle: boolean): Record<string, unknown> {
    switch (placement) {
        case "hidden":
            return { show: false };
        case "top":
            return { show: true, type: "scroll", top: hasTitle ? 52 : 0, left: 0 };
        case "bottom":
            return { show: true, type: "scroll", bottom: 0, left: 0 };
        case "right":
            return { show: true, type: "scroll", orient: "vertical", right: 0, top: "middle" };
    }
}

export function titleOption(
    title: string | undefined,
    subtitle: string | undefined,
    align: "left" | "center"
): Record<string, unknown> | undefined {
    if (!title && !subtitle) {
        return undefined;
    }
    return {
        show: true,
        text: title ?? "",
        subtext: subtitle ?? "",
        left: align === "center" ? "center" : 0,
        top: 0,
        padding: 0,
        itemGap: 6
    };
}

/** Space around the plot, leaving room for the title and legend. */
export function gridOption(
    placement: LegendPlacement,
    hasTitle: boolean,
    hasSubtitle: boolean
): Record<string, unknown> {
    const titleSpace = hasTitle ? (hasSubtitle ? 52 : 34) : 0;
    const legendTop = placement === "top" ? 28 : 0;
    return {
        top: titleSpace + legendTop + 12,
        bottom: placement === "bottom" ? 36 : 8,
        left: 8,
        right: placement === "right" ? 120 : 16,
        containLabel: true
    };
}

export function surfaceBackground(tokens: ChartTokens, style: ChartStyle): string {
    return style.background === "surface" ? tokens.surface : "transparent";
}

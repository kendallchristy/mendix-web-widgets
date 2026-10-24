import { deepMerge, isPlainObject } from "../options/merge";
import type { ChartTokens } from "./tokens";

export type EChartsTheme = Record<string, unknown>;

function axisTheme(tokens: ChartTokens): EChartsTheme {
    return {
        axisLine: { show: false, lineStyle: { color: tokens.grid } },
        axisTick: { show: false },
        axisLabel: { color: tokens.label, fontFamily: tokens.figuresFont, fontSize: 12 },
        nameTextStyle: { color: tokens.label, fontFamily: tokens.fontFamily, fontSize: 12 },
        splitLine: { lineStyle: { color: tokens.grid, width: 1 } },
        splitArea: { show: false }
    };
}

/**
 * The Hyper look as an ECharts theme. The shape matches what the ECharts theme builder exports, so a custom theme
 * pasted into Studio Pro merges over it key by key.
 */
export function buildHyperTheme(tokens: ChartTokens): EChartsTheme {
    const axis = axisTheme(tokens);
    return {
        color: tokens.palette,
        backgroundColor: "transparent",
        textStyle: { fontFamily: tokens.fontFamily, color: tokens.label },
        title: {
            textStyle: { color: tokens.text, fontFamily: tokens.fontFamily, fontSize: 17, fontWeight: 700 },
            subtextStyle: { color: tokens.label, fontFamily: tokens.fontFamily, fontSize: 12 }
        },
        legend: {
            icon: "circle",
            itemWidth: 8,
            itemHeight: 8,
            itemGap: 16,
            textStyle: { color: tokens.label, fontFamily: tokens.fontFamily, fontSize: 12 },
            inactiveColor: tokens.muted
        },
        tooltip: {
            backgroundColor: tokens.tooltipBackground,
            borderColor: tokens.tooltipBorder,
            borderWidth: 1,
            padding: [10, 12],
            textStyle: { color: tokens.tooltipText, fontFamily: tokens.fontFamily, fontSize: 12 },
            extraCssText: "border-radius: 10px; box-shadow: 0 8px 24px rgba(16, 24, 40, 0.12);",
            axisPointer: {
                lineStyle: { color: tokens.label, width: 1, type: "dashed" },
                crossStyle: { color: tokens.label },
                shadowStyle: { color: tokens.grid }
            }
        },
        categoryAxis: axis,
        valueAxis: axis,
        timeAxis: axis,
        logAxis: axis,
        line: { smooth: true, symbol: "circle", symbolSize: 8, lineStyle: { width: 2.5 } },
        bar: { itemStyle: { borderRadius: 4 } },
        candlestick: {
            itemStyle: {
                color: tokens.up,
                color0: tokens.down,
                borderColor: tokens.up,
                borderColor0: tokens.down
            }
        },
        dataZoom: {
            backgroundColor: "transparent",
            borderColor: tokens.grid,
            fillerColor: tokens.grid,
            handleStyle: { color: tokens.surface, borderColor: tokens.label },
            textStyle: { color: tokens.label, fontFamily: tokens.figuresFont }
        }
    };
}

/** Pulls the series colours out of a custom theme, so gradients and glows use them too. */
export function themePalette(theme: unknown): string[] | undefined {
    if (!isPlainObject(theme)) {
        return undefined;
    }
    const color = theme.color;
    return Array.isArray(color) && color.every(c => typeof c === "string") && color.length > 0
        ? (color as string[])
        : undefined;
}

/** The theme a chart is initialised with: Hyper, with a custom theme (if any) merged over it. */
export function buildTheme(tokens: ChartTokens, customTheme?: EChartsTheme): EChartsTheme {
    const theme = buildHyperTheme(tokens);
    if (!customTheme) {
        return theme;
    }
    // The palette in the tokens already accounts for the custom theme, the CSS tokens and the Palette property.
    return { ...deepMerge(theme, customTheme), color: tokens.palette };
}

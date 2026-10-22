import type { ChartTokens } from "../theme/tokens";
import type { ChartStyle } from "./style";
import { figuresFontFamily } from "./style";

export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

/** What a data item can carry for its tooltip, beside its value. */
export interface TooltipData {
    /** Text from the series' Tooltip text template; replaces the default row for this point. */
    hcTooltip?: string;
}

export interface TooltipParam {
    seriesIndex?: number;
    seriesName?: string;
    name?: string;
    color?: unknown;
    value?: unknown;
    data?: unknown;
    axisValueLabel?: string;
    marker?: string;
}

export interface TooltipFormatterOptions {
    tokens: ChartTokens;
    style: ChartStyle;
    formatValue: (value: number) => string;
    /** Picks the number to show from a point's value, for example y from an [x, y] pair. */
    pickValue?: (value: unknown) => number | undefined;
    /** Header for item tooltips, when there's no axis label. */
    headerOf?: (param: TooltipParam) => string;
    /** The swatch colour for a row; defaults to the colour ECharts reports, which can be a gradient object. */
    colorOf?: (param: TooltipParam) => string | undefined;
}

const defaultPickValue = (value: unknown): number | undefined => {
    const n = Array.isArray(value) ? Number(value[value.length - 1]) : Number(value);
    return Number.isFinite(n) ? n : undefined;
};

function swatch(color: unknown, fallback: string): string {
    const css = typeof color === "string" ? color : fallback;
    return `<span class="hc-tooltip__swatch" style="background:${escapeHtml(css)}"></span>`;
}

/**
 * Builds the tooltip HTML. Card shows a header and a row per series; pill shows just the values in a dark pill.
 * Everything that came from data is escaped.
 */
export function createTooltipFormatter(
    options: TooltipFormatterOptions
): (params: TooltipParam | TooltipParam[]) => string {
    const { tokens, style, formatValue } = options;
    const pickValue = options.pickValue ?? defaultPickValue;
    const figures = escapeHtml(figuresFontFamily(tokens, style));

    return input => {
        const params = (Array.isArray(input) ? input : [input]).filter(
            p => p.seriesName !== undefined || p.value !== undefined
        );
        if (params.length === 0) {
            return "";
        }
        const first = params[0];
        const header = first.axisValueLabel ?? options.headerOf?.(first) ?? first.name ?? "";

        const rows = params.map(p => {
            const custom = (p.data as TooltipData | undefined)?.hcTooltip;
            const value = pickValue(p.value);
            const formatted = value === undefined ? "" : formatValue(value);
            if (style.tooltip === "pill") {
                return `<span class="hc-tooltip__pill-value" style="font-family:${figures}">${escapeHtml(custom ?? formatted)}</span>`;
            }
            if (custom) {
                return `<div class="hc-tooltip__row hc-tooltip__row--custom">${swatch(options.colorOf?.(p) ?? p.color, tokens.palette[0])}<span>${escapeHtml(custom)}</span></div>`;
            }
            return (
                `<div class="hc-tooltip__row">${swatch(options.colorOf?.(p) ?? p.color, tokens.palette[0])}` +
                `<span class="hc-tooltip__name">${escapeHtml(p.seriesName ?? "")}</span>` +
                `<span class="hc-tooltip__value" style="font-family:${figures}">${escapeHtml(formatted)}</span></div>`
            );
        });

        if (style.tooltip === "pill") {
            return `<div class="hc-tooltip hc-tooltip--pill">${rows.join("")}</div>`;
        }
        const head = header
            ? `<div class="hc-tooltip__header" style="font-family:${figures}">${escapeHtml(header)}</div>`
            : "";
        return `<div class="hc-tooltip">${head}${rows.join("")}</div>`;
    };
}

/** The ECharts tooltip option for a style. */
export function tooltipOption(
    tokens: ChartTokens,
    style: ChartStyle,
    trigger: "axis" | "item",
    formatter: (params: TooltipParam | TooltipParam[]) => string
): Record<string, unknown> {
    if (style.tooltip === "off") {
        return { show: false };
    }
    const pill =
        style.tooltip === "pill"
            ? {
                  backgroundColor: tokens.pillBackground,
                  borderWidth: 0,
                  padding: [5, 10],
                  extraCssText: "border-radius: 999px; box-shadow: none;",
                  textStyle: { color: tokens.pillText }
              }
            : {};
    return {
        show: true,
        trigger,
        confine: true,
        className: "hc-tooltip-container",
        formatter,
        axisPointer: {
            type: style.hoverGuide === "band" ? "shadow" : style.hoverGuide === "line" ? "line" : "none"
        },
        ...pill
    };
}

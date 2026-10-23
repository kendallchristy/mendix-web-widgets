import type { BuiltChart, ChartTokens, ElementSize } from "@kendallchristy/chart-core";
import {
    baseOption,
    createNumberFormatter,
    createPercentFormatter,
    escapeHtml,
    figuresFontFamily,
    fitArc,
    glowStyle,
    tooltipOption,
    withAlpha
} from "@kendallchristy/chart-core";

import type { GaugeBand, GaugeSettings } from "./types";

const ANGLES: Record<GaugeSettings["shape"], { start: number; sweep: number }> = {
    arc: { start: 210, sweep: 240 },
    half: { start: 180, sweep: 180 },
    ring: { start: 90, sweep: 360 }
};

// End labels: 10 px figures, about this wide per character.
const RANGE_CHAR = 6.2;

interface Block {
    /** Half the width of the value and caption, in pixels. */
    half: number;
    /** How far their bottom is below the centre, in pixels. */
    bottom: number;
}

/**
 * Where the minimum and maximum labels go, from the centre in pixels. On an arc or half circle they sit under the
 * ends, so a wide arc never covers them, and drop below the value if they would run into it. On a ring, where both
 * ends meet at the top, they sit either side of the seam, above the ring.
 */
function rangeLabels(
    shape: GaugeSettings["shape"],
    radius: number,
    width: number,
    roundCaps: boolean,
    texts: [string, string],
    avoid: Block
): Array<{ text: string; x: number; y: number }> {
    const half = texts.map(text => (text.length * RANGE_CHAR) / 2);
    if (shape === "ring") {
        const y = -radius - 9;
        return [
            { text: texts[0], x: half[0] + 4, y },
            { text: texts[1], x: -half[1] - 4, y }
        ];
    }
    // The middle of each end, kept from running past the side of the gauge.
    const across = (shape === "arc" ? Math.cos(Math.PI / 6) : 1) * (radius - width / 2);
    // An arc's ends dip below the centre; round caps bulge past the ends.
    const bottom = shape === "arc" ? radius * 0.5 + (roundCaps ? width / 4 : 0) : roundCaps ? width / 2 : 0;
    return texts.map((text, i) => {
        const x = Math.min(across, radius - half[i]);
        const clear = x - half[i] >= avoid.half + 6;
        const y = clear ? bottom + 11 : Math.max(bottom + 11, avoid.bottom + 9);
        return { text, x: i === 0 ? -x : x, y };
    });
}

/** The band a value falls in: each band runs from the previous band's end, the first from the minimum. */
export function bandOf(value: number, bands: GaugeBand[]): GaugeBand | undefined {
    return [...bands].sort((a, b) => a.to - b.to).find(band => value <= band.to);
}

export function buildGauge(
    settings: GaugeSettings,
    tokens: ChartTokens,
    _path: unknown[],
    size: ElementSize = { width: 0, height: 0 },
    locale?: string
): BuiltChart<never> {
    const { style } = settings;
    const formatNumber = createNumberFormatter({ ...settings.numberFormat, locale });
    const formatPercent = createPercentFormatter(settings.percentDecimals, locale);
    const min = settings.min;
    const max = settings.max > min ? settings.max : min + 1;
    const fraction = (value: number): number => Math.min(1, Math.max(0, (value - min) / (max - min)));
    const format = (value: number): string =>
        settings.showAsPercent ? formatPercent((value - min) / (max - min)) : formatNumber(value);
    const figures = figuresFontFamily(tokens, style);

    const value = settings.value;
    const bands = [...settings.bands].filter(b => Number.isFinite(b.to)).sort((a, b) => a.to - b.to);
    const band = value === undefined ? undefined : bandOf(value, bands);
    const color = settings.colorMode === "band" && band ? band.color : tokens.palette[0];
    const track = withAlpha(tokens.muted, tokens.mode === "dark" ? 0.35 : 0.45);

    const { start, sweep } = ANGLES[settings.shape];
    const width = Math.max(1, settings.arcWidth);
    const top = 8;
    const caption = settings.caption && settings.showValue ? 18 : 0;
    const needle = settings.indicator !== "progress";
    const ring = settings.shape === "ring";
    // A half circle's value sits on its flat edge, so it needs room below the centre.
    const below = settings.shape === "half" && settings.showValue ? settings.valueSize * 0.5 + caption : 0;
    // The value sits in the middle, below the needle's pivot, or just above a half circle's flat edge.
    const valueOffsetAt = (r: number): number =>
        settings.shape === "half" ? -settings.valueSize * 0.2 : needle ? Math.round(r * 0.38) : 0;
    const valueText = settings.showValue && value !== undefined ? format(value) : "";
    const blockAt = (r: number): Block =>
        settings.showValue
            ? {
                  half: Math.max(
                      valueText.length * settings.valueSize * 0.31,
                      caption ? (settings.caption ?? "").length * 3.3 : 0
                  ),
                  bottom: valueOffsetAt(r) + (caption ? settings.valueSize * 0.75 + 9 : settings.valueSize * 0.6)
              }
            : { half: 0, bottom: -Infinity };
    const range: [string, string] = [format(min), format(max)];
    const endsAt = (r: number): ReturnType<typeof rangeLabels> =>
        settings.showRange ? rangeLabels(settings.shape, r, width, settings.roundCaps, range, blockAt(r)) : [];
    // How far below the centre anything reaches: the value under a needle, or the end labels.
    const extentBelow = (r: number): number =>
        Math.max(
            needle && !ring && settings.shape !== "half" && settings.showValue ? blockAt(r).bottom : 0,
            ...endsAt(r)
                .filter(() => !ring)
                .map(end => end.y + 7)
        );
    // A ring's end labels sit above it.
    const above = settings.showRange && ring ? 16 : 0;
    let layout: Record<string, unknown>;
    let radius = 0;
    if (size.width > 0) {
        const height = size.height - top - 8 - above;
        let room = height - below;
        let fit = fitArc(start, sweep, 0, size.width - 16, room, 0);
        for (let i = 0; i < 3; i++) {
            const overflow = fit.y + extentBelow(fit.radius) - height;
            if (overflow <= 0.5) {
                break;
            }
            room -= overflow;
            fit = fitArc(start, sweep, 0, size.width - 16, room, 0);
        }
        radius = fit.radius;
        layout = { center: [8 + fit.x, top + above + fit.y], radius: Math.round(radius) };
    } else {
        layout = { center: ["50%", settings.shape === "half" ? "75%" : "55%"], radius: "75%" };
    }

    // Bands colour the track; the rest of it stays muted.
    const trackColors: Array<[number, string]> =
        bands.length > 0
            ? [
                  ...bands
                      .filter(b => b.to > min)
                      .map((b): [number, string] => [
                          fraction(b.to),
                          settings.indicator === "needle" ? b.color : withAlpha(b.color, 0.28)
                      ]),
                  [1, track]
              ]
            : [[1, track]];

    const valueOffset = valueOffsetAt(radius || 80);
    const shared = { type: "gauge", ...layout, startAngle: start, endAngle: start - sweep, min, max };
    const series: Array<Record<string, unknown>> = [
        {
            ...shared,
            name: settings.title ?? "",
            splitNumber: settings.showTicks ? 10 : 1,
            // Round caps would round every band's ends, so only a plain track gets them.
            axisLine: { roundCap: settings.roundCaps && bands.length === 0, lineStyle: { width, color: trackColors } },
            progress: {
                show: settings.indicator !== "needle",
                width,
                roundCap: settings.roundCaps,
                itemStyle: { color, ...glowStyle(color, tokens, style), shadowOffsetY: 2 }
            },
            pointer: {
                show: needle,
                length: "62%",
                width: 4,
                offsetCenter: [0, 0],
                itemStyle: { color: tokens.text }
            },
            anchor: {
                show: needle,
                size: 12,
                showAbove: true,
                itemStyle: { color: tokens.surface, borderColor: tokens.text, borderWidth: 3 }
            },
            axisTick: {
                show: settings.showTicks,
                distance: -width - 6,
                length: 4,
                lineStyle: { color: tokens.label, width: 1 }
            },
            splitLine: {
                show: settings.showTicks,
                distance: -width - 6,
                length: 8,
                lineStyle: { color: tokens.label, width: 1.5 }
            },
            // The minimum and maximum are drawn by their own series, where they can't collide.
            axisLabel: { show: false },
            title: {
                show: Boolean(settings.caption) && settings.showValue,
                offsetCenter: [0, valueOffset + settings.valueSize * (settings.shape === "half" ? 0.7 : 0.75)],
                color: tokens.label,
                fontSize: 12
            },
            detail: {
                show: settings.showValue,
                valueAnimation: style.animation,
                offsetCenter: [0, valueOffset],
                formatter: (v: number) => format(v),
                color: tokens.text,
                fontFamily: figures,
                fontSize: settings.valueSize,
                fontWeight: 600
            },
            data: value === undefined ? [] : [{ value, name: settings.caption ?? "" }]
        }
    ];

    if (settings.target !== undefined && value !== undefined) {
        // The target: a short bar across the arc, drawn as the pointer of an otherwise empty gauge on top.
        const length = width + 8;
        series.push({
            ...shared,
            name: "target",
            silent: true,
            tooltip: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            progress: { show: false },
            anchor: { show: false },
            title: { show: false },
            detail: { show: false },
            pointer: {
                show: true,
                icon: "rect",
                width: 3,
                length: radius > 0 ? length : "14%",
                offsetCenter: [0, radius > 0 ? -(radius - width / 2 - length / 2) : "-80%"],
                itemStyle: { color: tokens.text }
            },
            data: [{ value: Math.min(max, Math.max(min, settings.target)) }]
        });
    }

    if (settings.showRange) {
        // Two invisible pointers whose titles are the minimum and maximum, placed clear of the arc.
        const ends = endsAt(radius || 80);
        series.push({
            ...shared,
            name: "range",
            silent: true,
            tooltip: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            progress: { show: false },
            pointer: { show: false },
            anchor: { show: false },
            detail: { show: false },
            title: { show: true, color: tokens.label, fontFamily: figures, fontSize: 10 },
            data: ends.map(end => ({
                value: min,
                name: end.text,
                title: { offsetCenter: [Math.round(end.x), Math.round(end.y)] }
            }))
        });
    }

    const rows: Array<[string, string]> = [];
    if (value !== undefined) {
        rows.push(["Value", format(value)]);
    }
    if (settings.target !== undefined) {
        rows.push(["Target", format(settings.target)]);
    }
    if (band?.label) {
        rows.push(["Band", band.label]);
    }
    const tooltipFormatter = (): string => {
        if (settings.tooltip) {
            return `<div class="hc-tooltip"><div class="hc-tooltip__row hc-tooltip__row--custom"><span>${escapeHtml(settings.tooltip)}</span></div></div>`;
        }
        const head = settings.caption ? `<div class="hc-tooltip__header">${escapeHtml(settings.caption)}</div>` : "";
        const body = rows
            .map(
                ([name, text]) =>
                    `<div class="hc-tooltip__row"><span class="hc-tooltip__name">${escapeHtml(name)}</span>` +
                    `<span class="hc-tooltip__value" style="font-family:${escapeHtml(figures)}">${escapeHtml(text)}</span></div>`
            )
            .join("");
        return `<div class="hc-tooltip">${head}${body}</div>`;
    };

    const option: Record<string, unknown> = {
        ...baseOption(tokens, style),
        tooltip: tooltipOption(tokens, style, "item", tooltipFormatter),
        series
    };

    return {
        option,
        clickTargets: [[{ action: settings.action }]],
        breadcrumb: [],
        table: {
            columns: ["Measure", "Value"],
            rows: [...rows, ["Minimum", format(min)], ["Maximum", format(max)]]
        },
        pointCount: value === undefined ? 0 : 1
    };
}

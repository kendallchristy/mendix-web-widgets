import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef } from "react";

import type { EChartsCoreOption, EChartsType } from "../echarts";
import { echarts } from "../echarts";
import type { EChartsTheme } from "../theme/echartsTheme";

/** What ECharts passes to a click handler; `data` is the data item as the widget built it. */
export interface ChartClickEvent {
    componentType: string;
    seriesIndex?: number;
    seriesName?: string;
    dataIndex: number;
    name: string;
    value: unknown;
    data: unknown;
}

export interface EChartProps {
    option: EChartsCoreOption;
    theme: EChartsTheme;
    renderer: "canvas" | "svg";
    className?: string;
    style?: CSSProperties;
    onClick?: (event: ChartClickEvent) => void;
    /** Called once the chart has drawn for the first time. */
    onRendered?: () => void;
    /** Called with ECharts' message when an option can't be drawn, and with undefined once one is drawn. */
    onError?: (message: string | undefined, option: EChartsCoreOption) => void;
}

// replaceMerge drops series and axes that are gone (after a drilldown, say) while still animating the ones that stay.
const UPDATE = { replaceMerge: ["series", "xAxis", "yAxis", "visualMap", "dataZoom"] };

/**
 * Renders an ECharts option. The chart is created once per renderer; theme and option changes are applied to the
 * live chart, so toggling dark mode or new data never rebuilds it.
 *
 * ECharts can fail part way through merging an update into what it drew before, and a chart that failed ignores
 * every later update. So a failed update starts a fresh chart that draws the option from scratch, and only an
 * option that fails even then is reported.
 */
export function EChart(props: EChartProps): ReactElement {
    const { option, theme, renderer, className, style } = props;
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    // The latest props, and what the live chart was last given, so the effects below only push real changes.
    const latestRef = useRef(props);
    const appliedThemeRef = useRef<EChartsTheme | null>(null);
    const appliedOptionRef = useRef<EChartsCoreOption | null>(null);
    const restartRef = useRef<() => void>(() => undefined);

    useEffect(() => {
        latestRef.current = props;
    });

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const start = (): void => {
            chartRef.current?.dispose();
            const latest = latestRef.current;
            const chart = echarts.init(element, latest.theme, { renderer });
            chartRef.current = chart;
            appliedThemeRef.current = latest.theme;
            appliedOptionRef.current = latest.option;
            const rendered = (): void => {
                chart.off("rendered", rendered);
                latestRef.current.onRendered?.();
            };
            chart.on("rendered", rendered);
            chart.on("click", params => latestRef.current.onClick?.(params as ChartClickEvent));
            chart.setOption(latest.option);
        };
        restartRef.current = () => {
            const latest = latestRef.current;
            try {
                start();
                latest.onError?.(undefined, latest.option);
            } catch (e) {
                latest.onError?.(e instanceof Error ? e.message : String(e), latest.option);
            }
        };
        restartRef.current();

        let observer: ResizeObserver | undefined;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(() => chartRef.current?.resize());
            observer.observe(element);
        }
        return () => {
            observer?.disconnect();
            chartRef.current?.dispose();
            chartRef.current = null;
        };
    }, [renderer]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || appliedThemeRef.current === theme) {
            return;
        }
        appliedThemeRef.current = theme;
        try {
            // setTheme redraws the chart from the first option it was given, so the current one goes back on top.
            chart.setTheme(theme);
            appliedOptionRef.current = latestRef.current.option;
            chart.setOption(latestRef.current.option, { notMerge: true });
        } catch {
            restartRef.current();
        }
    }, [theme]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || appliedOptionRef.current === option) {
            return;
        }
        appliedOptionRef.current = option;
        try {
            chart.setOption(option, UPDATE);
            latestRef.current.onError?.(undefined, option);
        } catch {
            restartRef.current();
        }
    }, [option]);

    return <div ref={ref} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}

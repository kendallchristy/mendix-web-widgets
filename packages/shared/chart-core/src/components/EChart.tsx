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
}

/**
 * Renders an ECharts option. The chart is created once per renderer; theme and option changes are applied to the
 * live chart, so toggling dark mode or new data never rebuilds it.
 */
export function EChart({ option, theme, renderer, className, style, onClick }: EChartProps): ReactElement {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    // The latest props for the chart's creation, and what the live chart was last given, so the effects below
    // only push real changes.
    const latestRef = useRef({ theme, option });
    const appliedThemeRef = useRef<EChartsTheme | null>(null);
    const appliedOptionRef = useRef<EChartsCoreOption | null>(null);

    useEffect(() => {
        latestRef.current = { theme, option };
    });

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const latest = latestRef.current;
        const chart = echarts.init(element, latest.theme, { renderer });
        chart.setOption(latest.option);
        chartRef.current = chart;
        appliedThemeRef.current = latest.theme;
        appliedOptionRef.current = latest.option;

        let observer: ResizeObserver | undefined;
        if (typeof ResizeObserver !== "undefined") {
            observer = new ResizeObserver(() => chart.resize());
            observer.observe(element);
        }
        return () => {
            observer?.disconnect();
            chart.dispose();
            chartRef.current = null;
        };
    }, [renderer]);

    useEffect(() => {
        const chart = chartRef.current;
        if (chart && appliedThemeRef.current !== theme) {
            appliedThemeRef.current = theme;
            chart.setTheme(theme);
        }
    }, [theme]);

    useEffect(() => {
        const chart = chartRef.current;
        if (chart && appliedOptionRef.current !== option) {
            appliedOptionRef.current = option;
            // replaceMerge drops series and axes that are gone (after a drilldown, say) while still animating
            // the ones that stay.
            chart.setOption(option, { replaceMerge: ["series", "xAxis", "yAxis", "visualMap", "dataZoom"] });
        }
    }, [option]);

    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || !onClick) {
            return;
        }
        const handler = (params: unknown): void => onClick(params as ChartClickEvent);
        chart.on("click", handler);
        return () => {
            chart.off("click", handler);
        };
    }, [onClick, renderer]);

    return <div ref={ref} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}

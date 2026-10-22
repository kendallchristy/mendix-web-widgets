import type { ChartTokens } from "./tokens";

/**
 * The Hyper theme in the ECharts theme builder's own format, for its Import button
 * (https://echarts.apache.org/en/theme-builder.html). The builder exports a theme JSON that the chart widgets'
 * Theme JSON property takes as is.
 */
export function themeBuilderConfig(tokens: ChartTokens, themeName: string): Record<string, unknown> {
    const axes = (["all", "category", "value", "log", "time"] as const).map((type, i) => ({
        type,
        name: `${["General", "Category", "Value", "Log", "Time"][i]} Axis`,
        axisLineShow: false,
        axisLineColor: tokens.grid,
        axisTickShow: false,
        axisTickColor: tokens.grid,
        axisLabelShow: true,
        axisLabelColor: tokens.label,
        // Hyper draws vertical gridlines: the split lines of category and time axes.
        splitLineShow: type === "all" || type === "category" || type === "time",
        splitLineColor: [tokens.grid],
        splitAreaShow: false,
        splitAreaColor: ["rgba(0,0,0,0)", "rgba(0,0,0,0)"]
    }));

    return {
        version: 1,
        themeName,
        theme: {
            seriesCnt: 4,
            backgroundColor: "rgba(0,0,0,0)",
            titleColor: tokens.text,
            subtitleColor: tokens.label,
            textColorShow: false,
            textColor: tokens.text,
            markTextColor: tokens.pillText,
            color: tokens.palette,
            borderColor: tokens.surface,
            borderWidth: 0,
            visualMapColor: ["#F86860", "#F8B810", "#48B840"],
            legendTextColor: tokens.label,
            kColor: tokens.palette[2],
            kColor0: tokens.down,
            kBorderColor: tokens.palette[2],
            kBorderColor0: tokens.down,
            kBorderWidth: 1,
            lineWidth: 2.5,
            symbolSize: 8,
            symbol: "circle",
            symbolBorderWidth: 2,
            lineSmooth: true,
            graphLineWidth: 1,
            graphLineColor: tokens.grid,
            mapLabelColor: tokens.text,
            mapLabelColorE: tokens.text,
            mapBorderColor: tokens.surface,
            mapBorderColorE: tokens.surface,
            mapBorderWidth: 0.5,
            mapBorderWidthE: 1,
            mapAreaColor: tokens.grid,
            mapAreaColorE: tokens.palette[0],
            axes,
            axisSeperateSetting: true,
            toolboxColor: tokens.label,
            toolboxEmphasisColor: tokens.text,
            tooltipAxisColor: tokens.label,
            tooltipAxisWidth: 1,
            timelineLineColor: tokens.grid,
            timelineLineWidth: 2,
            timelineItemColor: tokens.palette[0],
            timelineItemColorE: tokens.surface,
            timelineCheckColor: tokens.palette[0],
            timelineCheckBorderColor: tokens.surface,
            timelineItemBorderWidth: 1,
            timelineControlColor: tokens.label,
            timelineControlBorderColor: tokens.label,
            timelineControlBorderWidth: 1,
            timelineLabelColor: tokens.label,
            gridLeft: 16,
            gridRight: 16,
            gridTop: 40,
            gridBottom: 32,
            legendLeft: 0,
            legendRight: "auto",
            legendTop: 0,
            legendBottom: "auto"
        }
    };
}

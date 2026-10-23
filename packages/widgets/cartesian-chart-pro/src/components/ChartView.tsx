import type { ChartClickEvent, HeightUnit, PaletteName, ThemePreset } from "@kendallchristy/chart-core";
import {
    Breadcrumb,
    ChartContainer,
    ChartStatus,
    EChart,
    ScreenReaderTable,
    buildTheme,
    deepMerge,
    figuresFontFamily,
    mergeJsonTexts,
    surfaceBackground,
    themePalette,
    useChartTokens,
    useDrillPath
} from "@kendallchristy/chart-core";
import type { CSSProperties, ReactElement } from "react";
import { useCallback, useMemo, useRef } from "react";

import { buildChart } from "../model/buildChart";
import "../registerCharts";
import type { ChartSettings, DrillValue, SeriesInput } from "../model/types";

export interface ThemeSettings {
    preset: ThemePreset;
    palette: PaletteName;
    customPalette?: string;
    /** Theme JSON texts, merged in order. Only used for the custom preset. */
    themeJson: Array<string | undefined>;
    /** Option override texts, merged in order over the finished option. */
    optionOverride: Array<string | undefined>;
}

export interface ChartViewProps {
    series: SeriesInput[];
    settings: ChartSettings;
    theme: ThemeSettings;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

export function ChartView(props: ChartViewProps): ReactElement {
    const { series, settings, theme } = props;
    const containerRef = useRef<HTMLDivElement>(null);

    const themeKey = theme.preset === "custom" ? JSON.stringify(theme.themeJson) : "";
    const customTheme = useMemo(
        () =>
            themeKey ? mergeJsonTexts(JSON.parse(themeKey) as string[]) : { errors: [] as string[], value: undefined },
        [themeKey]
    );
    const customThemePalette = useMemo(() => themePalette(customTheme.value), [customTheme]);
    const tokens = useChartTokens(containerRef, {
        preset: theme.preset,
        palette: theme.palette,
        customPalette: theme.customPalette,
        customThemePalette
    });
    const echartsTheme = useMemo(() => buildTheme(tokens, customTheme.value), [tokens, customTheme]);

    const overrideKey = JSON.stringify(theme.optionOverride);
    const override = useMemo(() => mergeJsonTexts(JSON.parse(overrideKey) as string[]), [overrideKey]);

    const drillPath = useDrillPath<DrillValue>();
    const built = useMemo(
        () => buildChart(series, settings, tokens, drillPath.steps),
        [series, settings, tokens, drillPath.steps]
    );
    const option = useMemo(
        () => (override.value ? deepMerge(built.option, override.value) : built.option),
        [built.option, override.value]
    );

    const { push } = drillPath;
    const onClick = useCallback(
        (event: ChartClickEvent) => {
            if (event.componentType !== "series" || event.seriesIndex === undefined) {
                return;
            }
            const target = built.clickTargets[event.seriesIndex]?.[event.dataIndex];
            if (target?.drill) {
                push(target.drill);
            } else if (target?.action?.canExecute) {
                target.action.execute();
            }
        },
        [built.clickTargets, push]
    );

    const errors = [
        ...customTheme.errors.map(e => `Theme JSON: ${e}`),
        ...override.errors.map(e => `Option override: ${e}`)
    ];

    let body: ReactElement;
    if (errors.length > 0) {
        body = <ChartStatus kind="error" message={errors.join(" ")} />;
    } else if (props.loading) {
        body = <ChartStatus kind="loading" />;
    } else if (built.pointCount === 0) {
        body = <ChartStatus kind="empty" message={props.emptyMessage} />;
    } else {
        body = (
            <EChart
                className="hc-chart__plot"
                option={option}
                theme={echartsTheme}
                renderer={props.renderer}
                onClick={onClick}
            />
        );
    }

    return (
        <ChartContainer
            ref={containerRef}
            widgetClass="widget-cartesian-chart-pro"
            className={props.className}
            style={props.style}
            heightUnit={props.heightUnit}
            height={props.height}
            background={surfaceBackground(tokens, settings.style)}
            textFont={tokens.fontFamily}
            figuresFont={figuresFontFamily(tokens, settings.style)}
            labelColor={tokens.label}
            textColor={tokens.text}
        >
            {body}
            <Breadcrumb items={built.breadcrumb} onNavigate={drillPath.goTo} />
            {built.pointCount > 0 && (
                <ScreenReaderTable
                    caption={settings.title ?? "Chart data"}
                    columns={built.table.columns}
                    rows={built.table.rows}
                />
            )}
        </ChartContainer>
    );
}

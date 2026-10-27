import classNames from "classnames";
import type { CSSProperties, ReactElement } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import type { DrillStep } from "../hooks/useDrillPath";
import { useDrillPath } from "../hooks/useDrillPath";
import { useChartTokens } from "../hooks/useChartTokens";
import type { ElementSize } from "../hooks/useElementSize";
import { useElementSize } from "../hooks/useElementSize";
import { deepMerge, mergeJsonTexts } from "../options/merge";
import type { ChartStyle } from "../options/style";
import { figuresFontFamily, surfaceBackground } from "../options/style";
import type { EChartsTheme } from "../theme/echartsTheme";
import { buildTheme, themePalette } from "../theme/echartsTheme";
import type { ChartTokens, PaletteName, ThemePreset } from "../theme/tokens";
import { Breadcrumb } from "./Breadcrumb";
import type { HeightUnit } from "./ChartContainer";
import { ChartContainer } from "./ChartContainer";
import { ChartStatus } from "./ChartStatus";
import type { ChartClickEvent } from "./EChart";
import { EChart } from "./EChart";
import { ScreenReaderTable } from "./ScreenReaderTable";

/** Something a click can run: a Mendix action for the clicked object. */
export interface ClickAction {
    canExecute: boolean;
    execute: () => void;
}

/** What clicking a data item does: go one drilldown level deeper, or run its action. */
export interface ClickTarget<D> {
    drill?: DrillStep<D>;
    action?: ClickAction;
}

/** A widget's finished chart, for one set of tokens and one drilldown path. */
export interface BuiltChart<D> {
    option: Record<string, unknown>;
    /** What clicking each data item does, by series index and data index. */
    clickTargets: Array<Array<ClickTarget<D>>>;
    /** Empty when the chart has no drilldown. */
    breadcrumb: string[];
    table: { columns: string[]; rows: string[][] };
    pointCount: number;
    /** Problems with the widget's own settings, shown instead of the chart. */
    errors?: string[];
}

export interface ThemeSettings {
    preset: ThemePreset;
    palette: PaletteName;
    customPalette?: string;
    /** Theme JSON texts, merged in order. Only used for the custom preset. */
    themeJson: Array<string | undefined>;
    /** Option override texts, merged in order over the finished option. */
    optionOverride: Array<string | undefined>;
}

export interface ChartFrameProps<D> {
    /** The widget's own class, for example widget-pie. */
    widgetClass: string;
    /** Builds the chart. Keep it stable (useCallback) so the chart only rebuilds when its inputs change. */
    build: (tokens: ChartTokens, path: Array<DrillStep<D>>, size: ElementSize) => BuiltChart<D>;
    /** Rebuilds the chart when it resizes, for layouts ECharts can't size by itself. Size is zero otherwise. */
    measure?: boolean;
    theme: ThemeSettings;
    chartStyle: ChartStyle;
    title?: string;
    subtitle?: string;
    titleAlign?: "left" | "center";
    /** Caption of the screen-reader data table. */
    caption: string;
    renderer: "canvas" | "svg";
    heightUnit: HeightUnit;
    height: number;
    /**
     * True until every data source has loaded completely. Nothing is built or drawn before that: the first load shows
     * a placeholder, and a reload keeps the last chart with a progress bar.
     */
    loading: boolean;
    emptyMessage: string;
    className?: string;
    style?: CSSProperties;
}

interface TitleStyle {
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string | number;
}

/** The title's text style from the theme, so a custom theme's title colours still apply to the HTML title. */
function titleStyles(theme: EChartsTheme): { title: CSSProperties; subtitle: CSSProperties } {
    const component = (theme.title ?? {}) as { textStyle?: TitleStyle; subtextStyle?: TitleStyle };
    const css = (text: TitleStyle = {}): CSSProperties => ({
        color: text.color,
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        fontWeight: text.fontWeight
    });
    return { title: css(component.textStyle), subtitle: css(component.subtextStyle) };
}

/**
 * Everything around a chart that every chart widget shares: theme and dark mode, the option override, loading,
 * empty and error states, clicks and drilldown, and the screen-reader table.
 */
export function ChartFrame<D>(props: ChartFrameProps<D>): ReactElement {
    const { build, theme, chartStyle } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);

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
    // Axis labels take the figures font from the theme, so Figures font must reach it too.
    const figuresFont = figuresFontFamily(tokens, chartStyle);
    const echartsTheme = useMemo(
        () => buildTheme({ ...tokens, figuresFont }, customTheme.value),
        [tokens, figuresFont, customTheme]
    );

    const overrideKey = JSON.stringify(theme.optionOverride);
    const override = useMemo(() => mergeJsonTexts(JSON.parse(overrideKey) as string[]), [overrideKey]);

    // The plot's own box, below the title.
    const size = useElementSize(bodyRef, props.measure ?? false);
    const drillPath = useDrillPath<D>();
    const { loading } = props;
    const fresh = useMemo(
        () => (loading ? undefined : build(tokens, drillPath.steps, size)),
        [loading, build, tokens, drillPath.steps, size]
    );
    // While data reloads, keep showing the last complete chart rather than a partial one.
    const [kept, setKept] = useState(fresh);
    if (fresh && fresh !== kept) {
        setKept(fresh);
    }
    const built = fresh ?? kept;
    const option = useMemo(
        () => (built && override.value ? deepMerge(built.option, override.value) : built?.option),
        [built, override.value]
    );
    // The placeholder stays up until the chart has actually drawn, not just until the data arrived.
    const [drawn, setDrawn] = useState(false);
    const onRendered = useCallback(() => setDrawn(true), []);
    // ECharts' own error for an option it couldn't draw. It stays with that option, so the next one gets a fresh try.
    const [drawError, setDrawError] = useState<{ message: string; option: unknown }>();
    const onError = useCallback(
        (message: string | undefined, failed: unknown) =>
            setDrawError(message === undefined ? undefined : { message, option: failed }),
        []
    );

    const { push } = drillPath;
    const onClick = useCallback(
        (event: ChartClickEvent) => {
            if (event.componentType !== "series") {
                return;
            }
            const target = built?.clickTargets[event.seriesIndex ?? 0]?.[event.dataIndex];
            if (target?.drill) {
                push(target.drill);
            } else if (target?.action?.canExecute) {
                target.action.execute();
            }
        },
        [built, push]
    );

    const errors = [
        ...customTheme.errors.map(e => `Theme JSON: ${e}`),
        ...override.errors.map(e => `Option override: ${e}`),
        ...(built?.errors ?? []),
        ...(drawError && drawError.option === option ? [`The chart couldn't be drawn: ${drawError.message}`] : [])
    ];

    let body: ReactElement;
    if (errors.length > 0) {
        body = <ChartStatus kind="error" message={errors.join(" ")} />;
    } else if (!built || !option) {
        body = <ChartStatus kind="loading" />;
    } else if (built.pointCount === 0) {
        body = <ChartStatus kind="empty" message={props.emptyMessage} />;
    } else {
        body = (
            <>
                <EChart
                    className="hc-chart__plot"
                    option={option}
                    theme={echartsTheme}
                    renderer={props.renderer}
                    onClick={onClick}
                    onRendered={onRendered}
                    onError={onError}
                />
                {!drawn && <ChartStatus kind="loading" />}
            </>
        );
    }

    const breadcrumb = built?.breadcrumb ?? [];
    const { title, subtitle } = props;
    // Drilldown charts keep the header row even at the top level, so the plot doesn't jump when the trail appears.
    const hasHeader = Boolean(title || subtitle) || breadcrumb.length > 0;
    const titleCss = titleStyles(echartsTheme);

    return (
        <ChartContainer
            ref={containerRef}
            widgetClass={props.widgetClass}
            className={props.className}
            style={props.style}
            heightUnit={props.heightUnit}
            height={props.height}
            background={surfaceBackground(tokens, chartStyle)}
            textFont={tokens.fontFamily}
            figuresFont={figuresFont}
            labelColor={tokens.label}
            textColor={tokens.text}
        >
            {hasHeader && (
                <div
                    className={classNames("hc-chart__header", {
                        "hc-chart__header--center": props.titleAlign === "center"
                    })}
                >
                    <div className="hc-chart__titles">
                        {title && (
                            <div className="hc-chart__title" style={titleCss.title}>
                                {title}
                            </div>
                        )}
                        {subtitle && (
                            <div className="hc-chart__subtitle" style={titleCss.subtitle}>
                                {subtitle}
                            </div>
                        )}
                    </div>
                    <Breadcrumb items={breadcrumb} onNavigate={drillPath.goTo} />
                </div>
            )}
            <div ref={bodyRef} className="hc-chart__body">
                {body}
                {loading && built && <div className="hc-chart__progress" role="status" aria-label="Updating chart" />}
            </div>
            {built && built.pointCount > 0 && (
                <ScreenReaderTable caption={props.caption} columns={built.table.columns} rows={built.table.rows} />
            )}
        </ChartContainer>
    );
}

/** The Theme and Advanced properties every chart widget has, as Mendix hands them over at runtime. */
export interface ThemeProps {
    theme: ThemePreset;
    palette: PaletteName;
    customPalette: string;
    themeJson: string;
    themeJsonExpression?: { value?: string };
    optionOverride: string;
    optionOverrideExpression?: { value?: string };
}

export function themeSettingsFromProps(props: ThemeProps): ThemeSettings {
    return {
        preset: props.theme,
        palette: props.palette,
        customPalette: props.customPalette,
        themeJson: [props.themeJson, props.themeJsonExpression?.value],
        optionOverride: [props.optionOverride, props.optionOverrideExpression?.value]
    };
}

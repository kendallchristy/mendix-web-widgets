import { ChartStatus, THEME_BUILDER_URL } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";

import type { CustomChartProPreviewProps } from "../typings/CustomChartProProps";
import { CustomView } from "./components/CustomView";
import { customSettings } from "./model/fromProps";
import { sampleDataSets } from "./model/sample";

export function preview(props: CustomChartProPreviewProps): ReactElement {
    const height = props.height ?? 240;
    const status = (message: string): ReactElement => (
        <div className="hc-chart widget-custom-chart-pro" style={{ height: `${height}px` }}>
            <ChartStatus kind="empty" message={message} />
        </div>
    );
    if (props.theme === "custom" && !props.themeJson.trim() && !props.themeJsonExpression.trim()) {
        return status(`Paste a theme from ${THEME_BUILDER_URL.replace("https://", "")} into Theme JSON`);
    }
    if (!props.optionJson.trim()) {
        return status("Add an ECharts option in Option JSON");
    }
    if (props.mapName.trim() && props.mapUrl.trim()) {
        // Studio Pro can't fetch the app's map files.
        return status(`Map chart: draws in the app with the ${props.mapName.trim()} map`);
    }
    const sets = sampleDataSets(
        props.dataSets.map(set => ({
            name: set.name.trim(),
            fields: [
                set.field1 && set.field1Name,
                set.field2 && set.field2Name,
                set.field3 && set.field3Name,
                set.field4 && set.field4Name,
                set.field5 && set.field5Name,
                set.field6 && set.field6Name
            ].flatMap(name => (name?.trim() ? [name.trim()] : []))
        }))
    );
    const settings = customSettings({
        ...props,
        animation: false,
        animationDuration: 0,
        optionJson: [props.optionJson]
    });
    return (
        <CustomView
            dataSets={sets}
            settings={settings}
            theme={{
                preset: props.theme,
                palette: props.palette,
                customPalette: props.customPalette,
                themeJson: [props.themeJson],
                optionOverride: []
            }}
            renderer="svg"
            heightUnit={props.heightUnit === "fill" ? "pixels" : props.heightUnit}
            height={height}
            loading={false}
            emptyMessage="No data"
            className={props.class}
            style={props.styleObject}
        />
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/CustomChartPro.scss");
}

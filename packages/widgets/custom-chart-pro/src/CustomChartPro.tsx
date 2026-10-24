import { isAnyLoading } from "@kendallchristy/chart-core";
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { CustomChartProContainerProps } from "../typings/CustomChartProProps";
import { CustomView } from "./components/CustomView";
import { useMap } from "./components/useMap";
import { readDataSets } from "./model/dataSets";
import { settingsFromProps } from "./model/fromProps";
import "./ui/CustomChartPro.scss";

export function CustomChartPro(props: CustomChartProContainerProps): ReactElement {
    // Nothing is read until every data source has loaded, and a map the option uses has been registered.
    const map = useMap(props.mapName, props.mapUrl);
    const loading = isAnyLoading(props.dataSets.map(set => set.dataSource)) || map.loading;
    const dataSets = useMemo(() => (loading ? [] : readDataSets(props.dataSets)), [loading, props]);
    const settings = useMemo(() => settingsFromProps(props), [props]);

    return (
        <CustomView
            dataSets={dataSets}
            settings={settings}
            theme={{
                preset: props.theme,
                palette: props.palette,
                customPalette: props.customPalette,
                themeJson: [props.themeJson, props.themeJsonExpression?.value],
                optionOverride: []
            }}
            renderer={props.renderer}
            heightUnit={props.heightUnit}
            height={props.height}
            loading={loading}
            mapError={map.error}
            emptyMessage={props.emptyMessage?.value ?? "No data"}
            className={props.class}
            style={props.style}
        />
    );
}

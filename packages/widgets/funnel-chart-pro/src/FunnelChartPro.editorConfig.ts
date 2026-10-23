import {
    checkCategoryDataProperties,
    checkSharedStyleProperties,
    hideCategoryDataProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { FunnelChartProPreviewProps } from "../typings/FunnelChartProProps";

export function getProperties(values: FunnelChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    hideCategoryDataProperties(values, defaultProperties);
    if (values.labelPosition === "hidden") {
        hideProperties(defaultProperties, ["showName", "showValue"]);
    }
    if (values.conversion === "off") {
        hideProperties(defaultProperties, ["percentDecimals"]);
    }
    return defaultProperties;
}

export function check(values: FunnelChartProPreviewProps): Problem[] {
    const problems = [...checkSharedStyleProperties(values), ...checkCategoryDataProperties(values)];
    if (values.sortOrder === "data") {
        problems.push({
            property: "sortOrder",
            severity: "warning",
            message: "Stages follow the data source order: sort the data source by stage, or pick Largest first."
        });
    }
    return problems;
}

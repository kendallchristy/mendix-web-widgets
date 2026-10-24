import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { StreamChartProPreviewProps } from "../typings/StreamChartProProps";

export function getProperties(values: StreamChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    if (values.aggregation === "count") {
        hideProperties(defaultProperties, ["valueAttribute"]);
    }
    if (values.maxGroups === 0) {
        hideProperties(defaultProperties, ["otherLabel"]);
    }
    if (!values.showAxis) {
        hideProperties(defaultProperties, ["dateFormat"]);
    }
    return defaultProperties;
}

export function check(values: StreamChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    if (values.aggregation !== "count" && !values.valueAttribute) {
        problems.push({
            property: "valueAttribute",
            severity: "error",
            message: "Choose a Value attribute, or set Aggregation to Count."
        });
    }
    if (values.maxGroups !== null && values.maxGroups < 0) {
        problems.push({ property: "maxGroups", severity: "error", message: "Use 0 to show every group." });
    }
    return problems;
}

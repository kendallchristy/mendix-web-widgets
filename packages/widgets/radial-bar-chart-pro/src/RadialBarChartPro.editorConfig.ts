import {
    checkCategoryDataProperties,
    checkSharedStyleProperties,
    hideCategoryDataProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { RadialBarChartProPreviewProps } from "../typings/RadialBarChartProProps";

export function getProperties(values: RadialBarChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    hideCategoryDataProperties(values, defaultProperties);
    if (values.valueLabel === "off") {
        hideProperties(defaultProperties, ["labelStyle"]);
    }
    return defaultProperties;
}

export function check(values: RadialBarChartProPreviewProps): Problem[] {
    const problems = [...checkSharedStyleProperties(values), ...checkCategoryDataProperties(values)];
    if (values.sweep !== null && (values.sweep < 30 || values.sweep > 360)) {
        problems.push({ property: "sweep", severity: "error", message: "Sweep must be between 30 and 360 degrees." });
    }
    if ((values.maxRings ?? 0) > 8 || values.maxRings === 0) {
        problems.push({
            property: "maxRings",
            severity: "warning",
            message: "Past 8 rings the colours repeat and the inner rings get too short to compare."
        });
    }
    return problems;
}

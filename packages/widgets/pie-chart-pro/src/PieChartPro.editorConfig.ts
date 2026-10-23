import {
    checkCategoryDataProperties,
    checkSharedStyleProperties,
    hideCategoryDataProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { PieChartProPreviewProps } from "../typings/PieChartProProps";

export function getProperties(values: PieChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    hideCategoryDataProperties(values, defaultProperties);

    if (values.shape === "pie") {
        hideProperties(defaultProperties, ["innerRadius", "centerContent", "centerCaption"]);
    } else if (values.centerContent === "none") {
        hideProperties(defaultProperties, ["centerCaption"]);
    }
    if (values.shape === "halfDonut") {
        hideProperties(defaultProperties, ["startAngle"]);
    }
    if (values.labelPosition === "hidden") {
        hideProperties(defaultProperties, ["labelContent"]);
    }
    if (values.maxSlices === 0) {
        hideProperties(defaultProperties, ["otherLabel"]);
    }
    return defaultProperties;
}

export function check(values: PieChartProPreviewProps): Problem[] {
    const problems = [...checkSharedStyleProperties(values), ...checkCategoryDataProperties(values)];
    if ((values.maxSlices ?? 0) > 8 || values.maxSlices === 0) {
        problems.push({
            property: "maxSlices",
            severity: "warning",
            message: "Past 8 slices the colours repeat and the slices get hard to compare. Consider 6 or fewer."
        });
    }
    return problems;
}

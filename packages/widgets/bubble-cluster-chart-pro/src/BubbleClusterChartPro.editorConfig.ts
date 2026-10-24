import {
    checkCategoryDataProperties,
    checkSharedStyleProperties,
    hideCategoryDataProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { BubbleClusterChartProPreviewProps } from "../typings/BubbleClusterChartProProps";

export function getProperties(values: BubbleClusterChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    hideCategoryDataProperties(values, defaultProperties);

    if (!values.groupAttribute) {
        hideProperties(defaultProperties, ["groupGap", "groupOutlines"]);
    }
    if (values.labelContent === "hidden" || values.labelContent === "name") {
        hideProperties(defaultProperties, ["valueStyle"]);
    }
    if (values.maxBubbles === 0) {
        hideProperties(defaultProperties, ["otherLabel"]);
    }
    return defaultProperties;
}

export function check(values: BubbleClusterChartProPreviewProps): Problem[] {
    const problems = [...checkSharedStyleProperties(values), ...checkCategoryDataProperties(values)];
    if (values.maxBubbles === 0 || (values.maxBubbles ?? 0) > 150) {
        problems.push({
            property: "maxBubbles",
            severity: "warning",
            message:
                "Past about 150 bubbles most are too small to read or hover. Consider Most bubbles of 100 or fewer."
        });
    }
    return problems;
}

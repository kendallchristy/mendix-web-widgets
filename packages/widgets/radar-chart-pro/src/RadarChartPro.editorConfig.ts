import {
    checkSharedStyleProperties,
    hideNestedProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { RadarChartProPreviewProps } from "../typings/RadarChartProProps";

const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|[a-z]+)$/i;

export function getProperties(values: RadarChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    if (!values.valueLabels) {
        hideProperties(defaultProperties, ["labelStyle"]);
    }
    values.series.forEach((series, index) => {
        if (series.aggregation === "count") {
            hideNestedProperties(defaultProperties, "series", index, ["valueAttribute"]);
        }
    });
    return defaultProperties;
}

export function check(values: RadarChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    if (values.series.length === 0) {
        problems.push({ property: "series", severity: "error", message: "Add at least one series." });
    }
    values.series.forEach((series, index) => {
        if (series.aggregation !== "count" && !series.valueAttribute) {
            problems.push({
                property: `series/${index + 1}/valueAttribute`,
                severity: "error",
                message: `Series ${index + 1}: choose a Value attribute, or set Aggregation to Count.`
            });
        }
        if (series.color && !COLOUR.test(series.color.trim())) {
            problems.push({
                property: `series/${index + 1}/color`,
                severity: "error",
                message: `Series ${index + 1}: "${series.color}" isn't a colour. Use for example #8038D0.`
            });
        }
    });
    return problems;
}

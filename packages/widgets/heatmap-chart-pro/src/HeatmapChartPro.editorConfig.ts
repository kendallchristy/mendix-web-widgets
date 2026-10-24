import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { HeatmapChartProPreviewProps } from "../typings/HeatmapChartProProps";

const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|[a-z]+)$/i;

export function getProperties(values: HeatmapChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    if (values.layout === "calendar") {
        hideProperties(defaultProperties, ["yAttribute"]);
    }
    if (values.aggregation === "count") {
        hideProperties(defaultProperties, ["valueAttribute"]);
    }
    if (values.colorScale !== "custom") {
        hideProperties(defaultProperties, ["customScale"]);
    }
    return defaultProperties;
}

export function check(values: HeatmapChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    if (values.aggregation !== "count" && !values.valueAttribute) {
        problems.push({
            property: "valueAttribute",
            severity: "error",
            message: "Choose a Value attribute, or set Aggregation to Count."
        });
    }
    if (values.colorScale === "custom") {
        const colours = values.customScale
            .split(",")
            .map(c => c.trim())
            .filter(Boolean);
        const wrong = colours.find(c => !COLOUR.test(c));
        if (colours.length < 2 || wrong) {
            problems.push({
                property: "customScale",
                severity: "error",
                message: wrong
                    ? `"${wrong}" isn't a colour. Use for example #F2F4F8, #8038D0.`
                    : "Add at least two colours, low first, for example #F2F4F8, #8038D0."
            });
        }
    }
    return problems;
}

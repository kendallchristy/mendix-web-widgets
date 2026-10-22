import {
    checkSharedStyleProperties,
    hideNestedProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { ChartPreviewProps } from "../typings/ChartProps";

export function getProperties(values: ChartPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);

    values.series.forEach((series, index) => {
        const hidden: string[] = [];
        if (series.seriesType !== "bubble") {
            hidden.push("sizeAttribute");
        }
        if (values.drilldown !== "category") {
            hidden.push("drillAttribute1", "drillAttribute2");
        }
        if (series.groupByAttribute) {
            hidden.push("color");
        }
        hideNestedProperties(defaultProperties, "series", index, hidden);
    });

    if (values.drilldown !== "date") {
        hideProperties(defaultProperties, ["drillDateFrom", "drillDateTo"]);
    }
    if (values.drilldown === "none") {
        hideProperties(defaultProperties, ["drillTopLabel"]);
    }
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    return defaultProperties;
}

export function check(values: ChartPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    values.series.forEach((series, index) => {
        const where = `Series ${index + 1}`;
        if (!series.yAttribute && series.aggregation !== "count") {
            problems.push({
                property: `series/${index + 1}/yAttribute`,
                severity: "error",
                message: `${where}: choose a Y value, or set Aggregation to Count.`
            });
        }
        if (series.seriesType === "bubble" && !series.sizeAttribute) {
            problems.push({
                property: `series/${index + 1}/sizeAttribute`,
                severity: "warning",
                message: `${where}: bubbles all have the same size until Bubble size is set.`
            });
        }
    });
    if (values.series.length === 0) {
        problems.push({ property: "series", severity: "error", message: "Add at least one series." });
    }
    return problems;
}

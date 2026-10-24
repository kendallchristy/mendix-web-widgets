import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import { parseJsonObject } from "@kendallchristy/chart-core/dist/options/merge";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { CustomChartProPreviewProps } from "../typings/CustomChartProProps";

export function getProperties(values: CustomChartProPreviewProps, defaultProperties: Properties): Properties {
    // Custom Chart Pro has no option override: Option JSON is the whole option.
    hideSharedStyleProperties({ ...values, optionOverride: "" }, defaultProperties);
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    return defaultProperties;
}

const NAME = /^[A-Za-z0-9_]+$/;

export function check(values: CustomChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties({ ...values, optionOverride: "" });
    const option = parseJsonObject(values.optionJson);
    if (option.error) {
        problems.push({
            property: "optionJson",
            severity: "error",
            message: `Option JSON isn't valid: ${option.error}`
        });
    } else if (!values.optionJson.trim() && !values.optionJsonExpression.trim()) {
        problems.push({ property: "optionJson", severity: "error", message: "Add an ECharts option in Option JSON." });
    }
    const names = new Set<string>();
    values.dataSets.forEach((set, index) => {
        const name = set.name.trim();
        const label = `Data set ${index + 1}${name ? ` (${name})` : ""}`;
        if (name && !NAME.test(name)) {
            problems.push({
                property: "dataSets",
                severity: "error",
                message: `${label}: use letters, digits and underscores in its name, so the option can name it.`
            });
        } else if (names.has(name)) {
            problems.push({
                property: "dataSets",
                severity: "error",
                message: `${label}: another data set has this name.`
            });
        }
        names.add(name);
        const slots = [
            [set.field1, set.field1Name],
            [set.field2, set.field2Name],
            [set.field3, set.field3Name],
            [set.field4, set.field4Name],
            [set.field5, set.field5Name],
            [set.field6, set.field6Name]
        ];
        slots.forEach(([attribute, fieldName], i) => {
            if (attribute && !fieldName.trim()) {
                problems.push({
                    property: "dataSets",
                    severity: "error",
                    message: `${label}: name Field ${i + 1}, so the option can refer to it.`
                });
            }
        });
    });
    if (Boolean(values.mapName.trim()) !== Boolean(values.mapUrl.trim())) {
        problems.push({
            property: values.mapName.trim() ? "mapUrl" : "mapName",
            severity: "error",
            message: "A map needs both a name and the URL of its GeoJSON."
        });
    }
    return problems;
}

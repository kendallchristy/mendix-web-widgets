import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { RangeChartProPreviewProps } from "../typings/RangeChartProProps";

export function getProperties(values: RangeChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    hideProperties(defaultProperties, values.rangeStyle === "bars" ? ["dotSize"] : ["cornerRadius"]);
    if (values.valueLabels === "off") {
        hideProperties(defaultProperties, ["labelStyle"]);
    }
    return defaultProperties;
}

export function check(values: RangeChartProPreviewProps): Problem[] {
    return checkSharedStyleProperties(values);
}

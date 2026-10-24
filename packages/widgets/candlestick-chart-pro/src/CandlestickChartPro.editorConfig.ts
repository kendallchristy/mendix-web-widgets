import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { CandlestickChartProPreviewProps } from "../typings/CandlestickChartProProps";

const COLOR = /^(#[0-9a-f]{3,8}|rgba?\(.+\)|[a-z]+)$/i;

export function getProperties(values: CandlestickChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    if (!values.volumeAttribute) {
        hideProperties(defaultProperties, ["volumeHeight"]);
    }
    return defaultProperties;
}

export function check(values: CandlestickChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    for (const property of ["risingColor", "fallingColor"] as const) {
        const color = values[property].trim();
        if (color && !COLOR.test(color)) {
            problems.push({ property, severity: "error", message: `"${color}" isn't a colour, for example #0860F8.` });
        }
    }
    const periods = values.movingAverages.trim();
    if (periods && periods.split(/[,;\s]+/).some(part => !/^\d+$/.test(part) || Number(part) < 2)) {
        problems.push({
            property: "movingAverages",
            severity: "warning",
            message: "Use whole numbers of 2 or more, separated by commas, for example 5, 20."
        });
    }
    return problems;
}

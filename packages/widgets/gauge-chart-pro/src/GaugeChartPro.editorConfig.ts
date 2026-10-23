import {
    checkSharedStyleProperties,
    hideProperties,
    hideSharedStyleProperties
} from "@kendallchristy/chart-core/dist/editor/properties";
import type { Problem, Properties } from "@mendix/pluggable-widgets-tools";

import type { GaugeChartProPreviewProps } from "../typings/GaugeChartProProps";

const COLOUR = /^(#[0-9a-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|[a-z]+)$/i;

export function getProperties(values: GaugeChartProPreviewProps, defaultProperties: Properties): Properties {
    hideSharedStyleProperties(values, defaultProperties);
    if (!values.title) {
        hideProperties(defaultProperties, ["titleAlign"]);
    }
    if (!values.showValue) {
        hideProperties(defaultProperties, ["valueSize", "valueCaption"]);
    }
    if (values.bands.length === 0) {
        hideProperties(defaultProperties, ["colorMode"]);
    }
    if (!values.showAsPercent) {
        hideProperties(defaultProperties, ["percentDecimals"]);
    } else {
        hideProperties(defaultProperties, ["decimals", "prefix", "suffix", "thousandsSeparator", "compactNumbers"]);
    }
    return defaultProperties;
}

export function check(values: GaugeChartProPreviewProps): Problem[] {
    const problems = checkSharedStyleProperties(values);
    values.bands.forEach((band, index) => {
        if (band.bandColor && !COLOUR.test(band.bandColor.trim())) {
            problems.push({
                property: `bands/${index + 1}/bandColor`,
                severity: "error",
                message: `Band ${index + 1}: "${band.bandColor}" isn't a colour. Use for example #48B840.`
            });
        }
        if (!band.bandLabel) {
            problems.push({
                property: `bands/${index + 1}/bandLabel`,
                severity: "warning",
                message: `Band ${index + 1}: add a label so the band doesn't rely on colour alone.`
            });
        }
    });
    return problems;
}

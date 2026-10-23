import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { RangeChartProPreviewProps } from "../../typings/RangeChartProProps";
import { getProperties } from "../RangeChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): RangeChartProPreviewProps {
    return {
        rangeStyle: "bars",
        valueLabels: "off",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as RangeChartProPreviewProps;
}

const keys = (properties: Properties): string[] => properties[0].properties!.map(p => p.key);
const all = (): Properties => [
    { caption: "All", properties: ["dotSize", "cornerRadius", "labelStyle"].map(key => ({ key, caption: key })) }
];

describe("Range editor config", () => {
    it("shows the settings of the chosen style only", () => {
        expect(keys(getProperties(values(), all()))).toEqual(["cornerRadius"]);
        expect(keys(getProperties(values({ rangeStyle: "dumbbell", valueLabels: "ends" }), all()))).toEqual([
            "dotSize",
            "labelStyle"
        ]);
    });
});

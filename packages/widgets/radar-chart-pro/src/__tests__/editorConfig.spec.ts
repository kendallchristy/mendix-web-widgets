import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { RadarChartProPreviewProps } from "../../typings/RadarChartProProps";
import { check, getProperties } from "../RadarChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): RadarChartProPreviewProps {
    return {
        title: "",
        valueLabels: false,
        series: [{ seriesName: "", aggregation: "sum", valueAttribute: "Score", color: "" }],
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as RadarChartProPreviewProps;
}

const keys = (properties: Properties): string[] => properties[0].properties!.map(p => p.key);
const all = (): Properties => [
    { caption: "All", properties: ["labelStyle", "titleAlign"].map(key => ({ key, caption: key })) }
];

describe("Radar editor config", () => {
    it("shows the label style only with value labels", () => {
        expect(keys(getProperties(values(), all()))).toEqual([]);
        expect(keys(getProperties(values({ valueLabels: true, title: "Scores" }), all()))).toEqual([
            "labelStyle",
            "titleAlign"
        ]);
    });

    it("checks each series' value and colour", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ series: [] })).map(p => p.property)).toEqual(["series"]);
        expect(
            check(values({ series: [{ aggregation: "sum", valueAttribute: "", color: "nope!" }] })).map(p => p.property)
        ).toEqual(["series/1/valueAttribute", "series/1/color"]);
    });
});

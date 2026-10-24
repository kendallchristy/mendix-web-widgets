import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { PieChartProPreviewProps } from "../../typings/PieChartProProps";
import { check, getProperties } from "../PieChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): PieChartProPreviewProps {
    return {
        valueAttribute: "Amount",
        aggregation: "sum",
        drilldown: false,
        drillAttribute1: "",
        title: "",
        shape: "donut",
        centerContent: "total",
        labelPosition: "outside",
        maxSlices: 6,
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as PieChartProPreviewProps;
}

const keys = [
    "innerRadius",
    "holeUnit",
    "centerContent",
    "centerCaption",
    "startAngle",
    "labelContent",
    "otherLabel",
    "drillAttribute1"
];
function visible(v: PieChartProPreviewProps): string[] {
    const props: Properties = [{ caption: "All", properties: keys.map(key => ({ key, caption: key })) }];
    return getProperties(v, props)[0].properties!.map(p => p.key);
}

describe("Pie editor config", () => {
    it("hides properties that don't apply", () => {
        expect(visible(values({ shape: "pie" }))).toEqual(["startAngle", "labelContent", "otherLabel"]);
        expect(visible(values({ shape: "halfDonut", labelPosition: "hidden", maxSlices: 0 }))).toEqual([
            "innerRadius",
            "holeUnit",
            "centerContent",
            "centerCaption"
        ]);
    });

    it("warns about too many slices and checks the data properties", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ maxSlices: 12 })).map(p => p.property)).toEqual(["maxSlices"]);
        expect(check(values({ valueAttribute: "" })).map(p => p.property)).toEqual(["valueAttribute"]);
    });
});

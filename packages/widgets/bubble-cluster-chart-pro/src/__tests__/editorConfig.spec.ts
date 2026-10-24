import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { BubbleClusterChartProPreviewProps } from "../../typings/BubbleClusterChartProProps";
import { check, getProperties } from "../BubbleClusterChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): BubbleClusterChartProPreviewProps {
    return {
        valueAttribute: "Amount",
        aggregation: "sum",
        drilldown: false,
        drillAttribute1: "",
        groupAttribute: "",
        title: "",
        labelContent: "nameValue",
        maxBubbles: 30,
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as BubbleClusterChartProPreviewProps;
}

const keys = ["groupGap", "groupOutlines", "valueStyle", "otherLabel"];
function visible(v: BubbleClusterChartProPreviewProps): string[] {
    const props: Properties = [{ caption: "All", properties: keys.map(key => ({ key, caption: key })) }];
    return getProperties(v, props)[0].properties!.map(p => p.key);
}

describe("Bubble cluster editor config", () => {
    it("hides properties that don't apply", () => {
        expect(visible(values())).toEqual(["valueStyle", "otherLabel"]);
        expect(visible(values({ groupAttribute: "Category", labelContent: "name", maxBubbles: 0 }))).toEqual([
            "groupGap",
            "groupOutlines"
        ]);
    });

    it("warns about too many bubbles and checks the data properties", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ maxBubbles: 0 })).map(p => p.property)).toEqual(["maxBubbles"]);
        expect(check(values({ valueAttribute: "" })).map(p => p.property)).toEqual(["valueAttribute"]);
    });
});

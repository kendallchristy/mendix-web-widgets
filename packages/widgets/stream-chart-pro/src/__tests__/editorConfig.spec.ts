import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { StreamChartProPreviewProps } from "../../typings/StreamChartProProps";
import { check, getProperties } from "../StreamChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): StreamChartProPreviewProps {
    return {
        title: "",
        aggregation: "sum",
        valueAttribute: "Amount",
        maxGroups: 8,
        showAxis: true,
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as StreamChartProPreviewProps;
}

const keys = (properties: Properties): string[] => properties[0].properties!.map(p => p.key);
const all = (): Properties => [
    {
        caption: "All",
        properties: ["valueAttribute", "otherLabel", "dateFormat"].map(key => ({ key, caption: key }))
    }
];

describe("Stream editor config", () => {
    it("hides what the settings don't use", () => {
        expect(keys(getProperties(values(), all()))).toEqual(["valueAttribute", "otherLabel", "dateFormat"]);
        expect(keys(getProperties(values({ aggregation: "count", maxGroups: 0, showAxis: false }), all()))).toEqual([]);
    });

    it("asks for a value unless counting", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ valueAttribute: "" })).map(p => p.property)).toEqual(["valueAttribute"]);
        expect(check(values({ valueAttribute: "", aggregation: "count" }))).toEqual([]);
    });
});

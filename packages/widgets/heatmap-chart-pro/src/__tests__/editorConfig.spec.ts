import type { Properties } from "@mendix/pluggable-widgets-tools";

import type { HeatmapChartProPreviewProps } from "../../typings/HeatmapChartProProps";
import { check, getProperties } from "../HeatmapChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): HeatmapChartProPreviewProps {
    return {
        title: "",
        layout: "grid",
        aggregation: "sum",
        valueAttribute: "Amount",
        colorScale: "hyper",
        customScale: "",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as HeatmapChartProPreviewProps;
}

const keys = (properties: Properties): string[] => properties[0].properties!.map(p => p.key);
const all = (): Properties => [
    {
        caption: "All",
        properties: ["yAttribute", "valueAttribute", "customScale"].map(key => ({ key, caption: key }))
    }
];

describe("Heatmap editor config", () => {
    it("hides what the layout, aggregation and scale don't use", () => {
        expect(keys(getProperties(values(), all()))).toEqual(["yAttribute", "valueAttribute"]);
        expect(
            keys(getProperties(values({ layout: "calendar", aggregation: "count", colorScale: "custom" }), all()))
        ).toEqual(["customScale"]);
    });

    it("asks for a value and at least two custom colours", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ valueAttribute: "" })).map(p => p.property)).toEqual(["valueAttribute"]);
        expect(check(values({ colorScale: "custom", customScale: "#000" })).map(p => p.property)).toEqual([
            "customScale"
        ]);
        expect(check(values({ colorScale: "custom", customScale: "#000, #FFF" }))).toEqual([]);
    });
});

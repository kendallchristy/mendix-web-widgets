import type { RadialBarChartProPreviewProps } from "../../typings/RadialBarChartProProps";
import { check } from "../RadialBarChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): RadialBarChartProPreviewProps {
    return {
        valueAttribute: "Amount",
        aggregation: "sum",
        drilldown: false,
        drillAttribute1: "",
        title: "",
        sweep: 270,
        maxRings: 5,
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as RadialBarChartProPreviewProps;
}

describe("Radial bar editor config", () => {
    it("checks the sweep and the number of rings", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ sweep: 400 })).map(p => p.property)).toEqual(["sweep"]);
        expect(check(values({ maxRings: 0 })).map(p => p.severity)).toEqual(["warning"]);
    });
});

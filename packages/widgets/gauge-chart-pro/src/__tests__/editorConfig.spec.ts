import type { GaugeChartProPreviewProps } from "../../typings/GaugeChartProProps";
import { check } from "../GaugeChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): GaugeChartProPreviewProps {
    return {
        bands: [],
        title: "",
        showValue: true,
        showAsPercent: false,
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as GaugeChartProPreviewProps;
}

describe("Gauge editor config", () => {
    it("checks band colours and asks for band labels", () => {
        expect(check(values())).toEqual([]);
        const problems = check(
            values({
                bands: [
                    { bandTo: "50", bandColor: "#E5466F", bandLabel: "Behind" },
                    { bandTo: "100", bandColor: "not a colour!", bandLabel: "" }
                ]
            })
        );
        expect(problems.map(p => [p.property, p.severity])).toEqual([
            ["bands/2/bandColor", "error"],
            ["bands/2/bandLabel", "warning"]
        ]);
    });
});

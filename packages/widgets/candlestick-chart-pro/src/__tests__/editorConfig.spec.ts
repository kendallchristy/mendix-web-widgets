import type { CandlestickChartProPreviewProps } from "../../typings/CandlestickChartProProps";
import { check } from "../CandlestickChartPro.editorConfig";

function values(overrides: Record<string, unknown> = {}): CandlestickChartProPreviewProps {
    return {
        volumeAttribute: "",
        risingColor: "",
        fallingColor: "",
        movingAverages: "5, 20",
        theme: "hyper",
        palette: "theme",
        customPalette: "",
        heightUnit: "pixels",
        animation: true,
        themeJson: "",
        optionOverride: "",
        ...overrides
    } as unknown as CandlestickChartProPreviewProps;
}

describe("Candlestick editor config", () => {
    it("checks colours and moving average periods", () => {
        expect(check(values())).toEqual([]);
        expect(check(values({ risingColor: "not a colour!", movingAverages: "5, one" })).map(p => p.property)).toEqual([
            "risingColor",
            "movingAverages"
        ]);
    });
});

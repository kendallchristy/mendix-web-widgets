import { createPercentFormatter, numberFormatFromProps } from "../format/number";
import { fitArc } from "../options/polar";
import { baseOption, defaultChartStyle, legendRowCount, wrappingLegend } from "../options/style";
import { HYPER_LIGHT, readableInk } from "../theme/tokens";
import { previewNumber, previewText } from "../editor/properties";

describe("fitArc", () => {
    it("fits a full circle in the middle of a square", () => {
        const fit = fitArc(90, 360, 0, 200, 200, 0);
        expect(fit.x).toBeCloseTo(100);
        expect(fit.y).toBeCloseTo(100);
        expect(fit.radius).toBeCloseTo(98);
    });

    it("lets a half circle use twice its height", () => {
        const fit = fitArc(180, 180, 0, 400, 100, 0);
        expect(fit.radius).toBeCloseTo(98);
        // The centre sits on the bottom edge, below the arc.
        expect(fit.y).toBeCloseTo(99);
    });

    it("makes room on the left for names", () => {
        const without = fitArc(90, 180, 0.2, 300, 300, 0);
        const withNames = fitArc(90, 180, 0.2, 300, 300, 80);
        expect(without.x).toBeLessThan(80);
        expect(withNames.x).toBeGreaterThanOrEqual(80);
    });
});

describe("layout helpers", () => {
    it("estimates legend rows", () => {
        expect(legendRowCount(["One", "Two"], 0)).toBe(1);
        expect(legendRowCount(["One", "Two", "Three", "Four"], 0)).toBe(2);
        expect(legendRowCount(["A long name", "Another long name", "Third"], 150)).toBe(3);
        expect(wrappingLegend("bottom", ["A"], 300)).toMatchObject({ height: 30, option: { type: "plain" } });
        expect(wrappingLegend("right", ["A"], 300).height).toBe(0);
    });

    it("builds the shared option base", () => {
        const option = baseOption(HYPER_LIGHT, defaultChartStyle);
        expect(option).toMatchObject({ animation: true, aria: { enabled: true } });
        expect(option.title).toBeUndefined();
    });

    it("formats percentages and number format properties", () => {
        expect(createPercentFormatter(1)(0.4567)).toBe("45.7%");
        expect(createPercentFormatter(0)(Number.NaN)).toBe("");
        expect(
            numberFormatFromProps({
                decimals: null,
                prefix: "$",
                suffix: "",
                thousandsSeparator: true,
                compactNumbers: false
            })
        ).toEqual({ decimals: -1, prefix: "$", suffix: "", thousandsSeparator: true, compact: false });
    });

    it("picks a readable ink", () => {
        expect(readableInk("#FFF6D0", "#111318", "#FFFFFF")).toBe("#111318");
        expect(readableInk("#5B21B6", "#111318", "#FFFFFF")).toBe("#FFFFFF");
        expect(readableInk("purple", "#111318", "#FFFFFF")).toBe("#FFFFFF");
    });

    it("reads literals from design-mode expressions", () => {
        expect(previewNumber(" 75 ")).toBe(75);
        expect(previewNumber("-0.5")).toBe(-0.5);
        expect(previewNumber("$currentObject/Progress")).toBeUndefined();
        expect(previewText("'Q1'")).toBe("Q1");
        expect(previewText("$x")).toBeUndefined();
    });
});

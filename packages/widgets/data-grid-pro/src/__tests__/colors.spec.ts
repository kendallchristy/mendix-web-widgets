import { BADGE_COLORS, resolveColor } from "../model/colors";

describe("resolveColor", () => {
    it("uses a configured color name, ignoring case and spaces", () => {
        expect(resolveColor(" Green ", "anything")).toBe("green");
    });

    it("picks the same color for the same text when nothing valid is configured", () => {
        const color = resolveColor(undefined, "Netherlands");
        expect(BADGE_COLORS).toContain(color);
        expect(resolveColor("not-a-color", "Netherlands")).toBe(color);
    });
});

import { gridTemplate, minGridWidth } from "../model/layout";
import { column } from "./fixtures";

describe("gridTemplate", () => {
    const fill = column({ id: "a", minWidth: 80, fillWeight: 2 });
    const fixed = column({ id: "b", widthMode: "fixed", fixedWidth: 120 });

    it("sizes fill columns with minmax and fixed columns in pixels", () => {
        expect(gridTemplate([fill, fixed], {}, 0, undefined)).toBe("minmax(80px, 2fr) 120px");
    });

    it("puts the leading column for checkboxes and chevrons first", () => {
        expect(gridTemplate([fixed], {}, 64, undefined)).toBe("64px 120px");
    });

    it("uses widths the user resized to", () => {
        expect(gridTemplate([fill, fixed], { a: 300 }, 0, undefined)).toBe("300px 120px");
    });

    it("widens a hovered column to its expanded width, never narrower than it already is", () => {
        const wide = column({ id: "c", widthMode: "fixed", fixedWidth: 100, expandedWidth: 200 });
        expect(gridTemplate([wide], {}, 0, "c")).toBe("200px");
        expect(gridTemplate([wide], { c: 260 }, 0, "c")).toBe("260px");
        expect(gridTemplate([wide], {}, 0, undefined)).toBe("100px");
    });
});

describe("minGridWidth", () => {
    it("adds up minimum, fixed and resized widths plus the leading column", () => {
        const columns = [
            column({ id: "a", minWidth: 80 }),
            column({ id: "b", widthMode: "fixed", fixedWidth: 120 }),
            column({ id: "c", minWidth: 50 })
        ];
        expect(minGridWidth(columns, { c: 200 }, 32)).toBe(32 + 80 + 120 + 200);
    });
});

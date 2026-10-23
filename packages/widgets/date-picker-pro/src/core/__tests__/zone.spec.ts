import { detectUtc, fromAttribute, toAttribute } from "../zone";

describe("zone conversion", () => {
    it("round-trips non-localized dates through wall-clock time", () => {
        const stored = new Date(Date.UTC(2026, 0, 10));
        const shown = fromAttribute(stored, true)!;
        expect([shown.getFullYear(), shown.getMonth(), shown.getDate(), shown.getHours()]).toEqual([2026, 0, 10, 0]);
        expect(toAttribute(shown, true)).toEqual(stored);
    });

    it("leaves localized dates alone", () => {
        const date = new Date(2026, 0, 10, 8);
        expect(fromAttribute(date, false)).toBe(date);
        expect(toAttribute(date, false)).toBe(date);
    });

    it("can't tell without a date-time formatter", () => {
        expect(detectUtc(undefined)).toBeUndefined();
        expect(detectUtc({ format: () => "" })).toBeUndefined();
    });
});

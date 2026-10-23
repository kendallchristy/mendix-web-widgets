import { builtInPresetValue, findActivePreset, presetFits } from "../presets";

const today = new Date(2026, 0, 14, 9, 0); // Wednesday
const day = (y: number, m: number, d: number): Date => new Date(y, m - 1, d);

describe("builtInPresetValue", () => {
    it.each([
        ["today", day(2026, 1, 14), day(2026, 1, 14)],
        ["yesterday", day(2026, 1, 13), day(2026, 1, 13)],
        ["thisWeek", day(2026, 1, 12), day(2026, 1, 18)],
        ["lastWeek", day(2026, 1, 5), day(2026, 1, 11)],
        ["thisMonth", day(2026, 1, 1), day(2026, 1, 31)],
        ["lastMonth", day(2025, 12, 1), day(2025, 12, 31)],
        ["lastQuarter", day(2025, 10, 1), day(2025, 12, 31)],
        ["thisYear", day(2026, 1, 1), day(2026, 12, 31)]
    ] as const)("%s", (id, start, end) => {
        expect(builtInPresetValue(id, today, 1)).toEqual({ start, end });
    });

    it("starts weeks on Sunday when asked", () => {
        expect(builtInPresetValue("thisWeek", today, 0).start).toEqual(day(2026, 1, 11));
    });
});

describe("presetFits", () => {
    it("offers only day presets for single dates", () => {
        expect(presetFits("today", "single", "day")).toBe(true);
        expect(presetFits("thisWeek", "single", "day")).toBe(false);
    });
    it("hides presets smaller than the picker's period", () => {
        expect(presetFits("thisWeek", "range", "month")).toBe(false);
        expect(presetFits("thisMonth", "range", "month")).toBe(true);
        expect(presetFits("thisYear", "range", "quarter")).toBe(true);
    });
});

describe("findActivePreset", () => {
    const presets = [
        { id: "thisMonth", label: "This month", value: builtInPresetValue("thisMonth", today, 1) },
        { id: "allTime", label: "All time", value: {} }
    ];
    it("matches by day, ignoring time", () => {
        const value = { start: day(2026, 1, 1), end: new Date(2026, 0, 31, 23, 59, 59) };
        expect(findActivePreset(presets, value, "range", "day")?.id).toBe("thisMonth");
    });
    it("matches All time on an empty value", () => {
        expect(findActivePreset(presets, {}, "range", "day")?.id).toBe("allTime");
    });
    it("is custom otherwise", () => {
        expect(findActivePreset(presets, { start: day(2026, 1, 2), end: day(2026, 1, 31) }, "range", "day")).toBeUndefined();
    });
});

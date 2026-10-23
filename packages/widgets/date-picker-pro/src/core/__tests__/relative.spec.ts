import { parseRelative } from "../relative";
import { enUS } from "./helpers";

// Wednesday 14 January 2026, 10:30
const now = new Date(2026, 0, 14, 10, 30);
const context = { now, weekStartsOn: 1 as const, locale: enUS };
const day = (y: number, m: number, d: number): Date => new Date(y, m - 1, d);
const parse = (text: string): ReturnType<typeof parseRelative> => parseRelative(text, context);

describe("parseRelative", () => {
    it.each([
        ["t", day(2026, 1, 14)],
        ["Today", day(2026, 1, 14)],
        ["y", day(2026, 1, 13)],
        ["tom", day(2026, 1, 15)],
        ["+7", day(2026, 1, 21)],
        ["-7d", day(2026, 1, 7)],
        ["+2w", day(2026, 1, 28)],
        ["-1m", day(2025, 12, 14)],
        ["+1 year", day(2027, 1, 14)],
        ["+1q", day(2026, 4, 14)],
        ["15", day(2026, 1, 15)],
        ["fri", day(2026, 1, 16)],
        ["wed", day(2026, 1, 14)],
        ["next wed", day(2026, 1, 21)],
        ["last wed", day(2026, 1, 7)],
        ["last mon", day(2026, 1, 12)]
    ])("%s is a date", (text, expected) => {
        expect(parse(text)).toEqual({ kind: "date", date: expected });
    });

    it("keeps the time for now", () => {
        expect(parse("now")).toEqual({ kind: "date", date: now });
    });

    it.each([
        ["this week", day(2026, 1, 12), day(2026, 1, 18)],
        ["last week", day(2026, 1, 5), day(2026, 1, 11)],
        ["last month", day(2025, 12, 1), day(2025, 12, 31)],
        ["next quarter", day(2026, 4, 1), day(2026, 6, 30)],
        ["this year", day(2026, 1, 1), day(2026, 12, 31)],
        ["last 7 days", day(2026, 1, 8), day(2026, 1, 14)],
        ["next 30 days", day(2026, 1, 14), day(2026, 2, 12)],
        ["ytd", day(2026, 1, 1), day(2026, 1, 14)],
        ["mtd", day(2026, 1, 1), day(2026, 1, 14)]
    ])("%s is a range", (text, start, end) => {
        expect(parse(text)).toEqual({ kind: "range", start, end });
    });

    it.each(["", "hello", "+7x", "32", "next blah"])("ignores %p", text => {
        expect(parse(text)).toBeUndefined();
    });
});

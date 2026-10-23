import { buildDate, formatDate, granularityOf, parseWithTokens, partsFromDate, tokenize } from "../pattern";
import { enUS } from "./helpers";

describe("tokenize", () => {
    it("splits segments, display tokens and literals", () => {
        expect(tokenize("dd/MM/yyyy")).toEqual([
            { kind: "segment", type: "day", letter: "d", length: 2 },
            { kind: "literal", text: "/" },
            { kind: "segment", type: "month", letter: "M", length: 2 },
            { kind: "literal", text: "/" },
            { kind: "segment", type: "year", letter: "y", length: 4 }
        ]);
    });

    it("reads quoted text as literals", () => {
        expect(tokenize("d 'de' MMMM")).toEqual([
            { kind: "segment", type: "day", letter: "d", length: 1 },
            { kind: "literal", text: " de " },
            { kind: "segment", type: "month", letter: "M", length: 4 }
        ]);
        expect(tokenize("HH'h'mm''")[1]).toEqual({
            kind: "literal",
            text: "h"
        });
    });
});

describe("granularityOf", () => {
    it.each([
        ["dd/MM/yyyy", "day"],
        ["MMMM yyyy", "month"],
        ["yyyy QQQ", "quarter"],
        ["yyyy", "year"],
        ["HH:mm", "time"],
        ["EEE d MMM yyyy HH:mm", "day"]
    ])("%s is a %s pattern", (pattern, expected) => {
        expect(granularityOf(tokenize(pattern))).toBe(expected);
    });
});

describe("formatDate", () => {
    const date = new Date(2026, 0, 9, 15, 4, 5);
    it.each([
        ["dd/MM/yyyy", "09/01/2026"],
        ["d MMM yy", "9 Jan 26"],
        ["EEEE d MMMM yyyy", "Friday 9 January 2026"],
        ["h:mm a", "3:04 PM"],
        ["HH:mm:ss", "15:04:05"],
        ["yyyy QQQ", "2026 Q1"],
        ["'Week' w", "Week 2"]
    ])("%s gives %s", (pattern, expected) => {
        expect(formatDate(date, tokenize(pattern), enUS)).toBe(expected);
    });
});

describe("buildDate", () => {
    const tokens = tokenize("dd/MM/yyyy");
    it("waits for every part", () => {
        expect(buildDate({ day: 1, month: 2 }, tokens)).toBeUndefined();
    });
    it("rejects dates that don't exist", () => {
        expect(buildDate({ day: 30, month: 2, year: 2026 }, tokens)).toBeNull();
    });
    it("keeps the time of the previous value for date-only patterns", () => {
        const reference = new Date(2020, 4, 4, 13, 30);
        expect(buildDate({ day: 2, month: 3, year: 2026 }, tokens, reference)).toEqual(new Date(2026, 2, 2, 13, 30));
    });
    it("handles 12-hour clocks", () => {
        const time = tokenize("hh:mm a");
        const reference = new Date(2026, 0, 5);
        expect(buildDate({ hour: 12, minute: 15, dayPeriod: 0 }, time, reference)).toEqual(new Date(2026, 0, 5, 0, 15));
        expect(buildDate({ hour: 1, minute: 0, dayPeriod: 1 }, time, reference)).toEqual(new Date(2026, 0, 5, 13, 0));
    });
    it("round-trips through parts", () => {
        const date = new Date(2026, 6, 31, 0, 0);
        expect(buildDate(partsFromDate(date, tokens), tokens)).toEqual(date);
    });
    it("uses the start of the period for month and quarter patterns", () => {
        expect(buildDate({ month: 5, year: 2026 }, tokenize("MMM yyyy"))).toEqual(new Date(2026, 4, 1));
        expect(buildDate({ quarter: 3, year: 2026 }, tokenize("yyyy QQQ"))).toEqual(new Date(2026, 6, 1));
    });
});

describe("parseWithTokens", () => {
    const tokens = tokenize("dd/MM/yyyy");
    it.each([
        ["10/01/2026", new Date(2026, 0, 10)],
        ["1/2/2026", new Date(2026, 1, 1)],
        ["01-02-2026", new Date(2026, 1, 1)],
        ["01022026", new Date(2026, 1, 1)],
        ["1/2/26", new Date(2026, 1, 1)]
    ])("reads %s", (text, expected) => {
        expect(parseWithTokens(text, tokens, enUS)).toEqual(expected);
    });

    it("refuses text that doesn't fit", () => {
        expect(parseWithTokens("31/02/2026", tokens, enUS)).toBeNull();
        expect(parseWithTokens("hello", tokens, enUS)).toBeNull();
        expect(parseWithTokens("10/01/2026 extra", tokens, enUS)).toBeNull();
    });

    it("reads month names and day periods", () => {
        expect(parseWithTokens("Sept 9, 2026", tokenize("MMM d, yyyy"), enUS)).toEqual(new Date(2026, 8, 9));
        expect(parseWithTokens("3:30 pm", tokenize("h:mm a"), enUS, new Date(2026, 0, 1))).toEqual(
            new Date(2026, 0, 1, 15, 30)
        );
        expect(parseWithTokens("2026 q2", tokenize("yyyy QQQ"), enUS)).toEqual(new Date(2026, 3, 1));
    });
});

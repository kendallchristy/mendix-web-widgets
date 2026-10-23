import { bucketDate, dateTimeFormat, formatBucket, nextDateLevel } from "../format/date";
import { createNumberFormatter } from "../format/number";

describe("createNumberFormatter", () => {
    it("shows up to two decimals by default", () => {
        const format = createNumberFormatter({
            decimals: -1,
            thousandsSeparator: true,
            compact: false,
            locale: "en-US"
        });
        expect(format(1234.5)).toBe("1,234.5");
        expect(format(2)).toBe("2");
        expect(format(undefined)).toBe("");
    });

    it("fixes decimals and drops the separator", () => {
        const format = createNumberFormatter({
            decimals: 2,
            thousandsSeparator: false,
            compact: false,
            locale: "en-US"
        });
        expect(format(1234.5)).toBe("1234.50");
    });

    it("puts the minus sign before the prefix", () => {
        const format = createNumberFormatter({
            decimals: 0,
            prefix: "$",
            suffix: " USD",
            thousandsSeparator: true,
            compact: false,
            locale: "en-US"
        });
        expect(format(-1200)).toBe("-$1,200 USD");
    });

    it("compacts large numbers", () => {
        const format = createNumberFormatter({
            decimals: -1,
            thousandsSeparator: true,
            compact: true,
            locale: "en-US"
        });
        expect(format(1234)).toBe("1.2K");
        expect(format(3_400_000)).toBe("3.4M");
    });
});

describe("date buckets", () => {
    const date = new Date(2026, 7, 13, 15, 30); // Thursday 13 August 2026

    it("buckets by each level", () => {
        expect(bucketDate(date, "year")).toMatchObject({
            key: "2026",
            start: new Date(2026, 0, 1),
            end: new Date(2027, 0, 1)
        });
        expect(bucketDate(date, "quarter")).toMatchObject({
            key: "2026-Q3",
            start: new Date(2026, 6, 1),
            end: new Date(2026, 9, 1)
        });
        expect(bucketDate(date, "month")).toMatchObject({ key: "2026-08", start: new Date(2026, 7, 1) });
        expect(bucketDate(date, "week")).toMatchObject({ start: new Date(2026, 7, 10), end: new Date(2026, 7, 17) });
        expect(bucketDate(date, "day")).toMatchObject({ key: "2026-08-13", start: new Date(2026, 7, 13) });
    });

    it("sorts bucket keys in time order", () => {
        const keys = [new Date(2026, 10, 2), new Date(2026, 1, 2), new Date(2025, 11, 30)].map(
            d => bucketDate(d, "month").key
        );
        expect([...keys].sort()).toEqual(["2025-12", "2026-02", "2026-11"]);
    });

    it("labels buckets, adding the year only when asked", () => {
        expect(formatBucket(bucketDate(date, "quarter"), "quarter", false, "en-US")).toBe("Q3");
        expect(formatBucket(bucketDate(date, "quarter"), "quarter", true, "en-US")).toBe("Q3 2026");
        expect(formatBucket(bucketDate(date, "month"), "month", false, "en-US")).toBe("Aug");
        expect(formatBucket(bucketDate(date, "day"), "day", true, "en-US")).toBe("Aug 13, 2026");
    });

    it("stops at the deepest level", () => {
        expect(nextDateLevel("year", "day")).toBe("quarter");
        expect(nextDateLevel("month", "month")).toBeUndefined();
    });
});

describe("dateTimeFormat", () => {
    it("creates each format once", () => {
        const format = dateTimeFormat("en-US", { month: "short" });
        expect(dateTimeFormat("en-US", { month: "short" })).toBe(format);
        expect(dateTimeFormat("en-GB", { month: "short" })).not.toBe(format);
        expect(format.format(new Date(2026, 9, 1))).toBe("Oct");
    });
});

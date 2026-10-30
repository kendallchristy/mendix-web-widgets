import { Big } from "big.js";

import type { ColumnsType } from "../../typings/DataGridProProps";
import { isSearchable, searchFilter } from "../model/search";

// Plain objects instead of real filter conditions, so tests can compare them.
jest.mock("mendix/filters/builders", () => {
    const fn =
        (name: string) =>
        (...args: unknown[]) => ({ fn: name, args });
    return {
        attribute: (id: string) => ({ attr: id }),
        literal: (value: unknown) => ({ value }),
        empty: () => ({ empty: true }),
        and: fn("and"),
        or: fn("or"),
        equals: fn("="),
        notEqual: fn("!="),
        contains: fn("contains")
    };
});

function column(type: string, overrides: Partial<ColumnsType> = {}, universe?: string[]): ColumnsType {
    return {
        showContentAs: "attribute",
        searchable: true,
        visible: { status: "available", value: true },
        attribute: {
            id: `attr-${type}`,
            type,
            filterable: true,
            isList: false,
            universe,
            formatter: { format: (key: string) => `Caption ${key}` }
        },
        ...overrides
    } as unknown as ColumnsType;
}

describe("search filter", () => {
    it("matches nothing extra for an empty search", () => {
        expect(searchFilter([column("String")], "  ")).toBeUndefined();
    });

    it("looks for the text in text columns", () => {
        expect(searchFilter([column("String")], " acme ")).toEqual({
            fn: "contains",
            args: [{ attr: "attr-String" }, { value: "acme" }]
        });
    });

    it("combines columns with or", () => {
        const filter = searchFilter([column("String"), column("HashString")], "acme") as unknown as { fn: string };
        expect(filter.fn).toBe("or");
    });

    it("matches enumeration captions", () => {
        const filter = searchFilter([column("Enum", {}, ["open", "closed"])], "CAPTION OP");
        expect(filter).toEqual({ fn: "=", args: [{ attr: "attr-Enum" }, { value: "open" }] });
    });

    it("matches numbers only when the text is a number", () => {
        expect(searchFilter([column("Integer"), column("String")], "1,200")).toEqual({
            fn: "or",
            args: [
                { fn: "=", args: [{ attr: "attr-Integer" }, { value: new Big(1200) }] },
                { fn: "contains", args: [{ attr: "attr-String" }, { value: "1,200" }] }
            ]
        });
    });

    it("matches no rows when no column can match the text", () => {
        expect(searchFilter([column("Integer")], "abc")).toEqual({
            fn: "and",
            args: [
                { fn: "=", args: [{ attr: "attr-Integer" }, { empty: true }] },
                { fn: "!=", args: [{ attr: "attr-Integer" }, { empty: true }] }
            ]
        });
    });

    it("leaves out columns that can't be searched", () => {
        expect(isSearchable(column("String", { searchable: false }))).toBe(false);
        expect(isSearchable(column("String", { showContentAs: "dynamicText" }))).toBe(false);
        expect(isSearchable(column("Boolean"))).toBe(false);
        expect(isSearchable(column("String", { visible: { value: false } as never }))).toBe(false);
        expect(searchFilter([column("Boolean")], "yes")).toBeUndefined();
    });
});

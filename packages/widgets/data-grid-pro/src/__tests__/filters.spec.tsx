import { act, fireEvent, render, screen } from "@testing-library/react";
import { Big } from "big.js";

import { HeaderFilter } from "../components/HeaderFilter";
import {
    columnFilter,
    describeFilter,
    filterCondition,
    isActive,
    parseNumberFilter,
    type ColumnFilter
} from "../model/filters";

jest.mock("mendix/filters/builders", () => {
    const fn =
        (name: string) =>
        (...args: unknown[]) => ({ fn: name, args });
    return {
        attribute: (id: string) => ({ attr: id }),
        literal: (value: unknown) => ({ value }),
        and: fn("and"),
        or: fn("or"),
        equals: fn("="),
        contains: fn("contains"),
        greaterThan: fn(">"),
        greaterThanOrEqual: fn(">="),
        lessThan: fn("<"),
        lessThanOrEqual: fn("<="),
        dayGreaterThanOrEqual: fn("day>="),
        dayLessThanOrEqual: fn("day<=")
    };
});

const filter = (kind: ColumnFilter["kind"], options: ColumnFilter["options"] = []): ColumnFilter => ({
    kind,
    attribute: "attr" as never,
    options
});
const id = { attr: "attr" };

describe("number filter text", () => {
    it.each([
        ["12", "=", "12"],
        [">100", ">", "100"],
        [">= 1,500", ">=", "1500"],
        ["<-3.5", "<", "-3.5"],
        ["<=0", "<=", "0"],
        ["=7", "=", "7"]
    ])("reads %s", (text, op, value) => {
        expect(parseNumberFilter(text)).toEqual({ op, value: new Big(value) });
    });

    it("reads ranges", () => {
        expect(parseNumberFilter("10..20")).toEqual({ op: "range", from: new Big(10), to: new Big(20) });
    });

    it.each(["abc", ">", "1..", "1 2 x"])("rejects %s", text => {
        expect(parseNumberFilter(text)).toBeUndefined();
    });
});

describe("filter conditions", () => {
    it("filters text by contains", () => {
        expect(filterCondition(filter("text"), { kind: "text", text: " acme " })).toEqual({
            fn: "contains",
            args: [id, { value: "acme" }]
        });
    });

    it("filters number ranges inclusively", () => {
        expect(filterCondition(filter("number"), { kind: "number", text: "10..20" })).toEqual({
            fn: "and",
            args: [
                { fn: ">=", args: [id, { value: new Big(10) }] },
                { fn: "<=", args: [id, { value: new Big(20) }] }
            ]
        });
    });

    it("ignores number text it can't read", () => {
        expect(filterCondition(filter("number"), { kind: "number", text: "lots" })).toBeUndefined();
        expect(isActive({ kind: "number", text: "lots" })).toBe(false);
    });

    it("filters dates by whole days", () => {
        expect(filterCondition(filter("date"), { kind: "date", from: "2026-01-31" })).toEqual({
            fn: "day>=",
            args: [id, { value: new Date(2026, 0, 31) }]
        });
    });

    it("matches any picked enumeration value", () => {
        expect(filterCondition(filter("enum"), { kind: "enum", values: ["a", "b"] })).toEqual({
            fn: "or",
            args: [
                { fn: "=", args: [id, { value: "a" }] },
                { fn: "=", args: [id, { value: "b" }] }
            ]
        });
    });

    it("filters booleans", () => {
        expect(filterCondition(filter("boolean"), { kind: "boolean", value: false })).toEqual({
            fn: "=",
            args: [id, { value: false }]
        });
    });

    it("describes filters for chips", () => {
        const options = [
            { key: "a", caption: "Alpha" },
            { key: "b", caption: "Beta" },
            { key: "c", caption: "Gamma" }
        ];
        const format = (date: Date): string => date.toISOString().slice(0, 10);
        expect(describeFilter(filter("number"), { kind: "number", text: ">=5" }, format)).toBe(">= 5");
        expect(describeFilter(filter("enum", options), { kind: "enum", values: ["a", "b", "c"] }, format)).toBe(
            "Alpha, Beta +1"
        );
        expect(describeFilter(filter("text"), { kind: "text", text: "acme" }, format)).toBe('contains "acme"');
    });

    it("builds a filter only for filterable single attributes", () => {
        const attr = (overrides: object): never =>
            ({
                id: "x",
                type: "Enum",
                filterable: true,
                isList: false,
                universe: ["open"],
                formatter: { format: () => "Open" },
                ...overrides
            }) as never;
        expect(columnFilter(attr({}))).toEqual({
            kind: "enum",
            attribute: "x",
            options: [{ key: "open", caption: "Open" }]
        });
        expect(columnFilter(attr({ filterable: false }))).toBeUndefined();
        expect(columnFilter(attr({ isList: true }))).toBeUndefined();
        expect(columnFilter(attr({ type: "Binary" }))).toBeUndefined();
    });
});

describe("HeaderFilter", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("filters text once typing pauses", () => {
        const onChange = jest.fn();
        render(<HeaderFilter filter={filter("text")} label="Name" value={undefined} onChange={onChange} />);
        fireEvent.change(screen.getByRole("textbox", { name: "Filter Name" }), { target: { value: "ac" } });
        expect(onChange).not.toHaveBeenCalled();
        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(onChange).toHaveBeenCalledWith({ kind: "text", text: "ac" });
    });

    it("empties the input when the filter is removed elsewhere", () => {
        const { rerender } = render(
            <HeaderFilter
                filter={filter("text")}
                label="Name"
                value={{ kind: "text", text: "ac" }}
                onChange={jest.fn()}
            />
        );
        expect(screen.getByRole("textbox")).toHaveValue("ac");
        rerender(<HeaderFilter filter={filter("text")} label="Name" value={undefined} onChange={jest.fn()} />);
        expect(screen.getByRole("textbox")).toHaveValue("");
    });

    it("marks number text it can't read", () => {
        render(
            <HeaderFilter
                filter={filter("number")}
                label="Score"
                value={{ kind: "number", text: "lots" }}
                onChange={jest.fn()}
            />
        );
        expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    });

    it("picks enumeration values from a panel", () => {
        const onChange = jest.fn();
        render(
            <HeaderFilter
                filter={filter("enum", [
                    { key: "a", caption: "Alpha" },
                    { key: "b", caption: "Beta" }
                ])}
                label="Stage"
                value={{ kind: "enum", values: ["a"] }}
                onChange={onChange}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "Filter Stage: Alpha" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Beta" }));
        expect(onChange).toHaveBeenCalledWith({ kind: "enum", values: ["a", "b"] });
        fireEvent.click(screen.getByRole("checkbox", { name: "Alpha" }));
        expect(onChange).toHaveBeenLastCalledWith(undefined);
    });

    it("filters booleans with a select", () => {
        const onChange = jest.fn();
        render(<HeaderFilter filter={filter("boolean")} label="Active" value={undefined} onChange={onChange} />);
        fireEvent.change(screen.getByRole("combobox", { name: "Filter Active" }), { target: { value: "false" } });
        expect(onChange).toHaveBeenCalledWith({ kind: "boolean", value: false });
    });
});

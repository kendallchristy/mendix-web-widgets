import { act, renderHook } from "@testing-library/react";
import type { ListValue, ObjectItem } from "mendix";

import { useSelectAll } from "../model/useSelectAll";
import { items } from "./fixtures";

/** A data source over `rows` whose setOffset and setLimit take effect on the next rerender. */
function source(rows: ObjectItem[]): { value(): ListValue; requests: Array<[number, number]> } {
    let offset = 0;
    let limit = 150;
    const requests: Array<[number, number]> = [];
    const value = (): ListValue =>
        ({
            status: "available",
            offset,
            limit,
            items: rows.slice(offset, offset + limit),
            totalCount: rows.length,
            setOffset: (next: number) => {
                offset = next;
            },
            setLimit: (next: number) => {
                limit = next;
                requests.push([offset, limit]);
            }
        }) as unknown as ListValue;
    return { value, requests };
}

async function settle(rerender: () => void, rounds = 20): Promise<void> {
    for (let i = 0; i < rounds; i++) {
        await act(async () => {
            rerender();
            await Promise.resolve();
        });
    }
}

describe("Select all across pages", () => {
    it("fetches the data source in batches, selects every row and restores the window", async () => {
        const rows = items(1200);
        const ds = source(rows);
        const onDone = jest.fn();
        const restore = jest.fn();
        const { result, rerender } = renderHook(() => useSelectAll(ds.value(), 50000, onDone, restore));
        act(() => result.current.start());
        expect(result.current.progress).toEqual({ loaded: 0, target: 1200 });
        await settle(() => rerender());
        expect(ds.requests).toEqual([
            [0, 500],
            [500, 500],
            [1000, 200]
        ]);
        expect(onDone).toHaveBeenCalledWith(rows);
        expect(restore).toHaveBeenCalled();
        expect(result.current.progress).toBeUndefined();
    });

    it("stops at the maximum", async () => {
        const rows = items(1200);
        const ds = source(rows);
        const onDone = jest.fn();
        const { result, rerender } = renderHook(() => useSelectAll(ds.value(), 700, onDone, () => undefined));
        act(() => result.current.start());
        await settle(() => rerender());
        expect(onDone).toHaveBeenCalledWith(rows.slice(0, 700));
    });

    it("selects nothing when cancelled", async () => {
        const ds = source(items(1200));
        const onDone = jest.fn();
        const restore = jest.fn();
        const { result, rerender } = renderHook(() => useSelectAll(ds.value(), 50000, onDone, restore));
        act(() => result.current.start());
        act(() => result.current.cancel());
        await settle(() => rerender());
        expect(onDone).not.toHaveBeenCalled();
        expect(restore).toHaveBeenCalled();
        expect(result.current.progress).toBeUndefined();
    });
});

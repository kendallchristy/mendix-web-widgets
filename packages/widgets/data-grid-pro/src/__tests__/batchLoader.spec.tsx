import { act, renderHook } from "@testing-library/react";
import type { ListValue, ObjectItem } from "mendix";

import { useBatchLoader } from "../model/useBatchLoader";
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

describe("Batch loader", () => {
    it("pages through the data source and restores the window", async () => {
        const rows = items(1200);
        const ds = source(rows);
        const restore = jest.fn();
        const seen: ObjectItem[] = [];
        const { result, rerender } = renderHook(() => useBatchLoader(ds.value(), restore));
        let done: Promise<boolean> | undefined;
        act(() => {
            done = result.current.run("select", 50000, batch => seen.push(...batch));
        });
        expect(result.current.progress).toEqual({ task: "select", loaded: 0, target: 1200 });
        await settle(() => rerender());
        await expect(done).resolves.toBe(true);
        expect(ds.requests).toEqual([
            [0, 500],
            [500, 500],
            [1000, 200]
        ]);
        expect(seen).toEqual(rows);
        expect(restore).toHaveBeenCalled();
        expect(result.current.progress).toBeUndefined();
    });

    it("stops at the maximum", async () => {
        const rows = items(1200);
        const ds = source(rows);
        const seen: ObjectItem[] = [];
        const { result, rerender } = renderHook(() => useBatchLoader(ds.value(), () => undefined));
        act(() => {
            void result.current.run("export", 700, batch => seen.push(...batch));
        });
        await settle(() => rerender());
        expect(seen).toEqual(rows.slice(0, 700));
    });

    it("reports a cancelled run", async () => {
        const ds = source(items(1200));
        const restore = jest.fn();
        const onBatch = jest.fn();
        const { result, rerender } = renderHook(() => useBatchLoader(ds.value(), restore));
        let done: Promise<boolean> | undefined;
        act(() => {
            done = result.current.run("select", 50000, onBatch);
        });
        act(() => result.current.cancel());
        await settle(() => rerender());
        await expect(done).resolves.toBe(false);
        expect(onBatch).not.toHaveBeenCalled();
        expect(restore).toHaveBeenCalled();
        expect(result.current.progress).toBeUndefined();
    });
});

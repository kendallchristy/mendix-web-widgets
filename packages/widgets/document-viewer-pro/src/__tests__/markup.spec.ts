import { act, renderHook } from "@testing-library/react";

import { useMarkup, type MarkupSource } from "../components/useMarkup";
import {
    fromView,
    hitTest,
    mergeLineRects,
    parseMarkup,
    rectFromView,
    rectToView,
    serializeMarkup,
    thinStroke,
    toView,
    type Markup,
    type Rect
} from "../core/markup";

const close = (actual: number[], expected: number[]): void => {
    actual.forEach((value, i) => expect(value).toBeCloseTo(expected[i], 6));
};

describe("markup JSON", () => {
    it("reads what it writes and rounds positions", () => {
        const items: Markup[] = [
            { id: "a", type: "highlight", page: 1, color: "#fab005", rects: [[0.123456, 0.2, 0.3, 0.02]], text: "Hi" },
            { id: "b", type: "note", page: 2, color: "#40c057", x: 0.5, y: 0.25, comment: "Check", author: "Sam" },
            { id: "c", type: "ink", page: 1, color: "#fa5252", strokes: [[0.1, 0.1, 0.2, 0.2]], width: 0.003 },
            { id: "d", type: "area", page: 3, color: "#228be6", rect: [0.1, 0.1, 0.5, 0.5] }
        ];
        const json = serializeMarkup(items);
        expect(JSON.parse(json).version).toBe(1);
        const read = parseMarkup(json);
        expect(read).toHaveLength(4);
        expect((read[0] as { rects: Rect[] }).rects[0][0]).toBe(0.1235);
        expect(read[1]).toMatchObject({ type: "note", comment: "Check", author: "Sam" });
    });

    it("skips what it doesn't recognize instead of failing", () => {
        expect(parseMarkup(undefined)).toEqual([]);
        expect(parseMarkup("not json")).toEqual([]);
        const read = parseMarkup(
            JSON.stringify({
                items: [
                    { id: "ok", type: "area", page: 1, color: "red", rect: [0, 0, 1, 1] },
                    { id: "bad-page", type: "area", page: 0, rect: [0, 0, 1, 1] },
                    { id: "bad-type", type: "stamp", page: 1 },
                    { type: "note", page: 1, x: 0, y: 0 }
                ]
            })
        );
        expect(read.map(item => item.id)).toEqual(["ok"]);
    });
});

describe("markup positions", () => {
    it("turns page positions into view positions and back for every quarter turn", () => {
        for (const rotation of [0, 90, 180, 270]) {
            const [x, y] = toView(0.2, 0.7, rotation);
            close(fromView(x, y, rotation), [0.2, 0.7]);
        }
        // A quarter turn clockwise moves the top left corner to the top right.
        close(toView(0, 0, 90), [1, 0]);
        close(rectToView([0.1, 0.2, 0.3, 0.1], 90), [0.7, 0.1, 0.1, 0.3]);
        close(rectFromView(rectToView([0.1, 0.2, 0.3, 0.1], 270), 270), [0.1, 0.2, 0.3, 0.1]);
    });

    it("joins word rectangles into one per line", () => {
        const lines = mergeLineRects([
            [0.1, 0.1, 0.1, 0.02],
            [0.21, 0.1005, 0.1, 0.02],
            [0.1, 0.13, 0.2, 0.02],
            [0.5, 0.5, 0.0001, 0.02]
        ]);
        expect(lines).toHaveLength(2);
        close(lines[0], [0.1, 0.1, 0.21, 0.0205]);
    });

    it("thins drawings but keeps both ends", () => {
        const points = [0, 0, 0.0001, 0, 0.0002, 0, 0.01, 0, 0.0101, 0];
        expect(thinStroke(points)).toEqual([0, 0, 0.01, 0, 0.0101, 0]);
    });

    it("finds the topmost markup under a point", () => {
        const items: Markup[] = [
            { id: "area", type: "area", page: 1, color: "", rect: [0.1, 0.1, 0.5, 0.5] },
            { id: "ink", type: "ink", page: 1, color: "", strokes: [[0.2, 0.3, 0.4, 0.3]], width: 0.003 },
            { id: "other", type: "area", page: 2, color: "", rect: [0, 0, 1, 1] }
        ];
        expect(hitTest(items, 1, 0.3, 0.301, 1.4)?.id).toBe("ink");
        expect(hitTest(items, 1, 0.3, 0.4, 1.4)?.id).toBe("area");
        expect(hitTest(items, 1, 0.9, 0.9, 1.4)).toBeUndefined();
    });
});

describe("useMarkup", () => {
    function setup(json?: string, editable = true) {
        const save = jest.fn();
        const source = (value: string | undefined): MarkupSource => ({ json: value, editable, author: "Sam", save });
        const hook = renderHook(({ key, value }) => useMarkup(key, source(value)), {
            initialProps: { key: "file-1", value: json }
        });
        return { ...hook, save, source };
    }
    const note = { type: "note" as const, page: 1, color: "#fab005", x: 0.5, y: 0.5 };

    it("adds markup with an author and date, writes it back, and undoes and redoes", () => {
        const { result, save } = setup();
        act(() => {
            result.current.add(note);
        });
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toMatchObject({ author: "Sam", type: "note" });
        expect(parseMarkup(save.mock.calls[0][0])).toHaveLength(1);
        act(() => result.current.undo());
        expect(result.current.items).toHaveLength(0);
        expect(result.current.canRedo).toBe(true);
        act(() => result.current.redo());
        expect(result.current.items).toHaveLength(1);
    });

    it("builds on the latest change when two happen before a render", () => {
        const { result } = setup();
        act(() => {
            result.current.add(note);
            result.current.add({ ...note, x: 0.1 });
        });
        expect(result.current.items).toHaveLength(2);
    });

    it("keeps its history when the app echoes the JSON, and reloads when the app changes it", () => {
        const { result, save, rerender } = setup();
        act(() => {
            result.current.add(note);
        });
        rerender({ key: "file-1", value: save.mock.calls[0][0] });
        expect(result.current.canUndo).toBe(true);
        const other = serializeMarkup([{ id: "x", type: "area", page: 1, color: "", rect: [0, 0, 0.5, 0.5] }]);
        rerender({ key: "file-1", value: other });
        expect(result.current.items.map(item => item.id)).toEqual(["x"]);
        expect(result.current.canUndo).toBe(false);
        rerender({ key: "file-2", value: undefined });
        expect(result.current.items).toEqual([]);
    });

    it("changes nothing when markup isn't editable", () => {
        const { result, save } = setup(undefined, false);
        act(() => {
            result.current.add(note);
        });
        expect(result.current.items).toHaveLength(0);
        expect(save).not.toHaveBeenCalled();
    });
});

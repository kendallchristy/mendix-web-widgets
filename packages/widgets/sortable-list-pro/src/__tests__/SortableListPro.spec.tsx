import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Big from "big.js";

import { SortableListPro } from "../SortableListPro";
import type { SortableListProContainerProps } from "../../typings/SortableListProProps";

import { action, attribute, dynamic, expression, listValue, polyfillDom, store, widgets, type Store } from "./fixtures";

beforeAll(polyfillDom);

function setup(overrides: Partial<SortableListProContainerProps> = {}): {
    data: Store;
    props: SortableListProContainerProps;
} {
    // Deliberately out of order in the data source: the widget sorts by the sort attribute.
    const data = store([
        { id: "a", title: "Alpha", sort: new Big(2) },
        { id: "b", title: "Bravo", sort: new Big(1) },
        { id: "c", title: "Charlie", sort: new Big(3) }
    ]);
    const props = {
        name: "list",
        class: "",
        datasource: listValue(["a", "b", "c"]),
        content: widgets(item => <span>{data.rows.get(item.id)!.title}</span>),
        sortAttribute: attribute(data, "sort", "Decimal"),
        pageSize: 100,
        layout: "vertical",
        gap: 8,
        tileWidth: 220,
        heightMode: "auto",
        height: 480,
        dragHandle: "item",
        canDrag: expression(() => true),
        group: "",
        listName: dynamic("List"),
        canReceive: dynamic(true),
        onMove: action(data, "onMove"),
        indicator: "makeRoom",
        animation: "off",
        preview: "snapshot",
        itemLabel: expression(item => data.rows.get(item.id)!.title),
        instructions: dynamic("Press Space to pick up."),
        liftedText: dynamic("Picked up [item]."),
        movedText: dynamic("[item], position [position] of [count]."),
        droppedText: dynamic("Dropped [item] at position [position] of [count]."),
        cancelledText: dynamic("Cancelled."),
        ...overrides
    } as unknown as SortableListProContainerProps;
    return { data, props };
}

const titles = (): string[] => screen.getAllByRole("listitem").map(item => item.textContent ?? "");

describe("SortableListPro", () => {
    it("shows the items in sort attribute order", () => {
        const { props } = setup();
        render(<SortableListPro {...props} />);
        expect(titles()).toEqual(["Bravo", "Alpha", "Charlie"]);
    });

    it("moves an item with the keyboard and saves the new sort value", async () => {
        const { data, props } = setup();
        render(<SortableListPro {...props} />);
        const bravo = screen.getByLabelText("Bravo");
        bravo.focus();
        act(() => {
            fireEvent.keyDown(bravo, { key: " " });
        });
        act(() => {
            fireEvent.keyDown(bravo, { key: "ArrowDown" });
        });
        act(() => {
            fireEvent.keyDown(bravo, { key: "ArrowDown" });
        });
        act(() => {
            fireEvent.keyDown(bravo, { key: " " });
        });
        expect(data.rows.get("b")!.sort!.toString()).toBe("4");
        expect(data.log).toContain('onMove b {"moved":"true","oldPosition":"1","newPosition":"3"}');
        expect(titles()).toEqual(["Alpha", "Charlie", "Bravo"]);
        await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Dropped Bravo at position 3 of 3."));
    });

    it("puts the item back when the move is cancelled", () => {
        const { data, props } = setup();
        render(<SortableListPro {...props} />);
        const alpha = screen.getByLabelText("Alpha");
        act(() => {
            fireEvent.keyDown(alpha, { key: " " });
        });
        act(() => {
            fireEvent.keyDown(alpha, { key: "ArrowUp" });
        });
        act(() => {
            fireEvent.keyDown(alpha, { key: "Escape" });
        });
        expect(data.log).toEqual([]);
        expect(titles()).toEqual(["Bravo", "Alpha", "Charlie"]);
    });

    it("doesn't pick up items that can't be dragged", () => {
        const { data, props } = setup({ canDrag: expression(item => item.id !== "a") });
        render(<SortableListPro {...props} />);
        const alpha = screen.getByLabelText("Alpha");
        act(() => {
            fireEvent.keyDown(alpha, { key: " " });
        });
        act(() => {
            fireEvent.keyDown(alpha, { key: "ArrowDown" });
        });
        act(() => {
            fireEvent.keyDown(alpha, { key: " " });
        });
        expect(data.log).toEqual([]);
        expect(alpha).toHaveAttribute("aria-disabled", "true");
    });
});

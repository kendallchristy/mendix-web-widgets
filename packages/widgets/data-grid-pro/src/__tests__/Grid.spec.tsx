import { fireEvent, render, screen, type RenderResult } from "@testing-library/react";
import type { ObjectItem } from "mendix";
import type { ReactElement } from "react";

import { Grid, type GridProps } from "../components/Grid";
import { column, gridData, items, noSelection } from "./fixtures";

// jsdom has no layout. Give elements a size so the virtualizer renders rows.
beforeAll(() => {
    // Newer browsers return a Promise from scrollTo.
    Element.prototype.scrollTo = (() => Promise.resolve()) as unknown as typeof Element.prototype.scrollTo;
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
});

afterAll(() => jest.restoreAllMocks());

function grid(overrides: Partial<GridProps> = {}): ReactElement {
    return (
        <Grid
            columns={[column()]}
            data={gridData(items(20))}
            rowHeight={32}
            widths={{}}
            onResize={() => undefined}
            onReorder={undefined}
            sort={undefined}
            onSort={() => undefined}
            selection={noSelection}
            renderDetail={(item: ObjectItem) => `Details ${item.id}`}
            expandOnRowClick={false}
            singleExpand={false}
            rowClass={() => undefined}
            onRowAction={undefined}
            clickTrigger="single"
            stripes={false}
            pinFirstColumn={false}
            empty="No results"
            scrollResetKey=""
            ariaLabel="Grid"
            {...overrides}
        />
    );
}

function renderGrid(overrides: Partial<GridProps> = {}): RenderResult {
    return render(grid(overrides));
}

const expandButton = (row: number): HTMLElement => screen.getAllByRole("button", { name: "Expand row" })[row];

describe("Grid row details", () => {
    it("opens details with the chevron", () => {
        renderGrid();
        fireEvent.click(expandButton(1));
        expect(screen.getByText("Details 1")).toBeInTheDocument();
    });

    it("ignores row clicks when only the chevron expands", () => {
        renderGrid();
        fireEvent.click(screen.getByText("Row 1"));
        expect(screen.queryByText("Details 1")).not.toBeInTheDocument();
    });

    it("opens and closes details with a row click when that is turned on", () => {
        renderGrid({ expandOnRowClick: true });
        fireEvent.click(screen.getByText("Row 1"));
        expect(screen.getByText("Details 1")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Row 1"));
        expect(screen.queryByText("Details 1")).not.toBeInTheDocument();
    });

    it("keeps details open when clicking inside them", () => {
        renderGrid({ expandOnRowClick: true });
        fireEvent.click(screen.getByText("Row 1"));
        fireEvent.click(screen.getByText("Details 1"));
        expect(screen.getByText("Details 1")).toBeInTheDocument();
    });

    it("keeps several rows open by default", () => {
        renderGrid({ expandOnRowClick: true });
        fireEvent.click(screen.getByText("Row 1"));
        fireEvent.click(screen.getByText("Row 3"));
        expect(screen.getByText("Details 1")).toBeInTheDocument();
        expect(screen.getByText("Details 3")).toBeInTheDocument();
    });

    it("closes the open row when another opens, with one open at a time", () => {
        renderGrid({ expandOnRowClick: true, singleExpand: true });
        fireEvent.click(screen.getByText("Row 1"));
        fireEvent.click(screen.getByText("Row 3"));
        expect(screen.queryByText("Details 1")).not.toBeInTheDocument();
        expect(screen.getByText("Details 3")).toBeInTheDocument();
    });

    it("ignores the second click of a double click, so a double click action leaves the row open", () => {
        const onRowAction = jest.fn();
        renderGrid({ expandOnRowClick: true, onRowAction, clickTrigger: "double" });
        const cell = screen.getByText("Row 1");
        fireEvent.click(cell, { detail: 1 });
        fireEvent.click(cell, { detail: 2 });
        fireEvent.doubleClick(cell);
        expect(screen.getByText("Details 1")).toBeInTheDocument();
        expect(onRowAction).toHaveBeenCalledTimes(1);
    });

    it("toggles the focused row's details with Enter", () => {
        renderGrid();
        const cell = screen.getByText("Row 2");
        cell.focus();
        fireEvent.keyDown(cell, { key: "Enter" });
        expect(screen.getByText("Details 2")).toBeInTheDocument();
    });
});

describe("Grid sorting", () => {
    it("scrolls back to the top after a sort without breaking effect cleanup", () => {
        const errors = jest.spyOn(console, "error").mockImplementation(() => undefined);
        const { rerender, unmount } = renderGrid({ scrollResetKey: "a" });
        rerender(grid({ scrollResetKey: "b" }));
        rerender(grid({ scrollResetKey: "c" }));
        expect(() => unmount()).not.toThrow();
        expect(errors).not.toHaveBeenCalled();
        errors.mockRestore();
    });
});

describe("Grid selection", () => {
    it("clears the selection with Escape", () => {
        const clear = jest.fn();
        renderGrid({ selection: { ...noSelection, mode: "multi", count: 2, clear } });
        const cell = screen.getByText("Row 2");
        cell.focus();
        fireEvent.keyDown(cell, { key: "Escape" });
        expect(clear).toHaveBeenCalled();
    });
});

describe("Grid column reordering", () => {
    // jsdom has no PointerEvent, so pointer events would lose their coordinates and button.
    beforeAll(() => {
        if (!("PointerEvent" in window)) {
            class PointerEvent extends MouseEvent {
                readonly pointerId: number;
                constructor(type: string, init: PointerEventInit = {}) {
                    super(type, init);
                    this.pointerId = init.pointerId ?? 0;
                }
            }
            Object.assign(window, { PointerEvent });
        }
    });

    function rect(left: number, width: number): DOMRect {
        return { left, width, right: left + width, top: 0, bottom: 32, height: 32, x: left, y: 0 } as DOMRect;
    }

    function renderThreeColumns(onReorder: jest.Mock, onSort = jest.fn()): HTMLElement[] {
        renderGrid({
            columns: [
                column({ id: "c0", header: "A", sortAttribute: "a" as never }),
                column({ id: "c1", header: "B" }),
                column({ id: "c2", header: "C" })
            ],
            onReorder,
            onSort
        });
        const cells = ["c0", "c1", "c2"].map(id =>
            document.querySelector<HTMLElement>(`.dgp-hcell[data-col="${id}"]`)!
        );
        cells.forEach((cell, i) => jest.spyOn(cell, "getBoundingClientRect").mockReturnValue(rect(i * 100, 100)));
        return cells;
    }

    it("drops a dragged header in front of the column under the pointer", () => {
        const onReorder = jest.fn();
        const cells = renderThreeColumns(onReorder);
        fireEvent.pointerDown(cells[0], { button: 0, clientX: 20, pointerId: 1 });
        fireEvent.pointerMove(cells[0], { clientX: 160, pointerId: 1 });
        expect(cells[2]).toHaveClass("dgp-hcell--drop-before");
        fireEvent.pointerUp(cells[0], { clientX: 160, pointerId: 1 });
        expect(onReorder).toHaveBeenCalledWith("c0", "c2");
    });

    it("drops at the end past the last column's middle", () => {
        const onReorder = jest.fn();
        const cells = renderThreeColumns(onReorder);
        fireEvent.pointerDown(cells[0], { button: 0, clientX: 20, pointerId: 1 });
        fireEvent.pointerMove(cells[0], { clientX: 290, pointerId: 1 });
        fireEvent.pointerUp(cells[0], { clientX: 290, pointerId: 1 });
        expect(onReorder).toHaveBeenCalledWith("c0", undefined);
    });

    it("doesn't sort when a drag ends on the header", () => {
        const onReorder = jest.fn();
        const onSort = jest.fn();
        const cells = renderThreeColumns(onReorder, onSort);
        const button = screen.getByRole("button", { name: /A/ });
        fireEvent.pointerDown(button, { button: 0, clientX: 20, pointerId: 1 });
        fireEvent.pointerMove(button, { clientX: 160, pointerId: 1 });
        fireEvent.pointerUp(button, { clientX: 160, pointerId: 1 });
        fireEvent.click(button);
        expect(onSort).not.toHaveBeenCalled();
        expect(cells[0]).toBeInTheDocument();
    });

    it("still sorts on a plain click", () => {
        const onSort = jest.fn();
        renderThreeColumns(jest.fn(), onSort);
        const button = screen.getByRole("button", { name: /A/ });
        fireEvent.pointerDown(button, { button: 0, clientX: 20, pointerId: 1 });
        fireEvent.pointerUp(button, { clientX: 21, pointerId: 1 });
        fireEvent.click(button);
        expect(onSort).toHaveBeenCalledWith("c0");
    });
});

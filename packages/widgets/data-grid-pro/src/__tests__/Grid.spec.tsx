import { fireEvent, render, screen } from "@testing-library/react";
import type { ObjectItem } from "mendix";

import { Grid, type GridProps } from "../components/Grid";
import { column, gridData, items, noSelection } from "./fixtures";

// jsdom has no layout. Give elements a size so the virtualizer renders rows.
beforeAll(() => {
    Element.prototype.scrollTo = () => undefined;
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
});

afterAll(() => jest.restoreAllMocks());

function renderGrid(overrides: Partial<GridProps> = {}): void {
    render(
        <Grid
            columns={[column()]}
            data={gridData(items(20))}
            rowHeight={32}
            widths={{}}
            onResize={() => undefined}
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

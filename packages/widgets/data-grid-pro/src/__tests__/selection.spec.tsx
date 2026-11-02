import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ListValue, ObjectItem, SelectionMultiValue } from "mendix";

import type { DataGridProContainerProps } from "../../typings/DataGridProProps";
import { DataGridPro } from "../DataGridPro";
import { items } from "./fixtures";

beforeAll(() => {
    Element.prototype.scrollTo = (() => Promise.resolve()) as unknown as typeof Element.prototype.scrollTo;
    jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
});

afterAll(() => jest.restoreAllMocks());

function datasource(rows: ObjectItem[], window = { offset: 0, limit: 150 }): ListValue {
    return {
        status: "available",
        items: rows,
        offset: window.offset,
        limit: window.limit,
        totalCount: rows.length,
        hasMoreItems: false,
        requestTotalCount: jest.fn(),
        setOffset: jest.fn(),
        setLimit: jest.fn(),
        setSortOrder: jest.fn(),
        setFilter: jest.fn(),
        reload: jest.fn()
    } as unknown as ListValue;
}

function selectionValue(selected: ObjectItem[]): SelectionMultiValue {
    return {
        type: "Multi",
        selection: selected,
        setSelection: jest.fn(),
        setKeepSelection: jest.fn()
    } as unknown as SelectionMultiValue;
}

function props(overrides: Partial<DataGridProContainerProps>): DataGridProContainerProps {
    return {
        name: "grid",
        class: "",
        datasource: datasource(items(20)),
        refreshInterval: 0,
        columns: [],
        pinFirstColumn: false,
        density: "compact",
        stripes: false,
        onClickTrigger: "single",
        expandTrigger: "chevron",
        singleExpand: false,
        keepSelection: true,
        clearAfterBulkAction: true,
        showCount: false,
        showColumnMenu: false,
        showDensityToggle: false,
        pagination: "virtualScrolling",
        pageSize: 50,
        heightMode: "fixed",
        height: 400,
        configurationStorage: "none",
        bulkActions: <button type="button">Approve</button>,
        ...overrides
    } as DataGridProContainerProps;
}

describe("Selection for bulk actions", () => {
    it("asks Mendix to keep selected rows when the loaded rows change", () => {
        const selection = selectionValue([]);
        render(<DataGridPro {...props({ itemSelection: selection })} />);
        expect(selection.setKeepSelection).toHaveBeenCalledTimes(1);
        const keep = (selection.setKeepSelection as jest.Mock).mock.calls[0][0] as (item: ObjectItem) => boolean;
        expect(keep({ id: "99" } as ObjectItem)).toBe(true);
    });

    it("clears the selection once a bulk action has run and the rows reload", () => {
        const rows = items(20);
        const selection = selectionValue(rows.slice(0, 2));
        const { rerender } = render(<DataGridPro {...props({ itemSelection: selection })} />);
        fireEvent.click(screen.getByRole("button", { name: "Approve" }));
        expect(selection.setSelection).not.toHaveBeenCalled();
        act(() => {
            rerender(<DataGridPro {...props({ itemSelection: selection, datasource: datasource([...rows]) })} />);
        });
        expect(selection.setSelection).toHaveBeenCalledWith([]);
    });

    it("keeps the selection after a bulk action when that is turned off", () => {
        const rows = items(20);
        const selection = selectionValue(rows.slice(0, 2));
        const { rerender } = render(
            <DataGridPro {...props({ itemSelection: selection, clearAfterBulkAction: false })} />
        );
        fireEvent.click(screen.getByRole("button", { name: "Approve" }));
        act(() => {
            rerender(
                <DataGridPro
                    {...props({
                        itemSelection: selection,
                        clearAfterBulkAction: false,
                        datasource: datasource([...rows])
                    })}
                />
            );
        });
        expect(selection.setSelection).not.toHaveBeenCalled();
    });

    it("doesn't count loading another window as a refresh", () => {
        const rows = items(20);
        const selection = selectionValue(rows.slice(0, 2));
        const { rerender } = render(<DataGridPro {...props({ itemSelection: selection })} />);
        fireEvent.click(screen.getByRole("button", { name: "Approve" }));
        act(() => {
            rerender(
                <DataGridPro
                    {...props({
                        itemSelection: selection,
                        datasource: datasource([...rows], { offset: 50, limit: 150 })
                    })}
                />
            );
        });
        expect(selection.setSelection).not.toHaveBeenCalled();
    });

    it("shows how many rows are selected, including rows that aren't loaded", () => {
        const selected = [...items(3), { id: "far-away" } as ObjectItem];
        render(<DataGridPro {...props({ itemSelection: selectionValue(selected) })} />);
        expect(screen.getByText("4 selected")).toBeInTheDocument();
    });
});

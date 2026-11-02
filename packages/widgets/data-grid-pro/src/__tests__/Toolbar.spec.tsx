import { act, fireEvent, render, screen } from "@testing-library/react";

import { Toolbar } from "../components/Toolbar";
import { column } from "./fixtures";

function toolbar(overrides: Partial<Parameters<typeof Toolbar>[0]> = {}): Parameters<typeof Toolbar>[0] {
    return {
        title: undefined,
        total: undefined,
        content: undefined,
        selectedCount: 0,
        bulkActions: undefined,
        onClearSelection: () => undefined,
        onBulkAction: undefined,
        selectAll: undefined,
        progress: undefined,
        onExport: undefined,
        columns: undefined,
        hidden: [],
        onToggleColumn: () => undefined,
        onMoveColumn: undefined,
        onResetColumns: () => undefined,
        search: undefined,
        chips: [],
        onClearFilters: () => undefined,
        density: undefined,
        onDensity: () => undefined,
        ...overrides
    };
}

describe("Toolbar search box", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("searches once typing pauses", () => {
        const onSearch = jest.fn();
        render(<Toolbar {...toolbar({ search: { placeholder: "Search", onSearch } })} />);
        const input = screen.getByRole("textbox", { name: "Search" });
        fireEvent.change(input, { target: { value: "ac" } });
        fireEvent.change(input, { target: { value: "acme" } });
        expect(onSearch).not.toHaveBeenCalled();
        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(onSearch).toHaveBeenCalledTimes(1);
        expect(onSearch).toHaveBeenCalledWith("acme");
    });

    it("clears the search right away", () => {
        const onSearch = jest.fn();
        render(<Toolbar {...toolbar({ search: { placeholder: "Find", onSearch } })} />);
        fireEvent.change(screen.getByRole("textbox", { name: "Find" }), { target: { value: "acme" } });
        fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
        expect(onSearch).toHaveBeenLastCalledWith("");
        expect(screen.getByRole("textbox", { name: "Find" })).toHaveValue("");
    });
});

describe("Toolbar column menu", () => {
    it("moves columns left and right", () => {
        const onMoveColumn = jest.fn();
        render(
            <Toolbar
                {...toolbar({
                    columns: [column({ id: "c0", header: "Name" }), column({ id: "c1", header: "Score" })],
                    onMoveColumn
                })}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: "Columns" }));
        expect(screen.getByRole("button", { name: "Move Name left" })).toBeDisabled();
        fireEvent.click(screen.getByRole("button", { name: "Move Name right" }));
        expect(onMoveColumn).toHaveBeenCalledWith("c0", 1);
        fireEvent.click(screen.getByRole("button", { name: "Move Score left" }));
        expect(onMoveColumn).toHaveBeenCalledWith("c1", -1);
    });

    it("hides the move buttons when columns can't be reordered", () => {
        render(<Toolbar {...toolbar({ columns: [column()] })} />);
        fireEvent.click(screen.getByRole("button", { name: "Columns" }));
        expect(screen.queryByRole("button", { name: /Move/ })).not.toBeInTheDocument();
    });
});

describe("Toolbar select all", () => {
    it("offers to select every row", () => {
        const onStart = jest.fn();
        render(
            <Toolbar
                {...toolbar({
                    selectedCount: 150,
                    selectAll: { total: 20000, capped: false, onStart }
                })}
            />
        );
        expect(screen.getByText("150 selected")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Select all 20,000" }));
        expect(onStart).toHaveBeenCalled();
    });

    it("shows progress with a way to cancel", () => {
        const onCancel = jest.fn();
        render(
            <Toolbar
                {...toolbar({
                    selectedCount: 150,
                    progress: { value: { task: "select", loaded: 1500, target: 50000 }, onCancel }
                })}
            />
        );
        expect(screen.getByRole("status")).toHaveTextContent("Selecting 1,500 of 50,000");
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalled();
    });
});

describe("Toolbar export", () => {
    it("shows export progress in place of the bulk actions", () => {
        render(
            <Toolbar
                {...toolbar({
                    selectedCount: 3,
                    bulkActions: <button type="button">Approve</button>,
                    progress: { value: { task: "export", loaded: 500, target: 1200 }, onCancel: jest.fn() },
                    onExport: jest.fn()
                })}
            />
        );
        expect(screen.getByRole("status")).toHaveTextContent("Exporting 500 of 1,200");
        expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Export" })).toBeDisabled();
    });
});

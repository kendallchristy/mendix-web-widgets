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
        columns: undefined,
        hidden: [],
        onToggleColumn: () => undefined,
        onMoveColumn: undefined,
        onResetColumns: () => undefined,
        search: undefined,
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

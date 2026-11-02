import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import Big from "big.js";

import { KanbanBoardPro } from "../KanbanBoardPro";
import type { KanbanBoardProContainerProps } from "../../typings/KanbanBoardProProps";

import { action, attribute, dynamic, expression, listValue, polyfillDom, store, widgets, type Store } from "./fixtures";

beforeAll(polyfillDom);
beforeEach(() => window.localStorage.clear());

const COLUMNS = ["Backlog", "Doing", "Done"];

function setup(overrides: Partial<KanbanBoardProContainerProps> = {}): {
    data: Store;
    props: KanbanBoardProContainerProps;
} {
    const data = store([
        { id: "a", title: "Alpha", status: "Backlog", sort: new Big(2) },
        { id: "b", title: "Bravo", status: "Backlog", sort: new Big(1) },
        { id: "c", title: "Charlie", status: "Doing", sort: new Big(1) }
    ]);
    const props = {
        name: "board",
        class: "",
        columnSource: "enumeration",
        collapsible: true,
        showCount: true,
        emptyColumnText: dynamic("No cards"),
        cards: listValue(["a", "b", "c"]),
        cardContent: widgets(item => <span>{data.rows.get(item.id)!.title}</span>),
        cardStatus: attribute(data, "status", "Enum", COLUMNS),
        cardSortAttribute: attribute(data, "sort", "Decimal"),
        canDragCard: expression(() => true),
        maxCards: 2000,
        onCardMove: action(data, "onCardMove"),
        columnWidth: 280,
        heightMode: "auto",
        height: 640,
        cardStyle: "card",
        indicator: "makeRoom",
        animation: "off",
        preview: "snapshot",
        cardLabel: expression(item => data.rows.get(item.id)!.title),
        instructions: dynamic("Press Space to pick up."),
        liftedText: dynamic("Picked up [item] in [column]."),
        movedText: dynamic("[column], position [position] of [count]."),
        droppedText: dynamic("Dropped [item] in [column] at position [position] of [count]."),
        cancelledText: dynamic("Cancelled."),
        ...overrides
    } as unknown as KanbanBoardProContainerProps;
    return { data, props };
}

function column(title: string): HTMLElement {
    return screen.getByRole("heading", { name: title }).closest(".kbp-column") as HTMLElement;
}

const cardsIn = (title: string): string[] =>
    within(column(title))
        .queryAllByRole("listitem")
        .map(card => card.textContent ?? "");

describe("KanbanBoardPro", () => {
    it("makes a column per enumeration value and sorts the cards in each", () => {
        const { props } = setup();
        render(<KanbanBoardPro {...props} />);
        expect(screen.getAllByRole("heading").map(h => h.textContent)).toEqual(COLUMNS);
        expect(cardsIn("Backlog")).toEqual(["Bravo", "Alpha"]);
        expect(cardsIn("Doing")).toEqual(["Charlie"]);
        expect(within(column("Done")).getByText("No cards")).toBeInTheDocument();
    });

    it("moves a card to the next column with the keyboard", () => {
        const { data, props } = setup();
        render(<KanbanBoardPro {...props} />);
        const bravo = screen.getByLabelText("Bravo");
        for (const key of [" ", "ArrowRight", "ArrowDown", " "]) {
            act(() => {
                fireEvent.keyDown(bravo, { key });
            });
        }
        // On card move saves the move; the widget shows the card in its new place meanwhile.
        expect(data.log).toEqual([
            'onCardMove b {"moved":"true","newSortValue":"2","fromColumn":"Backlog","toColumn":"Doing","newPosition":"2"}'
        ]);
        expect(data.rows.get("b")!.status).toBe("Backlog");
        expect(cardsIn("Backlog")).toEqual(["Alpha"]);
        expect(cardsIn("Doing")).toEqual(["Charlie", "Bravo"]);
    });

    it("collapses a column", () => {
        const { props } = setup();
        render(<KanbanBoardPro {...props} />);
        fireEvent.click(screen.getByRole("button", { name: "Collapse Backlog" }));
        expect(screen.getByRole("button", { name: "Expand Backlog" })).toHaveAttribute("aria-expanded", "false");
        expect(cardsIn("Backlog")).toEqual([]);
    });
});

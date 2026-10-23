import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { startOfDay } from "date-fns";

import type { PickerValue } from "../../core/types";
import { DatePickerView } from "../DatePickerView";
import type { PickerConfig } from "../types";
import { testConfig } from "./testConfig";

function setup(config: PickerConfig, value: PickerValue = {}): { onCommit: jest.Mock } {
    const onCommit = jest.fn();
    render(<DatePickerView config={config} value={value} onCommit={onCommit} />);
    return { onCommit };
}

const day = (label: RegExp): HTMLElement => screen.getByRole("button", { name: label });

describe("DatePickerView", () => {
    describe("typing", () => {
        it("fills the separators in while the digits are typed", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig());
            await user.click(screen.getByRole("spinbutton", { name: /month/i }));
            await user.keyboard("03152026");
            expect(onCommit).toHaveBeenLastCalledWith({ start: new Date(2026, 2, 15) });
        });

        it("doesn't save a half-typed year", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig());
            await user.click(screen.getByRole("spinbutton", { name: /month/i }));
            await user.keyboard("0315202");
            expect(onCommit).not.toHaveBeenCalledWith({ start: new Date(202, 2, 15) });
        });

        it("reads a relative shortcut on Enter", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig());
            await user.click(screen.getByRole("spinbutton", { name: /month/i }));
            await user.keyboard("t{Enter}");
            expect(onCommit).toHaveBeenLastCalledWith({ start: startOfDay(new Date()) });
        });

        it("fills both ends of a range from a period shortcut", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig({ selection: "range" }));
            await user.click(screen.getAllByRole("spinbutton", { name: /month/i })[0]);
            await user.keyboard("this year{Enter}");
            const year = new Date().getFullYear();
            expect(onCommit).toHaveBeenLastCalledWith({
                start: new Date(year, 0, 1),
                end: new Date(year, 11, 31)
            });
        });

        it("steps a segment with the arrow keys", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig(), { start: new Date(2026, 0, 14) });
            await user.click(screen.getByRole("spinbutton", { name: /day/i }));
            await user.keyboard("{ArrowUp}");
            expect(onCommit).toHaveBeenLastCalledWith({ start: new Date(2026, 0, 15) });
        });
    });

    describe("single date", () => {
        it("saves and closes when a day is clicked", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig(), { start: new Date(2026, 0, 14) });
            await user.click(screen.getByRole("button", { name: "Toggle calendar" }));
            await user.click(day(/January 20, 2026/));
            expect(onCommit).toHaveBeenLastCalledWith({ start: new Date(2026, 0, 20) });
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("won't pick a day that is unavailable", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(testConfig({ constraints: { max: new Date(2026, 0, 18) } }), {
                start: new Date(2026, 0, 14)
            });
            await user.click(screen.getByRole("button", { name: "Toggle calendar" }));
            await user.click(day(/January 20, 2026/));
            expect(onCommit).not.toHaveBeenCalled();
        });
    });

    describe("range with Apply", () => {
        const rangeConfig = (): PickerConfig => testConfig({ selection: "range", trigger: "button" });

        it("saves only on Apply", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(rangeConfig(), {
                start: new Date(2026, 0, 10),
                end: new Date(2026, 0, 16)
            });
            await user.click(screen.getByRole("button", { name: /Jan 10, 2026/ }));
            await user.click(day(/January 20, 2026/));
            await user.click(day(/January 27, 2026/));
            expect(onCommit).not.toHaveBeenCalled();
            await user.click(screen.getByRole("button", { name: "Apply" }));
            expect(onCommit).toHaveBeenLastCalledWith({
                start: new Date(2026, 0, 20),
                end: new Date(2026, 0, 27)
            });
        });

        it("puts the dates in order when the end is picked first", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(rangeConfig(), { start: new Date(2026, 0, 10) });
            await user.click(screen.getByRole("button", { name: /Jan 10, 2026/ }));
            await user.click(day(/January 27, 2026/));
            await user.click(day(/January 20, 2026/));
            await user.click(screen.getByRole("button", { name: "Apply" }));
            expect(onCommit).toHaveBeenLastCalledWith({
                start: new Date(2026, 0, 20),
                end: new Date(2026, 0, 27)
            });
        });

        it("drops the changes on Cancel", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(rangeConfig(), { start: new Date(2026, 0, 10) });
            await user.click(screen.getByRole("button", { name: /Jan 10, 2026/ }));
            await user.click(day(/January 20, 2026/));
            await user.click(screen.getByRole("button", { name: "Cancel" }));
            expect(onCommit).not.toHaveBeenCalled();
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });

        it("fills both dates from a preset", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(rangeConfig());
            // An empty range is what "All time" stands for, so the button names that preset.
            await user.click(screen.getByRole("button", { name: "allTime", expanded: false }));
            await user.click(screen.getByRole("button", { name: "thisMonth" }));
            await user.click(screen.getByRole("button", { name: "Apply" }));
            const today = new Date();
            expect(onCommit).toHaveBeenLastCalledWith({
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
            });
        });

        it("explains a range that is too short", async () => {
            const user = userEvent.setup();
            const { onCommit } = setup(
                testConfig({ selection: "range", trigger: "button", rangeRules: { minLength: 3 } }),
                {
                    start: new Date(2026, 0, 10)
                }
            );
            await user.click(screen.getByRole("button", { name: /Jan 10, 2026/ }));
            await user.click(day(/January 20, 2026/));
            await user.click(day(/January 21, 2026/));
            await user.click(screen.getByRole("button", { name: "Apply" }));
            expect(onCommit).not.toHaveBeenCalled();
            expect(screen.getByRole("status")).toHaveTextContent("at least 3");
        });
    });

    describe("help", () => {
        it("opens from the field with ?", async () => {
            const user = userEvent.setup();
            setup(testConfig());
            await user.click(screen.getByRole("spinbutton", { name: /month/i }));
            await user.keyboard("?");
            const help = await screen.findByRole("dialog", { name: /shortcuts/i });
            expect(within(help).getByText("Shortcuts you can type")).toBeInTheDocument();
            expect(within(help).getByText("next fri")).toBeInTheDocument();
        });

        it("leaves relative shortcuts out when they are turned off", async () => {
            const user = userEvent.setup();
            setup(testConfig({ relativeTyping: false }));
            await user.click(screen.getByRole("button", { name: /shortcuts/i }));
            const help = await screen.findByRole("dialog", { name: /shortcuts/i });
            expect(within(help).queryByText("Shortcuts you can type")).not.toBeInTheDocument();
            expect(within(help).getByText("Typing a date")).toBeInTheDocument();
        });
    });
});

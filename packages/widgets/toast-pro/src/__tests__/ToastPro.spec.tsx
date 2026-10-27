import { act, fireEvent, render, screen } from "@testing-library/react";
import { Big } from "big.js";
import type { ActionValue, DynamicValue, EditableValue } from "mendix";

import type { ButtonsType, ToastProContainerProps } from "../../typings/ToastProProps";
import { ToastPro } from "../ToastPro";

const dv = <T,>(value: T): DynamicValue<T> => ({ status: "available", value }) as DynamicValue<T>;
const action = (): ActionValue & { execute: jest.Mock } =>
    ({ canExecute: true, isExecuting: false, execute: jest.fn() }) as unknown as ActionValue & { execute: jest.Mock };
const editable = <T extends boolean | string>(value: T, universe?: T[]): EditableValue<T> & { setValue: jest.Mock } =>
    ({ status: "available", value, readOnly: false, universe, setValue: jest.fn() }) as unknown as EditableValue<T> & {
        setValue: jest.Mock;
    };

function props(over: Partial<ToastProContainerProps> = {}): ToastProContainerProps {
    return {
        name: "toast",
        class: "",
        trigger: "LOAD",
        variant: "INFO",
        title: dv("Saved"),
        message: dv("Your changes are saved."),
        showIcon: true,
        useCustomContent: false,
        customContentPlacement: "BELOW",
        buttons: [],
        showCloseButton: true,
        closeButtonLabel: dv("Close"),
        duration: dv(new Big(3000)),
        pauseOnHover: true,
        pauseWhenHidden: true,
        showProgress: true,
        closeOnToastClick: false,
        position: "BOTTOM_RIGHT",
        stackMode: "STACKED",
        maxVisible: 3,
        width: 360,
        coloredBackground: false,
        animation: "SLIDE",
        swipeToDismiss: true,
        ...over
    };
}

// Steps through time so promise continuations (the waits between lifecycle steps) can schedule their timers.
async function advance(ms: number): Promise<void> {
    let left = ms;
    do {
        const step = Math.min(left, 50);
        await act(async () => {
            jest.advanceTimersByTime(step);
        });
        left -= step;
    } while (left > 0);
}

const toast = (): HTMLElement | null => document.querySelector(".tp-toast");

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("ToastPro", () => {
    it("shows on load and closes itself after the duration, in event order", async () => {
        const calls: string[] = [];
        const track = (name: string): ActionValue => {
            const a = action();
            a.execute.mockImplementation(() => calls.push(name));
            return a;
        };
        const reason = editable<string>(undefined as unknown as string);
        reason.setValue.mockImplementation(v => calls.push(`reason ${v}`));
        render(
            <ToastPro
                {...props({
                    onShow: track("show"),
                    onTimeout: track("timeout"),
                    onBeforeClose: track("before close"),
                    onClose: track("close"),
                    closeReasonAttribute: reason
                })}
            />
        );
        await advance(0);
        expect(screen.getByRole("status")).toHaveTextContent("Saved");
        expect(calls).toEqual(["show"]);

        await advance(3000);
        await advance(300);
        await advance(220);
        expect(toast()).toBeNull();
        expect(calls).toEqual(["show", "reason Timeout", "timeout", "before close", "close"]);
    });

    it("stays open when the duration is empty", async () => {
        render(<ToastPro {...props({ duration: undefined })} />);
        await advance(60000);
        expect(toast()).not.toBeNull();
    });

    it("closes with the X and runs On dismiss", async () => {
        const onDismiss = action();
        const reason = editable<string>("", ["Timeout", "Dismissed"]);
        render(<ToastPro {...props({ onDismiss, closeReasonAttribute: reason })} />);
        await advance(0);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        await advance(300);
        await advance(220);
        expect(onDismiss.execute).toHaveBeenCalled();
        expect(reason.setValue).toHaveBeenCalledWith("Dismissed");
        expect(toast()).toBeNull();
    });

    it("closes with Escape", async () => {
        render(<ToastPro {...props()} />);
        await advance(0);
        fireEvent.keyDown(toast()!, { key: "Escape" });
        await advance(600);
        expect(toast()).toBeNull();
    });

    it("skips close reasons an enumeration doesn't have", async () => {
        const reason = editable<string>("", ["Timeout"]);
        render(<ToastPro {...props({ closeReasonAttribute: reason })} />);
        await advance(0);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        await advance(600);
        expect(reason.setValue).not.toHaveBeenCalled();
    });

    it("shows when the Boolean attribute turns true and resets it after closing", async () => {
        const off = editable(false);
        const { rerender } = render(<ToastPro {...props({ trigger: "ATTRIBUTE", showAttribute: off })} />);
        await advance(0);
        expect(toast()).toBeNull();

        const on = editable(true);
        rerender(<ToastPro {...props({ trigger: "ATTRIBUTE", showAttribute: on })} />);
        await advance(0);
        expect(toast()).not.toBeNull();

        await advance(3000);
        await advance(600);
        expect(toast()).toBeNull();
        expect(on.setValue).toHaveBeenCalledWith(false);
    });

    it("shows each time the expression turns true", async () => {
        const onShow = action();
        const view = (value: boolean): ToastProContainerProps =>
            props({ trigger: "EXPRESSION", showWhen: dv(value), onShow, duration: dv(new Big(500)) });
        const { rerender } = render(<ToastPro {...view(true)} />);
        await advance(0);
        await advance(1200);
        expect(toast()).toBeNull();
        rerender(<ToastPro {...view(false)} />);
        rerender(<ToastPro {...view(true)} />);
        await advance(0);
        expect(toast()).not.toBeNull();
        expect(onShow.execute).toHaveBeenCalledTimes(2);
    });

    it("closes when Close when turns true", async () => {
        const reason = editable<string>("");
        const { rerender } = render(<ToastPro {...props({ closeWhen: dv(false), closeReasonAttribute: reason })} />);
        await advance(0);
        rerender(<ToastPro {...props({ closeWhen: dv(true), closeReasonAttribute: reason })} />);
        await advance(600);
        expect(toast()).toBeNull();
        expect(reason.setValue).toHaveBeenCalledWith("Condition");
    });

    it("runs a button's action and closes when set to", async () => {
        const undo = action();
        const button: ButtonsType = {
            caption: dv("Undo ([seconds])"),
            buttonStyle: "SECONDARY",
            action: undo,
            closeOnClick: true,
            visible: dv(true)
        };
        const hidden: ButtonsType = { ...button, caption: dv("Hidden"), visible: dv(false) };
        render(<ToastPro {...props({ buttons: [button, hidden] })} />);
        await advance(0);
        expect(screen.queryByRole("button", { name: "Hidden" })).toBeNull();
        await advance(1000);
        fireEvent.click(screen.getByRole("button", { name: "Undo (2)" }));
        expect(undo.execute).toHaveBeenCalled();
        await advance(600);
        expect(toast()).toBeNull();
    });

    it("waits for On before close to finish", async () => {
        const beforeClose = action();
        const { rerender } = render(<ToastPro {...props({ onBeforeClose: beforeClose })} />);
        await advance(0);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        await advance(0);
        expect(beforeClose.execute).toHaveBeenCalled();

        rerender(<ToastPro {...props({ onBeforeClose: { ...beforeClose, isExecuting: true } })} />);
        await advance(2000);
        expect(toast()).not.toBeNull();

        rerender(<ToastPro {...props({ onBeforeClose: { ...beforeClose, isExecuting: false } })} />);
        await advance(300);
        expect(toast()).toBeNull();
    });

    it("runs On click and can close on click", async () => {
        const onClick = action();
        render(<ToastPro {...props({ onClick, closeOnToastClick: true })} />);
        await advance(0);
        fireEvent.click(screen.getByText("Your changes are saved."));
        expect(onClick.execute).toHaveBeenCalled();
        await advance(600);
        expect(toast()).toBeNull();
    });

    it("closes from an element with the toast-pro-close class in custom content", async () => {
        const reason = editable<string>("");
        render(
            <ToastPro
                {...props({
                    useCustomContent: true,
                    customContent: <span className="toast-pro-close">Done</span>,
                    closeReasonAttribute: reason
                })}
            />
        );
        await advance(0);
        fireEvent.click(screen.getByText("Done"));
        await advance(600);
        expect(reason.setValue).toHaveBeenCalledWith("Content");
        expect(toast()).toBeNull();
    });

    it("announces errors as alerts and takes the variant from data", async () => {
        render(<ToastPro {...props({ variantExpression: dv("error") })} />);
        await advance(0);
        expect(screen.getByRole("alert")).toHaveClass("tp--error");
    });

    it("doesn't count down while busy", async () => {
        const { rerender } = render(<ToastPro {...props({ busy: dv(true) })} />);
        await advance(10000);
        expect(toast()?.querySelector(".tp-spinner")).not.toBeNull();
        rerender(<ToastPro {...props({ busy: dv(false), variantExpression: dv("success") })} />);
        await advance(0);
        expect(toast()).toHaveClass("tp--success");
        await advance(3000);
        await advance(600);
        expect(toast()).toBeNull();
    });

    it("replaces an open toast with the same group key", async () => {
        const onClose = action();
        render(
            <>
                <ToastPro {...props({ groupKey: dv("order-1"), title: dv("Shipped"), onClose })} />
            </>
        );
        await advance(0);
        render(<ToastPro {...props({ groupKey: dv("order-1"), title: dv("Delivered") })} />);
        await advance(0);
        await advance(300);
        expect(screen.queryByText("Shipped")).toBeNull();
        expect(screen.getByText("Delivered")).toBeInTheDocument();
        expect(onClose.execute).toHaveBeenCalled();
    });
});

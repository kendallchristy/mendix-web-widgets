import { runAndWait, RenderSignal, type ActionLike } from "../actions";
import { Countdown } from "../countdown";
import { GAP, PEEK, ToastStack, type StackEntry } from "../stack";
import { fillSeconds, hasSecondsToken, parseVariant, toDuration } from "../text";

describe("Countdown", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("fires once the duration has run", () => {
        const done = jest.fn();
        new Countdown(1000).start(done);
        jest.advanceTimersByTime(999);
        expect(done).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(done).toHaveBeenCalledTimes(1);
    });

    it("waits until every pause reason is gone", () => {
        const done = jest.fn();
        const countdown = new Countdown(1000);
        countdown.start(done);
        jest.advanceTimersByTime(400);
        countdown.setPaused("hover", true);
        countdown.setPaused("hidden", true);
        jest.advanceTimersByTime(5000);
        countdown.setPaused("hover", false);
        jest.advanceTimersByTime(5000);
        expect(done).not.toHaveBeenCalled();
        expect(countdown.remaining()).toBe(600);
        countdown.setPaused("hidden", false);
        jest.advanceTimersByTime(600);
        expect(done).toHaveBeenCalledTimes(1);
    });

    it("can start paused and tells subscribers when it runs", () => {
        const countdown = new Countdown(1000);
        const listener = jest.fn();
        countdown.subscribe(listener);
        countdown.start(jest.fn(), ["queued"]);
        expect(countdown.running).toBe(false);
        countdown.setPaused("queued", false);
        expect(countdown.running).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it("never fires after stop", () => {
        const done = jest.fn();
        const countdown = new Countdown(1000);
        countdown.start(done);
        countdown.stop();
        countdown.setPaused("hover", false);
        jest.advanceTimersByTime(2000);
        expect(done).not.toHaveBeenCalled();
    });
});

describe("text", () => {
    it("fills in [seconds], rounding up", () => {
        expect(fillSeconds("Undo ([seconds])", 4100)).toBe("Undo (5)");
        expect(fillSeconds("[SECONDS] s", 1000)).toBe("1 s");
        expect(hasSecondsToken("Undo ([seconds])")).toBe(true);
        expect(hasSecondsToken("Undo")).toBe(false);
    });

    it("reads the variant from data, falling back to the static one", () => {
        expect(parseVariant(" Error ", "info")).toBe("error");
        expect(parseVariant("Failed", "info")).toBe("info");
        expect(parseVariant(undefined, "success")).toBe("success");
    });

    it("treats empty and zero durations as staying open", () => {
        expect(toDuration(undefined)).toBeUndefined();
        expect(toDuration({ toNumber: () => 0 })).toBeUndefined();
        expect(toDuration({ toNumber: () => 2500 })).toBe(2500);
    });
});

describe("ToastStack", () => {
    const entry = (id: string, over: Partial<StackEntry> = {}): StackEntry => ({
        id,
        position: "bottom-right",
        alwaysExpanded: false,
        maxVisible: 3,
        width: 360,
        onReplaced: jest.fn(),
        ...over
    });

    it("puts the newest first and peeks the others behind it", () => {
        const stack = new ToastStack();
        stack.add(entry("a"), 60);
        stack.add(entry("b"), 80);
        expect(stack.layout("b")).toMatchObject({ index: 0, offset: 0, frontHeight: 80 });
        expect(stack.layout("a")).toMatchObject({ index: 1, offset: PEEK, expanded: false });
    });

    it("fans out on hover", () => {
        const stack = new ToastStack();
        stack.add(entry("a"), 60);
        stack.add(entry("b"), 80);
        stack.setHovered("bottom-right", true);
        expect(stack.layout("a")).toMatchObject({ offset: 80 + GAP, expanded: true, hovered: true });
        expect(stack.bounds("bottom-right").height).toBe(60 + 80 + GAP);
    });

    it("queues toasts past the most visible count", () => {
        const stack = new ToastStack();
        stack.add(entry("a", { maxVisible: 1 }));
        stack.add(entry("b", { maxVisible: 1 }));
        expect(stack.layout("a")?.queued).toBe(true);
        expect(stack.layout("b")?.queued).toBe(false);
    });

    it("replaces a toast with the same group key", () => {
        const stack = new ToastStack();
        const first = entry("a", { groupKey: "order-1" });
        stack.add(first);
        stack.add(entry("b", { groupKey: "order-1" }));
        expect(first.onReplaced).toHaveBeenCalled();
        expect(stack.has("a")).toBe(false);
    });

    it("keeps separate stacks per position", () => {
        const stack = new ToastStack();
        stack.add(entry("a"));
        stack.add(entry("b", { position: "top-left" }));
        expect(stack.layout("a")?.index).toBe(0);
        expect(stack.layout("b")?.index).toBe(0);
    });

    it("freezes a leaving toast and closes the gap behind it", () => {
        const stack = new ToastStack();
        stack.add(entry("a"), 50);
        stack.add(entry("b"), 50);
        stack.add(entry("c"), 50);
        stack.leave("b");
        expect(stack.layout("b")?.index).toBe(1);
        expect(stack.layout("a")?.index).toBe(1);
    });
});

describe("runAndWait", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    function action(): ActionLike & { isExecuting: boolean } {
        return { canExecute: true, isExecuting: false, execute: jest.fn() };
    }

    it("resolves right away without an action", async () => {
        await expect(runAndWait(() => undefined, new RenderSignal())).resolves.toBeUndefined();
    });

    it("waits until a started action finishes", async () => {
        const signal = new RenderSignal();
        const a = action();
        const done = jest.fn();
        void runAndWait(() => a, signal).then(done);
        a.isExecuting = true;
        signal.notify();
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
        expect(done).not.toHaveBeenCalled();
        a.isExecuting = false;
        signal.notify();
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
        expect(a.execute).toHaveBeenCalledTimes(1);
    });

    it("stops waiting after the limit", async () => {
        const signal = new RenderSignal();
        const a = action();
        const done = jest.fn();
        void runAndWait(() => a, signal, { limit: 10000 }).then(done);
        a.isExecuting = true;
        signal.notify();
        jest.advanceTimersByTime(10000);
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
    });

    it("moves on when a quick action never shows as running", async () => {
        const done = jest.fn();
        void runAndWait(action, new RenderSignal(), { startGrace: 300 }).then(done);
        jest.advanceTimersByTime(300);
        await Promise.resolve();
        expect(done).toHaveBeenCalled();
    });
});

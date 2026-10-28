import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Big } from "big.js";
import type { ActionValue, DynamicValue, EditableValue, FileValue } from "mendix";

import type { DocumentViewerProContainerProps } from "../../typings/DocumentViewerProProps";
import { defaultLabels } from "../core/labels";
import { DocumentViewerPro } from "../DocumentViewerPro";

const dv = <T,>(value: T): DynamicValue<T> => ({ status: "available", value }) as DynamicValue<T>;
const action = (): ActionValue & { execute: jest.Mock } =>
    ({ canExecute: true, isExecuting: false, execute: jest.fn() }) as unknown as ActionValue & { execute: jest.Mock };
const editable = <T extends string | Big>(value: T): EditableValue<T> & { setValue: jest.Mock } =>
    ({ status: "available", value, readOnly: false, setValue: jest.fn() }) as unknown as EditableValue<T> & {
        setValue: jest.Mock;
    };
const fileValue = (uri: string, name: string): DynamicValue<FileValue> => dv({ uri, name } as FileValue);

const files: Record<string, string> = {
    "/files/notes.txt": "First line about revenue\nSecond line\nRevenue again",
    "/files/readme.md": "# Title"
};

beforeAll(() => {
    // Engines normally load as separate scripts; tests register stand-ins.
    Object.assign(globalThis, {
        __documentViewerProEngines: {
            code: { highlight: (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;") },
            markdown: { toSafeHtml: (text: string) => `<h1>${text.replace(/^# /, "")}</h1>` }
        }
    });
});

beforeEach(() => {
    global.fetch = jest.fn(async (url: string) => {
        const text = files[url];
        if (text === undefined) {
            return { ok: false, status: 404 } as Response;
        }
        const data = new Uint8Array(Array.from(text, c => c.charCodeAt(0)));
        return {
            ok: true,
            status: 200,
            headers: { get: () => null },
            body: null,
            arrayBuffer: async () => data.buffer
        } as unknown as Response;
    }) as unknown as typeof fetch;
});

function props(over: Partial<DocumentViewerProContainerProps> = {}): DocumentViewerProContainerProps {
    return {
        name: "viewer",
        class: "",
        source: "FILE",
        file: fileValue("/files/notes.txt", "notes.txt"),
        previewMode: "FALLBACK",
        layout: "CONTINUOUS",
        initialZoom: "FIT_WIDTH",
        zoomPercent: 100,
        sidebar: "AUTO",
        heightUnit: "PIXELS",
        height: 640,
        toolbarPosition: "TOP",
        showFileName: true,
        showPageControls: true,
        showZoom: true,
        showRotate: true,
        showSearch: true,
        showPrint: true,
        showDownload: true,
        showFullscreen: true,
        allowDownload: dv(true),
        allowPrint: dv(true),
        allowCopy: dv(true),
        blockRemoteImages: true,
        ...over
    } as DocumentViewerProContainerProps;
}

describe("DocumentViewerPro", () => {
    it("shows a text file and runs the load action", async () => {
        const onLoad = action();
        const errorMessage = editable("old error");
        render(<DocumentViewerPro {...props({ onLoad, errorMessage })} />);
        expect(await screen.findByText(/First line about revenue/)).toBeTruthy();
        expect(screen.getByText("notes.txt")).toBeTruthy();
        await waitFor(() => expect(onLoad.execute).toHaveBeenCalledTimes(1));
        expect(errorMessage.setValue).toHaveBeenCalledWith("");
    });

    it("uses the file name expression over the file's own name", async () => {
        render(<DocumentViewerPro {...props({ fileName: dv("Quarterly notes.txt") })} />);
        expect(await screen.findByText("Quarterly notes.txt")).toBeTruthy();
    });

    it("shows a placeholder while Mendix loads the file, then a message when there is none", () => {
        const { rerender } = render(
            <DocumentViewerPro {...props({ file: { status: "loading" } as DynamicValue<FileValue> })} />
        );
        expect(screen.getByText(defaultLabels.loading)).toBeTruthy();
        rerender(<DocumentViewerPro {...props({ file: dv(undefined as unknown as FileValue) })} />);
        expect(screen.getByText(defaultLabels.noFile)).toBeTruthy();
    });

    it("reports a failed download once, through the error attribute and action", async () => {
        const onError = action();
        const errorMessage = editable("");
        render(
            <DocumentViewerPro {...props({ file: fileValue("/files/gone.pdf", "gone.pdf"), onError, errorMessage })} />
        );
        expect(await screen.findByText(defaultLabels.error)).toBeTruthy();
        await waitFor(() => expect(onError.execute).toHaveBeenCalledTimes(1));
        expect(errorMessage.setValue).toHaveBeenCalledWith("The file could not be downloaded (HTTP 404).");
    });

    it("says when a file type can't be shown and offers a download", async () => {
        files["/files/setup.exe"] = "MZ\u0000\u0000\u0003\u0000\u0000\u0000\u0004";
        const onError = action();
        render(<DocumentViewerPro {...props({ file: fileValue("/files/setup.exe", "setup.exe"), onError })} />);
        expect(await screen.findByText(defaultLabels.unsupported)).toBeTruthy();
        expect(screen.getAllByRole("button", { name: defaultLabels.download }).length).toBeGreaterThan(0);
        await waitFor(() => expect(onError.execute).toHaveBeenCalledTimes(1));
    });

    it("switches to the preview file when the original can't be shown", async () => {
        files["/files/old.doc"] = "\u00d0\u00cf\u0011\u00e0\u00a1\u00b1\u001a\u00e1\u0000\u0000";
        render(
            <DocumentViewerPro
                {...props({
                    file: fileValue("/files/old.doc", "old.doc"),
                    previewFile: fileValue("/files/notes.txt", "old.txt")
                })}
            />
        );
        expect(await screen.findByText(/First line about revenue/)).toBeTruthy();
        expect(screen.getByText(defaultLabels.fallback)).toBeTruthy();
    });

    it("hides download when the app doesn't allow it, and uses the app's download action when set", async () => {
        const { rerender } = render(<DocumentViewerPro {...props({ allowDownload: dv(false) })} />);
        await screen.findByText(/First line about revenue/);
        expect(screen.queryByRole("button", { name: defaultLabels.download })).toBeNull();

        const onDownload = action();
        rerender(<DocumentViewerPro {...props({ onDownload })} />);
        fireEvent.click(screen.getByRole("button", { name: defaultLabels.download }));
        expect(onDownload.execute).toHaveBeenCalledTimes(1);
    });

    it("searches the text and counts the matches", async () => {
        render(<DocumentViewerPro {...props()} />);
        await screen.findByText(/First line about revenue/);
        fireEvent.click(screen.getByRole("button", { name: defaultLabels.search }));
        jest.useFakeTimers();
        fireEvent.change(screen.getByPlaceholderText(defaultLabels.searchPlaceholder), {
            target: { value: "revenue" }
        });
        act(() => {
            jest.advanceTimersByTime(300);
        });
        jest.useRealTimers();
        await waitFor(() => expect(document.querySelectorAll(".dvp-match")).toHaveLength(2));
        expect(screen.getByText("1 of 2")).toBeTruthy();
    });

    it("lists files from a data source and switches between them", async () => {
        const items = [{ id: "1" }, { id: "2" }];
        const names: Record<string, string> = { "1": "notes.txt", "2": "readme.md" };
        Object.assign(window, { mx: { appUrl: "http://localhost/" } });
        files["http://localhost/file?guid=1"] = files["/files/notes.txt"];
        files["http://localhost/file?guid=2"] = files["/files/readme.md"];
        render(
            <DocumentViewerPro
                {...props({
                    source: "LIST",
                    files: { status: "available", items } as unknown as DocumentViewerProContainerProps["files"],
                    listFileName: { get: (item: { id: string }) => dv(names[item.id]) } as never
                })}
            />
        );
        expect(await screen.findByText(/First line about revenue/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: defaultLabels.nextFile }));
        expect(await screen.findByRole("heading", { name: "Title" })).toBeTruthy();
    });

    it("sets the height from the settings", () => {
        const { container } = render(<DocumentViewerPro {...props({ heightUnit: "VIEWPORT", height: 80 })} />);
        expect((container.firstChild as HTMLElement).style.height).toBe("80vh");
    });

    it("stores the page count when a paged document opens", async () => {
        const pageCount = editable<Big>(undefined as unknown as Big);
        render(<DocumentViewerPro {...props({ pageCount })} />);
        await screen.findByText(/First line about revenue/);
        // Text files have no pages, so nothing is written.
        expect(pageCount.setValue).not.toHaveBeenCalled();
    });
});

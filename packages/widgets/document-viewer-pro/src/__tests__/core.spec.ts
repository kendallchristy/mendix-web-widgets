import { detectKind, extensionOf, kindFromExtension, sniffKind } from "../core/fileTypes";
import { fillTemplate } from "../core/labels";
import { currentPageAt, layoutPages, PAGE_GAP, PAGE_PADDING, rotateSize, visiblePages } from "../core/pages";
import { countMatches, highlightMatches, MARK_CLASS, clearHighlights } from "../core/search";
import { clampScale, resolveScale, stepScale } from "../core/zoom";

const bytes = (text: string): Uint8Array => new Uint8Array(Array.from(text, c => c.charCodeAt(0)));
const withHeader = (header: number[], rest = ""): Uint8Array => new Uint8Array([...header, ...bytes(rest)]);
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

describe("file types", () => {
    it("reads extensions case-insensitively and ignores query strings", () => {
        expect(extensionOf("Report.PDF")).toBe("pdf");
        expect(extensionOf("https://example.com/files/sheet.xlsx?version=2#top")).toBe("xlsx");
        expect(extensionOf("README")).toBe("");
    });

    it("maps extensions to viewers", () => {
        expect(kindFromExtension("docx")).toBe("docx");
        expect(kindFromExtension("csv")).toBe("sheet");
        expect(kindFromExtension("ods")).toBe("sheet");
        expect(kindFromExtension("pptx")).toBe("pptx");
        expect(kindFromExtension("tif")).toBe("tiff");
        expect(kindFromExtension("png")).toBe("image");
        expect(kindFromExtension("ts")).toBe("code");
        expect(kindFromExtension("md")).toBe("markdown");
        expect(kindFromExtension("eml")).toBe("email");
        expect(kindFromExtension("mp4")).toBe("video");
        expect(kindFromExtension("exe")).toBe("unknown");
    });

    it("recognizes content from the first bytes", () => {
        expect(sniffKind(bytes("%PDF-1.7\n"))).toBe("pdf");
        expect(sniffKind(withHeader(ZIP, "....[Content_Types].xml word/document.xml"))).toBe("docx");
        expect(sniffKind(withHeader(ZIP, "....xl/workbook.xml"))).toBe("sheet");
        expect(sniffKind(withHeader(ZIP, "....ppt/presentation.xml"))).toBe("pptx");
        expect(sniffKind(withHeader([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image");
        expect(sniffKind(withHeader(OLE))).toBe("ole");
    });

    it("trusts unmistakable content over a wrong name", () => {
        expect(detectKind("invoice.docx", bytes("%PDF-1.4 ..."))).toEqual({ kind: "pdf", ext: "pdf" });
        expect(detectKind("download", withHeader(ZIP, "....word/document.xml"))).toEqual({ kind: "docx", ext: "docx" });
    });

    it("keeps the name's viewer when the content agrees or is plain text", () => {
        expect(detectKind("people.csv", bytes("Name,Age\nAda,36\n"))).toEqual({ kind: "sheet", ext: "csv" });
        expect(detectKind("deck.pptx", withHeader(ZIP, "ppt/slides/slide1.xml"))).toEqual({
            kind: "pptx",
            ext: "pptx"
        });
    });

    it("only opens legacy Office containers it can read", () => {
        expect(detectKind("old.xls", withHeader(OLE)).kind).toBe("sheet");
        expect(detectKind("mail.msg", withHeader(OLE)).kind).toBe("email");
        expect(detectKind("old.doc", withHeader(OLE)).kind).toBe("unknown");
    });
});

describe("labels", () => {
    it("fills placeholders in square brackets", () => {
        expect(fillTemplate("of [total]", { total: 12 })).toBe("of 12");
        expect(fillTemplate("[current] of [total]", { current: 2, total: 5 })).toBe("2 of 5");
        expect(fillTemplate("no placeholders", { total: 1 })).toBe("no placeholders");
    });
});

describe("zoom", () => {
    const page = { width: 800, height: 1000 };
    const viewport = { width: 832, height: 532 };

    it("fits the page width or the whole page inside the viewport", () => {
        expect(resolveScale({ mode: "fitWidth", scale: 1 }, page, viewport)).toBe(1);
        expect(resolveScale({ mode: "fitPage", scale: 1 }, page, viewport)).toBe(0.5);
        expect(resolveScale({ mode: "actual", scale: 3 }, page, viewport)).toBe(1);
        expect(resolveScale({ mode: "custom", scale: 1.5 }, page, viewport)).toBe(1.5);
    });

    it("never fits small images beyond the given limit", () => {
        expect(resolveScale({ mode: "fitWidth", scale: 1 }, { width: 100, height: 100 }, viewport, 1)).toBe(1);
    });

    it("steps through round percentages and stays in range", () => {
        expect(stepScale(1, 1)).toBe(1.1);
        expect(stepScale(1, -1)).toBe(0.9);
        expect(stepScale(1.17, 1)).toBe(1.25);
        expect(stepScale(5, 1)).toBe(5);
        expect(clampScale(0.01)).toBe(0.25);
        expect(clampScale(50)).toBe(5);
    });
});

describe("page layout", () => {
    const layout = layoutPages(
        [
            { width: 100, height: 200 },
            { width: 100, height: 200 },
            { width: 300, height: 100 }
        ],
        2
    );

    it("stacks pages with gaps and padding", () => {
        expect(layout.offsets).toEqual([
            PAGE_PADDING,
            PAGE_PADDING + 400 + PAGE_GAP,
            PAGE_PADDING + 800 + PAGE_GAP * 2
        ]);
        expect(layout.maxWidth).toBe(600);
        expect(layout.totalHeight).toBe(PAGE_PADDING * 2 + 1000 + PAGE_GAP * 2);
    });

    it("finds the pages in view and the current page", () => {
        expect(visiblePages(layout, 0, 300, 0)).toEqual([0]);
        expect(visiblePages(layout, 0, 300, 1)).toEqual([0, 1]);
        expect(currentPageAt(layout, 420, 300)).toBe(1);
    });

    it("swaps width and height for quarter turns", () => {
        expect(rotateSize({ width: 1, height: 2 }, 90)).toEqual({ width: 2, height: 1 });
        expect(rotateSize({ width: 1, height: 2 }, 180)).toEqual({ width: 1, height: 2 });
    });
});

describe("search", () => {
    it("counts matches without regard to case or special characters", () => {
        expect(countMatches("Revenue and revenue", "REVENUE")).toBe(2);
        expect(countMatches("a+b a+b", "a+b")).toBe(2);
        expect(countMatches("anything", "  ")).toBe(0);
    });

    it("marks matches in the DOM and removes the marks again", () => {
        const root = document.createElement("div");
        root.innerHTML = "<p>Total revenue</p><p>Revenue <b>grew</b> by revenue</p>";
        const marks = highlightMatches(root, "revenue");
        expect(marks).toHaveLength(3);
        expect(root.querySelectorAll(`.${MARK_CLASS}`)).toHaveLength(3);
        clearHighlights(root);
        expect(root.querySelectorAll(`.${MARK_CLASS}`)).toHaveLength(0);
        expect(root.textContent).toBe("Total revenueRevenue grew by revenue");
    });
});

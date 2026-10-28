import { cellText, columnName, findMatches, type SheetData } from "../views/SheetView";

describe("spreadsheet helpers", () => {
    it("names columns like Excel", () => {
        expect(columnName(0)).toBe("A");
        expect(columnName(25)).toBe("Z");
        expect(columnName(26)).toBe("AA");
        expect(columnName(701)).toBe("ZZ");
        expect(columnName(702)).toBe("AAA");
    });

    it("shows formatted values, and formulas nobody calculated", () => {
        expect(cellText({ t: "n", v: 1234.5, w: "1,234.50" })).toEqual({ text: "1,234.50", numeric: true });
        expect(cellText({ t: "s", v: "Hello" })).toEqual({ text: "Hello", numeric: false });
        expect(cellText({ t: "z", f: "C2*D2", v: 0 })).toEqual({ text: "=C2*D2", numeric: false });
        expect(cellText({ t: "z" })).toBeUndefined();
        expect(cellText(undefined)).toBeUndefined();
    });

    it("finds matching cells across sheets", () => {
        const sheet = (rows: string[][]): SheetData =>
            ({
                name: "Sheet",
                rows: rows.map(row => row.map(text => (text ? { text, numeric: false } : undefined))),
                rowCount: rows.length,
                colCount: 2,
                colWidths: [80, 80],
                rowHeights: rows.map(() => 22),
                merges: []
            }) as unknown as SheetData;
        const sheets = [
            sheet([
                ["Region 3", "x"],
                ["", "region 30"]
            ]),
            sheet([["nothing", "Region 3"]])
        ];
        expect(findMatches(sheets, "region 3")).toEqual([
            { sheet: 0, r: 0, c: 0 },
            { sheet: 0, r: 1, c: 1 },
            { sheet: 1, r: 0, c: 1 }
        ]);
        expect(findMatches(sheets, "")).toEqual([]);
    });
});

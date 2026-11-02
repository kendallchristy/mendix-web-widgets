import { Big } from "big.js";
import type { ObjectItem } from "mendix";

import type { ColumnsType } from "../../typings/DataGridProProps";
import { exportFileName, exportValue, isExportable } from "../model/exportColumns";
import { columnName, crc32, excelDate, xlsxParts, zip } from "../model/xlsx";

const item = { id: "1" } as ObjectItem;

function attributeColumn(type: string, value: unknown, displayValue = String(value)): ColumnsType {
    return {
        showContentAs: "attribute",
        attribute: {
            type,
            formatter: { format: (v: unknown) => `#${String(v)}` },
            get: () => ({ isList: Array.isArray(value), value, displayValue })
        }
    } as unknown as ColumnsType;
}

describe("export values", () => {
    it("keeps attribute types", () => {
        expect(exportValue(attributeColumn("Decimal", new Big("12.5")), item)).toBe(12.5);
        expect(exportValue(attributeColumn("Boolean", false), item)).toBe(false);
        const date = new Date(2026, 9, 30);
        expect(exportValue(attributeColumn("DateTime", date), item)).toBe(date);
        expect(exportValue(attributeColumn("String", "Acme"), item)).toBe("Acme");
    });

    it("exports enumeration captions and lists as text", () => {
        expect(exportValue(attributeColumn("Enum", "open", "Open"), item)).toBe("Open");
        expect(exportValue(attributeColumn("String", ["a", "b"]), item)).toBe("#a, #b");
    });

    it("prefers the export value when set", () => {
        const column = {
            showContentAs: "customContent",
            exportValue: { get: () => ({ value: "Custom" }) }
        } as unknown as ColumnsType;
        expect(isExportable(column)).toBe(true);
        expect(exportValue(column, item)).toBe("Custom");
    });

    it("leaves out custom content without an export value", () => {
        expect(isExportable({ showContentAs: "customContent" } as ColumnsType)).toBe(false);
    });

    it("makes safe file names", () => {
        expect(exportFileName("Q3: report/final")).toBe("Q3 report final.xlsx");
        expect(exportFileName(undefined)).toBe("Export.xlsx");
        expect(exportFileName("data.XLSX")).toBe("data.XLSX");
    });
});

describe("xlsx writer", () => {
    it("names columns like Excel", () => {
        expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
    });

    it("converts dates to Excel serial numbers in local time", () => {
        expect(excelDate(new Date(1900, 0, 1))).toBe(2);
        expect(excelDate(new Date(2026, 0, 1, 12))).toBe(46023.5);
    });

    it("computes zip checksums", () => {
        expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
    });

    it("writes typed cells and escapes text", () => {
        const sheet = xlsxParts({
            name: "Sales: Q3",
            columns: [
                { header: "Name", width: 10 },
                { header: "Amount", width: 10 },
                { header: "Paid", width: 6 }
            ],
            rows: [["A & <B>", 12.5, true]]
        });
        const worksheet = sheet.find(([path]) => path === "xl/worksheets/sheet1.xml")![1];
        expect(worksheet).toContain(
            '<c r="A2" t="inlineStr"><is><t xml:space="preserve">A &amp; &lt;B&gt;</t></is></c>'
        );
        expect(worksheet).toContain('<c r="B2"><v>12.5</v></c>');
        expect(worksheet).toContain('<c r="C2" t="b"><v>1</v></c>');
        expect(worksheet).toContain('<autoFilter ref="A1:C2"/>');
        const workbook = sheet.find(([path]) => path === "xl/workbook.xml")![1];
        expect(workbook).toContain('<sheet name="Sales  Q3"');
    });

    it("packs the parts into a zip", async () => {
        const archive = await zip([["a.txt", "hello"]]);
        const view = new DataView(archive.buffer);
        expect(view.getUint32(0, true)).toBe(0x04034b50);
        expect(view.getUint32(archive.length - 22, true)).toBe(0x06054b50);
        expect(view.getUint16(archive.length - 12, true)).toBe(1);
    });
});

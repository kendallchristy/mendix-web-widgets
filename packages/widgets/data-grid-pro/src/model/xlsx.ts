/**
 * A small .xlsx writer for grid exports: one sheet, a bold header row that stays in view, an autofilter, and
 * typed cells (numbers, dates, booleans and text). Writing the format directly keeps the widget free of a
 * spreadsheet library several hundred kilobytes in size.
 */

export type CellValue = string | number | boolean | Date | undefined;

export interface SheetColumn {
    header: string;
    /** Width in characters. */
    width: number;
}

export interface Sheet {
    name: string;
    columns: SheetColumn[];
    rows: CellValue[][];
}

/** Indexes into cellXfs in the styles part below. */
const Style = { Header: 1, Date: 2, DateTime: 3 } as const;

/** Characters XML 1.0 doesn't allow, even escaped. */
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

function escapeXml(text: string): string {
    return text
        .replace(INVALID_XML, "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Column letters: 0 is A, 25 is Z, 26 is AA. */
export function columnName(index: number): string {
    let name = "";
    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
        name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
    }
    return name;
}

/** Excel stores dates as days since 1899-12-30, in the time zone the user sees. */
export function excelDate(date: Date): number {
    const local = Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
    );
    return (local - Date.UTC(1899, 11, 30)) / 86400000;
}

function cell(ref: string, value: CellValue, header = false): string {
    if (value === undefined || value === "" || (typeof value === "number" && !Number.isFinite(value))) {
        return "";
    }
    if (typeof value === "number") {
        return `<c r="${ref}"><v>${value}</v></c>`;
    }
    if (typeof value === "boolean") {
        return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
    }
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return "";
        }
        const withTime = value.getHours() + value.getMinutes() + value.getSeconds() > 0;
        return `<c r="${ref}" s="${withTime ? Style.DateTime : Style.Date}"><v>${excelDate(value)}</v></c>`;
    }
    const style = header ? ` s="${Style.Header}"` : "";
    return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetName(name: string): string {
    const clean = name
        .replace(/[[\]:*?/\\]/g, " ")
        .trim()
        .slice(0, 31);
    return clean || "Export";
}

function worksheet(sheet: Sheet): string {
    const lastColumn = columnName(Math.max(sheet.columns.length - 1, 0));
    const lastRow = sheet.rows.length + 1;
    const parts: string[] = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
        '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>',
        '<sheetFormatPr defaultRowHeight="15"/>',
        "<cols>",
        ...sheet.columns.map(
            (column, i) =>
                `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(column.width, 6), 80)}" customWidth="1"/>`
        ),
        "</cols>",
        "<sheetData>",
        `<row r="1">${sheet.columns.map((column, i) => cell(`${columnName(i)}1`, column.header, true)).join("")}</row>`
    ];
    const names = sheet.columns.map((_, i) => columnName(i));
    sheet.rows.forEach((row, r) => {
        const number = r + 2;
        parts.push(`<row r="${number}">${row.map((value, i) => cell(`${names[i]}${number}`, value)).join("")}</row>`);
    });
    parts.push("</sheetData>");
    if (sheet.columns.length > 0) {
        parts.push(`<autoFilter ref="A1:${lastColumn}${lastRow}"/>`);
    }
    parts.push("</worksheet>");
    return parts.join("");
}

function workbook(sheet: Sheet): string {
    const name = sheetName(sheet.name);
    const lastColumn = columnName(Math.max(sheet.columns.length - 1, 0));
    return [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        `<sheets><sheet name="${escapeXml(name)}" sheetId="1" r:id="rId1"/></sheets>`,
        sheet.columns.length > 0
            ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${escapeXml(name.replace(/'/g, "''"))}'!$A$1:$${lastColumn}$${sheet.rows.length + 1}</definedName></definedNames>`
            : "",
        "</workbook>"
    ].join("");
}

const STYLES = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<numFmts count="2"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/><numFmt numFmtId="165" formatCode="yyyy-mm-dd hh:mm"/></numFmts>',
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>',
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    '<cellXfs count="4">',
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>',
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>',
    '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
    '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>',
    "</cellXfs>",
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
    "</styleSheet>"
].join("");

const CONTENT_TYPES = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    "</Types>"
].join("");

const ROOT_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';

const WORKBOOK_RELS =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** The parts of the .xlsx package, by path. */
export function xlsxParts(sheet: Sheet): Array<[path: string, content: string]> {
    return [
        ["[Content_Types].xml", CONTENT_TYPES],
        ["_rels/.rels", ROOT_RELS],
        ["xl/workbook.xml", workbook(sheet)],
        ["xl/_rels/workbook.xml.rels", WORKBOOK_RELS],
        ["xl/styles.xml", STYLES],
        ["xl/worksheets/sheet1.xml", worksheet(sheet)]
    ];
}

// Zip

let crcTable: Uint32Array | undefined;

export function crc32(data: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) {
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            }
            crcTable[n] = c >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) {
        crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

/** Compresses with the browser's built-in deflate, or returns undefined where it isn't available. */
async function deflate(data: Uint8Array): Promise<Uint8Array | undefined> {
    if (typeof CompressionStream === "undefined" || typeof Response === "undefined") {
        return undefined;
    }
    try {
        const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate-raw"));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
        return undefined;
    }
}

/** A zip archive of the given files, deflated when the browser can, stored otherwise. */
export async function zip(files: Array<[path: string, content: string]>): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;
    for (const [path, content] of files) {
        const name = encoder.encode(path);
        const raw = encoder.encode(content);
        const crc = crc32(raw);
        const deflated = await deflate(raw);
        const body = deflated ?? raw;
        const method = deflated ? 8 : 0;

        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // UTF-8 names
        local.setUint16(8, method, true);
        local.setUint32(14, crc, true);
        local.setUint32(18, body.length, true);
        local.setUint32(22, raw.length, true);
        local.setUint16(26, name.length, true);
        chunks.push(new Uint8Array(local.buffer), name, body);

        const entry = new DataView(new ArrayBuffer(46));
        entry.setUint32(0, 0x02014b50, true);
        entry.setUint16(4, 20, true);
        entry.setUint16(6, 20, true);
        entry.setUint16(8, 0x0800, true);
        entry.setUint16(10, method, true);
        entry.setUint32(16, crc, true);
        entry.setUint32(20, body.length, true);
        entry.setUint32(24, raw.length, true);
        entry.setUint16(28, name.length, true);
        entry.setUint32(42, offset, true);
        central.push(new Uint8Array(entry.buffer), name);

        offset += 30 + name.length + body.length;
    }
    const centralSize = central.reduce((size, part) => size + part.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, files.length, true);
    end.setUint16(10, files.length, true);
    end.setUint32(12, centralSize, true);
    end.setUint32(16, offset, true);

    const parts = [...chunks, ...central, new Uint8Array(end.buffer)];
    const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
    let at = 0;
    for (const part of parts) {
        result.set(part, at);
        at += part.length;
    }
    return result;
}

export async function buildXlsx(sheet: Sheet): Promise<Blob> {
    return new Blob([(await zip(xlsxParts(sheet))) as BlobPart], { type: XLSX_TYPE });
}

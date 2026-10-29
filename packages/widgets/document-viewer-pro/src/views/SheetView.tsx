import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import { matcher } from "../core/search";
import { reflowScale, useElementSize } from "./hooks";
import type { ViewProps } from "./types";

type SheetJs = Awaited<ReturnType<typeof loadEngine<"sheet">>>;
type WorkSheet = ReturnType<SheetJs["read"]>["Sheets"][string];

interface Cell {
    text: string;
    numeric: boolean;
}

interface Merge {
    r: number;
    c: number;
    rows: number;
    cols: number;
}

export interface SheetData {
    name: string;
    rows: Array<Array<Cell | undefined> | undefined>;
    rowCount: number;
    colCount: number;
    colWidths: number[];
    rowHeights: number[];
    merges: Merge[];
    worksheet: WorkSheet;
}

interface Match {
    sheet: number;
    r: number;
    c: number;
}

const DEFAULT_COL_WIDTH = 88;
const MAX_AUTO_WIDTH = 320;
const DEFAULT_ROW_HEIGHT = 22;
const HEADER_HEIGHT = 24;
// Large CSV exports can have millions of cells; the grid caps what it reads to stay responsive.
const MAX_ROWS = 200_000;
const MAX_COLS = 2_000;

export function columnName(index: number): string {
    let name = "";
    let n = index + 1;
    while (n > 0) {
        const rest = (n - 1) % 26;
        name = String.fromCharCode(65 + rest) + name;
        n = Math.floor((n - 1) / 26);
    }
    return name;
}

export function cellText(cell: { w?: string; v?: unknown; t?: string; f?: string } | undefined): Cell | undefined {
    if (!cell) {
        return undefined;
    }
    if (cell.t === "z" || (cell.v === undefined && cell.w === undefined)) {
        // A formula the saving app never calculated (files written by scripts) shows as its formula.
        return cell.f ? { text: `=${cell.f}`, numeric: false } : undefined;
    }
    let text = cell.w;
    if (text === undefined) {
        text = cell.v instanceof Date ? cell.v.toLocaleString() : String(cell.v ?? "");
    }
    return { text, numeric: cell.t === "n" || cell.t === "d" };
}

/** A width that fits a column's text, for files that don't store widths (CSV), judged from the first rows. */
function autoWidth(rows: Array<Array<Cell | undefined> | undefined>, c: number): number {
    let longest = 0;
    for (let r = 0; r < Math.min(rows.length, 200); r++) {
        longest = Math.max(longest, rows[r]?.[c]?.text.length ?? 0);
    }
    return Math.min(MAX_AUTO_WIDTH, Math.max(DEFAULT_COL_WIDTH, longest * 7 + 16));
}

export function readSheets(engine: SheetJs, bytes: ArrayBuffer, ext: string): SheetData[] {
    const options = { dense: true, cellDates: true, cellFormula: true, cellStyles: true, sheetStubs: true } as const;
    const workbook =
        ext === "csv" || ext === "tsv"
            ? engine.read(new TextDecoder().decode(bytes), {
                  ...options,
                  type: "string",
                  FS: ext === "tsv" ? "\t" : undefined
              })
            : engine.read(new Uint8Array(bytes), { ...options, type: "array" });
    const sheets: SheetData[] = [];
    workbook.SheetNames.forEach((name, index) => {
        if (workbook.Workbook?.Sheets?.[index]?.Hidden) {
            return;
        }
        const worksheet = workbook.Sheets[name];
        const ref = worksheet["!ref"];
        const range = ref ? engine.utils.decode_range(ref) : { s: { r: 0, c: 0 }, e: { r: -1, c: -1 } };
        // Some writers (LibreOffice) leave merged ranges outside the sheet's used range.
        const merged = worksheet["!merges"] ?? [];
        const lastRow = Math.max(range.e.r, ...merged.map(m => m.e.r));
        const lastCol = Math.max(range.e.c, ...merged.map(m => m.e.c));
        const rowCount = Math.min(lastRow + 1, MAX_ROWS);
        const colCount = Math.min(lastCol + 1, MAX_COLS);
        const data = (worksheet["!data"] ?? []) as Array<Array<{ w?: string; v?: unknown; t?: string }> | undefined>;
        const rows = data.slice(0, rowCount).map(row => row?.slice(0, colCount).map(cellText));
        const cols = worksheet["!cols"] ?? [];
        const rowInfo = worksheet["!rows"] ?? [];
        const colWidths = Array.from({ length: colCount }, (_, c) => {
            const col = cols[c];
            if (col?.hidden) {
                return 0;
            }
            if (col?.width || col?.wpx) {
                // Excel's width unit is about 7 pixels at the default font.
                return Math.round(col.width ? col.width * 7 : (col.wpx as number));
            }
            return autoWidth(rows, c);
        });
        const rowHeights = Array.from({ length: rowCount }, (_, r) => {
            const row = rowInfo[r];
            if (row?.hidden) {
                return 0;
            }
            return Math.round(row?.hpx ?? (row?.hpt ? (row.hpt * 96) / 72 : DEFAULT_ROW_HEIGHT));
        });
        const merges = merged
            .filter(m => m.s.r < rowCount && m.s.c < colCount)
            .map(m => ({
                r: m.s.r,
                c: m.s.c,
                rows: Math.min(m.e.r, rowCount - 1) - m.s.r + 1,
                cols: Math.min(m.e.c, colCount - 1) - m.s.c + 1
            }));
        sheets.push({ name, rows, rowCount, colCount, colWidths, rowHeights, merges, worksheet });
    });
    return sheets;
}

function prefix(sizes: number[], scale: number): number[] {
    const result = [0];
    for (const size of sizes) {
        result.push(result[result.length - 1] + size * scale);
    }
    return result;
}

/** First index whose start is at or before the position. */
function indexAt(starts: number[], position: number): number {
    let low = 0;
    let high = starts.length - 2;
    let found = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (starts[mid] <= position) {
            found = mid;
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return Math.max(0, found);
}

export function findMatches(sheets: SheetData[], query: string): Match[] {
    const pattern = matcher(query);
    if (!pattern) {
        return [];
    }
    const matches: Match[] = [];
    sheets.forEach((sheet, s) => {
        sheet.rows.forEach((row, r) => {
            row?.forEach((cell, c) => {
                pattern.lastIndex = 0;
                if (cell && pattern.test(cell.text)) {
                    matches.push({ sheet: s, r, c });
                }
            });
        });
    });
    return matches;
}

/** Which cells start a merged range, and which cells a merge hides. */
function indexMerges(merges: Merge[]): { covered: Set<string>; mergeAt: Map<string, Merge> } {
    const covered = new Set<string>();
    const mergeAt = new Map<string, Merge>();
    for (const merge of merges) {
        mergeAt.set(`${merge.r}:${merge.c}`, merge);
        for (let r = merge.r; r < merge.r + merge.rows; r++) {
            for (let c = merge.c; c < merge.c + merge.cols; c++) {
                if (r !== merge.r || c !== merge.c) {
                    covered.add(`${r}:${c}`);
                }
            }
        }
    }
    return { covered, mergeAt };
}

export function SheetView(props: ViewProps): ReactElement | null {
    const { file, callbacks, zoom, query, activeMatch } = props;
    const [sheets, setSheets] = useState<SheetData[] | null>(null);
    const [active, setActive] = useState(0);
    const [scroll, setScroll] = useState({ top: 0, left: 0 });
    const scroller = useRef<HTMLDivElement>(null);
    const viewport = useElementSize(scroller);
    const engine = useRef<SheetJs | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadEngine("sheet")
            .then(sheetJs => {
                if (cancelled || !file.bytes) {
                    return;
                }
                engine.current = sheetJs;
                const parsed = readSheets(sheetJs, file.bytes, file.ext);
                setSheets(parsed);
                callbacks.onReady({ zoomable: true, fits: false, rotatable: false, searchable: true });
            })
            .catch(() => {
                if (!cancelled) {
                    callbacks.onError();
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const scale = reflowScale(zoom);
    useEffect(() => {
        callbacks.onScale(scale);
    }, [scale, callbacks]);

    const sheet = sheets?.[active];

    useEffect(() => {
        if (!sheet || !engine.current) {
            return;
        }
        const sheetJs = engine.current;
        callbacks.onInfo({
            print: async () => ({
                kind: "html",
                html: sheetJs.utils.sheet_to_html(sheet.worksheet, { header: "", footer: "" }),
                css: "table { border-collapse: collapse; font: 11px system-ui, sans-serif; } td { border: 1px solid #ccc; padding: 2px 4px; }"
            })
        });
    }, [sheet, callbacks]);

    const matches = useMemo(() => (sheets ? findMatches(sheets, query) : []), [sheets, query]);
    useEffect(() => {
        if (sheets) {
            callbacks.onMatches(matches.length);
        }
    }, [matches, sheets, callbacks]);

    const colStarts = useMemo(() => (sheet ? prefix(sheet.colWidths, scale) : [0]), [sheet, scale]);
    const rowStarts = useMemo(() => (sheet ? prefix(sheet.rowHeights, scale) : [0]), [sheet, scale]);
    const mergeIndex = useMemo(() => indexMerges(sheet?.merges ?? []), [sheet]);
    const rowHeaderWidth = Math.round((String(sheet?.rowCount ?? 1).length * 8 + 20) * scale);
    const headerHeight = Math.round(HEADER_HEIGHT * scale);

    // The active match opens its sheet, then scrolls into view.
    const current = matches[activeMatch];
    const [shownMatch, setShownMatch] = useState(current);
    if (current !== shownMatch) {
        setShownMatch(current);
        if (current && current.sheet !== active) {
            setActive(current.sheet);
        }
    }
    useEffect(() => {
        if (!current || current.sheet !== active) {
            return;
        }
        const element = scroller.current;
        if (!element) {
            return;
        }
        const x = colStarts[current.c] ?? 0;
        const y = rowStarts[current.r] ?? 0;
        element.scrollTop = Math.max(0, y - element.clientHeight / 2);
        element.scrollLeft = Math.max(0, x - element.clientWidth / 3);
    }, [current, active, colStarts, rowStarts]);

    const onScroll = useCallback(() => {
        const element = scroller.current;
        if (element) {
            setScroll({ top: element.scrollTop, left: element.scrollLeft });
        }
    }, []);

    if (!sheets) {
        return null;
    }
    if (!sheet) {
        return <div className="dvp-sheet dvp-sheet--empty" />;
    }

    const height = viewport.height || 600;
    const width = viewport.width || 800;
    const firstRow = indexAt(rowStarts, scroll.top);
    const lastRow = Math.min(sheet.rowCount - 1, indexAt(rowStarts, scroll.top + height) + 1);
    const firstCol = indexAt(colStarts, scroll.left);
    const lastCol = Math.min(sheet.colCount - 1, indexAt(colStarts, scroll.left + width) + 1);
    const pattern = matcher(query);

    const { covered, mergeAt } = mergeIndex;
    const cells: ReactElement[] = [];
    const renderCell = (r: number, c: number, merge?: Merge): void => {
        const cell = sheet.rows[r]?.[c];
        const w = merge ? colStarts[merge.c + merge.cols] - colStarts[c] : sheet.colWidths[c] * scale;
        const h = merge ? rowStarts[merge.r + merge.rows] - rowStarts[r] : sheet.rowHeights[r] * scale;
        if (w <= 0 || h <= 0) {
            return;
        }
        let matched = false;
        if (pattern && cell) {
            pattern.lastIndex = 0;
            matched = pattern.test(cell.text);
        }
        const isActive = current && current.sheet === active && current.r === r && current.c === c;
        cells.push(
            <div
                key={`${r}:${c}`}
                className={classNames("dvp-cell", {
                    "dvp-cell--number": cell?.numeric,
                    "dvp-cell--merged": merge,
                    "dvp-cell--match": matched,
                    "dvp-cell--active": isActive
                })}
                style={{ left: colStarts[c], top: rowStarts[r], width: w, height: h }}
                title={cell && cell.text.length > 40 ? cell.text : undefined}
            >
                {cell?.text}
            </div>
        );
    };
    for (let r = firstRow; r <= lastRow; r++) {
        for (let c = firstCol; c <= lastCol; c++) {
            const key = `${r}:${c}`;
            if (!covered.has(key)) {
                renderCell(r, c, mergeAt.get(key));
            }
        }
    }
    // Merged cells that start above or left of the visible area still need drawing.
    for (const merge of sheet.merges) {
        const startsInside = merge.r >= firstRow && merge.c >= firstCol;
        const reaches =
            merge.r <= lastRow &&
            merge.r + merge.rows - 1 >= firstRow &&
            merge.c <= lastCol &&
            merge.c + merge.cols - 1 >= firstCol;
        if (!startsInside && reaches) {
            renderCell(merge.r, merge.c, merge);
        }
    }

    const columnHeaders: ReactElement[] = [];
    for (let c = firstCol; c <= lastCol; c++) {
        if (sheet.colWidths[c] > 0) {
            columnHeaders.push(
                <div
                    key={c}
                    className="dvp-col-header"
                    style={{ left: colStarts[c], width: sheet.colWidths[c] * scale }}
                >
                    {columnName(c)}
                </div>
            );
        }
    }
    const rowHeaders: ReactElement[] = [];
    for (let r = firstRow; r <= lastRow; r++) {
        if (sheet.rowHeights[r] > 0) {
            rowHeaders.push(
                <div
                    key={r}
                    className="dvp-row-header"
                    style={{ top: rowStarts[r], height: sheet.rowHeights[r] * scale }}
                >
                    {r + 1}
                </div>
            );
        }
    }

    return (
        <div className="dvp-sheet" style={{ fontSize: `${12 * scale}px` }}>
            <div
                className="dvp-sheet-grid"
                style={{ gridTemplateColumns: `${rowHeaderWidth}px 1fr`, gridTemplateRows: `${headerHeight}px 1fr` }}
            >
                <div className="dvp-sheet-corner" />
                <div className="dvp-sheet-col-headers">
                    <div className="dvp-sheet-track" style={{ transform: `translateX(${-scroll.left}px)` }}>
                        {columnHeaders}
                    </div>
                </div>
                <div className="dvp-sheet-row-headers">
                    <div className="dvp-sheet-track" style={{ transform: `translateY(${-scroll.top}px)` }}>
                        {rowHeaders}
                    </div>
                </div>
                <div ref={scroller} className="dvp-sheet-body" onScroll={onScroll} tabIndex={0}>
                    <div
                        className="dvp-sheet-cells"
                        style={{ width: colStarts[colStarts.length - 1], height: rowStarts[rowStarts.length - 1] }}
                    >
                        {cells}
                    </div>
                </div>
            </div>
            {sheets.length > 1 && (
                <div className="dvp-sheet-tabs" role="tablist">
                    {sheets.map((s, i) => (
                        <button
                            key={s.name}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            className={classNames("dvp-sheet-tab", { "dvp-sheet-tab--active": i === active })}
                            onClick={() => {
                                setActive(i);
                                setScroll({ top: 0, left: 0 });
                                if (scroller.current) {
                                    scroller.current.scrollTop = 0;
                                    scroller.current.scrollLeft = 0;
                                }
                            }}
                        >
                            {s.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

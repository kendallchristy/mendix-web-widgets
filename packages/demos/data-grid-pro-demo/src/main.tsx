import { DataGridPro } from "@kendallchristy/data-grid-pro/src/DataGridPro";
import type { DataGridProContainerProps } from "@kendallchristy/data-grid-pro/typings/DataGridProProps";
import { StrictMode, useEffect, useReducer, useState, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import { generate, type Competitor, type Keyword } from "./data";
import {
    MockList,
    action,
    attribute,
    dynamic,
    expression,
    listAttribute,
    reference,
    widgets
} from "./mendix-mock/list";

const params = new URLSearchParams(window.location.search);
const ROWS = Number(params.get("rows") ?? 20000);
const LATENCY = Number(params.get("latency") ?? 120);
const { competitors, keywords } = generate(ROWS);

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US");

const column = (overrides: Record<string, unknown>): unknown => ({
    showContentAs: "attribute",
    visible: dynamic(true),
    cellStyle: "text",
    progressMax: 100,
    expandedWidth: 0,
    alignment: "left",
    sortable: true,
    resizable: true,
    hidable: "yes",
    widthMode: "fill",
    fillWeight: 1,
    fixedWidth: 120,
    minWidth: 90,
    ...overrides
});

function App(): ReactElement {
    const [, rerender] = useReducer((n: number) => n + 1, 0);
    const [lists] = useState(() => ({
        competitors: new MockList<Competitor>(
            competitors,
            {
                latency: LATENCY,
                sortValue: (row, id) => row[id as keyof Competitor] as string | number,
                association: () => undefined
            },
            () => rerender()
        ),
        keywords: new MockList<Keyword>(
            keywords,
            { latency: LATENCY, sortValue: row => row.text, association: row => row.owner },
            () => rerender()
        )
    }));
    const [selection, setSelection] = useState<Competitor[]>([]);

    const props = {
        name: "competitorsGrid",
        class: "",
        datasource: lists.competitors.value(),
        refreshInterval: 0,
        pinFirstColumn: true,
        density: "default",
        stripes: false,
        onClickTrigger: "double",
        expandTrigger: "row",
        singleExpand: true,
        onClick: action<Competitor>(row => console.info("Open", row.domain)),
        detailContent: widgets<Competitor>(row => (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 220px))", gap: 24 }}>
                <div>
                    <strong>Today</strong>
                    <div>Backlinks {number.format(row.backlinks)}</div>
                </div>
                <div>
                    <strong>Referring domains</strong>
                    <div>{number.format(row.htCount)}</div>
                </div>
                <div>
                    <strong>Score</strong>
                    <div>{row.score}</div>
                </div>
            </div>
        )),
        itemSelection: { type: "Multi", selection, setSelection },
        title: dynamic("Competitors"),
        showCount: true,
        toolbarContent: (
            <div style={{ display: "flex", gap: 8, width: "100%" }}>
                {["CPC (USD)", "Include keywords", "Exclude keywords", "Average filters"].map(label => (
                    <button key={label} className="dgp-tool-button" type="button">
                        {label} ▾
                    </button>
                ))}
                <button
                    type="button"
                    className="dgp-tool-button"
                    style={{ marginLeft: "auto", background: "#16a34a", color: "white", borderColor: "#16a34a" }}
                >
                    Download full list
                </button>
            </div>
        ),
        bulkActions: (
            <button type="button" className="dgp-tool-button">
                Export selected
            </button>
        ),
        showColumnMenu: true,
        showDensityToggle: true,
        pagination: params.get("pages") ? "pages" : "virtualScrolling",
        pageSize: 50,
        heightMode: "fixed",
        height: 640,
        configurationStorage: "browser",
        columns: [
            column({
                header: dynamic("Domain"),
                attribute: attribute<Competitor>("domain", "String", row => row.domain),
                fillWeight: 2,
                minWidth: 200,
                hidable: "no"
            }),
            column({
                header: dynamic("Backlinks"),
                attribute: attribute<Competitor>(
                    "backlinks",
                    "Integer",
                    row => row.backlinks,
                    v => number.format(v as number)
                ),
                alignment: "right",
                widthMode: "fixed",
                fixedWidth: 110
            }),
            column({
                header: dynamic("Flag"),
                attribute: listAttribute<Competitor>("flags", row => row.flags),
                sortable: false,
                minWidth: 160
            }),
            column({
                header: dynamic("ND"),
                showContentAs: "customContent",
                content: widgets<Competitor>(row => (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                        {row.score}
                        <span
                            className={`dgp-badge dgp-badge--${row.grade === "A" ? "green" : row.grade === "F" ? "red" : "yellow"}`}
                        >
                            {row.grade}
                        </span>
                    </span>
                )),
                widthMode: "fixed",
                fixedWidth: 90
            }),
            column({
                header: dynamic("Location"),
                attribute: attribute<Competitor>("country", "String", row => row.country),
                cellStyle: "badge",
                badgeColor: expression(() => "gray"),
                widthMode: "fixed",
                fixedWidth: 100
            }),
            column({
                header: dynamic("HT"),
                attribute: attribute<Competitor>("ht", "Integer", row => row.ht),
                cellStyle: "progress",
                expandedText: expression<Competitor>(row => number.format(row.htCount)),
                expandedWidth: 200,
                widthMode: "fixed",
                fixedWidth: 100
            }),
            column({
                header: dynamic("TT"),
                attribute: attribute<Competitor>("tt", "Integer", row => row.tt),
                cellStyle: "progress",
                widthMode: "fixed",
                fixedWidth: 100
            }),
            column({
                header: dynamic("Keywords"),
                showContentAs: "related",
                relatedSource: lists.keywords.value(),
                relatedParent: reference<Keyword>("owner", row => row.owner),
                relatedCaption: expression<Keyword>(row => row.text),
                relatedColor: expression<Keyword>(row => row.color),
                minWidth: 200
            }),
            column({
                header: dynamic("Contract"),
                attribute: attribute<Competitor>(
                    "contract",
                    "Integer",
                    row => row.contract,
                    v => money.format(v as number)
                ),
                alignment: "right",
                widthMode: "fixed",
                fixedWidth: 110
            }),
            column({
                header: dynamic("Active"),
                attribute: attribute<Competitor>("active", "Boolean", row => row.active),
                alignment: "center",
                widthMode: "fixed",
                fixedWidth: 80,
                hidable: "hidden"
            })
        ]
    } as unknown as DataGridProContainerProps;

    return (
        <>
            <DataGridPro {...props} />
            <Stats requests={lists.competitors.requests + lists.keywords.requests} />
        </>
    );
}

/** Live counters used by the benchmark: rendered rows and requests made. */
function Stats({ requests }: { requests: number }): ReactElement {
    const [rows, setRows] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setRows(document.querySelectorAll(".dgp-row").length), 250);
        return () => clearInterval(timer);
    }, []);
    return (
        <p id="stats" style={{ color: "#6b7280", fontSize: 12 }}>
            {number.format(ROWS)} rows in the data source · <span id="dom-rows">{rows}</span> rows in the page ·{" "}
            <span id="requests">{requests}</span> requests
        </p>
    );
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);

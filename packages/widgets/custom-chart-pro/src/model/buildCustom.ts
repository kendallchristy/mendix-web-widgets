import type { BuiltChart, ChartTokens, ClickTarget } from "@kendallchristy/chart-core";
import { baseOption, deepMerge, isPlainObject, mergeJsonTexts } from "@kendallchristy/chart-core";

import type { Cell, CustomSettings, DataSet } from "./types";

// Strings in the option that stand for Mendix data, such as "$rows:Sales" or "$column:Sales.value".
const PLACEHOLDER = /^\$(rows|column|tree|nodes):([A-Za-z0-9_]+)(?:\.(.+))?$/;

/** A tree node built from rows with name, parent and value fields, remembering which row it came from. */
interface TreeNode {
    row: number;
    node: Record<string, unknown>;
    children: TreeNode[];
}

/** Nests rows under their parent by name. Rows without a parent that exists are roots. */
function buildTree(set: DataSet): TreeNode[] {
    const nodes = set.rows.map((row, i) => {
        const { parent: _parent, ...rest } = row;
        return { row: i, node: { ...rest } as Record<string, unknown>, children: [] as TreeNode[] };
    });
    const byName = new Map<string, TreeNode>();
    nodes.forEach(n => {
        const name = set.rows[n.row].name;
        if (name != null && !byName.has(String(name))) {
            byName.set(String(name), n);
        }
    });
    const roots: TreeNode[] = [];
    nodes.forEach(n => {
        const parentName = set.rows[n.row].parent;
        const parent = parentName == null ? undefined : byName.get(String(parentName));
        if (parent && parent !== n) {
            parent.children.push(n);
        } else {
            roots.push(n);
        }
    });
    return roots;
}

/** The tree as ECharts takes it, and its rows in the order ECharts numbers the nodes: depth first. */
function treeData(roots: TreeNode[]): { data: unknown[]; order: number[] } {
    const order: number[] = [];
    const visit = (n: TreeNode): Record<string, unknown> => {
        order.push(n.row);
        return n.children.length > 0 ? { ...n.node, children: n.children.map(visit) } : n.node;
    };
    return { data: roots.map(visit), order };
}

/**
 * The distinct names in the source and target fields, as sankey and graph nodes, each in the next palette colour.
 * ECharts would otherwise blend colours between palette entries once there are more nodes than colours.
 */
function nodeNames(set: DataSet, palette: string[]): Array<Record<string, unknown>> {
    const names = new Set<string>();
    for (const row of set.rows) {
        for (const value of [row.source, row.target]) {
            if (value != null) {
                names.add(String(value));
            }
        }
    }
    return [...names].map((name, i) => ({ name, itemStyle: { color: palette[i % palette.length] } }));
}

interface Resolved {
    value: unknown;
    /** The rows behind each data item, when a series' data came from a data set. */
    rows?: { set: DataSet; order: number[] };
}

/**
 * Replaces each placeholder string in the option with the data set it names. Unknown data sets and fields are
 * reported rather than left for ECharts to choke on.
 */
function resolve(value: unknown, sets: Map<string, DataSet>, palette: string[], errors: string[]): Resolved {
    if (typeof value === "string") {
        const match = PLACEHOLDER.exec(value);
        if (!match) {
            return { value };
        }
        const [, kind, name, field] = match;
        const set = sets.get(name);
        if (!set) {
            errors.push(`"${value}" names a data set that doesn't exist.`);
            return { value: [] };
        }
        switch (kind) {
            case "rows":
                return { value: set.rows, rows: { set, order: set.rows.map((_, i) => i) } };
            case "column":
                if (!field || !set.fields.includes(field)) {
                    errors.push(
                        `"${value}" names a field ${set.name} doesn't have. Its fields are ${set.fields.join(", ")}.`
                    );
                    return { value: [] };
                }
                return { value: set.rows.map(row => row[field]) };
            case "tree": {
                const { data, order } = treeData(buildTree(set));
                return { value: data, rows: { set, order } };
            }
            default:
                return { value: nodeNames(set, palette) };
        }
    }
    if (Array.isArray(value)) {
        return { value: value.map(item => resolve(item, sets, palette, errors).value) };
    }
    if (isPlainObject(value)) {
        return {
            value: Object.fromEntries(
                Object.entries(value).map(([k, v]) => [k, resolve(v, sets, palette, errors).value])
            )
        };
    }
    return { value };
}

/** The data sets as ECharts datasets: one row per object, fields in order. */
function datasetsOf(sets: DataSet[]): Array<Record<string, unknown>> {
    return sets.map(set => ({
        id: set.name,
        dimensions: set.fields,
        source: set.rows.map(row => set.fields.map(field => row[field] as Cell))
    }));
}

/**
 * The Hyper look for the series types people reach for most, under whatever the option says. Series types not
 * listed take ECharts' defaults with the Hyper theme's colours and fonts.
 */
export function hyperSeriesDefaults(type: unknown, tokens: ChartTokens): Record<string, unknown> {
    const surfaceEdge = { borderColor: tokens.surface, borderWidth: 2 };
    switch (type) {
        case "treemap":
            return {
                breadcrumb: { show: false },
                itemStyle: { ...surfaceEdge, gapWidth: 2, borderRadius: 6 },
                label: { color: "#FFFFFF", fontSize: 12 },
                upperLabel: { color: "#FFFFFF" }
            };
        case "sunburst":
            return {
                itemStyle: { ...surfaceEdge, borderRadius: 4 },
                label: { color: "#FFFFFF", fontSize: 11, textBorderWidth: 0 }
            };
        case "sankey":
            return {
                nodeWidth: 12,
                nodeGap: 10,
                itemStyle: { borderWidth: 0, borderRadius: 3 },
                lineStyle: { color: "gradient", opacity: 0.3, curveness: 0.5 },
                label: { color: tokens.text, fontSize: 11, textBorderWidth: 0 },
                emphasis: { focus: "adjacency" }
            };
        case "graph":
            return {
                itemStyle: surfaceEdge,
                lineStyle: { color: tokens.grid, width: 1.5, opacity: 1 },
                label: { color: tokens.text, fontSize: 11, position: "right", textBorderWidth: 0 },
                emphasis: { focus: "adjacency" }
            };
        case "pie":
            return { itemStyle: { ...surfaceEdge, borderRadius: 4 } };
        case "bar":
            return { itemStyle: { borderRadius: 4 }, barMaxWidth: 32 };
        case "line":
            return { symbol: "circle", symbolSize: 6, lineStyle: { width: 2.5 } };
        default:
            return {};
    }
}

/**
 * Series types whose data items are lists of values read by position, such as [x, y]. A row object means nothing to
 * them, so "$rows:…" hands them each row as a list instead. Pie, graph, sankey and the like take row objects as they are.
 */
const ROW_ARRAY_TYPES = new Set([
    "line",
    "bar",
    "scatter",
    "effectScatter",
    "pictorialBar",
    "candlestick",
    "boxplot",
    "heatmap",
    "parallel",
    "themeRiver",
    "custom"
]);

/** Series types that sit on an x and a y axis unless their coordinateSystem says otherwise. */
const CARTESIAN_TYPES = new Set([
    "line",
    "bar",
    "scatter",
    "effectScatter",
    "pictorialBar",
    "candlestick",
    "boxplot",
    "heatmap",
    "custom"
]);

const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

/** Builds the chart from the option JSON and the data sets. */
export function buildCustom(sets: DataSet[], settings: CustomSettings, tokens: ChartTokens): BuiltChart<string> {
    const parsed = mergeJsonTexts(settings.optionJson);
    const errors = parsed.errors.map(e => `Option JSON: ${e}`);
    const empty: BuiltChart<string> = {
        option: {},
        clickTargets: [],
        breadcrumb: [],
        table: { columns: [], rows: [] },
        pointCount: 1,
        errors
    };
    if (errors.length > 0) {
        return empty;
    }
    if (!parsed.value) {
        return { ...empty, errors: ["Add an ECharts option in Option JSON."] };
    }

    const byName = new Map(sets.map(set => [set.name, set]));
    const user = parsed.value;
    // Series resolve one by one, so a series whose data came from a data set knows its rows for clicks.
    const series = asList(user.series).map(s => {
        if (!isPlainObject(s)) {
            return { value: s };
        }
        const { data: own, ...rest } = s;
        const resolved = deepMerge(
            hyperSeriesDefaults(s.type, tokens),
            resolve(rest, byName, tokens.palette, errors).value as Record<string, unknown>
        );
        if (own === undefined) {
            return { value: resolved };
        }
        const data = resolve(own, byName, tokens.palette, errors);
        if (data.rows && ROW_ARRAY_TYPES.has(String(s.type)) && typeof own === "string" && own.startsWith("$rows:")) {
            // Series on axes read values by position, so their rows become arrays, with the fields named for encode.
            const { set } = data.rows;
            return {
                value: {
                    dimensions: set.fields,
                    ...resolved,
                    data: set.rows.map(row => set.fields.map(field => row[field]))
                },
                rows: data.rows
            };
        }
        return { value: { ...resolved, data: data.value }, rows: data.rows };
    });
    const { series: _series, dataset: ownDatasets, ...others } = user;
    const option = resolve(others, byName, tokens.palette, errors).value as Record<string, unknown>;
    errors.push(
        ...axisProblems(
            series.map(s => s.value),
            option
        )
    );
    const userDatasets = asList(ownDatasets);
    const datasets = [...userDatasets, ...datasetsOf(sets)];

    // A series reads a dataset by id or index, and the first dataset when it has no data of its own.
    const setForDataset = (s: Record<string, unknown>): DataSet | undefined => {
        if (s.data !== undefined) {
            return undefined;
        }
        if (typeof s.datasetId === "string") {
            return byName.get(s.datasetId);
        }
        const index = typeof s.datasetIndex === "number" ? s.datasetIndex : 0;
        return index >= userDatasets.length ? sets[index - userDatasets.length] : undefined;
    };
    const clickTargets: Array<Array<ClickTarget<string>>> = series.map(({ value, rows }) => {
        const offset = isPlainObject(value) && (value.type === "treemap" || value.type === "sunburst") && rows ? 1 : 0;
        const source = rows ?? (isPlainObject(value) ? datasetRows(setForDataset(value)) : undefined);
        if (!source) {
            return [];
        }
        // Treemaps and sunbursts number an invisible root before the first node.
        const targets: Array<ClickTarget<string>> = offset ? [{}] : [];
        for (const row of source.order) {
            targets.push({
                get action() {
                    return source.set.actionOf(row);
                }
            });
        }
        return targets;
    });

    const finished: Record<string, unknown> = deepMerge(baseOption(tokens, settings.style), {
        ...option,
        ...(datasets.length > 0 ? { dataset: datasets } : {}),
        series: series.map(s => s.value)
    });

    const rowCount = sets.reduce((sum, set) => sum + set.rows.length, 0);
    return {
        option: finished,
        clickTargets,
        breadcrumb: [],
        table: tableOf(sets),
        // A chart with no data sets draws whatever its option holds; one whose data sets are all empty has no data.
        pointCount: sets.length === 0 ? 1 : rowCount,
        errors
    };
}

/**
 * Series on x and y axes that name an axis the option doesn't have. ECharts fails on these with an unhelpful
 * "Cannot read properties of undefined", so they are reported in words instead.
 */
function axisProblems(series: unknown[], option: Record<string, unknown>): string[] {
    const problems: string[] = [];
    series.forEach((s, i) => {
        if (!isPlainObject(s) || !CARTESIAN_TYPES.has(String(s.type))) {
            return;
        }
        if (s.coordinateSystem !== undefined && s.coordinateSystem !== "cartesian2d") {
            return;
        }
        for (const axis of ["xAxis", "yAxis"]) {
            const axes = asList(option[axis]);
            const id = s[`${axis}Id`];
            const index = s[`${axis}Index`] ?? 0;
            const label = `Series ${i + 1} (${String(s.type)})`;
            if (axes.length === 0) {
                problems.push(`${label} is drawn on x and y axes, but the option has no ${axis}.`);
            } else if (id !== undefined) {
                if (!axes.some(a => isPlainObject(a) && a.id === id)) {
                    problems.push(`${label} uses ${axis}Id "${String(id)}", but no ${axis} has that id.`);
                }
            } else if (typeof index === "number" && index >= axes.length) {
                problems.push(`${label} uses ${axis}Index ${index}, but the option has only ${axes.length} ${axis}.`);
            }
        }
    });
    return problems;
}

function datasetRows(set: DataSet | undefined): { set: DataSet; order: number[] } | undefined {
    return set ? { set, order: set.rows.map((_, i) => i) } : undefined;
}

function cellText(value: Cell | undefined): string {
    if (value == null) {
        return "";
    }
    return value instanceof Date ? value.toISOString() : String(value);
}

/** Every data set's rows, for the screen-reader table. */
function tableOf(sets: DataSet[]): BuiltChart<string>["table"] {
    const fields = [...new Set(sets.flatMap(set => set.fields))];
    const several = sets.length > 1;
    return {
        columns: several ? ["Data set", ...fields] : fields,
        rows: sets.flatMap(set =>
            set.rows.map(row => [...(several ? [set.name] : []), ...fields.map(field => cellText(row[field]))])
        )
    };
}

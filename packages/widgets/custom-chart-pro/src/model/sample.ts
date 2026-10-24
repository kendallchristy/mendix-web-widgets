import type { Cell, DataSet } from "./types";

/** A believable value for a field, guessed from its name, for Studio Pro's design mode. */
function sampleCell(field: string, i: number): Cell {
    const name = field.toLowerCase();
    if (/value|amount|count|total|size|qty|quantity|price|sales|score|^y$/.test(name)) {
        return [120, 96, 74, 58, 40][i];
    }
    if (name === "parent") {
        return i === 0 ? null : i < 3 ? "Item 1" : "Item 2";
    }
    if (name === "target") {
        return `Item ${Math.min(5, i + 2)}`;
    }
    if (/date|time|day|month/.test(name)) {
        return new Date(2025, i, 1);
    }
    return `Item ${i + 1}`;
}

/** Five sample rows for each data set, so the design-mode preview draws the option's shape. */
export function sampleDataSets(sets: Array<{ name: string; fields: string[] }>): DataSet[] {
    return sets.map(set => ({
        name: set.name,
        fields: set.fields,
        rows: [0, 1, 2, 3, 4].map(i => Object.fromEntries(set.fields.map(field => [field, sampleCell(field, i)]))),
        actionOf: () => undefined
    }));
}

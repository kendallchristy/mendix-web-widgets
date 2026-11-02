import { Big } from "big.js";
import type { ListAttributeValue } from "mendix";
import type { FilterCondition } from "mendix/filters";
import {
    and,
    attribute,
    contains,
    dayGreaterThanOrEqual,
    dayLessThanOrEqual,
    equals,
    greaterThan,
    greaterThanOrEqual,
    lessThan,
    lessThanOrEqual,
    literal,
    or
} from "mendix/filters/builders";

export type FilterKind = "text" | "number" | "date" | "enum" | "boolean";

/** What a user has entered in one column's header filter. */
export type FilterValue =
    | { kind: "text"; text: string }
    | { kind: "number"; text: string }
    | { kind: "date"; from?: string; to?: string }
    | { kind: "enum"; values: string[] }
    | { kind: "boolean"; value: boolean };

export interface FilterOption {
    key: string;
    caption: string;
}

/** The filter a column offers, built from its attribute. */
export interface ColumnFilter {
    kind: FilterKind;
    attribute: ListAttributeValue["id"];
    /** Choices for enumeration filters. */
    options: FilterOption[];
}

const NUMBER_TYPES = new Set(["AutoNumber", "Decimal", "Integer", "Long"]);

export function filterKind(type: string): FilterKind | undefined {
    if (type === "String" || type === "HashString") {
        return "text";
    }
    if (NUMBER_TYPES.has(type)) {
        return "number";
    }
    if (type === "DateTime") {
        return "date";
    }
    if (type === "Enum") {
        return "enum";
    }
    if (type === "Boolean") {
        return "boolean";
    }
    return undefined;
}

/** The parts of a column's attribute that filtering needs. */
interface FilterableAttribute {
    id: ListAttributeValue["id"];
    type: string;
    filterable: boolean;
    isList: boolean;
    universe?: unknown[];
    formatter: { format(value: never): string | undefined };
}

export function columnFilter(attr: FilterableAttribute | undefined): ColumnFilter | undefined {
    const kind = attr && attr.filterable && !attr.isList ? filterKind(attr.type) : undefined;
    if (!attr || !kind) {
        return undefined;
    }
    const options =
        kind === "enum"
            ? (attr.universe ?? []).map(key => ({
                  key: String(key),
                  caption: attr.formatter.format(key as never) ?? String(key)
              }))
            : [];
    return { kind, attribute: attr.id, options };
}

type Comparison = { op: ">" | ">=" | "<" | "<=" | "="; value: Big } | { op: "range"; from: Big; to: Big };

function toBig(text: string): Big | undefined {
    try {
        return new Big(text.replace(/[\s,]/g, ""));
    } catch {
        return undefined;
    }
}

/**
 * Reads a number filter: a number ("12"), a comparison (">12", "<= 3.5") or a range ("10..20").
 * Returns undefined for text that isn't one of those.
 */
export function parseNumberFilter(text: string): Comparison | undefined {
    const value = text.trim();
    const range = /^(-?[\d.,\s]+?)\s*\.\.\s*(-?[\d.,\s]+)$/.exec(value);
    if (range) {
        const from = toBig(range[1]);
        const to = toBig(range[2]);
        return from && to ? { op: "range", from, to } : undefined;
    }
    const comparison = /^(>=|<=|>|<|=)?\s*(-?[\d.,\s]+)$/.exec(value);
    if (!comparison) {
        return undefined;
    }
    const number = toBig(comparison[2]);
    return number
        ? { op: (comparison[1] as ">" | ">=" | "<" | "<=" | "=" | undefined) ?? "=", value: number }
        : undefined;
}

/** Whether a filter value narrows the rows at all. Empty inputs don't. */
export function isActive(value: FilterValue | undefined): value is FilterValue {
    switch (value?.kind) {
        case "text":
            return value.text.trim() !== "";
        case "number":
            return parseNumberFilter(value.text) !== undefined;
        case "date":
            return Boolean(value.from || value.to);
        case "enum":
            return value.values.length > 0;
        case "boolean":
            return true;
        default:
            return false;
    }
}

/** A date input's yyyy-mm-dd value as local midnight. */
function day(value: string): Date {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export function filterCondition(filter: ColumnFilter, value: FilterValue): FilterCondition | undefined {
    const id = attribute(filter.attribute);
    switch (value.kind) {
        case "text": {
            const text = value.text.trim();
            return text ? contains(id, literal(text)) : undefined;
        }
        case "number": {
            const parsed = parseNumberFilter(value.text);
            if (!parsed) {
                return undefined;
            }
            switch (parsed.op) {
                case "range":
                    return and(greaterThanOrEqual(id, literal(parsed.from)), lessThanOrEqual(id, literal(parsed.to)));
                case ">":
                    return greaterThan(id, literal(parsed.value));
                case ">=":
                    return greaterThanOrEqual(id, literal(parsed.value));
                case "<":
                    return lessThan(id, literal(parsed.value));
                case "<=":
                    return lessThanOrEqual(id, literal(parsed.value));
                default:
                    return equals(id, literal(parsed.value));
            }
        }
        case "date": {
            const parts = [
                ...(value.from ? [dayGreaterThanOrEqual(id, literal(day(value.from)))] : []),
                ...(value.to ? [dayLessThanOrEqual(id, literal(day(value.to)))] : [])
            ];
            return parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : and(...parts);
        }
        case "enum": {
            const parts = value.values.map(key => equals(id, literal(key)));
            return parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : or(...parts);
        }
        case "boolean":
            return equals(id, literal(value.value));
    }
}

/** Short text for a filter chip, without the column name. */
export function describeFilter(filter: ColumnFilter, value: FilterValue, formatDate: (date: Date) => string): string {
    switch (value.kind) {
        case "text":
            return `contains "${value.text.trim()}"`;
        case "number": {
            const parsed = parseNumberFilter(value.text);
            if (!parsed) {
                return value.text;
            }
            return parsed.op === "range"
                ? `${parsed.from.toString()} to ${parsed.to.toString()}`
                : `${parsed.op === "=" ? "is" : parsed.op} ${parsed.value.toString()}`;
        }
        case "date":
            if (value.from && value.to) {
                return `${formatDate(day(value.from))} to ${formatDate(day(value.to))}`;
            }
            return value.from ? `from ${formatDate(day(value.from))}` : `until ${formatDate(day(value.to!))}`;
        case "enum": {
            const captions = value.values.map(key => filter.options.find(o => o.key === key)?.caption ?? key);
            return captions.length > 2
                ? `${captions.slice(0, 2).join(", ")} +${captions.length - 2}`
                : captions.join(", ");
        }
        case "boolean":
            return value.value ? "yes" : "no";
    }
}

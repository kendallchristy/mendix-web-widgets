import type {
    ListActionValue,
    ListAttributeValue,
    ListExpressionValue,
    ListValue,
    ObjectItem,
} from "mendix";

import type { ClickAction, ClickTarget } from "../components/ChartFrame";
import type { DrillStep } from "../hooks/useDrillPath";
import type { Aggregation } from "./aggregate";
import { combineValues } from "./aggregate";
import { isAnyLoading, readNumber, readText } from "./values";

/** One source object of a chart that draws one item per category: a pie slice, a ring, a funnel stage. */
export interface CategoryPoint {
    category: string;
    value?: number;
    color?: string;
    tooltip?: string;
    action?: ClickAction;
    /** Values of the Drilldown level 2 and 3 attributes. */
    drill: Array<string | undefined>;
}

export type CategoryAggregation = Exclude<Aggregation, "none">;

export type CategorySort = "data" | "valueDesc" | "valueAsc" | "name";

export interface CategoryOptions {
    aggregation: CategoryAggregation;
    sort: CategorySort;
    /** The most items to draw; 0 draws them all. */
    limit: number;
    /** Folds the items past the limit into one item with this name. Without it they are left out. */
    otherLabel?: string;
    drilldown: boolean;
    topLabel: string;
}

export interface CategoryItem {
    name: string;
    value: number;
    /** From the Colour attribute; the widget picks a palette colour otherwise. */
    color?: string;
    /** From the Tooltip text template, when the item stands for a single object. */
    tooltip?: string;
    /** True for the item that holds everything past the limit. */
    other: boolean;
    target: ClickTarget<string>;
}

export interface CategoryLevel {
    items: CategoryItem[];
    /** Empty when there is no drilldown. */
    breadcrumb: string[];
    /** The number of source objects at this level, for the screen-reader table and empty state. */
    pointCount: number;
}

/** The value a point has at a drilldown depth: its category at the top, then its drilldown attributes. */
function valueAt(point: CategoryPoint, depth: number): string | undefined {
    return depth === 0 ? point.category : point.drill[depth - 1];
}

function sortItems(items: CategoryItem[], sort: CategorySort): CategoryItem[] {
    switch (sort) {
        case "data":
            return items;
        case "valueDesc":
            return [...items].sort((a, b) => b.value - a.value);
        case "valueAsc":
            return [...items].sort((a, b) => a.value - b.value);
        case "name":
            return [...items].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { numeric: true })
            );
    }
}

function combine(
    points: CategoryPoint[],
    aggregation: CategoryAggregation
): number | undefined {
    const values = points
        .map((p) => p.value)
        .filter((v): v is number => v !== undefined);
    return combineValues(values, aggregation, points.length);
}

/**
 * Groups the source objects into one item per category at the current drilldown level, aggregates them, sorts
 * them and applies the limit. The largest items stay when there are too many.
 */
export function categoryLevel(
    points: CategoryPoint[],
    options: CategoryOptions,
    path: Array<DrillStep<string>>
): CategoryLevel {
    const depth = options.drilldown ? Math.min(path.length, 2) : 0;
    const steps = path.slice(0, depth);
    const inPath = points.filter((p) =>
        steps.every((step, i) => valueAt(p, i) === step.value)
    );

    const groups = new Map<string, CategoryPoint[]>();
    for (const point of inPath) {
        const key = valueAt(point, depth);
        if (key === undefined) {
            continue;
        }
        const group = groups.get(key);
        if (group) {
            group.push(point);
        } else {
            groups.set(key, [point]);
        }
    }

    let anyDeeper = false;
    const items: CategoryItem[] = [];
    for (const [name, group] of groups) {
        const value = combine(group, options.aggregation);
        if (value === undefined) {
            continue;
        }
        const deeper =
            options.drilldown &&
            depth < 2 &&
            group.some((p) => p.drill[depth] !== undefined);
        anyDeeper ||= deeper;
        items.push({
            name,
            value,
            color: group.find((p) => p.color)?.color,
            tooltip: group.length === 1 ? group[0].tooltip : undefined,
            other: false,
            target: deeper
                ? { drill: { label: name, value: name } }
                : { action: group[0].action },
        });
    }

    let shown = sortItems(items, options.sort);
    if (options.limit > 0 && shown.length > options.limit) {
        const keepCount = options.otherLabel
            ? Math.max(1, options.limit - 1)
            : options.limit;
        const kept = new Set(
            [...items].sort((a, b) => b.value - a.value).slice(0, keepCount)
        );
        const rest = shown.filter((item) => !kept.has(item));
        shown = shown.filter((item) => kept.has(item));
        if (options.otherLabel) {
            const restPoints = rest.flatMap(
                (item) => groups.get(item.name) ?? []
            );
            shown.push({
                name: options.otherLabel,
                value: combine(restPoints, options.aggregation) ?? 0,
                other: true,
                target: {},
            });
        }
    }

    const breadcrumb =
        options.drilldown && (anyDeeper || depth > 0)
            ? [options.topLabel, ...steps.map((s) => s.label)]
            : [];
    return { items: shown, breadcrumb, pointCount: inPath.length };
}

/** The data properties every one-item-per-category widget has, as the generated typings declare them. */
export interface CategoryDataProps {
    dataSource: ListValue;
    categoryAttribute: ListAttributeValue;
    valueAttribute?: ListAttributeValue;
    colorAttribute?: ListAttributeValue<string>;
    colorExpression?: ListExpressionValue<string>;
    tooltipText?: ListExpressionValue<string>;
    onClick?: ListActionValue;
    drillAttribute1?: ListAttributeValue;
    drillAttribute2?: ListAttributeValue;
}

/** Reads the source objects of a one-item-per-category widget. Objects without a category are left out. */
export function readCategoryPoints(props: CategoryDataProps): CategoryPoint[] {
    const items: ObjectItem[] = props.dataSource.items ?? [];
    const points: CategoryPoint[] = [];
    for (const item of items) {
        const category = readText(props.categoryAttribute, item);
        if (category === undefined) {
            continue;
        }
        const { tooltipText, onClick, colorAttribute, colorExpression } = props;
        points.push({
            category,
            value: readNumber(props.valueAttribute, item),
            // Read when a category's colour is first needed, which for most is its first object only.
            get color() {
                return (
                    (colorExpression ?? colorAttribute)
                        ?.get(item)
                        .value?.trim() || undefined
                );
            },
            // Read only for the slices that need them: with thousands of objects, evaluating these up front is slow.
            get tooltip() {
                return tooltipText?.get(item).value || undefined;
            },
            get action() {
                return onClick?.get(item);
            },
            drill: [
                readText(props.drillAttribute1, item),
                readText(props.drillAttribute2, item),
            ],
        });
    }
    return points;
}

/** True until the data source has loaded completely, including while it reloads. */
export function isCategoryDataLoading(
    props: Pick<CategoryDataProps, "dataSource">
): boolean {
    return isAnyLoading([props.dataSource]);
}

const SAMPLE = [
    ["Direct", 420],
    ["Search", 310],
    ["Social", 240],
    ["Email", 180],
    ["Referral", 120],
    ["Partners", 80],
] as const;

/** Believable sample data for Studio Pro's design mode. */
export function sampleCategoryPoints(
    count: number = SAMPLE.length
): CategoryPoint[] {
    return SAMPLE.slice(0, count).map(([category, value]) => ({
        category,
        value,
        drill: [],
    }));
}

/** The colour of each item: its own, the palette in order, and the muted colour for Other. */
export function categoryColors(
    items: CategoryItem[],
    palette: string[],
    muted: string
): string[] {
    let next = 0;
    return items.map((item) => {
        if (item.other) {
            return muted;
        }
        const color = item.color ?? palette[next % palette.length];
        next += 1;
        return color;
    });
}

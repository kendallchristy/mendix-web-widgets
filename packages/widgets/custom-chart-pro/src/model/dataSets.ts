import { toNumber } from "@kendallchristy/chart-core";
import type { Big } from "big.js";
import type { EditableValue, ListActionValue, ListAttributeValue, ObjectItem } from "mendix";

import type { DataSetsType } from "../../typings/CustomChartProProps";
import type { Cell, DataSet } from "./types";

type Attribute = ListAttributeValue<string | boolean | Big | Date>;

/** A field as ECharts takes it: dates and booleans as they are, decimals as numbers, the rest as display text. */
function readCell(attribute: Attribute, item: ObjectItem): Cell {
    const editable = attribute.get(item) as EditableValue<string | boolean | Big | Date>;
    const value: unknown = editable.value;
    if (value == null) {
        return null;
    }
    if (value instanceof Date || typeof value === "boolean") {
        return value;
    }
    if (typeof value === "object" || typeof value === "number") {
        return toNumber(value) ?? null;
    }
    return editable.displayValue || String(value);
}

/** The field slots of a data set that have both an attribute and a name. */
function fieldsOf(config: DataSetsType): Array<{ name: string; attribute: Attribute }> {
    const slots = [
        [config.field1, config.field1Name],
        [config.field2, config.field2Name],
        [config.field3, config.field3Name],
        [config.field4, config.field4Name],
        [config.field5, config.field5Name],
        [config.field6, config.field6Name]
    ] as const;
    return slots.flatMap(([attribute, name]) => (attribute && name?.trim() ? [{ name: name.trim(), attribute }] : []));
}

/** Reads every data set's rows. */
export function readDataSets(configs: DataSetsType[]): DataSet[] {
    return configs.map(config => {
        const items: ObjectItem[] = config.dataSource.items ?? [];
        const fields = fieldsOf(config);
        const onClick: ListActionValue | undefined = config.onClick;
        return {
            name: config.name.trim(),
            fields: fields.map(f => f.name),
            rows: items.map(item => Object.fromEntries(fields.map(f => [f.name, readCell(f.attribute, item)]))),
            actionOf: row => (onClick && items[row] ? onClick.get(items[row]) : undefined)
        };
    });
}

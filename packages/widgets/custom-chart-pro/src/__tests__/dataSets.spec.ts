import { Big } from "big.js";
import type { ListAttributeValue, ObjectItem } from "mendix";

import type { DataSetsType } from "../../typings/CustomChartProProps";
import { readDataSets } from "../model/dataSets";

// Mendix values are mocked loosely; only what the reader touches is filled in.
/* eslint-disable @typescript-eslint/no-explicit-any */

type Value = string | boolean | Big | Date | undefined;

function attribute(values: Record<string, Value>, display?: Record<string, string>): ListAttributeValue<any> {
    return {
        get: (item: ObjectItem) => ({ value: values[item.id], displayValue: display?.[item.id] ?? "" })
    } as unknown as ListAttributeValue<any>;
}

const items = [{ id: "a" }, { id: "b" }] as unknown as ObjectItem[];

function config(overrides: Partial<DataSetsType>): DataSetsType {
    return {
        name: " Sales ",
        dataSource: { items },
        field1Name: "",
        field2Name: "",
        field3Name: "",
        field4Name: "",
        field5Name: "",
        field6Name: "",
        ...overrides
    } as unknown as DataSetsType;
}

describe("readDataSets", () => {
    it("reads named fields: numbers, dates and booleans as they are, the rest as display text", () => {
        const day = new Date(2026, 0, 1);
        const [set] = readDataSets([
            config({
                field1: attribute({ a: "jan", b: "feb" }, { a: "January", b: "February" }),
                field1Name: "month",
                field2: attribute({ a: new Big("1.5"), b: undefined }),
                field2Name: " value ",
                field3: attribute({ a: day, b: true }),
                field3Name: "when",
                field4: attribute({ a: "x", b: "y" }),
                field4Name: ""
            })
        ]);
        expect(set.name).toBe("Sales");
        expect(set.fields).toEqual(["month", "value", "when"]);
        expect(set.rows).toEqual([
            { month: "January", value: 1.5, when: day },
            { month: "February", value: null, when: true }
        ]);
    });

    it("gives each row its object's action", () => {
        const action = { canExecute: true, execute: jest.fn() };
        const get = jest.fn(() => action);
        const [set] = readDataSets([config({ onClick: { get } as any })]);
        expect(set.actionOf(1)).toBe(action);
        expect(get).toHaveBeenCalledWith(items[1]);
        expect(set.actionOf(5)).toBeUndefined();
        expect(readDataSets([config({})])[0].actionOf(0)).toBeUndefined();
    });

    it("has no rows until the data source has items", () => {
        expect(readDataSets([config({ dataSource: {} as any })])[0].rows).toEqual([]);
    });
});

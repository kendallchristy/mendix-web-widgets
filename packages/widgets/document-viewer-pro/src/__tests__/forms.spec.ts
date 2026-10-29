import { formStorageEntries, isFillable, parseFormValues, readFormValues, type FieldWidget } from "../core/forms";
import { fitInto, moveRect, placeAt } from "../core/signatures";

const fields: Record<string, FieldWidget[]> = {
    company: [{ id: "10R", type: "text", value: "" }],
    email: [{ id: "13R", type: "text", value: "ap@example.com" }],
    country: [{ id: "17R", type: "combobox", value: "Netherlands" }],
    tags: [{ id: "18R", type: "listbox", value: ["a"], multipleSelection: true }],
    terms: [
        { id: "20R", type: "radiobutton", value: "Off", exportValues: "net30" },
        { id: "25R", type: "radiobutton", value: "net60", exportValues: "net60" }
    ],
    agree: [{ id: "31R", type: "checkbox", value: "Off", exportValues: "Yes" }],
    signature: [{ id: "39R", type: "signature" }]
};

describe("PDF form values", () => {
    it("reads the values the PDF came with", () => {
        expect(readFormValues(fields, null)).toEqual({
            company: "",
            email: "ap@example.com",
            country: "Netherlands",
            tags: ["a"],
            terms: "net60",
            agree: false
        });
    });

    it("prefers what the user filled in", () => {
        const stored = {
            "10R": { value: "Acme" },
            "20R": { value: true },
            "25R": { value: false },
            "31R": { value: true },
            "18R": { value: ["a", "b"] }
        };
        expect(readFormValues(fields, stored)).toMatchObject({
            company: "Acme",
            terms: "net30",
            agree: true,
            tags: ["a", "b"]
        });
    });

    it("turns app values into storage entries for every widget of a field", () => {
        const entries = Object.fromEntries(
            formStorageEntries(fields, {
                company: "Acme",
                terms: "net30",
                agree: true,
                country: "Germany",
                missing: "x"
            })
        );
        expect(entries).toEqual({
            "10R": { value: "Acme" },
            "20R": { value: true },
            "25R": { value: false },
            "31R": { value: true },
            "17R": { value: ["Germany"] }
        });
    });

    it("knows whether a PDF has fields to fill in", () => {
        expect(isFillable(Object.values(fields).flat())).toBe(true);
        expect(isFillable(fields.signature)).toBe(false);
    });

    it("reads app JSON and ignores what it can't use", () => {
        expect(parseFormValues('{"a":"x","b":true,"c":3,"d":["1",2],"e":{"f":1}}')).toEqual({
            a: "x",
            b: true,
            c: "3",
            d: ["1", "2"]
        });
        expect(parseFormValues("not json")).toEqual({});
        expect(parseFormValues("[1]")).toEqual({});
        expect(parseFormValues(undefined)).toEqual({});
    });
});

describe("signature placement", () => {
    const signature = { image: "data:image/png;base64,", aspect: 0.25 };

    it("centers a signature on the point and keeps its shape on the page", () => {
        // A portrait page: 1.5 times as high as it is wide.
        const [x, y, w, h] = placeAt(0.5, 0.5, signature, 1.5);
        expect(x + w / 2).toBeCloseTo(0.5);
        expect(y + h / 2).toBeCloseTo(0.5);
        expect((h * 1.5) / w).toBeCloseTo(0.25);
    });

    it("stays on the page near an edge", () => {
        const [x, y, w, h] = placeAt(0.99, 0.01, signature, 1.5);
        expect(x + w).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(h).toBeGreaterThan(0);
        expect(moveRect([0.9, 0.9, 0.2, 0.05], 0.5, 0.5)).toEqual([0.8, 0.95, 0.2, 0.05]);
    });

    it("fills a field as far as the signature's shape allows, centered", () => {
        // A wide, short field: the signature is limited by its height.
        const [x, y, w, h] = fitInto([0.2, 0.6, 0.5, 0.05], signature, 1.5);
        expect(h).toBeCloseTo(0.05);
        expect((h * 1.5) / w).toBeCloseTo(0.25);
        expect(x + w / 2).toBeCloseTo(0.45);
        expect(y).toBeCloseTo(0.6);
    });
});

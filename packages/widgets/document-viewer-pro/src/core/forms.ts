// PDF form values, as the app sees them: one entry per field name. Text fields and drop-downs give text, check
// boxes true or false, radio groups the chosen option's value, and multi-select lists a list of values.

export type FormValue = string | boolean | string[];
export type FormValues = Record<string, FormValue>;

/** A widget of a form field, as pdf.js describes it in `getFieldObjects()`. */
export interface FieldWidget {
    id: string;
    type: string;
    value?: unknown;
    exportValues?: unknown;
    multipleSelection?: boolean;
}

type Stored = Record<string, { value?: unknown } | undefined> | null | undefined;

const FILLABLE = new Set(["text", "checkbox", "radiobutton", "combobox", "listbox"]);

function asText(value: unknown): string {
    if (Array.isArray(value)) {
        return value.map(String).join(", ");
    }
    return value === undefined || value === null ? "" : String(value);
}

function isOn(value: unknown, exportValue: unknown): boolean {
    if (typeof value === "boolean") {
        return value;
    }
    const text = asText(value);
    return text !== "" && text !== "Off" && (exportValue === undefined || text === asText(exportValue));
}

export function isFillable(widgets: FieldWidget[]): boolean {
    return widgets.some(widget => FILLABLE.has(widget.type));
}

/** Reads the current values: what the user typed (`stored`), otherwise what the PDF came with. */
export function readFormValues(fields: Record<string, FieldWidget[]> | null, stored: Stored): FormValues {
    const values: FormValues = {};
    for (const [name, widgets] of Object.entries(fields ?? {})) {
        const first = widgets.find(widget => FILLABLE.has(widget.type));
        if (!first) {
            continue;
        }
        switch (first.type) {
            case "text":
                values[name] = asText(stored?.[first.id]?.value ?? first.value);
                break;
            case "checkbox":
                values[name] = widgets.some(widget =>
                    stored?.[widget.id] ? Boolean(stored[widget.id]?.value) : isOn(widget.value, widget.exportValues)
                );
                break;
            case "radiobutton": {
                const chosen = widgets.find(widget =>
                    stored?.[widget.id] ? Boolean(stored[widget.id]?.value) : isOn(widget.value, widget.exportValues)
                );
                values[name] = chosen ? asText(chosen.exportValues) : "";
                break;
            }
            default: {
                const value = stored?.[first.id]?.value ?? first.value;
                const list = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
                values[name] = first.multipleSelection ? list : (list[0] ?? "");
            }
        }
    }
    return values;
}

/** Turns app values into pdf.js storage entries (widget id and stored value) for the fields they name. */
export function formStorageEntries(
    fields: Record<string, FieldWidget[]> | null,
    values: FormValues
): Array<[string, { value: unknown }]> {
    const entries: Array<[string, { value: unknown }]> = [];
    for (const [name, value] of Object.entries(values)) {
        const widgets = fields?.[name]?.filter(widget => FILLABLE.has(widget.type)) ?? [];
        for (const widget of widgets) {
            switch (widget.type) {
                case "text":
                    entries.push([widget.id, { value: asText(value) }]);
                    break;
                case "checkbox":
                    entries.push([widget.id, { value: value === true || isOn(value, widget.exportValues) }]);
                    break;
                case "radiobutton":
                    entries.push([widget.id, { value: asText(value) === asText(widget.exportValues) }]);
                    break;
                default:
                    entries.push([widget.id, { value: Array.isArray(value) ? value.map(String) : [asText(value)] }]);
            }
        }
    }
    return entries;
}

export function parseFormValues(json: string | undefined): FormValues {
    if (!json?.trim()) {
        return {};
    }
    try {
        const data = JSON.parse(json) as unknown;
        if (!data || typeof data !== "object" || Array.isArray(data)) {
            return {};
        }
        const values: FormValues = {};
        for (const [name, value] of Object.entries(data as Record<string, unknown>)) {
            if (typeof value === "string" || typeof value === "boolean") {
                values[name] = value;
            } else if (typeof value === "number") {
                values[name] = String(value);
            } else if (Array.isArray(value)) {
                values[name] = value.map(String);
            }
        }
        return values;
    } catch {
        return {};
    }
}

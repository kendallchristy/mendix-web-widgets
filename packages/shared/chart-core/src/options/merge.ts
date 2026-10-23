export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * Merges `override` into `base` without changing either. Objects merge key by key; arrays and everything else are
 * replaced. An array of objects in the override (such as `series`) merges item by item with the base array, so an
 * override can restyle the first series without repeating its data.
 */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
        const current = result[key];
        if (isPlainObject(current) && isPlainObject(value)) {
            result[key] = deepMerge(current, value);
        } else if (Array.isArray(current) && Array.isArray(value) && value.some(isPlainObject)) {
            result[key] = mergeArrays(current, value);
        } else if (Array.isArray(current) && isPlainObject(value)) {
            // An object applied to a list (for example `"yAxis": {...}` over two axes) applies to each item.
            result[key] = current.map(item => (isPlainObject(item) ? deepMerge(item, value) : item));
        } else {
            result[key] = value;
        }
    }
    return result as T;
}

function mergeArrays(base: unknown[], override: unknown[]): unknown[] {
    const length = Math.max(base.length, override.length);
    const result: unknown[] = [];
    for (let i = 0; i < length; i++) {
        const a = base[i];
        const b = override[i];
        if (i >= override.length) {
            result.push(a);
        } else if (isPlainObject(a) && isPlainObject(b)) {
            result.push(deepMerge(a, b));
        } else {
            result.push(b);
        }
    }
    return result;
}

export interface ParsedJson {
    value?: Record<string, unknown>;
    error?: string;
}

/** Parses the JSON a Studio Pro user typed. Empty text is fine; anything that isn't an object is an error. */
export function parseJsonObject(text: string | undefined): ParsedJson {
    if (!text?.trim()) {
        return {};
    }
    try {
        const value: unknown = JSON.parse(text);
        if (!isPlainObject(value)) {
            return { error: "The JSON must be an object, starting with {" };
        }
        return { value };
    } catch (e) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

/** Merges several optional JSON texts in order. Errors are collected rather than thrown. */
export function mergeJsonTexts(texts: Array<string | undefined>): ParsedJson & { errors: string[] } {
    let value: Record<string, unknown> | undefined;
    const errors: string[] = [];
    for (const text of texts) {
        const parsed = parseJsonObject(text);
        if (parsed.error) {
            errors.push(parsed.error);
        } else if (parsed.value) {
            value = value ? deepMerge(value, parsed.value) : parsed.value;
        }
    }
    return { value, errors };
}

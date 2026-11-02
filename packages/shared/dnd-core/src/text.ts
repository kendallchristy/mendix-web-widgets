/**
 * Fills `[name]` placeholders in a text from Studio Pro. Braces can't be used there (Studio Pro reads them as
 * parameters), so the widgets use square brackets. Unknown placeholders are left as they are.
 */
export function fillText(template: string, values: Record<string, string | number>): string {
    return template.replace(/\[(\w+)\]/g, (match, key: string) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
    );
}

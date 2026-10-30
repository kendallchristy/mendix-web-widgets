/**
 * Puts items in the saved column order. Columns the saved order doesn't know, such as ones added in Studio Pro
 * later, keep their place relative to the column before them.
 */
export function applyOrder<T extends { id: string }>(columns: T[], order: string[] | undefined): T[] {
    if (!order || order.length === 0) {
        return columns;
    }
    const known = columns.filter(column => order.includes(column.id));
    known.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const result: T[] = [];
    columns.forEach(column => {
        if (order.includes(column.id)) {
            result.push(known.shift()!);
        } else {
            result.push(column);
        }
    });
    return result;
}

/** Moves `id` in front of `beforeId`, or to the end when `beforeId` is undefined. */
export function moveColumn(order: string[], id: string, beforeId: string | undefined): string[] {
    if (id === beforeId) {
        return order;
    }
    const rest = order.filter(other => other !== id);
    const at = beforeId === undefined ? rest.length : rest.indexOf(beforeId);
    return at < 0 ? order : [...rest.slice(0, at), id, ...rest.slice(at)];
}

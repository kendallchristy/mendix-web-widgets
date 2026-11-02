/**
 * Size estimates for windowed lists that learn from the rows they measure.
 *
 * A windowed list guesses the size of rows it hasn't drawn yet. When the guess is off, every row that scrolls in
 * changes the list's total size, which costs an extra layout on each frame of a fast scroll. Mendix content varies
 * per app, so rather than a fixed guess this keeps the average of the rows measured so far.
 */
export interface SizeLearner<M extends (...args: never[]) => number> {
    estimateSize(): number;
    /** Wraps the virtualizer's own measure function, noting each size it returns. */
    measureElement: M;
}

/** Stops learning after this many rows; by then the average has settled. */
const SAMPLES = 200;

export function sizeLearner<M extends (...args: never[]) => number>(initial: number, measure: M): SizeLearner<M> {
    let total = 0;
    let count = 0;
    let estimate = initial;
    const measureElement = ((...args: Parameters<M>): number => {
        const size = measure(...args);
        if (count < SAMPLES && size > 0) {
            total += size;
            count += 1;
            estimate = total / count;
        }
        return size;
    }) as M;
    return { estimateSize: () => estimate, measureElement };
}

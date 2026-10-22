import { useCallback, useState } from "react";

export interface DrillStep<T> {
    label: string;
    value: T;
}

export interface DrillPath<T> {
    steps: Array<DrillStep<T>>;
    push: (step: DrillStep<T>) => void;
    /** Goes back to a breadcrumb item: 0 is the top level, 1 the first step, and so on. */
    goTo: (index: number) => void;
}

/** The steps taken down a drilldown, for the breadcrumb and for filtering the data. */
export function useDrillPath<T>(): DrillPath<T> {
    const [steps, setSteps] = useState<Array<DrillStep<T>>>([]);
    const push = useCallback((step: DrillStep<T>) => setSteps(current => [...current, step]), []);
    const goTo = useCallback((index: number) => setSteps(current => current.slice(0, Math.max(0, index))), []);
    return { steps, push, goTo };
}

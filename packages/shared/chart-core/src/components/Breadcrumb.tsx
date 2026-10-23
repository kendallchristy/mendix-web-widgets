import type { ReactElement } from "react";

export interface BreadcrumbProps {
    /** The label of the top level, then one label per drilldown step. */
    items: string[];
    /** Called with the index of the item to go back to; 0 is the top level. */
    onNavigate: (index: number) => void;
}

/** The drilldown trail in the chart's top-right corner, clear of the title. Hidden at the top level. */
export function Breadcrumb({ items, onNavigate }: BreadcrumbProps): ReactElement | null {
    if (items.length < 2) {
        return null;
    }
    return (
        <nav className="hc-breadcrumb" aria-label="Drilldown">
            <ol>
                {items.map((label, index) => {
                    const current = index === items.length - 1;
                    return (
                        <li key={items.slice(0, index + 1).join("\u0000")}>
                            {current ? (
                                <span aria-current="page">{label}</span>
                            ) : (
                                <button type="button" onClick={() => onNavigate(index)}>
                                    {label}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

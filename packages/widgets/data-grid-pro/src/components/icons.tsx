import type { ReactElement } from "react";

const common = { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true } as const;

export function ChevronIcon({ open }: { open: boolean }): ReactElement {
    return (
        <svg {...common} className={open ? "dgp-chevron dgp-chevron--open" : "dgp-chevron"}>
            <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SortIcon({ direction }: { direction: "asc" | "desc" | undefined }): ReactElement {
    return (
        <svg {...common} className="dgp-sort-icon" data-direction={direction ?? "none"}>
            <path d="M8 3l3 4H5l3-4z" fill="currentColor" className="dgp-sort-up" />
            <path d="M8 13l-3-4h6l-3 4z" fill="currentColor" className="dgp-sort-down" />
        </svg>
    );
}

export function ColumnsIcon(): ReactElement {
    return (
        <svg {...common}>
            <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 3v10M10 3v10" stroke="currentColor" strokeWidth="1.3" />
        </svg>
    );
}

export function DensityIcon(): ReactElement {
    return (
        <svg {...common}>
            <path d="M3 4h10M3 8h10M3 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

export function SearchIcon(): ReactElement {
    return (
        <svg {...common} className="dgp-search-icon">
            <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.2 10.2L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

/** Up and down arrows; the column menu lists columns top to bottom in their left to right order. */
export function ArrowIcon({ direction }: { direction: "up" | "down" }): ReactElement {
    return (
        <svg {...common}>
            <path
                d={direction === "up" ? "M8 12V4M4.5 7.5L8 4l3.5 3.5" : "M8 4v8M4.5 8.5L8 12l3.5-3.5"}
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

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

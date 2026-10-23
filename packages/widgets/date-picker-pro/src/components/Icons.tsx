import type { ReactElement } from "react";

const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false
};

export function CalendarIcon(): ReactElement {
    return (
        <svg {...common} className="dpp-icon">
            <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" />
            <path d="M2.25 6.75h11.5M5.5 1.75v3M10.5 1.75v3" />
        </svg>
    );
}

export function ChevronIcon({ direction }: { direction: "left" | "right" }): ReactElement {
    return (
        <svg {...common} className="dpp-icon">
            <path d={direction === "left" ? "M9.75 3.5 5.25 8l4.5 4.5" : "M6.25 3.5 10.75 8l-4.5 4.5"} />
        </svg>
    );
}

export function ClearIcon(): ReactElement {
    return (
        <svg {...common} className="dpp-icon">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
    );
}

export function HelpIcon(): ReactElement {
    return (
        <svg {...common} className="dpp-icon">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M6.3 6.2a1.8 1.8 0 0 1 3.5.6c0 1.2-1.8 1.5-1.8 2.6M8 11.6v.05" />
        </svg>
    );
}

import type { ReactElement } from "react";

import type { Variant } from "../core/types";

const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    focusable: false,
    className: "tp-icon"
} as const;

export function VariantIcon({ variant }: { variant: Variant }): ReactElement {
    switch (variant) {
        case "success":
            return (
                <svg {...common}>
                    <circle cx="10" cy="10" r="8" />
                    <path d="M6.5 10.2l2.3 2.3 4.7-4.8" />
                </svg>
            );
        case "warning":
            return (
                <svg {...common}>
                    <path d="M10 2.8l7.6 13.4H2.4z" />
                    <path d="M10 8v3.6" />
                    <circle cx="10" cy="14.1" r="0.6" fill="currentColor" stroke="none" />
                </svg>
            );
        case "error":
            return (
                <svg {...common}>
                    <circle cx="10" cy="10" r="8" />
                    <path d="M7.3 7.3l5.4 5.4M12.7 7.3l-5.4 5.4" />
                </svg>
            );
        case "neutral":
            return (
                <svg {...common}>
                    <path d="M10 2.8a4.8 4.8 0 0 0-4.8 4.8v2.8L3.8 13.4h12.4l-1.4-3V7.6A4.8 4.8 0 0 0 10 2.8z" />
                    <path d="M8.2 16a1.9 1.9 0 0 0 3.6 0" />
                </svg>
            );
        default:
            return (
                <svg {...common}>
                    <circle cx="10" cy="10" r="8" />
                    <path d="M10 9v4.6" />
                    <circle cx="10" cy="6.4" r="0.6" fill="currentColor" stroke="none" />
                </svg>
            );
    }
}

export function SpinnerIcon(): ReactElement {
    return (
        <svg {...common} className="tp-icon tp-spinner">
            <circle cx="10" cy="10" r="7.5" opacity="0.25" />
            <path d="M17.5 10A7.5 7.5 0 0 0 10 2.5" />
        </svg>
    );
}

export function CloseIcon(): ReactElement {
    return (
        <svg {...common} width={14} height={14} viewBox="0 0 14 14" strokeWidth={1.6}>
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
        </svg>
    );
}

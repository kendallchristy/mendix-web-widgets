import type { ReactElement } from "react";

// 20px line icons drawn on a 24px grid, in the style of the other Pro widgets.
const paths = {
    sidebar: "M4 5h16v14H4zM9 5v14",
    chevronLeft: "M15 6l-6 6 6 6",
    chevronRight: "M9 6l6 6-6 6",
    chevronUp: "M6 15l6-6 6 6",
    chevronDown: "M6 9l6 6 6-6",
    zoomIn: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M11 8v6M8 11h6",
    zoomOut: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4M8 11h6",
    rotate: "M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
    print: "M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z",
    download: "M12 4v11M7 10l5 5 5-5M5 20h14",
    fullscreen: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
    exitFullscreen: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
    close: "M6 6l12 12M18 6L6 18",
    file: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4",
    alert: "M12 8v5M12 16.5v.5M10.3 4.3L2.8 17.5A2 2 0 0 0 4.5 20.5h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z",
    back: "M19 12H5M11 6l-6 6 6 6",
    pen: "M4 20l4-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5 16zM14 7l3 3",
    pointer: "M6 4l12 7-5.5 1.5L10 18z",
    highlighter: "M9 15l-3 3h5l1-1M9 15l7-9 3 3-7 9zM9 15l3 3M4 21h16",
    area: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M10 4h4M10 20h4M4 10v4M20 10v4",
    note: "M5 5h14v10h-6l-4 4v-4H5z",
    undo: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
    redo: "M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
    signature: "M3 17c3-1 4-9 6-9s-1 9 1 9 3-5 4-5 1 3 2 3 2-2 3-2M3 21h18",
    save: "M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 4v5h7V4M8 20v-6h8v6",
    paperclip: "M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7"
};

export type IconName = keyof typeof paths;

export function Icon(props: { name: IconName; className?: string }): ReactElement {
    return (
        <svg
            className={props.className ?? "dvp-icon"}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d={paths[props.name]} />
        </svg>
    );
}

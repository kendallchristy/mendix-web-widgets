let region: HTMLElement | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function getRegion(): HTMLElement {
    if (!region || !region.isConnected) {
        region = document.createElement("div");
        region.className = "kdnd-live";
        region.setAttribute("aria-live", "assertive");
        region.setAttribute("aria-atomic", "true");
        region.setAttribute("role", "status");
        Object.assign(region.style, {
            position: "absolute",
            width: "1px",
            height: "1px",
            margin: "-1px",
            padding: "0",
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
            border: "0"
        });
        document.body.appendChild(region);
    }
    return region;
}

/** Tells screen reader users what happened, through one shared live region. */
export function announce(message: string): void {
    if (!message) {
        return;
    }
    const live = getRegion();
    clearTimeout(timer);
    // Clearing first makes screen readers repeat a message that is the same as the last one.
    live.textContent = "";
    timer = setTimeout(() => {
        live.textContent = message;
    }, 50);
}

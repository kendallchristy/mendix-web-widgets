export type PrintJob =
    // `rotation` is the turn the pages were drawn with, so markup can be drawn on them the same way.
    | { kind: "images"; images: string[]; landscape?: boolean; rotation?: number }
    | { kind: "html"; html: string; css?: string };

function escapeHtml(text: string): string {
    return text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

function watermarkCss(): string {
    return `
.dvp-print-watermark { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 10; }
.dvp-print-watermark span { transform: rotate(-30deg); font: 600 48px/1.2 system-ui, sans-serif;
  color: rgba(0,0,0,0.12); white-space: pre-wrap; text-align: center; max-width: 90vw; }`;
}

export function buildPrintDocument(job: PrintJob, title: string, watermark?: string): string {
    const mark = watermark ? `<div class="dvp-print-watermark"><span>${escapeHtml(watermark)}</span></div>` : "";
    if (job.kind === "images") {
        const pages = job.images
            .map(src => `<div class="dvp-print-page"><img src="${src}" alt="">${mark}</div>`)
            .join("");
        return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
@page { margin: 0; }
html, body { margin: 0; padding: 0; }
.dvp-print-page { position: relative; page-break-after: always; break-after: page; height: 100vh; display: flex;
  align-items: center; justify-content: center; overflow: hidden; }
.dvp-print-page:last-child { page-break-after: auto; break-after: auto; }
.dvp-print-page img { max-width: 100%; max-height: 100%; }
.dvp-print-watermark { position: absolute; }
${watermarkCss()}
</style></head><body>${pages}</body></html>`;
    }
    return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
body { margin: 0; font-family: system-ui, sans-serif; }
${job.css ?? ""}
${watermarkCss()}
</style></head><body>${job.html}${mark}</body></html>`;
}

/** Prints through a hidden frame so the app page itself isn't printed. */
export function printDocument(html: string): Promise<void> {
    return new Promise(resolve => {
        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        // Print content can come from the file (HTML, email), so it gets no scripts here either.
        frame.setAttribute("sandbox", "allow-same-origin allow-modals");
        frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
        document.body.appendChild(frame);
        const done = (): void => {
            setTimeout(() => frame.remove(), 1000);
            resolve();
        };
        frame.onload = () => {
            const win = frame.contentWindow;
            if (!win) {
                done();
                return;
            }
            const images = Array.from(win.document.images);
            Promise.all(
                images.map(img =>
                    img.complete ? Promise.resolve() : new Promise(r => img.addEventListener("load", r, { once: true }))
                )
            ).then(() => {
                win.addEventListener("afterprint", done, { once: true });
                win.focus();
                win.print();
                // Some browsers don't fire afterprint for frames.
                setTimeout(done, 60_000);
            });
        };
        frame.srcdoc = html;
    });
}

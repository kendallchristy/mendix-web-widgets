import { useCallback, useEffect, useRef, type ReactElement } from "react";

export interface SandboxFrameProps {
    html: string;
    title: string;
    scale: number;
    allowCopy: boolean;
    /** Grow the frame to its content instead of scrolling inside it. */
    autoHeight?: boolean;
    onDocument?(doc: Document): void;
}

const HEAD = `<base target="_blank"><meta name="referrer" content="no-referrer">`;

function applyZoom(doc: Document, scale: number): void {
    doc.documentElement.style.zoom = String(scale);
}

function prepare(html: string, allowCopy: boolean): string {
    const extra = allowCopy ? HEAD : `${HEAD}<style>* { user-select: none !important; }</style>`;
    if (/<head[\s>]/i.test(html)) {
        return html.replace(/<head([^>]*)>/i, `<head$1>${extra}`);
    }
    return `<!doctype html><html><head><meta charset="utf-8">${extra}</head><body>${html}</body></html>`;
}

/**
 * Shows untrusted HTML (HTML files, email bodies) in a frame where scripts, forms and plugins can't run. The frame
 * shares the page's origin only so the viewer can search, zoom and measure its content.
 */
export function SandboxFrame(props: SandboxFrameProps): ReactElement {
    const { html, title, scale, allowCopy, autoHeight, onDocument } = props;
    const frame = useRef<HTMLIFrameElement>(null);

    const fit = useCallback(() => {
        const doc = frame.current?.contentDocument;
        if (doc && autoHeight && frame.current) {
            frame.current.style.height = `${Math.ceil(doc.documentElement.scrollHeight * scale) + 2}px`;
        }
    }, [autoHeight, scale]);

    const onLoad = useCallback(() => {
        const doc = frame.current?.contentDocument;
        if (!doc) {
            return;
        }
        applyZoom(doc, scale);
        fit();
        onDocument?.(doc);
    }, [scale, fit, onDocument]);

    useEffect(() => {
        const doc = frame.current?.contentDocument;
        if (doc?.documentElement) {
            applyZoom(doc, scale);
            fit();
        }
    }, [scale, fit]);

    return (
        <iframe
            ref={frame}
            className={autoHeight ? "dvp-frame dvp-frame--auto" : "dvp-frame"}
            title={title}
            sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            srcDoc={prepare(html, allowCopy)}
            onLoad={onLoad}
        />
    );
}

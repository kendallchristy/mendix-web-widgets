import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import { CodeBlock } from "./CodeBlock";
import { decodeText, reflowScale, useDomSearch } from "./hooks";
import type { ViewProps } from "./types";

export function MarkdownView(props: ViewProps): ReactElement | null {
    const { file, callbacks, labels, zoom, query, activeMatch } = props;
    const text = useMemo(() => decodeText(file.bytes), [file]);
    const [html, setHtml] = useState<string | null>(null);
    const [source, setSource] = useState(false);
    const body = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;
        loadEngine("markdown")
            .then(engine => {
                if (cancelled) {
                    return;
                }
                const rendered = engine.toSafeHtml(text);
                setHtml(rendered);
                callbacks.onReady({
                    zoomable: true,
                    fits: false,
                    rotatable: false,
                    searchable: true,
                    print: async () => ({
                        kind: "html",
                        html: `<article class="dvp-prose">${rendered}</article>`,
                        css: PRINT_CSS
                    })
                });
            })
            .catch(() => {
                if (!cancelled) {
                    callbacks.onError();
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    // Links open in a new tab so the app stays where it is.
    useEffect(() => {
        body.current?.querySelectorAll("a[href]").forEach(link => {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        });
    }, [html, source]);

    const scale = reflowScale(zoom);
    useEffect(() => {
        callbacks.onScale(scale);
    }, [scale, callbacks]);

    useDomSearch(() => (source ? null : body.current), query, activeMatch, source ? "" : html, callbacks.onMatches);

    if (html === null) {
        return null;
    }
    return (
        <div className="dvp-text-view">
            <div className="dvp-view-options">
                <label className="dvp-check">
                    <input type="checkbox" checked={source} onChange={event => setSource(event.target.checked)} />
                    {labels.showSource}
                </label>
            </div>
            {source ? (
                <CodeBlock
                    text={text}
                    language="markdown"
                    scale={scale}
                    wrap
                    query={query}
                    activeMatch={activeMatch}
                    onMatches={callbacks.onMatches}
                />
            ) : (
                <div className="dvp-prose-scroll">
                    <article
                        ref={body}
                        className="dvp-prose"
                        style={{ fontSize: `${15 * scale}px` }}
                        // Sanitized by DOMPurify in the Markdown engine.
                        // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </div>
            )}
        </div>
    );
}

const PRINT_CSS = `
.dvp-prose { font: 12pt/1.6 system-ui, sans-serif; max-width: 48em; margin: 0 auto; }
.dvp-prose pre { background: #f6f8fa; padding: 8px; white-space: pre-wrap; }
.dvp-prose table { border-collapse: collapse; } .dvp-prose td, .dvp-prose th { border: 1px solid #ccc; padding: 4px 8px; }
.dvp-prose img { max-width: 100%; }`;

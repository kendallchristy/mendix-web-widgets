import { useEffect, useMemo, useState, type ReactElement } from "react";

import { languageFor } from "../core/fileTypes";
import { CodeBlock } from "./CodeBlock";
import { decodeText, reflowScale } from "./hooks";
import type { ViewProps } from "./types";

/** Pretty-prints JSON that was saved on one line, which is common for API exports. */
function formatJson(text: string): string {
    if (text.length > 5_000_000 || text.split("\n", 3).length > 2) {
        return text;
    }
    try {
        return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
        return text;
    }
}

export function CodeView(props: ViewProps): ReactElement {
    const { file, callbacks, labels, zoom, query, activeMatch } = props;
    const [wrap, setWrap] = useState(false);
    const language = languageFor(file.ext);
    const text = useMemo(() => {
        const decoded = decodeText(file.bytes);
        return language === "json" ? formatJson(decoded) : decoded;
    }, [file, language]);

    const scale = reflowScale(zoom);
    useEffect(() => {
        callbacks.onScale(scale);
    }, [scale, callbacks]);

    useEffect(() => {
        callbacks.onReady({
            zoomable: true,
            fits: false,
            rotatable: false,
            searchable: true,
            print: async () => ({
                kind: "html",
                html: `<pre>${text.replace(/[&<>]/g, c => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"))}</pre>`,
                css: "pre { white-space: pre-wrap; font: 11px ui-monospace, Consolas, monospace; }"
            })
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    return (
        <div className="dvp-text-view">
            <div className="dvp-view-options">
                <label className="dvp-check">
                    <input type="checkbox" checked={wrap} onChange={event => setWrap(event.target.checked)} />
                    {labels.wrapLines}
                </label>
            </div>
            <CodeBlock
                text={text}
                language={language}
                scale={scale}
                wrap={wrap}
                query={query}
                activeMatch={activeMatch}
                onMatches={callbacks.onMatches}
            />
        </div>
    );
}

import classNames from "classnames";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import { useDomSearch } from "./hooks";

// Above this size highlighting gets slow, so the text is shown plain.
const HIGHLIGHT_LIMIT = 1_000_000;

export interface CodeBlockProps {
    text: string;
    language?: string;
    scale: number;
    wrap: boolean;
    query: string;
    activeMatch: number;
    onMatches(count: number): void;
}

function escapeHtml(text: string): string {
    return text.replace(/[&<>]/g, c => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

export function CodeBlock(props: CodeBlockProps): ReactElement {
    const { text, language, scale, wrap, query, activeMatch, onMatches } = props;
    const [highlighted, setHighlighted] = useState<{ text: string; language?: string; html: string } | null>(null);
    const plain = useMemo(() => escapeHtml(text), [text]);
    const html = highlighted?.text === text && highlighted.language === language ? highlighted.html : plain;
    const code = useRef<HTMLElement>(null);

    // Plain text shows at once; the colors follow when the highlighter has loaded.
    useEffect(() => {
        let cancelled = false;
        if (text.length > HIGHLIGHT_LIMIT || language === "plaintext") {
            return;
        }
        loadEngine("code")
            .then(engine => {
                if (!cancelled) {
                    setHighlighted({ text, language, html: engine.highlight(text, language) });
                }
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
    }, [text, language]);

    const lineNumbers = useMemo(() => {
        const count = text.split("\n").length;
        return Array.from({ length: count }, (_, i) => i + 1).join("\n");
    }, [text]);

    useDomSearch(() => code.current, query, activeMatch, html, onMatches);

    return (
        <div className={classNames("dvp-code", { "dvp-code--wrap": wrap })} style={{ fontSize: `${13 * scale}px` }}>
            {!wrap && (
                <pre className="dvp-code-gutter" aria-hidden>
                    {lineNumbers}
                </pre>
            )}
            <pre className="dvp-code-text">
                {/* Escaped text, or highlight.js output built from escaped text. */}
                {/* eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml */}
                <code ref={code} className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
        </div>
    );
}

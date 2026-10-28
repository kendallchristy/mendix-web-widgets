import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { CodeBlock } from "./CodeBlock";
import { decodeText, reflowScale, useDomSearch } from "./hooks";
import { SandboxFrame } from "./SandboxFrame";
import type { ViewProps } from "./types";

export function HtmlView(props: ViewProps): ReactElement {
    const { file, callbacks, labels, zoom, query, activeMatch, allowCopy } = props;
    const text = useMemo(() => decodeText(file.bytes), [file]);
    const [source, setSource] = useState(false);
    const [doc, setDoc] = useState<Document | null>(null);
    const [version, setVersion] = useState(0);

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
            print: async () => ({ kind: "html", html: text })
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);

    const onDocument = useCallback((loaded: Document) => {
        setDoc(loaded);
        setVersion(v => v + 1);
    }, []);

    useDomSearch(() => (source ? null : doc?.body), query, activeMatch, version, callbacks.onMatches);

    return (
        <div className="dvp-text-view">
            <div className="dvp-view-options">
                <label className="dvp-check">
                    <input
                        type="checkbox"
                        checked={source}
                        onChange={event => {
                            setSource(event.target.checked);
                            setVersion(v => v + 1);
                        }}
                    />
                    {labels.showSource}
                </label>
            </div>
            {source ? (
                <CodeBlock
                    text={text}
                    language="xml"
                    scale={scale}
                    wrap={false}
                    query={query}
                    activeMatch={activeMatch}
                    onMatches={callbacks.onMatches}
                />
            ) : (
                <SandboxFrame
                    html={text}
                    title={file.name}
                    scale={scale}
                    allowCopy={allowCopy}
                    onDocument={onDocument}
                />
            )}
        </div>
    );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { fetchBytes } from "../core/fetchFile";
import { detectKind, streamsFromUrl } from "../core/fileTypes";
import type { LoadedFile } from "../views/types";
import type { MarkupSource } from "./useMarkup";

export interface ViewerSource {
    key: string;
    url: string;
    name: string;
    caption?: string;
    /** A PDF copy for formats the browser can't show. */
    previewUrl?: string;
    previewName?: string;
    markup?: MarkupSource;
}

type ReadyState = { status: "ready"; file: LoadedFile; usingPreview: boolean };

function sameBytes(a: ArrayBuffer | undefined, b: ArrayBuffer): boolean {
    if (!a || a.byteLength !== b.byteLength) {
        return false;
    }
    const left = new Uint8Array(a);
    const right = new Uint8Array(b);
    for (let i = 0; i < left.length; i++) {
        if (left[i] !== right[i]) {
            return false;
        }
    }
    return true;
}

export type LoadState =
    | { status: "empty" }
    | { status: "loading"; progress?: number }
    | ReadyState
    | { status: "unsupported" }
    | { status: "error"; message?: string };

/**
 * Downloads the current file and works out how to show it. When the file can't be shown and the app supplied a
 * preview file, it switches to that.
 *
 * When the same file (same key) gets a new URL, for example because the app saved its markup, the file on screen
 * stays while the new one downloads, and stays for good when the content turns out to be unchanged.
 */
export function useFileLoader(
    source: ViewerSource | undefined,
    previewMode: "fallback" | "always"
): { state: LoadState; failed(message?: string): void } {
    const url = source?.url;
    const name = source?.name ?? "";
    const previewUrl = source?.previewUrl;
    const previewName = source?.previewName;

    // Start each file on its own document, or on the preview when the app always wants that.
    const sourceKey = `${url}|${name}|${previewUrl}|${previewMode}`;
    const [usePreview, setUsePreview] = useState(Boolean(previewUrl) && previewMode === "always");
    const [shownSource, setShownSource] = useState(sourceKey);
    if (shownSource !== sourceKey) {
        setShownSource(sourceKey);
        setUsePreview(Boolean(previewUrl) && previewMode === "always");
    }

    const showingPreview = usePreview && Boolean(previewUrl);
    const target = useMemo(
        () =>
            url
                ? showingPreview
                    ? { url: previewUrl as string, name: previewName || `${name || "document"}.pdf` }
                    : { url, name }
                : undefined,
        [url, name, previewUrl, previewName, showingPreview]
    );
    const requestKey = target ? `${target.url}|${target.name}` : "";
    // Audio and video stream straight from their URL.
    const streamed = useMemo((): LoadedFile | undefined => {
        const byName = target ? detectKind(target.name) : undefined;
        return target && byName && streamsFromUrl(byName.kind) ? { ...target, ...byName } : undefined;
    }, [target]);

    // Results are tagged with the request they belong to, so a stale result never shows for a new file.
    const [result, setResult] = useState<{ key: string; state: LoadState } | null>(null);

    const identity = source?.key ?? "";
    const [shown, setShown] = useState<{ identity: string; state: ReadyState } | null>(null);
    const shownRef = useRef(shown);
    useLayoutEffect(() => {
        shownRef.current = shown;
    });

    useEffect(() => {
        if (!target || streamed) {
            return;
        }
        const controller = new AbortController();
        const canFallBack = !showingPreview && Boolean(previewUrl);
        const report = (state: LoadState): void => setResult({ key: requestKey, state });
        const requestedIdentity = identity;
        let shownPercent = -1;
        fetchBytes(target.url, controller.signal, ({ loaded, total }) => {
            const progress = total ? loaded / total : undefined;
            const percent = progress === undefined ? -1 : Math.floor(progress * 100);
            if (percent !== shownPercent) {
                shownPercent = percent;
                report({ status: "loading", progress });
            }
        })
            .then(bytes => {
                const detected = detectKind(target.name, new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 8192)));
                if (detected.kind === "unknown") {
                    if (canFallBack) {
                        setUsePreview(true);
                    } else {
                        report({ status: "unsupported" });
                    }
                    return;
                }
                const previous = shownRef.current;
                if (
                    previous?.identity === requestedIdentity &&
                    previous.state.usingPreview === showingPreview &&
                    previous.state.file.name === target.name &&
                    sameBytes(previous.state.file.bytes, bytes)
                ) {
                    report(previous.state);
                    return;
                }
                report({
                    status: "ready",
                    file: { url: target.url, name: target.name, ...detected, bytes },
                    usingPreview: showingPreview
                });
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) {
                    return;
                }
                if (canFallBack) {
                    setUsePreview(true);
                } else {
                    report({ status: "error", message: error instanceof Error ? error.message : undefined });
                }
            });
        return () => {
            controller.abort();
        };
        // The identity only matters together with a new target.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, streamed, requestKey, showingPreview, previewUrl]);

    let state: LoadState;
    if (!target) {
        state = { status: "empty" };
    } else if (result?.key === requestKey && result.state.status !== "loading") {
        state = result.state;
    } else if (streamed) {
        state = { status: "ready", file: streamed, usingPreview: showingPreview };
    } else {
        state = result?.key === requestKey ? result.state : { status: "loading" };
    }
    if (state.status === "loading" && shown?.identity === identity && shown.state.usingPreview === showingPreview) {
        state = shown.state;
    }
    if (state.status === "ready" && state.file.bytes && shown?.state !== state) {
        setShown({ identity, state });
    }

    // A view that can't render its file reports here, and the preview takes over when there is one.
    const failed = useCallback(
        (message?: string) => {
            if (previewUrl && !usePreview) {
                setUsePreview(true);
            } else {
                setResult({ key: requestKey, state: { status: "error", message: message || undefined } });
            }
        },
        [previewUrl, usePreview, requestKey]
    );
    return { state, failed };
}

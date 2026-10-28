import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactElement } from "react";

import { loadEngine, pdfAssetsUrl } from "../core/engines";
import type { PageSize } from "../core/pages";
import type { PrintJob } from "../core/print";
import { clearHighlights, countMatches, highlightMatches, setActiveMark } from "../core/search";
import { PagedView, type RenderPage } from "./PagedView";
import type { OutlineItem, Thumbnails, ViewProps } from "./types";

// pdf.js measures pages in points (1/72 inch); the browser's 100% is 96 pixels per inch.
const CSS_UNITS = 96 / 72;
// Browsers refuse canvases above about 16 million pixels on some devices.
const MAX_CANVAS_PIXELS = 16_000_000;

type PdfJs = Awaited<ReturnType<typeof loadEngine<"pdf">>>;

interface PasswordState {
    retry(password: string): void;
    wrong: boolean;
}

interface SearchIndex {
    query: string;
    /** Matches per page, counted per text run so they agree with the marks in the text layer. */
    perPage: number[];
}

function pageMatchLocation(index: SearchIndex, active: number): { page: number; local: number } | undefined {
    let remaining = active;
    for (let page = 0; page < index.perPage.length; page++) {
        if (remaining < index.perPage[page]) {
            return { page, local: remaining };
        }
        remaining -= index.perPage[page];
    }
    return undefined;
}

async function resolveOutline(doc: PDFDocumentProxy): Promise<OutlineItem[]> {
    const outline = await doc.getOutline();
    if (!outline?.length) {
        return [];
    }
    type RawItem = (typeof outline)[number];
    const resolve = async (item: RawItem): Promise<OutlineItem> => {
        let page: number | null = null;
        try {
            const dest = typeof item.dest === "string" ? await doc.getDestination(item.dest) : item.dest;
            const ref = Array.isArray(dest) ? dest[0] : undefined;
            if (ref && typeof ref === "object") {
                page = (await doc.getPageIndex(ref)) + 1;
            } else if (typeof ref === "number") {
                page = ref + 1;
            }
        } catch {
            page = null;
        }
        return {
            title: item.title,
            page,
            url: item.url ?? undefined,
            children: await Promise.all((item.items ?? []).map(resolve))
        };
    };
    return Promise.all(outline.map(resolve));
}

function addLinks(
    host: HTMLElement,
    page: PDFPageProxy,
    viewport: ReturnType<PDFPageProxy["getViewport"]>,
    doc: PDFDocumentProxy,
    goToPage: (page: number) => void
): void {
    page.getAnnotations({ intent: "display" })
        .then(annotations => {
            const layer = document.createElement("div");
            layer.className = "dvp-link-layer";
            for (const annotation of annotations) {
                if (annotation.subtype !== "Link" || (!annotation.url && !annotation.dest)) {
                    continue;
                }
                const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
                const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
                const link = document.createElement("a");
                link.className = "dvp-link";
                link.style.left = `${Math.min(x1, x2)}px`;
                link.style.top = `${Math.min(y1, y2)}px`;
                link.style.width = `${Math.abs(x2 - x1)}px`;
                link.style.height = `${Math.abs(y2 - y1)}px`;
                if (annotation.url) {
                    link.href = annotation.url;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.title = annotation.url;
                } else {
                    link.href = "#";
                    link.addEventListener("click", event => {
                        event.preventDefault();
                        const dest = annotation.dest;
                        Promise.resolve(typeof dest === "string" ? doc.getDestination(dest) : dest)
                            .then(explicit => {
                                const ref = Array.isArray(explicit) ? explicit[0] : undefined;
                                if (ref && typeof ref === "object") {
                                    return doc.getPageIndex(ref);
                                }
                                return typeof ref === "number" ? ref : undefined;
                            })
                            .then(index => {
                                if (index !== undefined) {
                                    goToPage(index + 1);
                                }
                            })
                            .catch(() => undefined);
                    });
                }
                layer.appendChild(link);
            }
            if (layer.childElementCount > 0) {
                host.appendChild(layer);
            }
        })
        .catch(() => undefined);
}

async function renderToCanvas(
    page: PDFPageProxy,
    canvas: HTMLCanvasElement,
    scale: number,
    rotation: number,
    pixelRatio: number
): Promise<void> {
    const viewport = page.getViewport({ scale: scale * CSS_UNITS, rotation: (page.rotate + rotation) % 360 });
    let ratio = pixelRatio;
    if (viewport.width * viewport.height * ratio * ratio > MAX_CANVAS_PIXELS) {
        ratio = Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height));
    }
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    await page.render({
        canvas,
        viewport,
        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined
    }).promise;
}

export function PdfView(props: ViewProps): ReactElement | null {
    const { file, callbacks, labels, query, activeMatch, rotation } = props;
    const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
    const [sizes, setSizes] = useState<PageSize[]>([]);
    const [password, setPassword] = useState<PasswordState | null>(null);
    const pdfjs = useRef<PdfJs | null>(null);
    const pages = useRef(new Map<number, Promise<PDFPageProxy>>());
    const textLayers = useRef(new Map<number, HTMLElement>());
    const texts = useRef(new Map<number, Promise<string[]>>());
    const [indexed, setIndexed] = useState<SearchIndex | null>(null);
    const searchIndex = query.trim() && indexed?.query === query ? indexed : null;
    const search = useRef({ query, activeMatch, index: searchIndex });
    useLayoutEffect(() => {
        search.current = { query, activeMatch, index: searchIndex };
    });

    const getPage = useCallback(
        (index: number): Promise<PDFPageProxy> => {
            if (!doc) {
                return Promise.reject(new Error("No document"));
            }
            let page = pages.current.get(index);
            if (!page) {
                page = doc.getPage(index + 1);
                pages.current.set(index, page);
            }
            return page;
        },
        [doc]
    );

    // Load the document.
    useEffect(() => {
        let cancelled = false;
        let task: PDFDocumentLoadingTask | undefined;
        let loaded: PDFDocumentProxy | undefined;
        loadEngine("pdf")
            .then(async engine => {
                if (cancelled || !file.bytes) {
                    return;
                }
                pdfjs.current = engine;
                const assets = pdfAssetsUrl();
                engine.GlobalWorkerOptions.workerSrc = `${assets}pdf.worker.min.js`;
                task = engine.getDocument({
                    // pdf.js takes ownership of the buffer it's given, so hand it a copy.
                    data: new Uint8Array(file.bytes.slice(0)),
                    cMapUrl: `${assets}cmaps/`,
                    cMapPacked: true,
                    standardFontDataUrl: `${assets}standard_fonts/`,
                    wasmUrl: `${assets}wasm/`,
                    iccUrl: `${assets}iccs/`
                });
                task.onPassword = (update: (password: string) => void, reason: number) => {
                    if (!cancelled) {
                        setPassword({
                            retry: value => update(value),
                            wrong: reason === engine.PasswordResponses.INCORRECT_PASSWORD
                        });
                    }
                };
                loaded = await task.promise;
                if (cancelled) {
                    return;
                }
                setPassword(null);
                const first = await loaded.getPage(1);
                const base = first.getViewport({ scale: CSS_UNITS });
                // Assume every page matches the first until the real sizes are in, so the first page shows at once.
                const guess = Array.from({ length: loaded.numPages }, () => ({
                    width: base.width,
                    height: base.height
                }));
                setDoc(loaded);
                setSizes(guess);
                callbacks.onReady({
                    pageCount: loaded.numPages,
                    zoomable: true,
                    fits: true,
                    rotatable: true,
                    searchable: true
                });
                const real: PageSize[] = [];
                for (let i = 0; i < loaded.numPages; i++) {
                    const page = await loaded.getPage(i + 1);
                    const viewport = page.getViewport({ scale: CSS_UNITS });
                    real.push({ width: viewport.width, height: viewport.height });
                    if (cancelled) {
                        return;
                    }
                }
                if (real.some((size, i) => size.width !== guess[i].width || size.height !== guess[i].height)) {
                    setSizes(real);
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    const name = (error as { name?: string })?.name;
                    callbacks.onError(name === "PasswordException" ? labels.wrongPassword : undefined);
                }
            });
        return () => {
            cancelled = true;
            task?.destroy().catch(() => undefined);
        };
        // Reload only for a new file; callbacks and labels are stable enough for the lifetime of a document.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    // Outline, thumbnails and printing, once the document is open.
    useEffect(() => {
        if (!doc) {
            return;
        }
        let cancelled = false;
        const thumbnails: Thumbnails = {
            count: doc.numPages,
            aspect: index => {
                const size = sizes[index] ?? sizes[0];
                return size ? size.height / size.width : 1.414;
            },
            render: async (index, canvas, width) => {
                const page = await getPage(index);
                const base = page.getViewport({ scale: CSS_UNITS });
                await renderToCanvas(page, canvas, width / base.width, 0, window.devicePixelRatio || 1);
            }
        };
        const print = async (): Promise<PrintJob> => {
            const images: string[] = [];
            for (let i = 0; i < doc.numPages; i++) {
                const page = await getPage(i);
                const canvas = document.createElement("canvas");
                // About 150 dpi: sharp on paper without running out of memory on long documents.
                await renderToCanvas(page, canvas, 1, rotation, 1.6);
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
                if (blob) {
                    images.push(URL.createObjectURL(blob));
                }
                canvas.width = 0;
                canvas.height = 0;
            }
            return { kind: "images", images };
        };
        callbacks.onInfo({ thumbnails, print });
        resolveOutline(doc)
            .then(outline => {
                if (!cancelled && outline.length > 0) {
                    callbacks.onInfo({ outline });
                }
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc, sizes, rotation, getPage]);

    const pageTexts = useCallback(
        (index: number): Promise<string[]> => {
            let text = texts.current.get(index);
            if (!text) {
                text = getPage(index)
                    .then(page => page.getTextContent())
                    .then(content => content.items.map(item => ("str" in item ? item.str : "")));
                texts.current.set(index, text);
            }
            return text;
        },
        [getPage]
    );

    // Count matches on every page when the query changes.
    useEffect(() => {
        if (!doc) {
            return;
        }
        if (!query.trim()) {
            callbacks.onMatches(0);
            return;
        }
        let cancelled = false;
        const perPage = new Array<number>(doc.numPages).fill(0);
        (async () => {
            for (let i = 0; i < doc.numPages; i++) {
                const items = await pageTexts(i);
                if (cancelled) {
                    return;
                }
                perPage[i] = items.reduce((sum, text) => sum + countMatches(text, query), 0);
            }
            setIndexed({ query, perPage });
            callbacks.onMatches(perPage.reduce((a, b) => a + b, 0));
        })().catch(() => undefined);
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc, query, pageTexts]);

    const applyHighlights = useCallback((pageIndex: number, layer: HTMLElement, scroll: boolean) => {
        const { query: current, activeMatch: active, index } = search.current;
        clearHighlights(layer);
        if (!index || index.query !== current) {
            return;
        }
        const marks = highlightMatches(layer, current);
        const location = pageMatchLocation(index, active);
        setActiveMark(
            marks,
            location?.page === pageIndex ? location.local : -1,
            scroll && location?.page === pageIndex
        );
    }, []);

    // Move to the active match: highlight it if its page is drawn, otherwise scroll to the page first.
    useEffect(() => {
        textLayers.current.forEach((layer, pageIndex) => applyHighlights(pageIndex, layer, false));
        if (!searchIndex) {
            return;
        }
        const location = pageMatchLocation(searchIndex, activeMatch);
        if (!location) {
            return;
        }
        const layer = textLayers.current.get(location.page);
        if (layer) {
            applyHighlights(location.page, layer, true);
        } else {
            callbacks.onGoTo(location.page + 1);
        }
    }, [searchIndex, activeMatch, applyHighlights, callbacks]);

    const goToPage = callbacks.onGoTo;

    const renderPage: RenderPage = useCallback(
        (index, host, scale, pageRotation) => {
            let cancelled = false;
            let renderTask: { cancel(): void } | undefined;
            let textLayer: { cancel(): void } | undefined;
            getPage(index)
                .then(async page => {
                    if (cancelled || !pdfjs.current) {
                        return;
                    }
                    const engine = pdfjs.current;
                    const viewport = page.getViewport({
                        scale: scale * CSS_UNITS,
                        rotation: (page.rotate + pageRotation) % 360
                    });
                    const canvas = document.createElement("canvas");
                    let ratio = window.devicePixelRatio || 1;
                    if (viewport.width * viewport.height * ratio * ratio > MAX_CANVAS_PIXELS) {
                        ratio = Math.sqrt(MAX_CANVAS_PIXELS / (viewport.width * viewport.height));
                    }
                    canvas.width = Math.floor(viewport.width * ratio);
                    canvas.height = Math.floor(viewport.height * ratio);
                    canvas.className = "dvp-page-canvas";
                    const task = page.render({
                        canvas,
                        viewport,
                        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined
                    });
                    renderTask = task;
                    await task.promise;
                    if (cancelled) {
                        return;
                    }
                    // Swap in the new drawing only when it's done, so zooming doesn't flash blank pages.
                    host.replaceChildren(canvas);
                    const text = document.createElement("div");
                    text.className = "textLayer";
                    text.style.setProperty("--total-scale-factor", String(viewport.scale));
                    text.style.setProperty("--scale-factor", String(viewport.scale));
                    host.appendChild(text);
                    const layer = new engine.TextLayer({
                        textContentSource: page.streamTextContent(),
                        container: text,
                        viewport
                    });
                    textLayer = layer;
                    await layer.render();
                    if (cancelled) {
                        return;
                    }
                    textLayers.current.set(index, text);
                    applyHighlights(index, text, true);
                    addLinks(host, page, viewport, doc as PDFDocumentProxy, goToPage);
                })
                .catch(() => undefined);
            return () => {
                cancelled = true;
                renderTask?.cancel();
                textLayer?.cancel();
                if (textLayers.current.get(index)?.parentElement === host) {
                    textLayers.current.delete(index);
                }
            };
        },
        [getPage, applyHighlights, doc, goToPage]
    );

    const onSubmitPassword = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const input = event.currentTarget.elements.namedItem("password") as HTMLInputElement | null;
            if (password && input) {
                password.retry(input.value);
            }
        },
        [password]
    );

    if (password) {
        return (
            <div className="dvp-status dvp-status--over">
                <form className="dvp-password" onSubmit={onSubmitPassword}>
                    <p>{labels.password}</p>
                    <input
                        className="form-control"
                        type="password"
                        name="password"
                        autoComplete="off"
                        aria-label={labels.password}
                        autoFocus
                    />
                    {password.wrong && <p className="dvp-password-error">{labels.wrongPassword}</p>}
                    <button type="submit" className="btn btn-primary">
                        {labels.open}
                    </button>
                </form>
            </div>
        );
    }

    if (!doc || sizes.length === 0) {
        return null;
    }

    return (
        <div className="dvp-pdf">
            <PagedView
                sizes={sizes}
                rotation={rotation}
                zoom={props.zoom}
                layout={props.layout}
                goTo={props.goTo}
                renderPage={renderPage}
                onPage={callbacks.onPage}
                onScale={callbacks.onScale}
                allowCopy={props.allowCopy}
            />
        </div>
    );
}

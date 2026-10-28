import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import { countMatches } from "../core/search";
import { canvasToObjectUrl } from "./canvas";
import { PagedView, type RenderPage } from "./PagedView";
import type { ViewProps } from "./types";

type PptxEngine = Awaited<ReturnType<typeof loadEngine<"pptx">>>;
type Viewer = InstanceType<PptxEngine["PPTXViewer"]>;

const EMU_PER_PIXEL = 914400 / 96;

interface Deck {
    viewer: Viewer;
    count: number;
    width: number;
    height: number;
    texts: string[][];
}

/**
 * PowerPoint slides, drawn by PptxViewJS. The library draws one slide at a time, so draws are queued, and each
 * slide is drawn once per scale and then copied to the page.
 */
export function SlidesView(props: ViewProps): ReactElement | null {
    const { file, callbacks, labels, query, activeMatch } = props;
    const [deck, setDeck] = useState<Deck | null>(null);
    const [noteDismissed, setNoteDismissed] = useState(false);
    const queue = useRef<Promise<unknown>>(Promise.resolve());

    useEffect(() => {
        let cancelled = false;
        let opened: Viewer | undefined;
        loadEngine("pptx")
            .then(async engine => {
                if (cancelled || !file.bytes) {
                    return;
                }
                const viewer = new engine.PPTXViewer({
                    autoRenderFirstSlide: false,
                    autoChartRerenderDelayMs: 0,
                    enableThumbnails: false,
                    logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop } as unknown as Console
                });
                opened = viewer;
                await viewer.loadFile(file.bytes.slice(0));
                const texts = await engine.slideTexts(file.bytes).catch(() => [] as string[][]);
                if (cancelled) {
                    return;
                }
                const processor = (
                    viewer as unknown as { processor?: { getSlideDimensions?(): { cx: number; cy: number } } }
                ).processor;
                const size = processor?.getSlideDimensions?.() ?? { cx: 9144000, cy: 6858000 };
                const count = viewer.getSlideCount();
                if (count === 0) {
                    throw new Error("No slides");
                }
                setDeck({ viewer, count, width: size.cx / EMU_PER_PIXEL, height: size.cy / EMU_PER_PIXEL, texts });
                callbacks.onReady({ pageCount: count, zoomable: true, fits: true, rotatable: false, searchable: true });
            })
            .catch(() => {
                if (!cancelled) {
                    callbacks.onError();
                }
            });
        return () => {
            cancelled = true;
            opened?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const draw = useCallback(
        (index: number, canvas: HTMLCanvasElement, cssWidth: number, pixelRatio: number): Promise<void> => {
            if (!deck) {
                return Promise.resolve();
            }
            const cssHeight = (cssWidth * deck.height) / deck.width;
            canvas.width = Math.round(cssWidth * pixelRatio);
            canvas.height = Math.round(cssHeight * pixelRatio);
            canvas.style.width = `${Math.round(cssWidth)}px`;
            canvas.style.height = `${Math.round(cssHeight)}px`;
            const job = queue.current.then(() => deck.viewer.renderSlide(index, canvas)).then(noop, noop);
            queue.current = job;
            return job;
        },
        [deck]
    );

    useEffect(() => {
        if (!deck) {
            return;
        }
        callbacks.onInfo({
            thumbnails: {
                count: deck.count,
                aspect: () => deck.height / deck.width,
                render: (index, canvas, width) => draw(index, canvas, width, window.devicePixelRatio || 1)
            },
            print: async () => {
                const images: string[] = [];
                for (let i = 0; i < deck.count; i++) {
                    const canvas = document.createElement("canvas");
                    await draw(i, canvas, deck.width, 1.6);
                    const url = await canvasToObjectUrl(canvas);
                    if (url) {
                        images.push(url);
                    }
                }
                return { kind: "images", images };
            }
        });
    }, [deck, draw, callbacks]);

    // Search the slide text; the active match moves to its slide.
    const perSlide = useMemo(
        () => (deck ? deck.texts.map(runs => runs.reduce((sum, run) => sum + countMatches(run, query), 0)) : []),
        [deck, query]
    );
    useEffect(() => {
        if (deck) {
            callbacks.onMatches(query.trim() ? perSlide.reduce((a, b) => a + b, 0) : 0);
        }
    }, [deck, perSlide, query, callbacks]);
    useEffect(() => {
        if (!query.trim()) {
            return;
        }
        let remaining = activeMatch;
        for (let slide = 0; slide < perSlide.length; slide++) {
            if (remaining < perSlide[slide]) {
                callbacks.onGoTo(slide + 1);
                return;
            }
            remaining -= perSlide[slide];
        }
    }, [activeMatch, perSlide, query, callbacks]);

    const renderPage: RenderPage = useCallback(
        (index, host, scale) => {
            if (!deck) {
                return;
            }
            let cancelled = false;
            const canvas = document.createElement("canvas");
            canvas.className = "dvp-page-canvas";
            draw(index, canvas, deck.width * scale, window.devicePixelRatio || 1).then(() => {
                if (!cancelled) {
                    host.replaceChildren(canvas);
                }
            });
            return () => {
                cancelled = true;
            };
        },
        [deck, draw]
    );

    const sizes = useMemo(
        () => (deck ? Array.from({ length: deck.count }, () => ({ width: deck.width, height: deck.height })) : []),
        [deck]
    );

    if (!deck) {
        return null;
    }
    return (
        <div className="dvp-slides">
            {labels.slidesBeta && !noteDismissed && (
                <div className="dvp-note" role="note">
                    <span>{labels.slidesBeta}</span>
                    <button
                        type="button"
                        className="dvp-note-close"
                        aria-label="Dismiss"
                        onClick={() => setNoteDismissed(true)}
                    >
                        ×
                    </button>
                </div>
            )}
            <PagedView
                sizes={sizes}
                rotation={0}
                zoom={props.zoom}
                layout={props.layout}
                goTo={props.goTo}
                renderPage={renderPage}
                onPage={callbacks.onPage}
                onScale={callbacks.onScale}
            />
        </div>
    );
}

function noop(): void {
    // Swallows the library's console output and settles queued draws.
}

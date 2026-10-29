import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { loadEngine } from "../core/engines";
import type { PageSize } from "../core/pages";
import { canvasToObjectUrl, drawRotated } from "./canvas";
import { PagedView, type RenderPage } from "./PagedView";
import type { ViewProps } from "./types";

export function TiffView(props: ViewProps): ReactElement | null {
    const { file, callbacks, rotation } = props;
    const [pages, setPages] = useState<HTMLCanvasElement[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadEngine("tiff")
            .then(engine => {
                if (cancelled || !file.bytes) {
                    return;
                }
                const decoded = engine.decodePages(file.bytes);
                if (decoded.length === 0) {
                    throw new Error("No pages");
                }
                // Keep each page as a full-size bitmap; pages are drawn from it at any scale.
                const bitmaps = decoded.map(page => {
                    const canvas = document.createElement("canvas");
                    canvas.width = page.width;
                    canvas.height = page.height;
                    const image = new ImageData(
                        new Uint8ClampedArray(page.rgba.buffer as ArrayBuffer, page.rgba.byteOffset, page.rgba.length),
                        page.width,
                        page.height
                    );
                    canvas.getContext("2d")?.putImageData(image, 0, 0);
                    return canvas;
                });
                setPages(bitmaps);
                callbacks.onReady({
                    pageCount: bitmaps.length,
                    zoomable: true,
                    fits: true,
                    rotatable: true,
                    searchable: false
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
    }, [file]);

    const sizes: PageSize[] = useMemo(() => (pages ?? []).map(p => ({ width: p.width, height: p.height })), [pages]);

    useEffect(() => {
        if (!pages) {
            return;
        }
        callbacks.onInfo({
            thumbnails: {
                count: pages.length,
                aspect: index => pages[index].height / pages[index].width,
                render: async (index, canvas, width) => {
                    const page = pages[index];
                    drawRotated(page, page.width, page.height, canvas, width / page.width, 0);
                }
            },
            print: async () => {
                const images: string[] = [];
                for (const page of pages) {
                    const canvas = document.createElement("canvas");
                    drawRotated(page, page.width, page.height, canvas, 1, rotation, 1);
                    const url = await canvasToObjectUrl(canvas);
                    if (url) {
                        images.push(url);
                    }
                }
                return { kind: "images", images, rotation };
            }
        });
    }, [pages, rotation, callbacks]);

    const renderPage: RenderPage = useCallback(
        (index, host, scale, pageRotation) => {
            const page = pages?.[index];
            if (!page) {
                return;
            }
            const canvas = document.createElement("canvas");
            canvas.className = "dvp-page-canvas";
            drawRotated(page, page.width, page.height, canvas, scale, pageRotation);
            host.replaceChildren(canvas);
        },
        [pages]
    );

    if (!pages) {
        return null;
    }
    return (
        <PagedView
            sizes={sizes}
            rotation={rotation}
            zoom={props.zoom}
            layout={props.layout}
            goTo={props.goTo}
            renderPage={renderPage}
            onPage={callbacks.onPage}
            onScale={callbacks.onScale}
            overlay={props.pageOverlay}
        />
    );
}

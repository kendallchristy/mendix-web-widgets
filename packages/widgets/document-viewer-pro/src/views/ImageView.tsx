import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { imageMimeType } from "../core/fileTypes";
import { PagedView, type RenderPage } from "./PagedView";
import type { ViewProps } from "./types";

export function ImageView(props: ViewProps): ReactElement | null {
    const { file, callbacks, rotation } = props;
    const [image, setImage] = useState<{ url: string; width: number; height: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        // Serve the image from memory with the right type; servers often send files as octet-stream.
        const url = file.bytes
            ? URL.createObjectURL(new Blob([file.bytes], { type: imageMimeType(file.ext) }))
            : file.url;
        const img = new Image();
        img.onload = () => {
            if (cancelled) {
                return;
            }
            // SVGs without a size report 0; give them a sensible canvas.
            const width = img.naturalWidth || 800;
            const height = img.naturalHeight || 600;
            setImage({ url, width, height });
            callbacks.onReady({ zoomable: true, fits: true, rotatable: true, searchable: false });
        };
        img.onerror = () => {
            if (!cancelled) {
                callbacks.onError();
            }
        };
        img.src = url;
        return () => {
            cancelled = true;
            if (url !== file.url) {
                URL.revokeObjectURL(url);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    useEffect(() => {
        if (!image) {
            return;
        }
        callbacks.onInfo({
            print: async () => ({ kind: "images", images: [image.url] })
        });
    }, [image, callbacks]);

    const sizes = useMemo(() => (image ? [{ width: image.width, height: image.height }] : []), [image]);

    const renderPage: RenderPage = useCallback(
        (_index, host, scale, pageRotation) => {
            if (!image) {
                return;
            }
            const img = document.createElement("img");
            img.src = image.url;
            img.alt = file.name;
            img.draggable = false;
            img.className = "dvp-image";
            img.style.width = `${image.width * scale}px`;
            img.style.height = `${image.height * scale}px`;
            img.style.transform = `translate(-50%, -50%) rotate(${pageRotation}deg)`;
            host.replaceChildren(img);
        },
        [image, file.name]
    );

    if (!image) {
        return null;
    }
    return (
        <PagedView
            sizes={sizes}
            rotation={rotation}
            zoom={props.zoom}
            layout="continuous"
            goTo={null}
            renderPage={renderPage}
            onPage={noop}
            onScale={callbacks.onScale}
            pannable
            maxFit={1}
        />
    );
}

function noop(): void {
    // A single image has no pages to report.
}

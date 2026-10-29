import { useEffect, type ReactElement } from "react";

import type { ViewProps } from "./types";

export function MediaView(props: ViewProps): ReactElement {
    const { file, callbacks } = props;
    useEffect(() => {
        callbacks.onScale(1);
    }, [callbacks]);
    const ready = (): void => callbacks.onReady({ zoomable: false, fits: false, rotatable: false, searchable: false });
    const failed = (): void => callbacks.onError();
    return (
        <div className="dvp-media">
            {file.kind === "audio" ? (
                <audio controls preload="metadata" src={file.url} onLoadedMetadata={ready} onError={failed}>
                    {file.name}
                </audio>
            ) : (
                <video controls preload="metadata" src={file.url} onLoadedMetadata={ready} onError={failed}>
                    {file.name}
                </video>
            )}
        </div>
    );
}

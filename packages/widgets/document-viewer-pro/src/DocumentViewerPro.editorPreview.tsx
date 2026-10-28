import type { ReactElement } from "react";

import type { DocumentViewerProPreviewProps } from "../typings/DocumentViewerProProps";

// A still picture of the viewer for Studio Pro's design mode: toolbar, thumbnails and a page.
export function preview(props: DocumentViewerProPreviewProps): ReactElement {
    const height = props.heightUnit === "PIXELS" && props.height ? Math.min(props.height, 480) : 360;
    const toolbar = props.toolbarPosition !== "HIDDEN" && (
        <div className="dvp-toolbar">
            <div className="dvp-toolbar-group dvp-toolbar-start">
                <span className="dvp-file-name">
                    {props.source === "LIST" ? "Files" : props.source === "URL" ? "Document from URL" : "Document"}
                </span>
            </div>
            <div className="dvp-toolbar-group dvp-toolbar-middle">
                {props.showPageControls && <span className="dvp-page-count">1 of 12</span>}
                {props.showZoom && <span className="dvp-page-count">100%</span>}
            </div>
            <div className="dvp-toolbar-group dvp-toolbar-end" />
        </div>
    );
    return (
        <div className={`widget-document-viewer-pro dvp dvp--preview ${props.className}`} style={{ height }}>
            {props.toolbarPosition === "TOP" && toolbar}
            <div className="dvp-main">
                {props.sidebar !== "HIDDEN" && props.sidebar !== "CLOSED" && (
                    <aside className="dvp-sidebar">
                        <div className="dvp-sidebar-body">
                            {[1, 2, 3].map(n => (
                                <span key={n} className="dvp-thumb">
                                    <span
                                        className="dvp-thumb-frame dvp-preview-page"
                                        style={{ width: 72, height: 96 }}
                                    />
                                    <span className="dvp-thumb-number">{n}</span>
                                </span>
                            ))}
                        </div>
                    </aside>
                )}
                <div className="dvp-content">
                    <div className="dvp-preview-page dvp-preview-page--main">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            </div>
            {props.toolbarPosition === "BOTTOM" && toolbar}
        </div>
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/DocumentViewerPro.scss");
}

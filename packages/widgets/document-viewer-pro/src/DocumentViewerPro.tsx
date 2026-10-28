import { Big } from "big.js";
import type { ActionValue, DynamicValue, EditableValue, ObjectItem } from "mendix";
import { useCallback, useMemo, useState, type CSSProperties, type ReactElement } from "react";

import type { DocumentViewerProContainerProps } from "../typings/DocumentViewerProProps";
import { Viewer, type ViewerSettings, type ViewerSource } from "./components/Viewer";
import { defaultLabels, type Labels } from "./core/labels";
import type { ZoomMode } from "./core/zoom";
import "./ui/DocumentViewerPro.scss";

function run(action: ActionValue | undefined): void {
    if (action?.canExecute && !action.isExecuting) {
        action.execute();
    }
}

function setNumber(attribute: EditableValue<Big> | undefined, value: number): void {
    if (attribute && !attribute.readOnly && attribute.value?.toNumber() !== value) {
        attribute.setValue(new Big(value));
    }
}

function setText(attribute: EditableValue<string> | undefined, value: string): void {
    if (attribute && !attribute.readOnly && (attribute.value ?? "") !== value) {
        attribute.setValue(value);
    }
}

const zoomModes: Record<string, ZoomMode> = {
    FIT_WIDTH: "fitWidth",
    FIT_PAGE: "fitPage",
    ACTUAL: "actual",
    CUSTOM: "custom"
};

/** Mendix serves every FileDocument at /file?guid=…, which is how files from a list data source are shown. */
function fileUrl(item: ObjectItem): string {
    const appUrl = (window as unknown as { mx?: { appUrl?: string } }).mx?.appUrl || `${window.location.origin}/`;
    return new URL(`file?guid=${encodeURIComponent(item.id)}`, appUrl.endsWith("/") ? appUrl : `${appUrl}/`).href;
}

function labelsFrom(props: DocumentViewerProContainerProps): Labels {
    const pick = (value: DynamicValue<string> | undefined, fallback: string): string => value?.value || fallback;
    return {
        loading: pick(props.labelLoading, defaultLabels.loading),
        error: pick(props.labelError, defaultLabels.error),
        unsupported: pick(props.labelUnsupported, defaultLabels.unsupported),
        noFile: pick(props.labelNoFile, defaultLabels.noFile),
        fallback: pick(props.labelFallback, defaultLabels.fallback),
        password: pick(props.labelPassword, defaultLabels.password),
        wrongPassword: pick(props.labelWrongPassword, defaultLabels.wrongPassword),
        open: pick(props.labelOpen, defaultLabels.open),
        previousPage: pick(props.labelPreviousPage, defaultLabels.previousPage),
        nextPage: pick(props.labelNextPage, defaultLabels.nextPage),
        pageNumber: pick(props.labelPageNumber, defaultLabels.pageNumber),
        pageCount: pick(props.labelPageCount, defaultLabels.pageCount),
        zoomIn: pick(props.labelZoomIn, defaultLabels.zoomIn),
        zoomOut: pick(props.labelZoomOut, defaultLabels.zoomOut),
        zoom: pick(props.labelZoom, defaultLabels.zoom),
        fitWidth: pick(props.labelFitWidth, defaultLabels.fitWidth),
        fitPage: pick(props.labelFitPage, defaultLabels.fitPage),
        actualSize: pick(props.labelActualSize, defaultLabels.actualSize),
        rotate: pick(props.labelRotate, defaultLabels.rotate),
        search: pick(props.labelSearch, defaultLabels.search),
        searchPlaceholder: pick(props.labelSearchPlaceholder, defaultLabels.searchPlaceholder),
        searchResults: pick(props.labelSearchResults, defaultLabels.searchResults),
        noResults: pick(props.labelNoResults, defaultLabels.noResults),
        previousMatch: pick(props.labelPreviousMatch, defaultLabels.previousMatch),
        nextMatch: pick(props.labelNextMatch, defaultLabels.nextMatch),
        closeSearch: pick(props.labelCloseSearch, defaultLabels.closeSearch),
        print: pick(props.labelPrint, defaultLabels.print),
        preparingPrint: pick(props.labelPreparingPrint, defaultLabels.preparingPrint),
        download: pick(props.labelDownload, defaultLabels.download),
        fullscreen: pick(props.labelFullscreen, defaultLabels.fullscreen),
        exitFullscreen: pick(props.labelExitFullscreen, defaultLabels.exitFullscreen),
        sidebar: pick(props.labelSidebar, defaultLabels.sidebar),
        thumbnails: pick(props.labelThumbnails, defaultLabels.thumbnails),
        outline: pick(props.labelOutline, defaultLabels.outline),
        previousFile: pick(props.labelPreviousFile, defaultLabels.previousFile),
        nextFile: pick(props.labelNextFile, defaultLabels.nextFile),
        attachments: pick(props.labelAttachments, defaultLabels.attachments),
        back: pick(props.labelBack, defaultLabels.back),
        from: pick(props.labelFrom, defaultLabels.from),
        to: pick(props.labelTo, defaultLabels.to),
        cc: pick(props.labelCc, defaultLabels.cc),
        date: pick(props.labelDate, defaultLabels.date),
        remoteBlocked: pick(props.labelRemoteBlocked, defaultLabels.remoteBlocked),
        showRemote: pick(props.labelShowRemote, defaultLabels.showRemote),
        wrapLines: pick(props.labelWrapLines, defaultLabels.wrapLines),
        showSource: pick(props.labelShowSource, defaultLabels.showSource),
        // An emptied note hides it, so only fall back while the text hasn't loaded.
        slidesBeta:
            props.labelSlidesBeta?.status === "available"
                ? (props.labelSlidesBeta.value ?? "")
                : defaultLabels.slidesBeta
    };
}

/** Keeps the same labels object while the texts don't change, so the viewer doesn't redo work on every render. */
function useStableLabels(next: Labels): Labels {
    const [labels, setLabels] = useState(next);
    const changed = (Object.keys(next) as Array<keyof Labels>).some(key => next[key] !== labels[key]);
    if (changed) {
        setLabels(next);
        return next;
    }
    return labels;
}

function heightStyle(props: DocumentViewerProContainerProps): CSSProperties {
    const height = Math.max(props.height, 1);
    if (props.heightUnit === "VIEWPORT") {
        return { height: `${height}vh` };
    }
    if (props.heightUnit === "PARENT") {
        return { height: "100%" };
    }
    return { height: `${height}px` };
}

export function DocumentViewerPro(props: DocumentViewerProContainerProps): ReactElement {
    const labels = useStableLabels(labelsFrom(props));
    const { source, file, url, fileName, files, listFileName, listCaption, previewFile } = props;

    const sources: ViewerSource[] = useMemo(() => {
        if (source === "LIST") {
            return (files?.items ?? []).map(item => {
                const name = listFileName?.get(item).value ?? "";
                return { key: item.id, url: fileUrl(item), name, caption: listCaption?.get(item).value };
            });
        }
        const preview =
            previewFile?.status === "available" && previewFile.value?.uri
                ? { previewUrl: previewFile.value.uri, previewName: previewFile.value.name }
                : {};
        if (source === "URL") {
            const address = url?.value;
            if (!address) {
                return [];
            }
            const name = fileName?.value || decodeURIComponent(address.split(/[?#]/)[0].split("/").pop() ?? "");
            return [{ key: address, url: address, name, ...preview }];
        }
        const value = file?.status === "available" ? file.value : undefined;
        if (!value?.uri) {
            return [];
        }
        return [{ key: value.uri, url: value.uri, name: fileName?.value || value.name || "", ...preview }];
    }, [source, file, url, fileName, files, listFileName, listCaption, previewFile]);

    const pending =
        (source === "FILE" && file?.status === "loading") ||
        (source === "LIST" && files?.status === "loading") ||
        (source === "URL" && url?.status === "loading");

    const settings: ViewerSettings = useMemo(
        () => ({
            layout: props.layout === "SINGLE" ? "single" : "continuous",
            initialZoom: {
                mode: zoomModes[props.initialZoom] ?? "fitWidth",
                scale: Math.min(500, Math.max(25, props.zoomPercent || 100)) / 100
            },
            sidebar:
                props.sidebar === "OPEN"
                    ? "open"
                    : props.sidebar === "CLOSED"
                      ? "closed"
                      : props.sidebar === "HIDDEN"
                        ? "hidden"
                        : "auto",
            toolbarPosition:
                props.toolbarPosition === "BOTTOM" ? "bottom" : props.toolbarPosition === "HIDDEN" ? "hidden" : "top",
            show: {
                fileName: props.showFileName,
                pageControls: props.showPageControls,
                zoom: props.showZoom,
                rotate: props.showRotate,
                search: props.showSearch,
                print: props.showPrint,
                download: props.showDownload,
                fullscreen: props.showFullscreen
            },
            allowDownload: props.allowDownload?.value !== false,
            allowPrint: props.allowPrint?.value !== false,
            allowCopy: props.allowCopy?.value !== false,
            watermark: props.watermark?.value || undefined,
            blockRemoteImages: props.blockRemoteImages,
            previewMode: props.previewMode === "ALWAYS" ? "always" : "fallback"
        }),
        [
            props.layout,
            props.initialZoom,
            props.zoomPercent,
            props.sidebar,
            props.toolbarPosition,
            props.showFileName,
            props.showPageControls,
            props.showZoom,
            props.showRotate,
            props.showSearch,
            props.showPrint,
            props.showDownload,
            props.showFullscreen,
            props.allowDownload?.value,
            props.allowPrint?.value,
            props.allowCopy?.value,
            props.watermark?.value,
            props.blockRemoteImages,
            props.previewMode
        ]
    );

    const { currentPage, pageCount, errorMessage, onLoad, onError, onPageChange, onDownload } = props;

    const onLoaded = useCallback(
        (count: number | undefined) => {
            if (count !== undefined) {
                setNumber(pageCount, count);
            }
            setText(errorMessage, "");
            run(onLoad);
        },
        [pageCount, errorMessage, onLoad]
    );
    const onFailed = useCallback(
        (message: string) => {
            setText(errorMessage, message);
            run(onError);
        },
        [errorMessage, onError]
    );
    const onPage = useCallback(
        (page: number, byUser: boolean) => {
            setNumber(currentPage, page);
            if (byUser) {
                run(onPageChange);
            }
        },
        [currentPage, onPageChange]
    );
    const download = useMemo(() => (onDownload ? () => run(onDownload) : undefined), [onDownload]);

    return (
        <Viewer
            sources={sources}
            pending={pending}
            settings={settings}
            labels={labels}
            toolbarContent={props.toolbarContent}
            requestedPage={currentPage?.value?.toNumber()}
            onLoaded={onLoaded}
            onError={onFailed}
            onPage={onPage}
            onDownload={download}
            className={props.class}
            style={{ ...heightStyle(props), ...props.style }}
            tabIndex={props.tabIndex}
        />
    );
}

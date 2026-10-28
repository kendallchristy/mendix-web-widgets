import classNames from "classnames";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode
} from "react";

import { downloadBytes, downloadUrl } from "../core/download";
import { detectKind } from "../core/fileTypes";
import type { Labels } from "../core/labels";
import { buildPrintDocument, printDocument } from "../core/print";
import { clampScale, stepScale, type Zoom, type ZoomMode } from "../core/zoom";
import { views } from "../views";
import type { Attachment, LoadedFile, PageRequest, ViewCallbacks, ViewInfo } from "../views/types";
import { FileStrip } from "./FileStrip";
import { Icon } from "./Icons";
import { SearchBar } from "./SearchBar";
import { Sidebar } from "./Sidebar";
import { LoadingState, MessageState } from "./StatusCard";
import { Toolbar, type ToolbarVisibility } from "./Toolbar";
import { useFileLoader, type ViewerSource } from "./useFileLoader";
import { Watermark } from "./Watermark";

export type { ViewerSource } from "./useFileLoader";

export interface ViewerSettings {
    layout: "continuous" | "single";
    initialZoom: Zoom;
    sidebar: "auto" | "open" | "closed" | "hidden";
    toolbarPosition: "top" | "bottom" | "hidden";
    show: ToolbarVisibility;
    allowDownload: boolean;
    allowPrint: boolean;
    allowCopy: boolean;
    watermark?: string;
    blockRemoteImages: boolean;
    previewMode: "fallback" | "always";
}

export interface ViewerProps {
    sources: ViewerSource[];
    /** True while Mendix is still fetching the file object. */
    pending?: boolean;
    settings: ViewerSettings;
    labels: Labels;
    toolbarContent?: ReactNode;
    /** A page the app asks for, for example through the current page attribute. */
    requestedPage?: number;
    onLoaded?(pageCount: number | undefined): void;
    onError?(message: string): void;
    /** `byUser` is false for the first page reported after a file opens. */
    onPage?(page: number, byUser: boolean): void;
    /** Replaces the built-in download when set. */
    onDownload?: () => void;
    className?: string;
    style?: CSSProperties;
    tabIndex?: number;
}

const SIDEBAR_AUTO_WIDTH = 900;

function isTyping(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return Boolean(element?.closest?.("input, textarea, select, [contenteditable='true'], .dvp-toolbar-extra"));
}

export function Viewer(props: ViewerProps): ReactElement {
    const { sources, settings, labels } = props;
    const root = useRef<HTMLDivElement>(null);
    const content = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState(0);
    // Stay on a valid file when the list shrinks.
    const index = Math.max(0, Math.min(selected, sources.length - 1));
    const source: ViewerSource | undefined = sources[index];
    const { state, failed } = useFileLoader(source, settings.previewMode);

    // Attachments opened from an email stack on top of it, until another file opens.
    const [attachments, setAttachments] = useState<LoadedFile[]>([]);
    const sourceKey = `${source?.key}|${source?.url}`;
    const [attachedTo, setAttachedTo] = useState(sourceKey);
    if (attachedTo !== sourceKey) {
        setAttachedTo(sourceKey);
        setAttachments([]);
    }

    const file: LoadedFile | undefined =
        attachments[attachments.length - 1] ?? (state.status === "ready" ? state.file : undefined);

    const [info, setInfo] = useState<ViewInfo | null>(null);
    const [zoom, setZoom] = useState<Zoom>(settings.initialZoom);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [page, setPage] = useState(1);
    const [goTo, setGoTo] = useState<PageRequest | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [matchCount, setMatchCount] = useState(0);
    const [activeMatch, setActiveMatch] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState<boolean | null>(null);
    const [fullscreen, setFullscreen] = useState(false);
    const [printing, setPrinting] = useState(false);

    const latest = useRef(props);
    useLayoutEffect(() => {
        latest.current = props;
    });

    // Fresh view state for every file, reset while rendering so the new view never sees the old file's state.
    const fileKey = file ? `${file.url}|${file.name}|${attachments.length}` : "";
    const [shownKey, setShownKey] = useState(fileKey);
    if (shownKey !== fileKey) {
        setShownKey(fileKey);
        setInfo(null);
        setPage(1);
        setRotation(0);
        setMatchCount(0);
        setActiveMatch(0);
        setGoTo(null);
        // Photos read best whole, so fit width becomes fit page for images.
        setZoom(
            file?.kind === "image" && settings.initialZoom.mode === "fitWidth"
                ? { ...settings.initialZoom, mode: "fitPage" }
                : settings.initialZoom
        );
    }
    const reportedPage = useRef<number | undefined>(undefined);
    const callbacks: ViewCallbacks = useMemo(() => {
        const opened: { ready: boolean; lastPage?: number } = { ready: false };
        return {
            onReady(viewInfo) {
                setInfo(previous => ({ ...previous, ...viewInfo }));
                if (!opened.ready) {
                    opened.ready = true;
                    latest.current.onLoaded?.(viewInfo.pageCount);
                }
            },
            onInfo(partial) {
                setInfo(previous => (previous ? { ...previous, ...partial } : previous));
            },
            onPage(value) {
                setPage(value);
                reportedPage.current = value;
                if (opened.lastPage !== value) {
                    latest.current.onPage?.(value, opened.lastPage !== undefined);
                    opened.lastPage = value;
                }
            },
            onScale: setScale,
            onMatches(count) {
                setMatchCount(count);
                setActiveMatch(0);
            },
            onError(message) {
                failed(message);
            },
            onGoTo(target) {
                setGoTo({ page: target, seq: Date.now() });
            },
            onOpenAttachment(attachment: Attachment) {
                const bytes = attachment.bytes.slice().buffer as ArrayBuffer;
                const detected = detectKind(
                    attachment.name,
                    new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 8192))
                );
                const url = URL.createObjectURL(new Blob([bytes]));
                setAttachments(stack => [...stack, { url, name: attachment.name, ...detected, bytes }]);
            }
        };
        // A new set of callbacks per file, so a closing view can't report into the next one.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileKey, failed]);

    // Report each failure once; the app's error handling may re-render the viewer.
    const reportedFailure = useRef<unknown>(null);
    useEffect(() => {
        if ((state.status === "error" || state.status === "unsupported") && reportedFailure.current !== state) {
            reportedFailure.current = state;
            const current = latest.current;
            current.onError?.(
                state.status === "unsupported" ? current.labels.unsupported : state.message || current.labels.error
            );
        }
    }, [state]);

    // Attachment URLs are made from memory; free them when they close.
    const attachmentUrls = useRef<string[]>([]);
    useEffect(() => {
        const urls = attachments.map(a => a.url);
        attachmentUrls.current.filter(url => !urls.includes(url)).forEach(url => URL.revokeObjectURL(url));
        attachmentUrls.current = urls;
    }, [attachments]);

    // The app asks for a page through the current page attribute.
    const { requestedPage } = props;
    useEffect(() => {
        if (requestedPage !== undefined && info?.pageCount && requestedPage !== reportedPage.current) {
            setGoTo({ page: requestedPage, seq: Date.now() });
        }
    }, [requestedPage, info?.pageCount]);

    const goToPage = useCallback(
        (target: number) => {
            const count = info?.pageCount ?? 1;
            setGoTo({ page: Math.min(Math.max(1, target), count), seq: Date.now() });
        },
        [info?.pageCount]
    );

    const scaleRef = useRef(scale);
    useEffect(() => {
        scaleRef.current = scale;
    }, [scale]);
    const zoomStep = useCallback((direction: 1 | -1) => {
        setZoom(current => ({
            mode: "custom",
            scale: stepScale(current.mode === "custom" ? current.scale : scaleRef.current, direction)
        }));
    }, []);

    const setZoomMode = useCallback((mode: ZoomMode, value?: number) => {
        setZoom({ mode, scale: value ?? 1 });
    }, []);

    // Ctrl + wheel and pinch zoom.
    const zoomable = Boolean(info?.zoomable);
    useEffect(() => {
        const element = content.current;
        if (!element || !zoomable) {
            return;
        }
        const onWheel = (event: WheelEvent): void => {
            if (!event.ctrlKey && !event.metaKey) {
                return;
            }
            event.preventDefault();
            const factor = Math.exp(-event.deltaY * 0.0025);
            setZoom({ mode: "custom", scale: clampScale(scaleRef.current * factor) });
        };
        let pinch: { distance: number; scale: number } | null = null;
        const distance = (event: TouchEvent): number =>
            Math.hypot(
                event.touches[0].clientX - event.touches[1].clientX,
                event.touches[0].clientY - event.touches[1].clientY
            );
        const onTouchStart = (event: TouchEvent): void => {
            if (event.touches.length === 2) {
                pinch = { distance: distance(event), scale: scaleRef.current };
            }
        };
        const onTouchMove = (event: TouchEvent): void => {
            if (pinch && event.touches.length === 2) {
                event.preventDefault();
                setZoom({ mode: "custom", scale: clampScale((pinch.scale * distance(event)) / pinch.distance) });
            }
        };
        const onTouchEnd = (): void => {
            pinch = null;
        };
        element.addEventListener("wheel", onWheel, { passive: false });
        element.addEventListener("touchstart", onTouchStart, { passive: true });
        element.addEventListener("touchmove", onTouchMove, { passive: false });
        element.addEventListener("touchend", onTouchEnd);
        return () => {
            element.removeEventListener("wheel", onWheel);
            element.removeEventListener("touchstart", onTouchStart);
            element.removeEventListener("touchmove", onTouchMove);
            element.removeEventListener("touchend", onTouchEnd);
        };
    }, [zoomable]);

    // Sidebar: automatic opens it on wide viewers.
    const sidebarAvailable = settings.sidebar !== "hidden" && Boolean(info?.thumbnails || info?.outline?.length);
    useLayoutEffect(() => {
        if (sidebarOpen !== null) {
            return;
        }
        if (settings.sidebar === "auto") {
            setSidebarOpen((root.current?.clientWidth ?? 0) >= SIDEBAR_AUTO_WIDTH);
        } else {
            setSidebarOpen(settings.sidebar === "open");
        }
    }, [settings.sidebar, sidebarOpen]);

    useEffect(() => {
        const onChange = (): void => setFullscreen(document.fullscreenElement === root.current);
        document.addEventListener("fullscreenchange", onChange);
        return () => {
            document.removeEventListener("fullscreenchange", onChange);
        };
    }, []);
    const toggleFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
        } else {
            root.current?.requestFullscreen?.().catch(() => undefined);
        }
    }, []);

    const stepMatch = useCallback(
        (direction: 1 | -1) => {
            if (matchCount > 0) {
                setActiveMatch(current => (current + direction + matchCount) % matchCount);
            }
        },
        [matchCount]
    );

    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setQuery("");
        root.current?.focus();
    }, []);

    const canDownload = settings.allowDownload && Boolean(source);
    const download = useCallback(() => {
        const current = latest.current;
        if (current.onDownload && attachments.length === 0) {
            current.onDownload();
            return;
        }
        const top = attachments[attachments.length - 1];
        if (top?.bytes) {
            downloadBytes(new Uint8Array(top.bytes), top.name);
        } else if (source) {
            downloadUrl(source.url, source.name);
        }
    }, [attachments, source]);

    const canPrint = settings.allowPrint && Boolean(info?.print);
    const print = useCallback(async () => {
        if (!info?.print || printing) {
            return;
        }
        setPrinting(true);
        try {
            const job = await info.print();
            await printDocument(buildPrintDocument(job, file?.name ?? "", settings.watermark));
            if (job.kind === "images") {
                job.images
                    .filter(url => url.startsWith("blob:"))
                    .forEach(url => setTimeout(() => URL.revokeObjectURL(url), 5000));
            }
        } finally {
            setPrinting(false);
        }
    }, [info, printing, file?.name, settings.watermark]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const mod = event.ctrlKey || event.metaKey;
            if (mod && event.key.toLowerCase() === "f" && info?.searchable && settings.show.search) {
                event.preventDefault();
                setSearchOpen(true);
                return;
            }
            if (mod && event.key.toLowerCase() === "p") {
                // The browser's own print would print the app page, so the viewer handles the shortcut either way.
                event.preventDefault();
                if (canPrint && settings.show.print) {
                    print();
                }
                return;
            }
            if (isTyping(event.target)) {
                return;
            }
            if (mod && (event.key === "+" || event.key === "=") && zoomable) {
                event.preventDefault();
                zoomStep(1);
            } else if (mod && event.key === "-" && zoomable) {
                event.preventDefault();
                zoomStep(-1);
            } else if (mod && event.key === "0" && zoomable) {
                event.preventDefault();
                setZoomMode(info?.fits ? "fitWidth" : "actual");
            } else if (info?.pageCount) {
                const single = settings.layout === "single";
                if (event.key === "PageDown" || (single && (event.key === "ArrowRight" || event.key === "ArrowDown"))) {
                    event.preventDefault();
                    goToPage(page + 1);
                } else if (
                    event.key === "PageUp" ||
                    (single && (event.key === "ArrowLeft" || event.key === "ArrowUp"))
                ) {
                    event.preventDefault();
                    goToPage(page - 1);
                } else if (event.key === "Home" && (mod || single)) {
                    event.preventDefault();
                    goToPage(1);
                } else if (event.key === "End" && (mod || single)) {
                    event.preventDefault();
                    goToPage(info.pageCount);
                }
            }
            if (event.key === "Escape" && searchOpen) {
                closeSearch();
            }
        },
        [info, settings, canPrint, print, zoomable, zoomStep, setZoomMode, goToPage, page, searchOpen, closeSearch]
    );

    const View = file && file.kind !== "unknown" ? views[file.kind] : undefined;
    const showStrip = sources.length > 1;
    const usingPreview = state.status === "ready" && state.usingPreview && attachments.length === 0;

    let body: ReactNode;
    if (props.pending) {
        body = <LoadingState label={labels.loading} />;
    } else if (attachments.length === 0 && state.status === "empty") {
        body = <MessageState icon="file" message={labels.noFile} />;
    } else if (attachments.length === 0 && state.status === "loading") {
        body = <LoadingState label={labels.loading} progress={state.progress} />;
    } else if (attachments.length === 0 && (state.status === "unsupported" || state.status === "error")) {
        body = (
            <MessageState icon="alert" message={state.status === "unsupported" ? labels.unsupported : labels.error}>
                {canDownload && (
                    <button type="button" className="btn btn-default" onClick={download}>
                        <Icon name="download" />
                        {labels.download}
                    </button>
                )}
            </MessageState>
        );
    } else if (file && View) {
        body = (
            <div className="dvp-view">
                {!info && (
                    <div className="dvp-view-loading">
                        <LoadingState label={labels.loading} />
                    </div>
                )}
                <View
                    key={fileKey}
                    file={file}
                    zoom={zoom}
                    rotation={rotation}
                    layout={settings.layout}
                    query={searchOpen ? query : ""}
                    activeMatch={activeMatch}
                    goTo={goTo}
                    allowCopy={settings.allowCopy}
                    blockRemoteImages={settings.blockRemoteImages}
                    labels={labels}
                    callbacks={callbacks}
                />
            </div>
        );
    }

    const toolbar =
        settings.toolbarPosition !== "hidden" ? (
            <Toolbar
                labels={labels}
                show={settings.show}
                fileName={file?.name ?? source?.name ?? ""}
                sidebarAvailable={sidebarAvailable}
                sidebarOpen={Boolean(sidebarOpen)}
                onToggleSidebar={() => setSidebarOpen(open => !open)}
                files={
                    showStrip
                        ? {
                              index,
                              count: sources.length,
                              onPrevious: () => setSelected(Math.max(0, index - 1)),
                              onNext: () => setSelected(Math.min(sources.length - 1, index + 1))
                          }
                        : undefined
                }
                back={attachments.length > 0 ? () => setAttachments(stack => stack.slice(0, -1)) : undefined}
                page={page}
                pageCount={info?.pageCount}
                onGoToPage={goToPage}
                zoomable={zoomable}
                fits={Boolean(info?.fits)}
                zoomMode={zoom.mode}
                scale={scale}
                onZoomMode={setZoomMode}
                onZoomStep={zoomStep}
                rotatable={Boolean(info?.rotatable)}
                onRotate={() => setRotation(r => (r + 90) % 360)}
                searchable={Boolean(info?.searchable)}
                searchOpen={searchOpen}
                onToggleSearch={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
                canPrint={canPrint}
                printing={printing}
                onPrint={print}
                canDownload={canDownload}
                onDownload={download}
                fullscreen={fullscreen}
                onToggleFullscreen={toggleFullscreen}
                extra={props.toolbarContent}
            />
        ) : null;

    return (
        <div
            ref={root}
            className={classNames("widget-document-viewer-pro", "dvp", props.className, {
                "dvp--fullscreen": fullscreen,
                "dvp--toolbar-bottom": settings.toolbarPosition === "bottom",
                "dvp--no-copy": !settings.allowCopy
            })}
            style={props.style}
            tabIndex={props.tabIndex ?? 0}
            onKeyDown={onKeyDown}
            onCopy={settings.allowCopy ? undefined : event => event.preventDefault()}
            onContextMenu={settings.allowCopy ? undefined : event => event.preventDefault()}
        >
            {settings.toolbarPosition === "top" && toolbar}
            {searchOpen && (
                <SearchBar
                    labels={labels}
                    query={query}
                    count={matchCount}
                    active={activeMatch}
                    onQuery={setQuery}
                    onStep={stepMatch}
                    onClose={closeSearch}
                />
            )}
            {showStrip && (
                <FileStrip
                    files={sources.map(s => ({ key: s.key, name: s.name, caption: s.caption }))}
                    index={index}
                    onSelect={setSelected}
                />
            )}
            {usingPreview && settings.previewMode === "fallback" && labels.fallback && (
                <div className="dvp-note dvp-note--banner" role="note">
                    {labels.fallback}
                </div>
            )}
            <div className="dvp-main">
                {sidebarAvailable && sidebarOpen && file && (
                    <Sidebar
                        key={fileKey}
                        labels={labels}
                        thumbnails={info?.thumbnails}
                        outline={info?.outline}
                        page={page}
                        onSelect={goToPage}
                    />
                )}
                <div ref={content} className="dvp-content">
                    {body}
                    {settings.watermark && file && <Watermark text={settings.watermark} />}
                </div>
            </div>
            {settings.toolbarPosition === "bottom" && toolbar}
        </div>
    );
}

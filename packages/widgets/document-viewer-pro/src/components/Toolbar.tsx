import classNames from "classnames";
import { useState, type ChangeEvent, type KeyboardEvent, type ReactElement, type ReactNode } from "react";

import { fillTemplate, type Labels } from "../core/labels";
import type { ZoomMode } from "../core/zoom";
import { Icon, type IconName } from "./Icons";

export interface ToolbarVisibility {
    fileName: boolean;
    pageControls: boolean;
    zoom: boolean;
    rotate: boolean;
    search: boolean;
    print: boolean;
    download: boolean;
    fullscreen: boolean;
}

export interface ToolbarProps {
    labels: Labels;
    show: ToolbarVisibility;
    fileName: string;
    sidebarAvailable: boolean;
    sidebarOpen: boolean;
    onToggleSidebar(): void;
    files?: { index: number; count: number; onPrevious(): void; onNext(): void };
    back?: () => void;
    page: number;
    pageCount?: number;
    onGoToPage(page: number): void;
    zoomable: boolean;
    fits: boolean;
    zoomMode: ZoomMode;
    scale: number;
    onZoomMode(mode: ZoomMode, scale?: number): void;
    onZoomStep(direction: 1 | -1): void;
    rotatable: boolean;
    onRotate(): void;
    searchable: boolean;
    searchOpen: boolean;
    onToggleSearch(): void;
    canPrint: boolean;
    printing: boolean;
    onPrint(): void;
    canDownload: boolean;
    onDownload(): void;
    fullscreen: boolean;
    onToggleFullscreen(): void;
    extra?: ReactNode;
}

function ToolButton(props: {
    icon: IconName;
    label: string;
    onClick(): void;
    disabled?: boolean;
    pressed?: boolean;
    className?: string;
}): ReactElement {
    return (
        <button
            type="button"
            className={classNames("dvp-tool", props.className)}
            onClick={props.onClick}
            disabled={props.disabled}
            aria-label={props.label}
            aria-pressed={props.pressed}
            title={props.label}
        >
            <Icon name={props.icon} />
        </button>
    );
}

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];

function PageInput(props: {
    page: number;
    pageCount: number;
    label: string;
    onGoToPage(page: number): void;
}): ReactElement {
    const { page, pageCount, onGoToPage } = props;
    // The typed value, while the user edits; otherwise the input follows the current page.
    const [draft, setDraft] = useState<string | null>(null);
    const value = draft ?? String(page);
    const commit = (): void => {
        const target = Number.parseInt(value, 10);
        if (Number.isFinite(target) && target >= 1 && target <= pageCount) {
            onGoToPage(target);
        }
        setDraft(null);
    };
    return (
        <input
            className="dvp-page-input"
            type="text"
            inputMode="numeric"
            aria-label={props.label}
            value={value}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value.replace(/\D/g, ""))}
            onBlur={commit}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    commit();
                }
            }}
            onFocus={event => event.target.select()}
        />
    );
}

export function Toolbar(props: ToolbarProps): ReactElement {
    const { labels, show, pageCount, page } = props;
    const zoomValue = props.zoomMode === "custom" ? "custom" : props.zoomMode;
    const percent = `${Math.round(props.scale * 100)}%`;
    return (
        <div className="dvp-toolbar" role="toolbar" aria-label={props.fileName}>
            <div className="dvp-toolbar-group dvp-toolbar-start">
                {props.back && <ToolButton icon="back" label={labels.back} onClick={props.back} />}
                {props.sidebarAvailable && (
                    <ToolButton
                        icon="sidebar"
                        label={labels.sidebar}
                        onClick={props.onToggleSidebar}
                        pressed={props.sidebarOpen}
                        className="dvp-tool--sidebar"
                    />
                )}
                {props.files && props.files.count > 1 && (
                    <div className="dvp-toolbar-group dvp-files-nav">
                        <ToolButton
                            icon="chevronLeft"
                            label={labels.previousFile}
                            onClick={props.files.onPrevious}
                            disabled={props.files.index === 0}
                        />
                        <span className="dvp-files-count">
                            {props.files.index + 1} / {props.files.count}
                        </span>
                        <ToolButton
                            icon="chevronRight"
                            label={labels.nextFile}
                            onClick={props.files.onNext}
                            disabled={props.files.index >= props.files.count - 1}
                        />
                    </div>
                )}
                {show.fileName && (
                    <span className="dvp-file-name" title={props.fileName}>
                        {props.fileName}
                    </span>
                )}
            </div>
            <div className="dvp-toolbar-group dvp-toolbar-middle">
                {show.pageControls && pageCount !== undefined && pageCount > 0 && (
                    <div className="dvp-toolbar-group dvp-page-controls">
                        <ToolButton
                            icon="chevronUp"
                            label={labels.previousPage}
                            onClick={() => props.onGoToPage(page - 1)}
                            disabled={page <= 1}
                        />
                        <PageInput
                            page={page}
                            pageCount={pageCount}
                            label={labels.pageNumber}
                            onGoToPage={props.onGoToPage}
                        />
                        <span className="dvp-page-count">{fillTemplate(labels.pageCount, { total: pageCount })}</span>
                        <ToolButton
                            icon="chevronDown"
                            label={labels.nextPage}
                            onClick={() => props.onGoToPage(page + 1)}
                            disabled={page >= pageCount}
                        />
                    </div>
                )}
                {show.zoom && props.zoomable && (
                    <div className="dvp-toolbar-group dvp-zoom-controls">
                        <ToolButton icon="zoomOut" label={labels.zoomOut} onClick={() => props.onZoomStep(-1)} />
                        <select
                            className="dvp-zoom-select"
                            aria-label={labels.zoom}
                            value={zoomValue}
                            onChange={event => {
                                const value = event.target.value;
                                if (value === "fitWidth" || value === "fitPage" || value === "actual") {
                                    props.onZoomMode(value);
                                } else if (value !== "custom") {
                                    props.onZoomMode("custom", Number(value));
                                }
                            }}
                        >
                            <option value="custom" hidden>
                                {percent}
                            </option>
                            {props.fits && <option value="fitWidth">{labels.fitWidth}</option>}
                            {props.fits && <option value="fitPage">{labels.fitPage}</option>}
                            <option value="actual">{labels.actualSize}</option>
                            {PRESETS.map(preset => (
                                <option key={preset} value={preset}>
                                    {Math.round(preset * 100)}%
                                </option>
                            ))}
                        </select>
                        <ToolButton icon="zoomIn" label={labels.zoomIn} onClick={() => props.onZoomStep(1)} />
                    </div>
                )}
            </div>
            <div className="dvp-toolbar-group dvp-toolbar-end">
                {show.rotate && props.rotatable && (
                    <ToolButton
                        icon="rotate"
                        label={labels.rotate}
                        onClick={props.onRotate}
                        className="dvp-tool--rotate"
                    />
                )}
                {show.search && props.searchable && (
                    <ToolButton
                        icon="search"
                        label={labels.search}
                        onClick={props.onToggleSearch}
                        pressed={props.searchOpen}
                    />
                )}
                {show.print && props.canPrint && (
                    <ToolButton
                        icon="print"
                        label={props.printing ? labels.preparingPrint : labels.print}
                        onClick={props.onPrint}
                        disabled={props.printing}
                    />
                )}
                {show.download && props.canDownload && (
                    <ToolButton icon="download" label={labels.download} onClick={props.onDownload} />
                )}
                {show.fullscreen && (
                    <ToolButton
                        icon={props.fullscreen ? "exitFullscreen" : "fullscreen"}
                        label={props.fullscreen ? labels.exitFullscreen : labels.fullscreen}
                        onClick={props.onToggleFullscreen}
                    />
                )}
                {props.extra && <div className="dvp-toolbar-extra">{props.extra}</div>}
            </div>
        </div>
    );
}

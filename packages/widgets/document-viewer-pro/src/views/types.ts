import type { ReactNode } from "react";

import type { FileKind } from "../core/fileTypes";
import type { FormValues } from "../core/forms";
import type { Labels } from "../core/labels";
import type { PrintJob } from "../core/print";
import type { PlacedSignature, SignatureField } from "../core/signatures";
import type { Zoom } from "../core/zoom";

export interface LoadedFile {
    url: string;
    name: string;
    ext: string;
    kind: FileKind;
    /** The file's content; absent for audio and video, which stream from the URL. */
    bytes?: ArrayBuffer;
}

export interface Thumbnails {
    count: number;
    /** Height divided by width, per page. */
    aspect(index: number): number;
    render(index: number, canvas: HTMLCanvasElement, width: number): Promise<void>;
}

export interface OutlineItem {
    title: string;
    /** 1-based, or null when the entry doesn't point at a page. */
    page: number | null;
    url?: string;
    children: OutlineItem[];
}

export interface ViewInfo {
    /** Set for views made of pages (PDF, Word, slides, TIFF). */
    pageCount?: number;
    zoomable: boolean;
    /** Whether fit width and fit page mean anything for this view. */
    fits: boolean;
    rotatable: boolean;
    searchable: boolean;
    print?: () => Promise<PrintJob>;
    thumbnails?: Thumbnails;
    outline?: OutlineItem[];
    /** PDFs: whether the document has fields to fill in, and whether any were changed since it opened or saved. */
    form?: boolean;
    formDirty?: boolean;
    signatureFields?: SignatureField[];
    /** PDFs: a copy of the document with the form values and the given signatures written into it. */
    exportPdf?: (signatures: PlacedSignature[], flatten: boolean) => Promise<Uint8Array>;
    /** PDFs: counts the current form values as saved. */
    markSaved?: () => void;
}

export interface Attachment {
    name: string;
    bytes: Uint8Array;
}

export interface ViewCallbacks {
    onReady(info: ViewInfo): void;
    /** Later changes once the view knows more, for example the outline. */
    onInfo(info: Partial<ViewInfo>): void;
    onPage(page: number): void;
    onScale(scale: number): void;
    onMatches(count: number): void;
    onError(message?: string): void;
    onOpenAttachment(file: Attachment): void;
    /** Moves to a page, for example to show a search match or follow a link. */
    onGoTo(page: number): void;
}

export interface PageRequest {
    page: number;
    /** Changes on every request, so asking for the same page twice still scrolls. */
    seq: number;
}

/** Draws something above a page, sized to the page as it shows (after zoom and rotation). */
export type PageOverlay = (page: number, box: { width: number; height: number; rotation: number }) => ReactNode;

export interface ViewProps {
    file: LoadedFile;
    zoom: Zoom;
    rotation: number;
    layout: "continuous" | "single";
    query: string;
    activeMatch: number;
    goTo: PageRequest | null;
    allowCopy: boolean;
    blockRemoteImages: boolean;
    labels: Labels;
    callbacks: ViewCallbacks;
    /** Markup on paged views. */
    pageOverlay?: PageOverlay;
    /** PDF forms: whether fields can be filled in, the values to start with, and where changes go. */
    forms?: { fill: boolean; initial?: FormValues; onChange?(values: FormValues): void };
}

import type { ComponentType } from "react";

import type { FileKind } from "../core/fileTypes";
import { CodeView } from "./CodeView";
import { DocxView } from "./DocxView";
import { EmailView } from "./EmailView";
import { HtmlView } from "./HtmlView";
import { ImageView } from "./ImageView";
import { MarkdownView } from "./MarkdownView";
import { MediaView } from "./MediaView";
import { PdfView } from "./PdfView";
import { SheetView } from "./SheetView";
import { SlidesView } from "./SlidesView";
import { TiffView } from "./TiffView";
import type { ViewProps } from "./types";

export const views: Record<Exclude<FileKind, "unknown">, ComponentType<ViewProps>> = {
    pdf: PdfView,
    docx: DocxView,
    sheet: SheetView,
    pptx: SlidesView,
    image: ImageView,
    tiff: TiffView,
    code: CodeView,
    markdown: MarkdownView,
    html: HtmlView,
    email: EmailView,
    audio: MediaView,
    video: MediaView
};

import { degrees, PDFDocument, PDFRef, PDFSignature, type PDFField } from "pdf-lib";

import { registerEngine } from "./register";

/** A signature image and where it goes, in PDF points on the page as stored (before the page's own rotation). */
export interface StampedImage {
    pageIndex: number;
    png: Uint8Array;
    x: number;
    y: number;
    width: number;
    height: number;
    /** The page's own rotation, so the image shows upright when the page is displayed. */
    rotate: number;
    /** The signature field it fills, as pdf.js names annotations ("12R"). */
    field?: string;
}

function refName(ref: { objectNumber: number; generationNumber: number }): string {
    return ref.generationNumber ? `${ref.objectNumber}R${ref.generationNumber}` : `${ref.objectNumber}R`;
}

/**
 * Takes form fields out of the PDF, with their widgets. Done by hand: pdf-lib's removeField needs appearance streams,
 * which signature fields often don't have.
 */
function removeFields(pdf: PDFDocument, remove: (field: PDFField, widgets: string[]) => boolean): void {
    const form = pdf.getForm();
    const pages = pdf.getPages();
    for (const field of form.getFields()) {
        const refs = field.acroField.getWidgets().map(widget => pdf.context.getObjectRef(widget.dict));
        if (
            !remove(
                field,
                refs.flatMap(ref => (ref ? [refName(ref)] : []))
            )
        ) {
            continue;
        }
        for (const ref of refs) {
            if (ref) {
                pages.forEach(page => page.node.removeAnnot(ref));
            }
        }
        form.acroForm.removeField(field.acroField);
    }
}

/** Draws signatures onto a PDF and optionally locks its form fields into the page content. */
async function stampPdf(bytes: Uint8Array, images: StampedImage[], flatten: boolean): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const pages = pdf.getPages();
    const embedded = new Map<Uint8Array, Awaited<ReturnType<PDFDocument["embedPng"]>>>();
    for (const image of images) {
        const page = pages[image.pageIndex];
        if (!page) {
            continue;
        }
        let png = embedded.get(image.png);
        if (!png) {
            png = await pdf.embedPng(image.png);
            embedded.set(image.png, png);
        }
        page.drawImage(png, {
            x: image.x,
            y: image.y,
            width: image.width,
            height: image.height,
            rotate: degrees(image.rotate)
        });
    }
    // Signed fields go, so the saved PDF doesn't ask for a signature there again.
    const signed = new Set(images.flatMap(image => (image.field ? [image.field] : [])));
    try {
        removeFields(pdf, (_, widgets) => widgets.some(widget => signed.has(widget)));
    } catch {
        // The signature is on the page either way.
    }
    if (flatten) {
        try {
            // Empty signature fields can't be flattened, and a locked document can't be signed later anyway.
            removeFields(pdf, field => field instanceof PDFSignature);
            pdf.getForm().flatten();
            // pdf-lib deletes the flattened widgets but leaves their references in the pages' annotation lists.
            for (const page of pdf.getPages()) {
                const annots = page.node.Annots();
                for (let i = (annots?.size() ?? 0) - 1; i >= 0; i--) {
                    const ref = annots?.get(i);
                    if (ref instanceof PDFRef && !pdf.context.lookup(ref)) {
                        annots?.remove(i);
                    }
                }
            }
        } catch {
            // Some forms can't be flattened (missing appearances or fonts); they stay fillable rather than failing.
        }
    }
    return pdf.save();
}

const api = { stampPdf };
export type PdfSaveEngine = typeof api;

registerEngine("pdfsave", api);

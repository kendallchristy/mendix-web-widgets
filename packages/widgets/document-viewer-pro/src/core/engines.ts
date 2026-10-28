import type { CodeEngine } from "../engines/code";
import type { DocxEngine } from "../engines/docx";
import type { EmailEngine } from "../engines/email";
import type { MarkdownEngine } from "../engines/markdown";
import type { PdfEngine } from "../engines/pdf";
import type { PptxEngine } from "../engines/pptx";
import { ENGINE_GLOBAL } from "../engines/register";
import type { SheetEngine } from "../engines/sheet";
import type { TiffEngine } from "../engines/tiff";

export interface Engines {
    pdf: PdfEngine;
    docx: DocxEngine;
    sheet: SheetEngine;
    pptx: PptxEngine;
    tiff: TiffEngine;
    code: CodeEngine;
    markdown: MarkdownEngine;
    email: EmailEngine;
}

export type EngineName = keyof Engines;

// Replaced with the package version by rollup.config.mjs, so a new widget version never runs a cached old engine.
declare const __DVP_VERSION__: string;
const version = typeof __DVP_VERSION__ === "string" ? __DVP_VERSION__ : "dev";

const widgetPath = "widgets/com/kendallchristy/widget/web/documentviewerpro/engines/";

interface EngineHost {
    [ENGINE_GLOBAL]?: Partial<Engines>;
    /** Lets a test page serve the engines from elsewhere. */
    __documentViewerProEngineBase?: string;
    mx?: { appUrl?: string };
}

const host = globalThis as unknown as EngineHost;

/** Folder the engine scripts are served from: the widget's folder in the deployed app. */
export function engineBaseUrl(): string {
    if (host.__documentViewerProEngineBase) {
        return host.__documentViewerProEngineBase;
    }
    const appUrl = host.mx?.appUrl || `${window.location.origin}/`;
    return new URL(widgetPath, appUrl.endsWith("/") ? appUrl : `${appUrl}/`).href;
}

const pending = new Map<EngineName, Promise<unknown>>();

/** Loads an engine script once per page and resolves with its API. */
export function loadEngine<K extends EngineName>(name: K): Promise<Engines[K]> {
    const ready = host[ENGINE_GLOBAL]?.[name];
    if (ready) {
        return Promise.resolve(ready as Engines[K]);
    }
    let promise = pending.get(name);
    if (!promise) {
        promise = new Promise<unknown>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `${engineBaseUrl()}${name}.js?v=${encodeURIComponent(version)}`;
            script.async = true;
            script.onload = () => {
                const api = host[ENGINE_GLOBAL]?.[name];
                if (api) {
                    resolve(api);
                } else {
                    reject(new Error(`The ${name} engine did not register.`));
                }
            };
            script.onerror = () => {
                pending.delete(name);
                script.remove();
                reject(new Error(`The ${name} engine could not be loaded from ${script.src}.`));
            };
            document.head.appendChild(script);
        });
        pending.set(name, promise);
    }
    return promise as Promise<Engines[K]>;
}

/** Where pdf.js finds its worker, fonts and character maps. */
export function pdfAssetsUrl(): string {
    return `${engineBaseUrl()}pdfjs/`;
}

export function engineVersion(): string {
    return version;
}

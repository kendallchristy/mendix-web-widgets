import JSZip from "jszip";
import { PPTXViewer } from "pptxviewjs";

import { registerEngine } from "./register";

// PptxViewJS looks for JSZip on the global object before falling back to a CDN script, so make sure it finds ours.
(globalThis as unknown as { JSZip: typeof JSZip }).JSZip = JSZip;

function decodeXml(text: string): string {
    return text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&amp;/g, "&");
}

/** The text runs of each slide, in presentation order, for search. */
async function slideTexts(buffer: ArrayBuffer): Promise<string[][]> {
    const zip = await JSZip.loadAsync(buffer);
    const presentation = (await zip.file("ppt/presentation.xml")?.async("string")) ?? "";
    const rels = (await zip.file("ppt/_rels/presentation.xml.rels")?.async("string")) ?? "";
    const targets = new Map<string, string>();
    for (const match of rels.matchAll(/<Relationship\b[^>]*>/g)) {
        const id = /\bId="([^"]+)"/.exec(match[0])?.[1];
        const target = /\bTarget="([^"]+)"/.exec(match[0])?.[1];
        if (id && target) {
            targets.set(id, target.replace(/^\/?ppt\//, "").replace(/^\//, ""));
        }
    }
    const order = [...presentation.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"/g)].map(m => targets.get(m[1]));
    return Promise.all(
        order.map(async target => {
            const xml = target ? ((await zip.file(`ppt/${target}`)?.async("string")) ?? "") : "";
            return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map(m => decodeXml(m[1]));
        })
    );
}

const api = { PPTXViewer, slideTexts };
export type PptxEngine = typeof api;

registerEngine("pptx", api);

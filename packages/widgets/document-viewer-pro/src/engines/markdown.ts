import DOMPurify from "dompurify";
import { marked } from "marked";

import { registerEngine } from "./register";

function toSafeHtml(markdown: string): string {
    const html = marked.parse(markdown, { async: false, gfm: true });
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

const api = { toSafeHtml };
export type MarkdownEngine = typeof api;

registerEngine("markdown", api);

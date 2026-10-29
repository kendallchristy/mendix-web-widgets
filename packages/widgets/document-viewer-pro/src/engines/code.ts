import hljs from "highlight.js/lib/common";

import { registerEngine } from "./register";

function highlight(code: string, language: string | undefined): string {
    if (language && hljs.getLanguage(language)) {
        return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    }
    return hljs.highlightAuto(code).value;
}

const api = { highlight };
export type CodeEngine = typeof api;

registerEngine("code", api);

export type FileKind =
    | "pdf"
    | "docx"
    | "sheet"
    | "pptx"
    | "image"
    | "tiff"
    | "code"
    | "markdown"
    | "html"
    | "email"
    | "audio"
    | "video"
    | "unknown";

const byExtension: Record<string, FileKind> = {
    pdf: "pdf",
    docx: "docx",
    docm: "docx",
    dotx: "docx",
    dotm: "docx",
    xlsx: "sheet",
    xlsm: "sheet",
    xlsb: "sheet",
    xltx: "sheet",
    xltm: "sheet",
    xls: "sheet",
    ods: "sheet",
    csv: "sheet",
    tsv: "sheet",
    pptx: "pptx",
    ppsx: "pptx",
    potx: "pptx",
    pptm: "pptx",
    jpg: "image",
    jpeg: "image",
    jpe: "image",
    jfif: "image",
    png: "image",
    apng: "image",
    gif: "image",
    webp: "image",
    avif: "image",
    bmp: "image",
    ico: "image",
    svg: "image",
    tif: "tiff",
    tiff: "tiff",
    md: "markdown",
    markdown: "markdown",
    html: "html",
    htm: "html",
    xhtml: "html",
    eml: "email",
    msg: "email",
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    oga: "audio",
    m4a: "audio",
    aac: "audio",
    flac: "audio",
    opus: "audio",
    mp4: "video",
    m4v: "video",
    webm: "video",
    ogv: "video",
    mov: "video"
};

// Extension to highlight.js language. Every key is also shown by the text viewer.
const languages: Record<string, string> = {
    txt: "plaintext",
    text: "plaintext",
    log: "plaintext",
    ini: "ini",
    cfg: "ini",
    conf: "ini",
    properties: "properties",
    env: "bash",
    json: "json",
    jsonc: "json",
    geojson: "json",
    xml: "xml",
    xsd: "xml",
    xsl: "xml",
    xslt: "xml",
    wsdl: "xml",
    plist: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    sql: "sql",
    js: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    css: "css",
    scss: "scss",
    less: "less",
    java: "java",
    kt: "kotlin",
    cs: "csharp",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    php: "php",
    c: "c",
    h: "c",
    cpp: "cpp",
    hpp: "cpp",
    swift: "swift",
    sh: "bash",
    bash: "bash",
    ps1: "powershell",
    bat: "dos",
    cmd: "dos",
    r: "r",
    lua: "lua",
    pl: "perl",
    graphql: "graphql",
    gql: "graphql",
    diff: "diff",
    patch: "diff",
    dockerfile: "dockerfile",
    makefile: "makefile",
    vb: "vbnet",
    tex: "latex"
};

/** Formats no browser library renders well. The preview file covers these. */
const knownUnsupported = new Set([
    "doc",
    "dot",
    "ppt",
    "pps",
    "pot",
    "odt",
    "odp",
    "odg",
    "rtf",
    "pages",
    "key",
    "numbers",
    "vsd",
    "vsdx",
    "pub",
    "heic",
    "heif",
    "psd",
    "ai",
    "eps",
    "dwg",
    "dxf",
    "zip",
    "7z",
    "rar",
    "epub"
]);

export function extensionOf(name: string | undefined): string {
    if (!name) {
        return "";
    }
    const clean = name.split(/[?#]/)[0].trim().toLowerCase();
    const base = clean.slice(clean.lastIndexOf("/") + 1);
    if (base === "dockerfile" || base === "makefile") {
        return base;
    }
    const dot = base.lastIndexOf(".");
    return dot > 0 ? base.slice(dot + 1) : "";
}

export function kindFromExtension(ext: string): FileKind {
    if (byExtension[ext]) {
        return byExtension[ext];
    }
    return ext in languages ? "code" : "unknown";
}

export function languageFor(ext: string): string | undefined {
    return languages[ext];
}

export function isKnownUnsupported(ext: string): boolean {
    return knownUnsupported.has(ext);
}

/** Kinds that the browser streams from the URL, so the widget doesn't download the whole file first. */
export function streamsFromUrl(kind: FileKind): boolean {
    return kind === "audio" || kind === "video";
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
    return signature.every((byte, i) => bytes[offset + i] === byte);
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
    return String.fromCharCode(...bytes.subarray(start, Math.min(end, bytes.length)));
}

/** Content-based type for files without a (known) extension, from the first bytes. */
export function sniffKind(bytes: Uint8Array): FileKind | "zip" | "ole" | undefined {
    if (bytes.length < 4) {
        return undefined;
    }
    if (ascii(bytes, 0, 1024).includes("%PDF-")) {
        return "pdf";
    }
    if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
        // Office Open XML files are zip archives; the first entries' names give the kind away.
        const head = ascii(bytes, 0, 4096);
        if (head.includes("word/")) {
            return "docx";
        }
        if (head.includes("xl/")) {
            return "sheet";
        }
        if (head.includes("ppt/")) {
            return "pptx";
        }
        if (head.includes("mimetypeapplication/vnd.oasis.opendocument.spreadsheet")) {
            return "sheet";
        }
        return "zip";
    }
    if (startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
        return "ole";
    }
    if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) {
        return "tiff";
    }
    if (
        startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]) ||
        startsWith(bytes, [0xff, 0xd8, 0xff]) ||
        ascii(bytes, 0, 4) === "GIF8" ||
        (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") ||
        ascii(bytes, 0, 2) === "BM"
    ) {
        return "image";
    }
    if (ascii(bytes, 4, 8) === "ftyp") {
        return ascii(bytes, 8, 11) === "M4A" ? "audio" : "video";
    }
    if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
        return "video";
    }
    if (ascii(bytes, 0, 3) === "ID3" || startsWith(bytes, [0xff, 0xfb])) {
        return "audio";
    }
    const text = ascii(bytes, 0, 512).trimStart().toLowerCase();
    if (text.startsWith("<!doctype html") || text.startsWith("<html")) {
        return "html";
    }
    if (text.startsWith("<svg") || (text.startsWith("<?xml") && text.includes("<svg"))) {
        return "image";
    }
    if (/^(from|received|return-path|mime-version|message-id|delivered-to):/m.test(text)) {
        return "email";
    }
    return looksLikeText(bytes) ? "code" : undefined;
}

function looksLikeText(bytes: Uint8Array): boolean {
    const sample = bytes.subarray(0, 4096);
    let control = 0;
    for (const byte of sample) {
        if (byte === 0) {
            return false;
        }
        if (byte < 9 || (byte > 13 && byte < 32)) {
            control++;
        }
    }
    return control / Math.max(sample.length, 1) < 0.02;
}

export interface Detected {
    kind: FileKind;
    ext: string;
}

/**
 * Picks the viewer for a file. The extension decides when the content agrees with it; the first bytes decide when
 * the name has no or an unknown extension, or when the content plainly disagrees (a PDF saved as .docx).
 */
export function detectKind(name: string | undefined, bytes?: Uint8Array): Detected {
    const ext = extensionOf(name);
    const byName = kindFromExtension(ext);
    if (!bytes) {
        return { kind: byName, ext };
    }
    const sniffed = sniffKind(bytes);
    if (sniffed === "ole") {
        // Legacy Office and Outlook files share one container format.
        if (ext === "xls" || ext === "msg") {
            return { kind: byName, ext };
        }
        return { kind: "unknown", ext };
    }
    // Content that is unmistakably one of these formats wins over the name, for example a PDF saved as .docx.
    const strong: Partial<Record<FileKind, string>> = {
        pdf: "pdf",
        docx: "docx",
        pptx: "pptx",
        sheet: "xlsx",
        tiff: "tiff"
    };
    const canonicalExt = sniffed && sniffed !== "zip" && sniffed !== byName ? strong[sniffed] : undefined;
    if (sniffed && sniffed !== "zip" && canonicalExt) {
        return { kind: sniffed, ext: canonicalExt };
    }
    if (byName !== "unknown") {
        return { kind: byName, ext };
    }
    if (sniffed === "zip" || sniffed === undefined) {
        return { kind: "unknown", ext };
    }
    return { kind: sniffed, ext: sniffed === "code" ? "txt" : ext };
}

const imageMime: Record<string, string> = {
    svg: "image/svg+xml",
    png: "image/png",
    apng: "image/apng",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    bmp: "image/bmp",
    ico: "image/x-icon",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    jpe: "image/jpeg",
    jfif: "image/jpeg"
};

export function imageMimeType(ext: string): string {
    return imageMime[ext] ?? "application/octet-stream";
}

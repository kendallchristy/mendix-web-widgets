// Browser stand-in for iconv-lite, which @kenjiuno/msgreader uses to decode legacy code pages in Outlook files.
// The browser's TextDecoder knows the same encodings, so the Node package (and its Buffer polyfill) isn't needed.
function decode(bytes: Uint8Array, encoding: string): string {
    try {
        return new TextDecoder(encoding).decode(bytes);
    } catch {
        return new TextDecoder("windows-1252").decode(bytes);
    }
}

function encode(text: string): Uint8Array {
    return new TextEncoder().encode(text);
}

export default { decode, encode };

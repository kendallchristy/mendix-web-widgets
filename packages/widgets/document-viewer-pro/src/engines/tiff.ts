import * as UTIF from "utif2";

import { registerEngine } from "./register";

export interface TiffPage {
    width: number;
    height: number;
    rgba: Uint8Array;
}

function decodePages(buffer: ArrayBuffer): TiffPage[] {
    const ifds = UTIF.decode(buffer);
    const pages: TiffPage[] = [];
    for (const ifd of ifds) {
        UTIF.decodeImage(buffer, ifd);
        const width = ifd.width as number;
        const height = ifd.height as number;
        if (!width || !height) {
            continue;
        }
        pages.push({ width, height, rgba: UTIF.toRGBA8(ifd) });
    }
    return pages;
}

const api = { decodePages };
export type TiffEngine = typeof api;

registerEngine("tiff", api);

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

import { registerEngine } from "./register";

export type PdfEngine = typeof pdfjs;

registerEngine("pdf", pdfjs);

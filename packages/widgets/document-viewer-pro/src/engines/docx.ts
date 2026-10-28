import { renderAsync } from "docx-preview";

import { registerEngine } from "./register";

const api = { renderAsync };
export type DocxEngine = typeof api;

registerEngine("docx", api);

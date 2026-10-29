import { read, utils } from "xlsx";

import { registerEngine } from "./register";

const api = { read, utils };
export type SheetEngine = typeof api;

registerEngine("sheet", api);

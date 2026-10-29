// Engines are built as separate scripts (see rollup.config.mjs) and hand their API to the widget through this
// global, so a page only downloads the libraries for the file types it actually opens.
export const ENGINE_GLOBAL = "__documentViewerProEngines";

export function registerEngine(name: string, api: unknown): void {
    const host = globalThis as unknown as Record<string, Record<string, unknown> | undefined>;
    const engines = (host[ENGINE_GLOBAL] ??= {});
    engines[name] = api;
}

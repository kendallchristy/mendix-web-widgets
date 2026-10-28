export interface FetchProgress {
    loaded: number;
    /** Undefined when the server doesn't send a length. */
    total?: number;
}

/** Downloads a file into memory, reporting progress when the body can be streamed. */
export async function fetchBytes(
    url: string,
    signal: AbortSignal,
    onProgress?: (progress: FetchProgress) => void
): Promise<ArrayBuffer> {
    const response = await fetch(url, { signal, credentials: "same-origin" });
    if (!response.ok) {
        throw new Error(`The file could not be downloaded (HTTP ${response.status}).`);
    }
    const length = Number(response.headers.get("content-length"));
    const total = Number.isFinite(length) && length > 0 ? length : undefined;
    if (!response.body || !onProgress) {
        return response.arrayBuffer();
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        loaded += value.length;
        onProgress({ loaded, total });
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return bytes.buffer;
}

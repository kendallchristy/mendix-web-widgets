/** Saves a file under its name. Same-origin URLs download directly; others open in a new tab. */
export function downloadUrl(url: string, name: string): void {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function downloadBytes(bytes: Uint8Array, name: string, type = "application/octet-stream"): void {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
    downloadUrl(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

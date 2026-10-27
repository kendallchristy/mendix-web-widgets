import type { Variant } from "./types";

// Square brackets because Studio Pro reads braces in text templates as parameter slots (CE0712).
const secondsToken = /\[seconds\]/gi;

export function hasSecondsToken(text: string | undefined): boolean {
    return !!text && text.search(secondsToken) !== -1;
}

export function fillSeconds(text: string, remainingMs: number | undefined): string {
    if (remainingMs === undefined) {
        return text.replace(secondsToken, "");
    }
    return text.replace(secondsToken, String(Math.ceil(remainingMs / 1000)));
}

const variants: Variant[] = ["success", "info", "warning", "error", "neutral"];

export function parseVariant(value: string | undefined, fallback: Variant): Variant {
    const key = value?.trim().toLowerCase();
    return variants.find(variant => variant === key) ?? fallback;
}

/** Milliseconds from the duration expression; undefined means the toast stays until it is closed. */
export function toDuration(value: { toNumber(): number } | undefined): number | undefined {
    const ms = value?.toNumber();
    return ms !== undefined && Number.isFinite(ms) && ms > 0 ? ms : undefined;
}

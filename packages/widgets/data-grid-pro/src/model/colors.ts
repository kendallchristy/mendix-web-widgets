export const BADGE_COLORS = ["gray", "blue", "green", "yellow", "orange", "red", "purple"] as const;
export type BadgeColor = (typeof BADGE_COLORS)[number];

/** Uses the configured color when it's a known name, otherwise picks a stable color from the text. */
export function resolveColor(configured: string | undefined, text: string): BadgeColor {
    const name = configured?.trim().toLowerCase();
    if (name && (BADGE_COLORS as readonly string[]).includes(name)) {
        return name as BadgeColor;
    }
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return BADGE_COLORS[Math.abs(hash) % BADGE_COLORS.length];
}

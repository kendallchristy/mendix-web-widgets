// What the help popover lists. Kept beside relative.ts so the two stay in step.
import type { Granularity, SelectionType } from "./types";

export interface ShortcutItem {
    keys: string[];
    description: string;
}

export interface ShortcutSection {
    id: string;
    title: string;
    items: ShortcutItem[];
}

export interface ShortcutOptions {
    selection: SelectionType;
    granularity: Granularity;
    hasTime: boolean;
    relativeTyping: boolean;
    segmented: boolean;
    inline: boolean;
    /** A typed example for the current format, like "10012026" for "dd/MM/yyyy". */
    typingExample?: { typed: string; shown: string };
}

export function shortcutSections(options: ShortcutOptions): ShortcutSection[] {
    const sections: ShortcutSection[] = [];
    const { selection, granularity, hasTime, relativeTyping, segmented, inline, typingExample } = options;
    const calendar = granularity !== "time";

    const typing: ShortcutItem[] = [];
    if (typingExample) {
        typing.push({
            keys: [typingExample.typed],
            description: segmented
                ? `Type only the numbers, the separators fill in: ${typingExample.shown}`
                : `Type the date, separators optional: ${typingExample.shown}`
        });
    }
    if (segmented) {
        typing.push(
            { keys: ["←", "→"], description: "Move between day, month and year" },
            { keys: ["↑", "↓"], description: "Change the part you're on" },
            { keys: ["Backspace"], description: "Clear the part you're on" }
        );
    }
    if (typing.length) {
        sections.push({ id: "typing", title: "Typing a date", items: typing });
    }

    if (relativeTyping && calendar) {
        const items: ShortcutItem[] = [
            { keys: ["t"], description: "Today" },
            { keys: ["y"], description: "Yesterday" },
            { keys: ["tom"], description: "Tomorrow" },
            { keys: ["+7", "-7"], description: "7 days from today, or 7 days ago" },
            { keys: ["+2w", "-3m", "+1q", "+1y"], description: "Weeks, months, quarters or years from today" }
        ];
        if (granularity === "day") {
            items.push(
                { keys: ["15"], description: "The 15th of this month" },
                { keys: ["fri"], description: "This coming Friday (today if it's Friday)" },
                { keys: ["next fri", "last mon"], description: "The Friday after today, or the Monday before" }
            );
        }
        if (hasTime) {
            items.push({ keys: ["now"], description: "Today at the current time" });
        }
        if (selection === "range") {
            items.push(
                { keys: ["this week", "last month", "next quarter"], description: "A whole period, filling both dates" },
                { keys: ["last 7 days", "next 30 days"], description: "A number of days up to or from today" },
                { keys: ["wtd", "mtd", "qtd", "ytd"], description: "Week, month, quarter or year to date" }
            );
        }
        sections.push({
            id: "relative",
            title: "Shortcuts you can type",
            items: [
                ...items,
                { keys: ["Enter"], description: "Use what you typed. Esc goes back to the date you had." }
            ]
        });
    }

    if (calendar) {
        const unit = granularity === "day" ? "day" : granularity;
        sections.push({
            id: "calendar",
            title: "In the calendar",
            items: [
                {
                    keys: ["←", "→", "↑", "↓"],
                    description: granularity === "day" ? "Move by day or week" : `Move between ${unit}s`
                },
                ...(granularity === "day"
                    ? [
                          { keys: ["Page Up", "Page Down"], description: "Previous or next month" },
                          { keys: ["Shift + Page Up", "Shift + Page Down"], description: "Previous or next year" },
                          { keys: ["Home", "End"], description: "Start or end of the week" }
                      ]
                    : [{ keys: ["Page Up", "Page Down"], description: "Previous or next page" }]),
                {
                    keys: ["Enter", "Space"],
                    description: selection === "range" ? "Pick the start, then the end" : `Pick the ${unit}`
                },
                ...(inline ? [] : [{ keys: ["Esc"], description: "Close without changing anything" }])
            ]
        });
    }

    if (!inline) {
        sections.push({
            id: "open",
            title: "Opening the picker",
            items: [
                { keys: ["Alt + ↓"], description: "Open the calendar from the date field" },
                { keys: ["?"], description: "Show this help from the date field" }
            ]
        });
    }
    return sections;
}

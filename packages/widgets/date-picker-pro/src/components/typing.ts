// Turning typed text into a value, shared by the segmented field's quick entry and the free-text field.
import type { LocaleInfo, WeekDay } from "../core/locale";
import { parseWithTokens, type Token } from "../core/pattern";
import { parseRelative, type RelativeResult } from "../core/relative";

export interface TypedTextContext {
    tokens: Token[];
    locale: LocaleInfo;
    weekStartsOn: WeekDay;
    relativeTyping: boolean;
    reference?: Date;
}

/** Relative shortcuts first, then the field's own format, then ISO dates ("2026-01-10"). */
export function resolveTypedText(text: string, context: TypedTextContext): RelativeResult | undefined {
    if (context.relativeTyping) {
        const relative = parseRelative(text, { now: new Date(), weekStartsOn: context.weekStartsOn, locale: context.locale });
        if (relative) {
            return relative;
        }
    }
    const date = parseWithTokens(text, context.tokens, context.locale, context.reference);
    if (date) {
        return { kind: "date", date };
    }
    const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(text.trim());
    if (iso) {
        const [, y, m, d, h = "0", min = "0"] = iso;
        const parsed = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
        if (parsed.getMonth() === Number(m) - 1) {
            return { kind: "date", date: parsed };
        }
    }
    return undefined;
}

import type { ReactElement, ReactNode } from "react";

import type { BadgeColor } from "../model/colors";

export interface Pill {
    key: string;
    caption: string;
    color: BadgeColor;
}

/** Pills shown before the rest collapse into a "+N" chip. */
const VISIBLE_PILLS = 3;

export function Badge({ color, children }: { color: BadgeColor; children: ReactNode }): ReactElement {
    return <span className={`dgp-badge dgp-badge--${color}`}>{children}</span>;
}

export function Pills({ pills }: { pills: Pill[] }): ReactElement | null {
    if (pills.length === 0) {
        return null;
    }
    const shown = pills.slice(0, VISIBLE_PILLS);
    const rest = pills.length - shown.length;
    return (
        <span className="dgp-pills" data-dgp-tip={rest > 0 ? pills.map(p => p.caption).join("\n") : undefined}>
            {shown.map(pill => (
                <Badge key={pill.key} color={pill.color}>
                    {pill.caption}
                </Badge>
            ))}
            {rest > 0 && <span className="dgp-badge dgp-badge--more">+{rest}</span>}
        </span>
    );
}

export function Progress({ value, max }: { value: number; max: number }): ReactElement {
    const ratio = max > 0 && Number.isFinite(value) ? Math.min(Math.max(value / max, 0), 1) : 0;
    const percent = Math.round(ratio * 100);
    const tone = percent >= 70 ? "high" : percent >= 40 ? "mid" : "low";
    return (
        <span className={`dgp-progress dgp-progress--${tone}`}>
            <span className="dgp-progress-label">{percent}%</span>
            <span
                className="dgp-progress-track"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <span className="dgp-progress-fill" style={{ width: `${percent}%` }} />
            </span>
        </span>
    );
}

export function BooleanMark({ value }: { value: boolean }): ReactElement {
    return (
        <span className={value ? "dgp-bool dgp-bool--true" : "dgp-bool"} aria-label={value ? "Yes" : "No"}>
            {value ? "✓" : "–"}
        </span>
    );
}

export function SkeletonBar(): ReactElement {
    return <span className="dgp-skeleton" aria-hidden />;
}
